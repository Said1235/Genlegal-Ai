"""
Direct-mode tests for SmartContractAuditor.

Run with:  pytest tests/direct/ -v

Uses the pytest fixtures auto-registered by genlayer-test's direct-mode
plugin (no conftest.py boilerplate needed for the fixtures themselves -
tests/direct/conftest.py only pins the GenVM SDK version, see that file):
direct_vm, direct_deploy, direct_alice, direct_bob. These run the contract
natively in Python (no WASM/Studio); LLM calls are mocked via
direct_vm.mock_llm and consensus is simulated by invoking the captured
validator through direct_vm.run_validator().
"""

import json

import pytest

CONTRACT = "smart_contract_auditor.py"


def _addr_hex(addr) -> str:
    """direct_alice/direct_bob are Address objects when the genlayer SDK's
    Address class is importable in this environment, otherwise gltest falls
    back to raw 20-byte `bytes` (see gltest.direct.loader.create_address).
    Compare case-insensitively since raw bytes.hex() has no EIP-55 checksum
    casing, while Address.as_hex does."""
    return getattr(addr, "as_hex", None) or f"0x{addr.hex()}"

# Note: risk_level is intentionally absent - the contract never trusts an
# LLM-reported risk_level, it's always derived from risk_score deterministically
# (see _derive_risk_level). 82 -> "High" (>= 67).
VALID_RESPONSE = json.dumps(
    {
        "summary": "A simple ERC-20-style token contract with mint and transfer functions.",
        "recommendations": [
            "Add a reentrancy guard around external calls",
            "Emit events on all state-changing functions",
        ],
        "risks": [
            "No access control on the mint function",
            "Missing zero-address check on transfer",
        ],
        "risk_score": 82,
    }
)

# The exact Solidity source that produced a MAJORITY_DISAGREE / UNDETERMINED
# result in production when the previous legal-agreement-domain prompt was
# fed real code (see the README "Domain correction" section).
HOLAMUNDO_SOURCE = """// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract HolaMundo {
    string public mensaje = "\u00a1Hola, Web3!";
    function cambiarMensaje(string memory _nuevoMensaje) public {
        mensaje = _nuevoMensaje;
    }
}"""

HOLAMUNDO_RESPONSE = json.dumps(
    {
        "summary": "HolaMundo is a minimal contract storing a public greeting string that anyone can overwrite via cambiarMensaje.",
        "recommendations": [
            "Add access control (e.g. Ownable) if only specific addresses should update the message",
            "Emit an event when the message changes for on-chain traceability",
        ],
        "risks": [
            "No access control - any address can overwrite the stored message",
            "No input length validation on _nuevoMensaje, potential gas griefing",
        ],
        "risk_score": 38,
    }
)


