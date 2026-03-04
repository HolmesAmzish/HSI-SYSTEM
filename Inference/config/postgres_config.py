from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import Optional


class PostgresConfig(BaseSettings):
    """PostgreSQL configuration with PostGIS raster support."""

    POSTGRES_HOST: str = Field(default="192.168.0.190", validation_alias="POSTGRES_HOST")
    POSTGRES_PORT: int = Field(default=5432, validation_alias="POSTGRES_PORT")
    POSTGRES_DB: str = Field(default="hsi_sys", validation_alias="POSTGRES_DB")
    POSTGRES_USER: str = Field(default="postgres", validation_alias="POSTGRES_USER")
    POSTGRES_PASSWORD: str = Field(default="postgres", validation_alias="POSTGRES_PASSWORD")

    # Connection pool settings
    POSTGRES_POOL_SIZE: int = Field(default=10, validation_alias="POSTGRES_POOL_SIZE")
    POSTGRES_MAX_OVERFLOW: int = Field(default=20, validation_alias="POSTGRES_MAX_OVERFLOW")
    POSTGRES_POOL_TIMEOUT: int = Field(default=30, validation_alias="POSTGRES_POOL_TIMEOUT")
    POSTGRES_POOL_RECYCLE: int = Field(default=1800, validation_alias="POSTGRES_POOL_RECYCLE")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    @property
    def connection_url(self) -> str:
        """Return PostgreSQL connection URL with psycopg2 dialect."""
        return f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @property
    def sync_connection_url(self) -> str:
        """Return synchronous PostgreSQL connection URL."""
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @property
    def connection_kwargs(self) -> dict:
        """Return connection parameters for psycopg2."""
        return {
            "host": self.POSTGRES_HOST,
            "port": self.POSTGRES_PORT,
            "database": self.POSTGRES_DB,
            "user": self.POSTGRES_USER,
            "password": self.POSTGRES_PASSWORD,
        }