import os
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """
    Application Settings loaded from environment variables or .env file.
    """
    GEMINI_API_KEY: str = ""

    CHROMA_DB_PATH: str = "./chroma_db"
    COLLECTION_NAME: str = "documents"

    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200

    TOP_K: int = 5

    GEMINI_MODEL: str = "gemini-2.5-flash"
    GEMINI_EMBEDDING_MODEL: str = "gemini-embedding-001"

    ALLOWED_ORIGINS: Union[str, List[str]] = ["http://localhost:3000", "http://localhost:5173"]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    def parse_allowed_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
