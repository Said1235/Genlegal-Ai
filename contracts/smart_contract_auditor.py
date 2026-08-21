# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
"""
GenLegal AI - Smart Contract Auditor (Intelligent Contract)

Lets anyone submit smart contract source code (Solidity, Vyper, etc.) for
AI-powered security audit. A leader validator asks an LLM to summarize what
the code does, list concrete vulnerabilities/risks and recommended fixes,
and assign a risk score. Other validators independently reproduce the audit
and the network reaches consensus on the *decision* fields (risk_level,
risk_score) via a custom Equivalence Principle validator - free-text fields
(summary, recommendations, risks wording) are stored from the leader's
answer but are not required to match byte-for-byte, since two LLMs will
phrase the same finding differently.

IMPORTANT - domain correction: an earlier version of this contract was
written as a *legal document* reviewer ("helping a non-lawyer understand a
{contract_type} agreement", extracting "obligations" between parties). That
doesn't match this project's actual purpose, which is auditing smart
contract *code*, not legal prose. Feeding real Solidity source through that
legal-agreement prompt caused persistent MAJORITY_DISAGREE / UNDETERMINED
results in production: different LLM providers guessed differently at
whether they were supposed to review it as a legal document or as code
(one provider correctly produced a code-security-style analysis anyway;
several others visibly did not agree with it), the same class of prompt-
ambiguity failure documented in the AI URL Reputation Oracle project for
off-topic inputs. This version's prompt, field names, and parameter names
are all rewritten for code security auditing specifically. See
`analyze_contract` / `_build_audit_prompt`.

Design notes (see README for the full write-up):
- Storage is flattened (TreeMap of primitives + DynArray[Audit]) rather
  than nesting DynArray/TreeMap fields inside the stored dataclass, to avoid
  the gl.storage.inmem_allocate dance required for generic-in-generic storage
  fields. recommendations/risks lists are persisted as compact JSON strings.
- Equivalence: gl.vm.run_nondet_unsafe with a hand-written leader/validator
  pair (Pattern 1 + numeric tolerance from the Equivalence Principle docs),
  not strict_eq, because LLM output here is inherently non-deterministic free
  text plus a subjective score.
- Errors raised inside the non-deterministic block are tagged with
  deterministic prefixes ([EXPECTED]/[EXTERNAL]/[TRANSIENT]/[LLM_ERROR]) so
  the validator can classify and decide agreement without re-trusting the
  leader's formatting alone. `get_my_audits` applies the same
  [EXPECTED]-tagged convention to a malformed `owner_address` argument
  (constructing `Address(owner_address)` directly would otherwise raise an
  untagged, generic exception, inconsistent with every other input
  validation error in this contract).
- `risk_level` ("Low"/"Medium"/"High") is ALWAYS derived deterministically
  from `risk_score` (see `_derive_risk_level`) and is never taken directly
  from the LLM. The prompt doesn't even ask for it. An earlier version let
  the LLM self-report `risk_level` and only fell back to deriving it when
  the label was missing/invalid - that allowed an internally contradictory
  stored record (e.g. risk_level="High" alongside risk_score=20), since a
  valid-looking label was trusted even when it disagreed with the model's
  own score. Two consumers reading different fields off the same record
  (a UI's risk badge vs. its score ring; two different downstream
  contracts) would then disagree with each other. Deriving one field from
  the other by fixed breakpoints makes that impossible by construction,
  and also makes the validator's exact-match check on `risk_level`
  meaningful: it's really an exact-match check on a discrete risk bucket,
  with the numeric `risk_score` tolerance as a tighter secondary
  constraint on top of it.
"""

import json
import typing
from dataclasses import dataclass
from datetime import datetime, timezone

from genlayer import *

# --------------------------------------------------------------------------
# Constants
# --------------------------------------------------------------------------

MAX_CODE_CHARS = 20_000
MAX_TITLE_CHARS = 160
MAX_LANGUAGE_CHARS = 160
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
class Audit:
    id: str
    owner: Address
    title: str
    language: str
    risk_level: str
    risk_score: u32
    summary: str
    recommendations_json: str
    risks_json: str
    created_at: str


def _audit_to_dict(a: Audit) -> dict:
    return {
        "id": a.id,
        "owner": a.owner.as_hex,
        "title": a.title,
        "language": a.language,
        "risk_level": a.risk_level,
        "risk_score": int(a.risk_score),
        "summary": a.summary,
        "recommendations": json.loads(a.recommendations_json),
        "risks": json.loads(a.risks_json),
        "created_at": a.created_at,
    }


# --------------------------------------------------------------------------
# Prompt construction (deterministic - safe to call outside and inside the
# non-deterministic block)
# --------------------------------------------------------------------------


