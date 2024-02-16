from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from dvalin_tools.lib.constants import ROOT_DIR_DVALIN_TOOLS

PROJECT_PREFIX = "DVALIN"


class S3Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ROOT_DIR_DVALIN_TOOLS / ".env",
        env_file_encoding="utf-8",
        env_prefix=f"{PROJECT_PREFIX}_S3_",
    )

    endpoint: str
    access_key: str
    secret_key: str


class CelerySettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ROOT_DIR_DVALIN_TOOLS / ".env",
        env_file_encoding="utf-8",
        env_prefix=f"{PROJECT_PREFIX}_CELERY_",
    )

    broker_url: str
    result_backend: str


class DvalinSettings(BaseSettings):
    s3: S3Settings = Field(default_factory=S3Settings)
    celery: CelerySettings = Field(default_factory=CelerySettings)


if __name__ == "__main__":
    settings = DvalinSettings()
    print(settings.s3.endpoint)
    print(settings.s3.access_key)
    print(settings.s3.secret_key)
    print(settings.celery.broker_url)
    print(settings.celery.result_backend)
