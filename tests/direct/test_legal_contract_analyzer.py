"""
Direct-mode tests for LegalContractAnalyzer.

Run with:  pytest tests/direct/ -v

Uses the pytest fixtures auto-registered by genlayer-test's direct-mode
plugin (no conftest.py needed): direct_vm, direct_deploy, direct_alice,
direct_bob. These run the contract natively in Python (no WASM/Studio); LLM
calls are mocked via direct_vm.mock_llm and consensus is simulated by
invoking the captured validator through direct_vm.run_validator().
"""

import json

import pytest

CONTRACT = "legal_contract_analyzer.py"

VALID_RESPONSE = json.dumps(
    {
        "summary": "A service agreement between a vendor and a client for web app development.",
        "obligations": [
            "Vendor must deliver the software described in Exhibit A",
            "Client must pay according to the milestone schedule",
        ],
        "risks": [
            "Limitation of liability clause is unusually broad",
            "Contract auto-renews unless cancelled 60 days in advance",
        ],
        "risk_level": "High",
        "risk_score": 82,
    }
)


class TestAnalyzeContract:
    def test_creates_analysis_and_returns_id(self, direct_vm, direct_deploy, direct_alice):
        direct_vm.sender = direct_alice
        contract = direct_deploy(CONTRACT)
        direct_vm.mock_llm(r".*", VALID_RESPONSE)

        new_id = contract.analyze_contract(
            "Service Agreement", "Service Agreement", "Some contract text " * 20
        )

        assert new_id == "0"
        record = contract.get_analysis(new_id)
        assert record["title"] == "Service Agreement"
        assert record["risk_level"] == "High"
        assert record["risk_score"] == 82
        assert record["owner"] == direct_alice.as_hex
        assert len(record["obligations"]) == 2
        assert len(record["risks"]) == 2

    def test_stats_and_listing_update(self, direct_vm, direct_deploy, direct_alice):
        direct_vm.sender = direct_alice
        contract = direct_deploy(CONTRACT)
        direct_vm.mock_llm(r".*", VALID_RESPONSE)

        contract.analyze_contract("Service Agreement", "Service Agreement", "text " * 20)

        stats = contract.get_stats()
        assert stats["total_analyses"] == 1
        assert stats["high_risk"] == 1
        assert stats["medium_risk"] == 0
        assert stats["low_risk"] == 0
        assert len(contract.get_all_analyses()) == 1

    def test_rejects_empty_text(self, direct_vm, direct_deploy, direct_alice):
        direct_vm.sender = direct_alice
        contract = direct_deploy(CONTRACT)
        with direct_vm.expect_revert("[EXPECTED]"):
            contract.analyze_contract("Title", "NDA", "   ")

    def test_rejects_text_over_limit(self, direct_vm, direct_deploy, direct_alice):
        direct_vm.sender = direct_alice
        contract = direct_deploy(CONTRACT)
        with direct_vm.expect_revert("[EXPECTED]"):
            contract.analyze_contract("Title", "NDA", "x" * 20_001)

    def test_malformed_llm_json_is_rejected(self, direct_vm, direct_deploy, direct_alice):
        direct_vm.sender = direct_alice
        contract = direct_deploy(CONTRACT)
        direct_vm.mock_llm(r".*", "not valid json at all")
        with direct_vm.expect_revert("[LLM_ERROR]"):
            contract.analyze_contract("Title", "NDA", "some contract body")

    def test_missing_risk_score_is_rejected(self, direct_vm, direct_deploy, direct_alice):
        direct_vm.sender = direct_alice
        contract = direct_deploy(CONTRACT)
        bad = json.dumps({"summary": "ok", "obligations": [], "risks": [], "risk_level": "Low"})
        direct_vm.mock_llm(r".*", bad)
        with direct_vm.expect_revert("[LLM_ERROR]"):
            contract.analyze_contract("Title", "NDA", "some contract body")

    def test_key_aliasing_is_tolerated(self, direct_vm, direct_deploy, direct_alice):
        """LLMs sometimes use alternate key names - the contract should cope."""
        direct_vm.sender = direct_alice
        contract = direct_deploy(CONTRACT)
        aliased = json.dumps(
            {
                "overview": "An NDA between two parties.",
                "key_obligations": ["Keep information confidential"],
                "red_flags": ["No defined expiration date"],
                "riskLevel": "medium",
                "score": 45,
            }
        )
        direct_vm.mock_llm(r".*", aliased)
        new_id = contract.analyze_contract("Mutual NDA", "NDA", "confidential info " * 10)
        record = contract.get_analysis(new_id)
        assert record["risk_level"] == "Medium"
        assert record["risk_score"] == 45
        assert record["summary"].startswith("An NDA")


