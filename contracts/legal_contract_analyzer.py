# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
"""
GenLegal AI - Intelligent Contract

Lets anyone submit a legal/contract text for AI-powered analysis. A leader
validator asks an LLM to summarize the contract, extract obligations and
risks, and assign a risk score. Other validators independently reproduce the
analysis and the network reaches consensus on the *decision* fields
(risk_level, risk_score) via a custom Equivalence Principle validator -
free-text fields (summary, obligations, risks wording) are stored from the
leader's answer but are not required to match byte-for-byte, since two LLMs
will phrase the same judgement differently.

Design notes (see README for the full write-up):
- Storage is flattened (TreeMap of primitives + DynArray[Analysis]) rather
  than nesting DynArray/TreeMap fields inside the stored dataclass, to avoid
  the gl.storage.inmem_allocate dance required for generic-in-generic storage
  fields. obligations/risks lists are persisted as compact JSON strings.
- Equivalence: gl.vm.run_nondet_unsafe with a hand-written leader/validator
  pair (Pattern 1 + numeric tolerance from the Equivalence Principle docs),
  not strict_eq, because LLM output here is inherently non-deterministic free
  text plus a subjective score.
- Errors raised inside the non-deterministic block are tagged with
  deterministic prefixes ([EXPECTED]/[EXTERNAL]/[TRANSIENT]/[LLM_ERROR]) so
  the validator can classify and decide agreement without re-trusting the
  leader's formatting alone.
"""

import json
import typing
from dataclasses import dataclass
from datetime import datetime, timezone

from genlayer import *

# --------------------------------------------------------------------------
# Constants
# --------------------------------------------------------------------------

RISK_LEVELS = ("Low", "Medium", "High")

MAX_CONTRACT_TEXT_CHARS = 20_000
MAX_TITLE_CHARS = 160
MAX_LIST_ITEMS = 6
MAX_ITEM_CHARS = 160
MAX_SUMMARY_CHARS = 1200

# How far a validator's independently-computed risk_score may drift from the
# leader's before the validator disagrees. LLM scoring is subjective, so an
# exact match is unrealistic; a wide gap should still force a re-vote.
RISK_SCORE_TOLERANCE = 12

ERR_EXPECTED = "[EXPECTED]"   # business-logic errors -> must match exactly
ERR_EXTERNAL = "[EXTERNAL]"   # external/API errors -> must match exactly
ERR_TRANSIENT = "[TRANSIENT]"  # timeouts etc -> agree if both see one
ERR_LLM = "[LLM_ERROR]"       # malformed/garbage model output -> always disagree


# --------------------------------------------------------------------------
# Storage type
# --------------------------------------------------------------------------


@allow_storage
@dataclass
class Analysis:
    id: str
    owner: Address
    title: str
    contract_type: str
    risk_level: str
    risk_score: u32
    summary: str
    obligations_json: str
    risks_json: str
    created_at: str


def _analysis_to_dict(a: Analysis) -> dict:
    return {
        "id": a.id,
        "owner": a.owner.as_hex,
        "title": a.title,
        "contract_type": a.contract_type,
        "risk_level": a.risk_level,
        "risk_score": int(a.risk_score),
        "summary": a.summary,
        "obligations": json.loads(a.obligations_json),
        "risks": json.loads(a.risks_json),
        "created_at": a.created_at,
    }


# --------------------------------------------------------------------------
# Prompt construction (deterministic - safe to call outside and inside the
# non-deterministic block)
# --------------------------------------------------------------------------


def _build_analysis_prompt(contract_type: str, text: str) -> str:
    return f"""You are an expert contract-review assistant helping a non-lawyer understand a {contract_type} agreement.

Read the contract text below and produce a careful, balanced risk assessment.

CONTRACT TEXT:
\"\"\"
{text}
\"\"\"

Respond with ONLY a single JSON object (no markdown fences, no extra commentary) using exactly this shape:
{{
  "summary": "2-4 sentence plain-English summary of what this contract is about and who must do what",
  "obligations": ["short obligation phrase", "..."],
  "risks": ["short risk or red-flag phrase", "..."],
  "risk_level": "Low" | "Medium" | "High",
  "risk_score": <integer 0-100, where 0 is no risk and 100 is severe risk to the party reviewing it>
}}

List at most {MAX_LIST_ITEMS} obligations and at most {MAX_LIST_ITEMS} risks, each a short phrase under 20 words.
Base risk_level and risk_score on concrete clauses you found (for example: unlimited liability, automatic renewal,
unilateral termination, missing data protections, one-sided indemnification, vague payment terms).
It is mandatory to respond with valid JSON matching the shape above and nothing else."""