class TestAnalyzeContract:
    def test_creates_analysis_and_returns_id(self, direct_vm, direct_deploy, direct_alice):
        direct_vm.sender = direct_alice
        contract = direct_deploy(CONTRACT)
        direct_vm.mock_llm(r".*", VALID_RESPONSE)

        new_id = contract.analyze_contract(
            "Vault", "Solidity", "contract Vault { function mint() public {} }" * 5
        )

        assert new_id == "0"
        record = contract.get_analysis(new_id)
        assert record["title"] == "Vault"
        assert record["language"] == "Solidity"
        assert record["risk_level"] == "High"
        assert record["risk_score"] == 82
        assert record["owner"].lower() == _addr_hex(direct_alice).lower()
        assert len(record["recommendations"]) == 2
        assert len(record["risks"]) == 2

    def test_regression_holamundo_source_from_failed_transaction(
        self, direct_vm, direct_deploy, direct_alice
    ):
        """The exact input that went through 3 leader rotations and finalized
        UNDETERMINED under the previous legal-document-domain prompt. With
        the code-security prompt, a single mocked response is accepted by
        the validator without any disagreement (see the equivalence-check
        tests below for the disagreement path itself)."""
        direct_vm.sender = direct_alice
        contract = direct_deploy(CONTRACT)
        direct_vm.mock_llm(r".*", HOLAMUNDO_RESPONSE)

        new_id = contract.analyze_contract("HolaMundo", "Solidity", HOLAMUNDO_SOURCE)
        record = contract.get_analysis(new_id)

        assert record["risk_level"] == "Medium"  # score 38 -> 34-66 bucket
        assert record["risk_score"] == 38
        assert "access control" in " ".join(record["risks"]).lower()

        # Validator independently re-runs the same prompt and must agree.
        assert direct_vm.run_validator() is True

    def test_stats_and_listing_update(self, direct_vm, direct_deploy, direct_alice):
        direct_vm.sender = direct_alice
        contract = direct_deploy(CONTRACT)
        direct_vm.mock_llm(r".*", VALID_RESPONSE)

        contract.analyze_contract("Vault", "Solidity", "code " * 20)

        stats = contract.get_stats()
        assert stats["total_analyses"] == 1
        assert stats["high_risk"] == 1
        assert stats["medium_risk"] == 0
        assert stats["low_risk"] == 0
        assert len(contract.get_all_analyses()) == 1

    def test_rejects_empty_code(self, direct_vm, direct_deploy, direct_alice):
        direct_vm.sender = direct_alice
        contract = direct_deploy(CONTRACT)
        with direct_vm.expect_revert("[EXPECTED]"):
            contract.analyze_contract("Title", "Solidity", "   ")

    def test_rejects_empty_title(self, direct_vm, direct_deploy, direct_alice):
        direct_vm.sender = direct_alice
        contract = direct_deploy(CONTRACT)
        with direct_vm.expect_revert("[EXPECTED]"):
            contract.analyze_contract("   ", "Solidity", "contract C {}")

    def test_rejects_code_over_limit(self, direct_vm, direct_deploy, direct_alice):
        direct_vm.sender = direct_alice
        contract = direct_deploy(CONTRACT)
        with direct_vm.expect_revert("[EXPECTED]"):
            contract.analyze_contract("Title", "Solidity", "x" * 20_001)

    def test_defaults_language_to_solidity_when_blank(self, direct_vm, direct_deploy, direct_alice):
        direct_vm.sender = direct_alice
        contract = direct_deploy(CONTRACT)
        direct_vm.mock_llm(r".*", VALID_RESPONSE)
        new_id = contract.analyze_contract("Title", "   ", "contract C { function f() public {} }")
        assert contract.get_analysis(new_id)["language"] == "Solidity"

    def test_malformed_llm_json_is_rejected(self, direct_vm, direct_deploy, direct_alice):
        direct_vm.sender = direct_alice
        contract = direct_deploy(CONTRACT)
        direct_vm.mock_llm(r".*", "not valid json at all")
        with direct_vm.expect_revert("[LLM_ERROR]"):
            contract.analyze_contract("Title", "Solidity", "some contract code")

    def test_missing_risk_score_is_rejected(self, direct_vm, direct_deploy, direct_alice):
        direct_vm.sender = direct_alice
        contract = direct_deploy(CONTRACT)
        bad = json.dumps({"summary": "ok", "recommendations": [], "risks": []})
        direct_vm.mock_llm(r".*", bad)
        with direct_vm.expect_revert("[LLM_ERROR]"):
            contract.analyze_contract("Title", "Solidity", "some contract code")

    def test_key_aliasing_is_tolerated(self, direct_vm, direct_deploy, direct_alice):
        """LLMs sometimes use alternate key names - the contract should cope."""
        direct_vm.sender = direct_alice
        contract = direct_deploy(CONTRACT)
        aliased = json.dumps(
            {
                "overview": "A simple token vault contract.",
                "fixes": ["Add input validation on deposit amounts"],
                "vulnerabilities": ["No pause mechanism for emergencies"],
                "score": 45,
            }
        )
        direct_vm.mock_llm(r".*", aliased)
        new_id = contract.analyze_contract("Token Vault", "Vyper", "vault code " * 10)
        record = contract.get_analysis(new_id)
        assert record["risk_level"] == "Medium"  # derived from score=45 (34-66 -> Medium)
        assert record["risk_score"] == 45
        assert record["summary"].startswith("A simple token vault")


