from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from .redis_config import RedisConfig


class Settings(BaseSettings):
    """
    Application settings for HSI Inference System.
    Matches configuration from Server project's application.properties.
    """

    # Path configuration
    SHARED_DATA_DIR: Path = Field(
        default=Path("C:/Development/repositories/HSI-SYSTEM/SharedData"),
        description="Base directory for shared data"
    )

    @property
    def UPLOAD_DIR(self) -> Path:
        """Directory for uploaded files."""
        return self.SHARED_DATA_DIR / "uploads"

    @property
    def OUTPUT_DIR(self) -> Path:
        """Directory for output files."""
        return self.SHARED_DATA_DIR / "outputs"

    @property
    def BIN_DIR(self) -> Path:
        """Directory for binary cube files."""
        return self.SHARED_DATA_DIR / "bin"

    @property
    def MAT_HSI_DIR(self) -> Path:
        """Directory for HSI MAT files."""
        return self.SHARED_DATA_DIR / "mat" / "hsi"

    @property
    def MAT_GT_DIR(self) -> Path:
        """Directory for GT MAT files."""
        return self.SHARED_DATA_DIR / "mat" / "gt"

    # Redis queue configuration
    # Three task queues for different task types
    REDIS_QUEUE_HSI_LOAD: str = Field(
        default="hsi:queue:hsi-load",
        validation_alias="REDIS_QUEUE_HSI_LOAD",
        description="Queue for HSI load tasks"
    )
    REDIS_QUEUE_HSI_INFERENCE: str = Field(
        default="hsi:queue:hsi-inference",
        validation_alias="REDIS_QUEUE_HSI_INFERENCE",
        description="Queue for HSI inference tasks"
    )
    REDIS_QUEUE_GT_LOAD: str = Field(
        default="hsi:queue:gt-load",
        validation_alias="REDIS_QUEUE_GT_LOAD",
        description="Queue for GT load tasks"
    )
    # Single shared result queue for all task results
    REDIS_QUEUE_RESULT: str = Field(
        default="hsi:queue:task-result",
        validation_alias="REDIS_QUEUE_RESULT",
        description="Shared queue for all task results"
    )

    redis: RedisConfig = RedisConfig()

    model_config = SettingsConfigDict(
        env_file="../.env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        validate_assignment=True,
        extra="ignore"
    )
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

settings = Settings()