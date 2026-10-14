"""Application configuration using Pydantic Settings."""

from typing import List, Union
from pathlib import Path
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    PORT: int = 5001
    HOST: str = "127.0.0.1"

    ALLOWED_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://ais-dev-ldt6qkvscxzrc4jx4netwn-434541130093.asia-east1.run.app"
    ]

    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    RATE_LIMIT_WINDOW_MS: int = 900000  # 15 minutes
    RATE_LIMIT_MAX_REQUESTS: int = 200
    AUTH_RATE_LIMIT_MAX: int = 20

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return [str(i).strip() for i in v if str(i).strip()]
        return ["http://localhost:3000", "http://localhost:5173"]

    model_config = SettingsConfigDict(
        env_file=[
            Path(__file__).resolve().parent.parent.parent / ".env",
            Path(__file__).resolve().parent.parent.parent.parent / ".env",
        ],
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
