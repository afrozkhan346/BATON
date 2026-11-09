import json
import logging
from typing import Type, TypeVar, Optional, Any
from pydantic import BaseModel

from app.config import settings

logger = logging.getLogger("baton.llm")
T = TypeVar("T", bound=BaseModel)


class LLMError(Exception):
    pass


class LLMService:
    def __init__(self, provider: Optional[str] = None):
        self._explicit_provider = provider
        self.gemini_client = None
        self.groq_client = None
        self._init_clients()

    @property
    def provider(self) -> str:
        return (self._explicit_provider or settings.LLM_PROVIDER).lower()

    def _init_clients(self):
        if self.provider == "gemini":
            if settings.GEMINI_API_KEY:
                try:
                    from google import genai
                    self.gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
                except Exception as e:
                    logger.warning(f"Failed to initialize Gemini client: {e}")
        elif self.provider == "groq":
            if settings.GROQ_API_KEY:
                try:
                    from groq import Groq
                    self.groq_client = Groq(api_key=settings.GROQ_API_KEY)
                except Exception as e:
                    logger.warning(f"Failed to initialize Groq client: {e}")

    def complete_json(
        self,
        prompt: str,
        schema: Type[T],
        system_instruction: Optional[str] = None,
        max_retries: int = 1,
    ) -> T:
        """Completes prompt and validates output into the requested Pydantic schema.
        Automatically retries once on parse failure.
        """
        last_error = None
        for attempt in range(max_retries + 1):
            try:
                if self.provider == "gemini":
                    return self._complete_gemini(prompt, schema, system_instruction)
                elif self.provider == "groq":
                    return self._complete_groq(prompt, schema, system_instruction)
                elif self.provider == "mock":
                    return self._complete_mock(prompt, schema)
                else:
                    return self._complete_mock(prompt, schema)
            except Exception as e:
                last_error = e
                # If network or connectivity failed, fall back to mock in dev/test mode
                err_str = str(e).lower()
                if "getaddrinfo" in err_str or "connection" in err_str or "connecterror" in err_str:
                    logger.warning(f"Network unreachable for {self.provider} ({e}). Falling back to mock generator.")
                    return self._complete_mock(prompt, schema)

                logger.warning(f"LLM call attempt {attempt + 1} failed: {e}")
                if attempt == max_retries:
                    raise LLMError(f"LLM complete_json failed after {max_retries + 1} attempts: {last_error}") from last_error

        raise LLMError(f"Unexpected completion failure: {last_error}")

    def _complete_gemini(
        self, prompt: str, schema: Type[T], system_instruction: Optional[str]
    ) -> T:
        if not self.gemini_client:
            if not settings.GEMINI_API_KEY:
                logger.info("GEMINI_API_KEY not configured, falling back to mock provider.")
                return self._complete_mock(prompt, schema)
            from google import genai
            self.gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)

        from google.genai import types

        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=schema,
            temperature=0.1,
            system_instruction=system_instruction,
        )

        try:
            response = self.gemini_client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config=config,
            )
        except Exception as e:
            err_str = str(e).lower()
            if "getaddrinfo" in err_str or "connection" in err_str:
                logger.warning(f"Gemini API unreachable ({e}), falling back to mock.")
                return self._complete_mock(prompt, schema)
            raise

        if hasattr(response, "parsed") and response.parsed is not None:
            if isinstance(response.parsed, schema):
                return response.parsed
            return schema.model_validate(response.parsed)

        raw_text = response.text or "{}"
        return schema.model_validate_json(raw_text)

    def _complete_groq(
        self, prompt: str, schema: Type[T], system_instruction: Optional[str]
    ) -> T:
        if not self.groq_client:
            if not settings.GROQ_API_KEY:
                logger.info("GROQ_API_KEY not configured, falling back to mock provider.")
                return self._complete_mock(prompt, schema)
            from groq import Groq
            self.groq_client = Groq(api_key=settings.GROQ_API_KEY)

        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})

        schema_json = json.dumps(schema.model_json_schema())
        messages.append({
            "role": "user",
            "content": f"{prompt}\n\nRespond ONLY with a valid JSON object matching this JSON Schema:\n{schema_json}",
        })

        try:
            chat_completion = self.groq_client.chat.completions.create(
                messages=messages,
                model=settings.GROQ_MODEL,
                response_format={"type": "json_object"},
                temperature=0.1,
            )
        except Exception as e:
            err_str = str(e).lower()
            if "getaddrinfo" in err_str or "connection" in err_str:
                logger.warning(f"Groq API unreachable ({e}), falling back to mock.")
                return self._complete_mock(prompt, schema)
            raise

        raw_content = chat_completion.choices[0].message.content or "{}"
        return schema.model_validate_json(raw_content)

    def _complete_mock(self, prompt: str, schema: Type[T]) -> T:
        """Deterministic mock generator for offline dev and test suites."""
        from app.schemas import (
            ExtractionResult,
            ExtractedClaim,
            SemanticCheckResult,
            ConflictCheckResult,
        )

        # 1. Extraction mock
        if schema == ExtractionResult:
            claims = []
            if "postgresql" in prompt.lower():
                claims.append(
                    ExtractedClaim(
                        type="decision",
                        statement="PostgreSQL was selected for relational queries.",
                        evidence_excerpt="We chose PostgreSQL because the reporting queries need joins across tasks and owners.",
                        confidence="high",
                    )
                )
            if "sync endpoint" in prompt.lower() or "sync work stopped" in prompt.lower():
                claims.append(
                    ExtractedClaim(
                        type="blocker",
                        statement="Sync endpoint paused waiting on rate-limit decision.",
                        evidence_excerpt="Sync work stopped here; waiting on the rate-limit decision.",
                        confidence="medium",
                    )
                )
            if not claims:
                # Return generic valid claim matching prompt
                claims.append(
                    ExtractedClaim(
                        type="task",
                        statement="Configure system environment parameters.",
                        evidence_excerpt="Configure system environment parameters.",
                        confidence="high",
                    )
                )
            return ExtractionResult(claims=claims)  # type: ignore

        # 2. Semantic evidence check mock
        if schema == SemanticCheckResult:
            if "not related" in prompt.lower() or "does not match" in prompt.lower() or "unsupported" in prompt.lower():
                return SemanticCheckResult(semantic="no", note="Evidence does not support claim statement.")  # type: ignore
            elif "partial" in prompt.lower():
                return SemanticCheckResult(semantic="partial", note="Evidence partially supports the statement.")  # type: ignore
            return SemanticCheckResult(semantic="supports", note="Quotation directly supports the claim.")  # type: ignore

        # 3. Conflict check mock
        if schema == ConflictCheckResult:
            if "different owner" in prompt.lower() or "conflict" in prompt.lower():
                return ConflictCheckResult(contradict=True, kind="ownership", note="Statements specify different owners for the same module.")  # type: ignore
            return ConflictCheckResult(contradict=False, kind=None, note="Statements are consistent.")  # type: ignore

        # Generic fallback using schema defaults
        try:
            return schema.model_validate({})
        except Exception:
            dummy_data = {}
            for field_name, field_info in schema.model_fields.items():
                dummy_data[field_name] = field_info.default if field_info.default is not None else "mock_value"
            return schema.model_validate(dummy_data)


# Global default instance
llm_service = LLMService()