class TestMultiUser:
    def test_get_my_analyses_filters_by_owner(self, direct_vm, direct_deploy, direct_alice, direct_bob):
        direct_vm.sender = direct_alice
        contract = direct_deploy(CONTRACT)
        direct_vm.mock_llm(r".*", VALID_RESPONSE)

        direct_vm.sender = direct_alice
        contract.analyze_contract("Alice's Vault", "Solidity", "alice code " * 10)

        direct_vm.sender = direct_bob
        contract.analyze_contract("Bob's Router", "Vyper", "bob code " * 10)

        alice_only = contract.get_my_analyses(_addr_hex(direct_alice))
        bob_only = contract.get_my_analyses(_addr_hex(direct_bob))

        assert len(alice_only) == 1
        assert alice_only[0]["title"] == "Alice's Vault"
        assert len(bob_only) == 1
        assert bob_only[0]["title"] == "Bob's Router"

    def test_get_my_analyses_rejects_malformed_address(self, direct_vm, direct_deploy, direct_alice):
        direct_vm.sender = direct_alice
        contract = direct_deploy(CONTRACT)
        with direct_vm.expect_revert("[EXPECTED]"):
            contract.get_my_analyses("not-a-real-address")

    def test_get_my_analyses_empty_for_unknown_owner(self, direct_vm, direct_deploy, direct_alice, direct_bob):
        direct_vm.sender = direct_alice
        contract = direct_deploy(CONTRACT)
        assert contract.get_my_analyses(_addr_hex(direct_bob)) == []


class TestEquivalencePrincipleValidator:
    """Exercise the hand-written leader/validator pair directly via
    direct_vm.run_validator(), simulating what a second validator node
    would independently compute. Three boundary cases, matching the
    validator's two-part check (exact risk_level bucket AND risk_score
    within RISK_SCORE_TOLERANCE)."""

    def test_validator_agrees_when_same_bucket_and_within_tolerance(
        self, direct_vm, direct_deploy, direct_alice
    ):
        direct_vm.sender = direct_alice
        contract = direct_deploy(CONTRACT)
        direct_vm.mock_llm(r".*", VALID_RESPONSE)  # risk_score=82 -> High

        contract.analyze_contract("Vault", "Solidity", "code " * 20)

        # 82 -> 88: still High, gap of 6 <= RISK_SCORE_TOLERANCE (12).
        close_response = VALID_RESPONSE.replace('"risk_score": 82', '"risk_score": 88')
        direct_vm.clear_mocks()
        direct_vm.mock_llm(r".*", close_response)

        assert direct_vm.run_validator() is True

    def test_validator_disagrees_across_risk_level_boundary_despite_small_score_gap(
        self, direct_vm, direct_deploy, direct_alice
    ):
        """66 and 67 differ by only 1 point (well within tolerance), but sit
        on opposite sides of the Medium/High boundary - the bucket check
        must still catch this, since it's checked independently of the
        numeric tolerance, not as a looser fallback."""
        direct_vm.sender = direct_alice
        contract = direct_deploy(CONTRACT)
        leader_66 = VALID_RESPONSE.replace('"risk_score": 82', '"risk_score": 66')  # Medium
        direct_vm.mock_llm(r".*", leader_66)

        contract.analyze_contract("Vault", "Solidity", "code " * 20)

        validator_67 = VALID_RESPONSE.replace('"risk_score": 82', '"risk_score": 67')  # High
        direct_vm.clear_mocks()
        direct_vm.mock_llm(r".*", validator_67)

        assert direct_vm.run_validator() is False

    def test_validator_disagrees_when_gap_exceeds_tolerance_even_within_same_bucket(
        self, direct_vm, direct_deploy, direct_alice
    ):
        """70 and 95 are both High (same bucket), but the 25-point gap
        exceeds RISK_SCORE_TOLERANCE (12) - the bucket match alone is not
        sufficient, the numeric check is a real, tighter constraint on top."""
        direct_vm.sender = direct_alice
        contract = direct_deploy(CONTRACT)
        leader_70 = VALID_RESPONSE.replace('"risk_score": 82', '"risk_score": 70')  # High
        direct_vm.mock_llm(r".*", leader_70)

        contract.analyze_contract("Vault", "Solidity", "code " * 20)

        validator_95 = VALID_RESPONSE.replace('"risk_score": 82', '"risk_score": 95')  # High
        direct_vm.clear_mocks()
        direct_vm.mock_llm(r".*", validator_95)

        assert direct_vm.run_validator() is False

    def test_leader_failure_on_garbage_output_aborts_before_validator(
        self, direct_vm, direct_deploy, direct_alice
    ):
        """In direct mode, an exception raised inside leader_fn() propagates
        immediately out of run_nondet_unsafe (no validator is captured) -
        this is a direct-test-mode characteristic, not a contract bug; in
        production the leader's UserError is itself the Result the first
        validator round reasons about (see _validator_agrees_with_error)."""
        direct_vm.sender = direct_alice
        contract = direct_deploy(CONTRACT)
        direct_vm.mock_llm(r".*", "garbage, not json")

        with pytest.raises(Exception):
            contract.analyze_contract("Title", "Solidity", "some contract code")
