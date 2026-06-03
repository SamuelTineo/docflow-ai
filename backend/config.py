from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    anthropic_api_key: str
    upload_dir: str = "uploads"
    max_file_size_mb: int = 50

    model_config = {"env_file": ".env"}


settings = Settings()
