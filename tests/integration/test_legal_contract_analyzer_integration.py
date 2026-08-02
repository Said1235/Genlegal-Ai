"""
Integration tests for LegalContractAnalyzer.

Run with:  gltest tests/integration/ -v -s

Unlike the direct-mode tests, these go through real consensus (leader +
validators) against a running network - localnet (genlayer up), StudioNet,
or a funded testnet. They use `create_mock_validator(mock_llm_response=...)`
so no real LLM provider key is required for the network's *virtual*
validators, but the network itself (Docker / genlayer CLI) must be running.

Requires, before `gltest` can resolve a network:
    genlayer init               # one-time, sets up Docker + GenVM
    genlayer up                 # starts the local validator network
    genlayer network set localnet   (or studionet)

This file could not be executed in the sandbox this project was generated
in - there is no Docker / GenVM runtime available there. Run it locally
once the steps above are done; see README.md "What's blocked" section.
"""

import importlib.util
import json
from pathlib import Path

import pytest
from gltest import get_contract_factory, get_accounts, get_validator_factory

CONTRACT_PATH = Path(__file__).parent.parent.parent / "contracts" / "legal_contract_analyzer.py"


def _load_prompt_builder():
    """Import _build_analysis_prompt straight from the contract file so the
    mocked-response prompt key always matches the real prompt byte-for-byte,
    even if the wording in the contract changes later."""
    spec = importlib.util.spec_from_file_location("legal_contract_analyzer", CONTRACT_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)  # type: ignore[union-attr]
    return module._build_analysis_prompt


VALID_RESPONSE = {
    "summary": "A non-disclosure agreement between two parties for a product evaluation.",
    "obligations": ["Receiving party must keep information confidential for 2 years"],
    "risks": ["No carve-out for independently developed information"],
    "risk_level": "Medium",
    "risk_score": 48,
}

SAMPLE_TEXT = "This Mutual Non-Disclosure Agreement is entered into by Acme Corp and Beta LLC " * 5
SAMPLE_TYPE = "NDA"


@pytest.fixture
def mock_validators():
    """5 virtual validators that all answer with the same mocked JSON, so
    consensus is reached deterministically without calling a real LLM."""
    build_prompt = _load_prompt_builder()
    prompt = build_prompt(SAMPLE_TYPE, SAMPLE_TEXT.strip())

    factory = get_validator_factory()
    mock_llm_response = {"nondet_exec_prompt": {prompt: json.dumps(VALID_RESPONSE)}}
    return factory.batch_create_mock_validators(5, mock_llm_response=mock_llm_response)


class TestLegalContractAnalyzerIntegration:
    def test_deploy_and_analyze_through_consensus(self, mock_validators):
        accounts = get_accounts()
        sender = accounts[0]

        factory = get_contract_factory(contract_file_path=str(CONTRACT_PATH))
        contract = factory.deploy(account=sender)

        receipt = contract.analyze_contract.transact(
            args=["Mutual NDA", SAMPLE_TYPE, SAMPLE_TEXT.strip()],
            account=sender,
        )
        assert receipt.status in ("ACCEPTED", "FINALIZED")

        # IDs are assigned sequentially starting at "0" for a fresh contract.
        record = contract.get_analysis.call(args=["0"])
        assert record["risk_level"] == "Medium"
        assert record["risk_score"] == 48
        assert record["title"] == "Mutual NDA"

    def test_stats_reflect_submitted_analysis(self, mock_validators):
        accounts = get_accounts()
        sender = accounts[0]

        factory = get_contract_factory(contract_file_path=str(CONTRACT_PATH))
        contract = factory.deploy(account=sender)

        contract.analyze_contract.transact(
            args=["Mutual NDA", SAMPLE_TYPE, SAMPLE_TEXT.strip()],
            account=sender,
        )

        stats = contract.get_stats.call()
        assert stats["total_analyses"] == 1
        assert stats["medium_risk"] == 1
