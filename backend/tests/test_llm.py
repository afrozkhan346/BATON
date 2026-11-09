import pytest
from pydantic import BaseModel
from typing import List

from app.services.llm import LLMService, LLMError
from app.schemas import (
    ExtractionResult,
    ExtractedClaim,
    SemanticCheckResult,
    ConflictCheckResult,
)


class CustomSchema(BaseModel):
    message: str
    code: int = 200


def test_llm_mock_extraction():
    service = LLMService(provider="mock")
    prompt = "We chose PostgreSQL because the reporting queries need joins across tasks and owners."
    result = service.complete_json(prompt=prompt, schema=ExtractionResult)

    assert isinstance(result, ExtractionResult)
    assert len(result.claims) >= 1
    assert result.claims[0].type == "decision"
    assert "PostgreSQL" in result.claims[0].statement
    assert result.claims[0].evidence_excerpt != ""


def test_llm_mock_semantic_check():
    service = LLMService(provider="mock")

    # Positive test
    res_pos = service.complete_json(
        prompt="Quotation directly confirms PostgreSQL selection.",
        schema=SemanticCheckResult,
    )
    assert isinstance(res_pos, SemanticCheckResult)
    assert res_pos.semantic == "supports"

    # Negative test
    res_neg = service.complete_json(
        prompt="The evidence text does not match the statement.",
        schema=SemanticCheckResult,
    )
    assert isinstance(res_neg, SemanticCheckResult)
    assert res_neg.semantic == "no"


def test_llm_mock_conflict_check():
    service = LLMService(provider="mock")

    res_conflict = service.complete_json(
        prompt="Different owner assigned in file A and file B. Potential conflict.",
        schema=ConflictCheckResult,
    )
    assert isinstance(res_conflict, ConflictCheckResult)
    assert res_conflict.contradict is True


def test_llm_retry_on_failure(monkeypatch):
    service = LLMService(provider="mock")
    attempts = 0

    def faulty_mock(prompt, schema):
        nonlocal attempts
        attempts += 1
        if attempts == 1:
            raise ValueError("Transient JSON parsing failure")
        return CustomSchema(message="recovered", code=200)

    monkeypatch.setattr(service, "_complete_mock", faulty_mock)

    result = service.complete_json(prompt="test", schema=CustomSchema, max_retries=1)
    assert result.message == "recovered"
    assert attempts == 2


def test_llm_max_retries_exceeded(monkeypatch):
    service = LLMService(provider="mock")

    def broken_mock(prompt, schema):
        raise ValueError("Persistent API timeout")

    monkeypatch.setattr(service, "_complete_mock", broken_mock)

    with pytest.raises(LLMError, match="failed after 2 attempts"):
        service.complete_json(prompt="test", schema=CustomSchema, max_retries=1)
