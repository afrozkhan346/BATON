from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    # LLM Settings
    LLM_PROVIDER: str = "gemini"  # "gemini" | "groq" | "mock"
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # Database
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    DATABASE_URL: str = "sqlite:///./baton_dev.db"

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
