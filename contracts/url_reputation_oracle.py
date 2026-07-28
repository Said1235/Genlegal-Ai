# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json
import typing
from datetime import datetime, timezone

_MAX_URL_LENGTH = 500
_MAX_PAGE_CHARS = 6000
_SCORE_TOLERANCE = 20
_CONFIDENCE_TOLERANCE = 0.3
_VALID_RISK_LEVELS = ("safe", "suspicious", "malicious", "unknown")

def _as_bool(v, d=False):
    if isinstance(v, bool): return v
    if isinstance(v, str): return v.strip().lower() in ("true","yes","1")
    if isinstance(v, int): return v != 0
    return d

def _as_text(v, d=""):
    return d if v is None else str(v)

def _coerce_verdict(parsed) -> dict:
    if not isinstance(parsed, dict):
        raise gl.vm.UserError("LLM_ERROR response was not a JSON object")
    rl = _as_text(parsed.get("risk_level"), "unknown").strip().lower()
    if rl not in _VALID_RISK_LEVELS: rl = "unknown"
    try: score = max(0, min(100, int(round(float(str(parsed.get("reputation_score", parsed.get("score", 0))).strip())))))
    except: score = 0
    try: conf = max(0.0, min(1.0, float(str(parsed.get("confidence", "0.5")).strip())))
    except: conf = 0.5
    summary = _as_text(parsed.get("summary"), "")[:500]
    return {"risk_level": rl, "is_phishing": _as_bool(parsed.get("is_phishing")),
            "is_malware": _as_bool(parsed.get("is_malware")), "is_official": _as_bool(parsed.get("is_official")),
            "is_clone": _as_bool(parsed.get("is_clone")), "is_scam_faucet": _as_bool(parsed.get("is_scam_faucet")),
            "reputation_score": score, "confidence": str(round(conf, 2)), "summary": summary, "fetch_error": False}

def _run_check(url: str) -> dict:
    try: snippet = (gl.nondet.web.render(url, mode="text") or "")[:_MAX_PAGE_CHARS]
    except:
        return {"risk_level":"unknown","is_phishing":False,"is_malware":False,"is_official":False,
                "is_clone":False,"is_scam_faucet":False,"reputation_score":0,"confidence":"0.0",
                "summary":"The page could not be rendered.","fetch_error":True}
    task = f"""You are a Web3 security analyst. Evaluate whether this website is safe.
URL: {url}
Page content: ---\n{snippet}\n---
Respond ONLY with valid JSON:
{{"risk_level":"safe|suspicious|malicious|unknown","is_phishing":false,"is_malware":false,"is_official":false,"is_clone":false,"is_scam_faucet":false,"reputation_score":0,"confidence":"0.0","summary":"explanation"}}"""
    return _coerce_verdict(gl.nondet.exec_prompt(task, response_format="json"))

def _agree(a, b):
    if not isinstance(a, dict) or not isinstance(b, dict): return False
    if bool(a.get("fetch_error")) or bool(b.get("fetch_error")): return bool(a.get("fetch_error")) == bool(b.get("fetch_error"))
    for field in ("risk_level","is_phishing","is_malware","is_official","is_clone","is_scam_faucet"):
        if a.get(field) != b.get(field): return False
    try:
        if abs(int(a.get("reputation_score",0)) - int(b.get("reputation_score",0))) > _SCORE_TOLERANCE: return False
        if abs(float(a.get("confidence",0)) - float(b.get("confidence",0))) > _CONFIDENCE_TOLERANCE: return False
    except: return False
    return True

class URLReputationOracle(gl.Contract):
    reports: TreeMap[str, str]
    statuses: TreeMap[str, str]
    last_checked_at: TreeMap[str, str]
    last_requester: TreeMap[str, str]
    total_analyses: str

    def __init__(self):
        self.total_analyses = "0"

    @gl.public.write
    def analyze(self, url: str) -> typing.Any:
        url = url.strip()
        if not url or len(url) > _MAX_URL_LENGTH:
            raise gl.vm.UserError("EXPECTED url must be between 1 and 500 characters")
        if not (url.startswith("http://") or url.startswith("https://")):
            raise gl.vm.UserError("EXPECTED url must start with http:// or https://")
        def leader(): return _run_check(url)
        def validator(lr) -> bool:
            if not isinstance(lr, gl.vm.Return): return False
            return _agree(lr.calldata, leader())
        verdict = gl.vm.run_nondet_unsafe(leader, validator)
        self.reports[url] = json.dumps(verdict, sort_keys=True)
        self.statuses[url] = "error" if verdict.get("fetch_error") else "analyzed"
        self.last_checked_at[url] = datetime.now(timezone.utc).isoformat()
        self.last_requester[url] = gl.message.sender_address.as_hex
        self.total_analyses = str(int(self.total_analyses) + 1)
        return verdict

    @gl.public.write
    def analyze_if_needed(self, url: str) -> typing.Any:
        key = url.strip()
        if key in self.statuses and str(self.statuses[key]) == "analyzed":
            return json.loads(str(self.reports[key]))
        return self.analyze(url)

    @gl.public.view
    def get_reputation(self, url: str) -> typing.Any:
        key = url.strip()
        if key not in self.statuses:
            return {"url": key, "status": "unchecked", "verdict": None, "last_checked_at": "", "last_requester": ""}
        return {"url": key, "status": str(self.statuses[key]),
                "verdict": json.loads(str(self.reports[key])),
                "last_checked_at": str(self.last_checked_at[key]),
                "last_requester": str(self.last_requester[key])}

    @gl.public.view
    def get_risk_level(self, url: str) -> typing.Any:
        key = url.strip()
        return str(json.loads(str(self.reports[key])).get("risk_level","unknown")) if key in self.statuses else "unchecked"

    @gl.public.view
    def is_flagged(self, url: str) -> typing.Any:
        key = url.strip()
        if key not in self.statuses: return False
        v = json.loads(str(self.reports[key]))
        return bool(v.get("is_phishing") or v.get("is_malware") or v.get("is_scam_faucet") or v.get("risk_level") == "malicious")

    @gl.public.view
    def get_stats(self) -> typing.Any:
        return {"total_analyses": str(self.total_analyses)}