# --------------------------------------------------------------------------
# Defensive parsing of the LLM response (used by both leader and validator)
# --------------------------------------------------------------------------


def _coerce_str_list(value: typing.Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        value = [value]
    if not isinstance(value, (list, tuple)):
        raise gl.vm.UserError(f"{ERR_LLM} expected a list, got {type(value).__name__}")
    out: list[str] = []
    for item in value:
        s = str(item).strip()
        if not s:
            continue
        out.append(s[:MAX_ITEM_CHARS])
        if len(out) >= MAX_LIST_ITEMS:
            break
    return out


def _coerce_risk_score(raw: typing.Any) -> int:
    try:
        score = int(round(float(str(raw).strip())))
    except (TypeError, ValueError):
        raise gl.vm.UserError(f"{ERR_LLM} non-numeric risk_score: {raw!r}")
    return max(0, min(100, score))


def _coerce_risk_level(raw: typing.Any, score: int) -> str:
    if isinstance(raw, str):
        normalized = raw.strip().capitalize()
        if normalized in RISK_LEVELS:
            return normalized
    # Derive from the score rather than rejecting on label wording alone -
    # the score is the field validators actually compare numerically.
    if score >= 67:
        return "High"
    if score >= 34:
        return "Medium"
    return "Low"


def _first_present(raw: dict, keys: tuple) -> typing.Any:
    for key in keys:
        if key in raw and raw[key] is not None:
            return raw[key]
    return None


def _normalize_analysis_response(raw: typing.Any) -> dict:
    """Validate + clean the LLM's JSON response. Raises gl.vm.UserError
    (tagged ERR_LLM) on anything that cannot be salvaged."""
    if not isinstance(raw, dict):
        raise gl.vm.UserError(f"{ERR_LLM} model did not return a JSON object, got {type(raw).__name__}")

    summary = _first_present(raw, ("summary", "analysis", "overview", "description"))
    summary = str(summary or "").strip()
    if not summary:
        raise gl.vm.UserError(f"{ERR_LLM} missing 'summary' in model response")
    summary = summary[:MAX_SUMMARY_CHARS]

    obligations = _coerce_str_list(_first_present(raw, ("obligations", "key_obligations")))
    risks = _coerce_str_list(_first_present(raw, ("risks", "risks_identified", "red_flags")))

    score_raw = _first_present(raw, ("risk_score", "score", "riskScore", "risk"))
    if score_raw is None:
        raise gl.vm.UserError(f"{ERR_LLM} missing 'risk_score' in model response")
    score = _coerce_risk_score(score_raw)

    level_raw = _first_present(raw, ("risk_level", "riskLevel"))
    level = _coerce_risk_level(level_raw, score)

    return {
        "summary": summary,
        "obligations": obligations,
        "risks": risks,
        "risk_score": score,
        "risk_level": level,
    }


def _validator_agrees_with_error(leaders_res: "gl.vm.Result", leader_fn: typing.Callable) -> bool:
    """The leader errored. Re-run independently and classify before agreeing.

    Mirrors the error-classification pattern from the Equivalence Principle
    docs: deterministic errors must match exactly, transient errors agree if
    both sides hit one, anything LLM-related or unclassified disagrees so the
    network rotates to a new leader instead of freezing on bad output.
    """
    leader_msg = getattr(leaders_res, "message", "") or ""
    try:
        leader_fn()
        # We produced a result where the leader failed -> genuine disagreement.
        return False
    except gl.vm.UserError as e:
        validator_msg = getattr(e, "message", str(e))
        if validator_msg.startswith(ERR_EXPECTED) or validator_msg.startswith(ERR_EXTERNAL):
            return validator_msg == leader_msg
        if validator_msg.startswith(ERR_TRANSIENT) and leader_msg.startswith(ERR_TRANSIENT):
            return True
        # ERR_LLM or anything unclassified: force a retry with a new leader.
        return False
    except Exception:
        return False


# --------------------------------------------------------------------------
# Contract
# --------------------------------------------------------------------------


class LegalContractAnalyzer(gl.Contract):
    analyses: DynArray[Analysis]
    analysis_index: TreeMap[str, u32]
    user_analysis_ids: TreeMap[Address, str]
    next_id: u256

    def __init__(self):
        pass

    @gl.public.write
    def analyze_contract(self, title: str, contract_type: str, text: str) -> str:
        """Submit a contract for AI analysis. Returns the new analysis id."""
        clean_title = title.strip()[:MAX_TITLE_CHARS]
        clean_type = (contract_type or "").strip()[:MAX_TITLE_CHARS] or "General Contract"
        clean_text = text.strip()

        if not clean_title:
            raise gl.vm.UserError(f"{ERR_EXPECTED} title is required")
        if not clean_text:
            raise gl.vm.UserError(f"{ERR_EXPECTED} contract text is required")
        if len(clean_text) > MAX_CONTRACT_TEXT_CHARS:
            raise gl.vm.UserError(
                f"{ERR_EXPECTED} contract text exceeds the {MAX_CONTRACT_TEXT_CHARS} character limit"
            )

        prompt = _build_analysis_prompt(clean_type, clean_text)

        def leader_fn():
            raw = gl.nondet.exec_prompt(prompt, response_format="json")
            return _normalize_analysis_response(raw)

        def validator_fn(leaders_res: "gl.vm.Result") -> bool:
            if not isinstance(leaders_res, gl.vm.Return):
                return _validator_agrees_with_error(leaders_res, leader_fn)
            try:
                my_result = leader_fn()
            except Exception:
                # Leader succeeded but we couldn't reproduce any usable
                # result - reject rather than agree blindly.
                return False
            leader_data = leaders_res.calldata
            if leader_data["risk_level"] != my_result["risk_level"]:
                return False
            return abs(leader_data["risk_score"] - my_result["risk_score"]) <= RISK_SCORE_TOLERANCE

        analysis = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        new_id = str(int(self.next_id))
        self.next_id = u256(int(self.next_id) + 1)

        owner = gl.message.sender_address
        record = Analysis(
            id=new_id,
            owner=owner,
            title=clean_title,
            contract_type=clean_type,
            risk_level=analysis["risk_level"],
            risk_score=u32(analysis["risk_score"]),
            summary=analysis["summary"],
            obligations_json=json.dumps(analysis["obligations"]),
            risks_json=json.dumps(analysis["risks"]),
            created_at=datetime.now(timezone.utc).isoformat(),
        )
        self.analyses.append(record)
        self.analysis_index[new_id] = u32(len(self.analyses) - 1)

        existing_ids = json.loads(self.user_analysis_ids.get(owner, "[]"))
        existing_ids.append(new_id)
        self.user_analysis_ids[owner] = json.dumps(existing_ids)

        return new_id

    @gl.public.view
    def get_analysis(self, analysis_id: str) -> dict:
        if analysis_id not in self.analysis_index:
            raise gl.vm.UserError(f"{ERR_EXPECTED} analysis '{analysis_id}' not found")
        idx = self.analysis_index[analysis_id]
        return _analysis_to_dict(self.analyses[idx])

    @gl.public.view
    def get_all_analyses(self) -> list[dict]:
        return [_analysis_to_dict(a) for a in self.analyses]

    @gl.public.view
    def get_my_analyses(self, owner_address: str) -> list[dict]:
        owner = Address(owner_address)
        ids_json = self.user_analysis_ids.get(owner, "[]")
        ids = json.loads(ids_json)
        out = []
        for aid in ids:
            if aid in self.analysis_index:
                out.append(_analysis_to_dict(self.analyses[self.analysis_index[aid]]))
        return out

    @gl.public.view
    def get_stats(self) -> dict:
        total = len(self.analyses)
        high = 0
        medium = 0
        for a in self.analyses:
            if a.risk_level == "High":
                high += 1
            elif a.risk_level == "Medium":
                medium += 1
        low = total - high - medium
        return {
            "total_analyses": total,
            "high_risk": high,
            "medium_risk": medium,
            "low_risk": low,
        }