def _build_audit_prompt(language: str, code: str) -> str:
    return f"""You are an expert smart contract security auditor reviewing {language} source code before it is deployed or trusted with user funds.

Read the contract source code below and produce a careful, balanced security assessment. This is CODE, not a legal document -- evaluate it purely as a software security auditor would, not as a legal or contract-law reviewer.

CONTRACT SOURCE CODE:
\"\"\"
{code}
\"\"\"

Respond with ONLY a single JSON object (no markdown fences, no extra commentary) using exactly this shape:
{{
  "summary": "2-4 sentence plain-English summary of what this contract does and its main entry points",
  "recommendations": ["short recommended fix or best practice", "..."],
  "risks": ["short vulnerability or red-flag phrase", "..."],
  "risk_score": <integer 0-100, where 0 is no security risk and 100 is a severe, exploitable vulnerability>
}}

List at most {MAX_LIST_ITEMS} recommendations and at most {MAX_LIST_ITEMS} risks, each a short phrase under 20 words.
Base risk_score on concrete issues you find in the code (for example: missing access control, reentrancy,
unchecked external calls or low-level calls, integer overflow/underflow, front-running or MEV exposure,
missing input validation, denial-of-service vectors, unprotected selfdestruct or delegatecall, tx.origin misuse,
missing events for state changes, centralization/single-owner risk, unbounded loops, insufficient testing surface).
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


def _derive_risk_level(score: int) -> str:
    """Always derive risk_level from risk_score deterministically. The LLM
    is intentionally NOT asked to self-report risk_level (see the prompt):
    if it were, its label and its own score could disagree (e.g. "High"
    with a score of 20), producing an internally self-contradictory
    on-chain record that a UI showing both the score and the label would
    display as two conflicting signals. Deriving one field from the other
    makes that impossible by construction."""
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


def _normalize_audit_response(raw: typing.Any) -> dict:
    """Validate + clean the LLM's JSON response. Raises gl.vm.UserError
    (tagged ERR_LLM) on anything that cannot be salvaged."""
    if not isinstance(raw, dict):
        raise gl.vm.UserError(f"{ERR_LLM} model did not return a JSON object, got {type(raw).__name__}")

    summary = _first_present(raw, ("summary", "analysis", "overview", "description"))
    summary = str(summary or "").strip()
    if not summary:
        raise gl.vm.UserError(f"{ERR_LLM} missing 'summary' in model response")
    summary = summary[:MAX_SUMMARY_CHARS]

    recommendations = _coerce_str_list(
        _first_present(raw, ("recommendations", "recommended_fixes", "fixes"))
    )
    risks = _coerce_str_list(_first_present(raw, ("risks", "vulnerabilities", "risks_identified", "red_flags")))

    score_raw = _first_present(raw, ("risk_score", "score", "riskScore", "risk"))
    if score_raw is None:
        raise gl.vm.UserError(f"{ERR_LLM} missing 'risk_score' in model response")
    score = _coerce_risk_score(score_raw)

    level = _derive_risk_level(score)

    return {
        "summary": summary,
        "recommendations": recommendations,
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


class SmartContractAuditor(gl.Contract):
    audits: DynArray[Audit]
    audit_index: TreeMap[str, u32]
    user_audit_ids: TreeMap[Address, str]
    next_id: u256

    def __init__(self):
        pass

    @gl.public.write
    def analyze_contract(self, title: str, language: str, code: str) -> str:
        """Submit smart contract source code for AI security audit. Returns
        the new audit id."""
        clean_title = title.strip()[:MAX_TITLE_CHARS]
        clean_language = (language or "").strip()[:MAX_LANGUAGE_CHARS] or "Solidity"
        clean_code = code.strip()

        if not clean_title:
            raise gl.vm.UserError(f"{ERR_EXPECTED} title is required")
        if not clean_code:
            raise gl.vm.UserError(f"{ERR_EXPECTED} contract source code is required")
        if len(clean_code) > MAX_CODE_CHARS:
            raise gl.vm.UserError(f"{ERR_EXPECTED} contract source exceeds the {MAX_CODE_CHARS} character limit")

        prompt = _build_audit_prompt(clean_language, clean_code)

        def leader_fn():
            raw = gl.nondet.exec_prompt(prompt, response_format="json")
            return _normalize_audit_response(raw)

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
            # risk_level is derived purely from risk_score (see
            # _derive_risk_level), so this is really an exact-match check
            # on a discrete risk bucket, not on an LLM-chosen label. Two
            # results can only agree here if their scores land in the same
            # bucket; the numeric check below is a tighter constraint on
            # top of that, not a separate, looser fallback.
            if leader_data["risk_level"] != my_result["risk_level"]:
                return False
            return abs(leader_data["risk_score"] - my_result["risk_score"]) <= RISK_SCORE_TOLERANCE

        audit = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        new_id = str(int(self.next_id))
        self.next_id = u256(int(self.next_id) + 1)

        owner = gl.message.sender_address
        record = Audit(
            id=new_id,
            owner=owner,
            title=clean_title,
            language=clean_language,
            risk_level=audit["risk_level"],
            risk_score=u32(audit["risk_score"]),
            summary=audit["summary"],
            recommendations_json=json.dumps(audit["recommendations"]),
            risks_json=json.dumps(audit["risks"]),
            created_at=datetime.now(timezone.utc).isoformat(),
        )
        self.audits.append(record)
        self.audit_index[new_id] = u32(len(self.audits) - 1)

        existing_ids = json.loads(self.user_audit_ids.get(owner, "[]"))
        existing_ids.append(new_id)
        self.user_audit_ids[owner] = json.dumps(existing_ids)

        return new_id

    @gl.public.view
    def get_analysis(self, audit_id: str) -> dict:
        if audit_id not in self.audit_index:
            raise gl.vm.UserError(f"{ERR_EXPECTED} audit '{audit_id}' not found")
        idx = self.audit_index[audit_id]
        return _audit_to_dict(self.audits[idx])

    @gl.public.view
    def get_all_analyses(self) -> list[dict]:
        return [_audit_to_dict(a) for a in self.audits]

    @gl.public.view
    def get_my_analyses(self, owner_address: str) -> list[dict]:
        try:
            owner = Address(owner_address)
        except Exception:
            raise gl.vm.UserError(f"{ERR_EXPECTED} invalid owner address: {owner_address!r}")
        ids_json = self.user_audit_ids.get(owner, "[]")
        ids = json.loads(ids_json)
        out = []
        for aid in ids:
            if aid in self.audit_index:
                out.append(_audit_to_dict(self.audits[self.audit_index[aid]]))
        return out

    @gl.public.view
    def get_stats(self) -> dict:
        total = len(self.audits)
        high = 0
        medium = 0
        for a in self.audits:
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
