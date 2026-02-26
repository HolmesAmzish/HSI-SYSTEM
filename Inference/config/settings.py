from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from .redis_config import RedisConfig

class Settings(BaseSettings):

    # Path configuration
    SHARED_DATA_DIR: Path = Field(default=Path("C:/Development/repositories/HSI-SYSTEM/SharedData"))

    @property
    def UPLOAD_DIR(self) -> Path:
        return self.SHARED_DATA_DIR / "uploads"

    @property
    def OUTPUT_DIR(self) -> Path:
        return self.SHARED_DATA_DIR / "outputs"

    REDIS_QUEUE_HSI_LOAD: str = Field(default="hsi:queue:hsi-load", validation_alias="REDIS_QUEUE_HSI_LOAD")
    REDIS_QUEUE_HSI_INFERENCE: str = Field(default="hsi:queue:hsi-inference", validation_alias="REDIS_QUEUE_HSI_INFERENCE")
    REDIS_QUEUE_GT_LOAD: str = Field(default="hsi:queue:gt-load", validation_alias="REDIS_QUEUE_GT_LOAD")

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