class TestMultiUser:
    def test_get_my_analyses_filters_by_owner(self, direct_vm, direct_deploy, direct_alice, direct_bob):
        direct_vm.sender = direct_alice
        contract = direct_deploy(CONTRACT)
        direct_vm.mock_llm(r".*", VALID_RESPONSE)

        direct_vm.sender = direct_alice
        contract.analyze_contract("Alice's NDA", "NDA", "alice text " * 10)

        direct_vm.sender = direct_bob
        contract.analyze_contract("Bob's MSA", "MSA", "bob text " * 10)

        alice_only = contract.get_my_analyses(direct_alice.as_hex)
        bob_only = contract.get_my_analyses(direct_bob.as_hex)

        assert len(alice_only) == 1
        assert alice_only[0]["title"] == "Alice's NDA"
        assert len(bob_only) == 1
        assert bob_only[0]["title"] == "Bob's MSA"


class TestEquivalencePrincipleValidator:
    """Exercise the hand-written leader/validator pair directly via
    direct_vm.run_validator(), simulating what a second validator node
    would independently compute."""

    def test_validator_agrees_within_score_tolerance(self, direct_vm, direct_deploy, direct_alice):
        direct_vm.sender = direct_alice
        contract = direct_deploy(CONTRACT)
        direct_vm.mock_llm(r".*", VALID_RESPONSE)  # risk_score=82, risk_level=High

        contract.analyze_contract("Service Agreement", "Service Agreement", "text " * 20)

        # Validator re-runs leader_fn; swap the mock to a slightly different
        # (but still High, within RISK_SCORE_TOLERANCE) score first.
        close_response = VALID_RESPONSE.replace('"risk_score": 82', '"risk_score": 88')
        direct_vm.mock_llm(r".*", close_response)

        assert direct_vm.run_validator() is True

    def test_validator_disagrees_on_risk_level_mismatch(self, direct_vm, direct_deploy, direct_alice):
        direct_vm.sender = direct_alice
        contract = direct_deploy(CONTRACT)
        direct_vm.mock_llm(r".*", VALID_RESPONSE)  # risk_level=High

        contract.analyze_contract("Service Agreement", "Service Agreement", "text " * 20)

        different_level = VALID_RESPONSE.replace('"risk_level": "High"', '"risk_level": "Low"').replace(
            '"risk_score": 82', '"risk_score": 10'
        )
        direct_vm.mock_llm(r".*", different_level)

        assert direct_vm.run_validator() is False

    def test_validator_disagrees_when_score_drifts_too_far(self, direct_vm, direct_deploy, direct_alice):
        direct_vm.sender = direct_alice
        contract = direct_deploy(CONTRACT)
        direct_vm.mock_llm(r".*", VALID_RESPONSE)  # risk_score=82

        contract.analyze_contract("Service Agreement", "Service Agreement", "text " * 20)

        far_response = VALID_RESPONSE.replace('"risk_score": 82', '"risk_score": 50')
        direct_vm.mock_llm(r".*", far_response)

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
            contract.analyze_contract("Title", "NDA", "some contract body")
