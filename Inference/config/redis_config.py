from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import Optional

class RedisConfig(BaseSettings):
    """Redis configuration based on Server project application.properties."""

    REDIS_HOST: str = Field(default="192.168.0.110", validation_alias="REDIS_HOST")
    REDIS_PORT: int = Field(default=6379, validation_alias="REDIS_PORT")
    REDIS_PASSWORD: Optional[str] = Field(default=None, validation_alias="REDIS_PASSWORD")
    REDIS_DB: int = Field(default=0, validation_alias="REDIS_DB")

    REDIS_TIMEOUT: int = Field(default=2, validation_alias="REDIS_TIMEOUT")
    REDIS_MAX_CONNECTIONS: int = Field(default=10, validation_alias="REDIS_MAX_CONNECTIONS")
    REDIS_CONNECTION_TIMEOUT: int = Field(default=2, validation_alias="REDIS_CONNECTION_TIMEOUT")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    @property
    def connection_url(self) -> str:
        if self.REDIS_PASSWORD:
            return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    @property
    def connection_kwargs(self) -> dict:
        return {
            "host": self.REDIS_HOST,
            "port": self.REDIS_PORT,
            "password": self.REDIS_PASSWORD,
            "db": self.REDIS_DB,
            "socket_timeout": self.REDIS_TIMEOUT,
            "socket_connect_timeout": self.REDIS_CONNECTION_TIMEOUT,
            "max_connections": self.REDIS_MAX_CONNECTIONS,
            "decode_responses": True
        }