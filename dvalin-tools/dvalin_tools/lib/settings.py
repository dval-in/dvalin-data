from pydantic_settings import BaseSettings, SettingsConfigDict

from dvalin_tools.lib.constants import ROOT_DIR_DVALIN_TOOLS


class DvalinSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ROOT_DIR_DVALIN_TOOLS / ".env",
        env_file_encoding="utf-8",
        env_prefix="DVALIN_",
    )

    s3_endpoint: str
    s3_access_key: str
    s3_secret_key: str


if __name__ == "__main__":
    settings = DvalinSettings()
    print(settings.s3_endpoint)
    print(settings.s3_access_key)
    print(settings.s3_secret_key)
