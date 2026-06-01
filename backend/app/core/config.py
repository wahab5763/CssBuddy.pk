from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "CssBuddy.pk"
    environment: str = "development"
    secret_key: str = "change_me_in_production"

    database_url: str = "sqlite:///./cssbuddy.db"

    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30

    frontend_url: str = "http://localhost:5173"
    cors_origins: str = "http://localhost:5173"

    max_pdf_mb: int = 10
    max_image_mb: int = 15

    admin_email: str = "cssbuddy.pk@gmail.com"
    rss_cache_minutes: int = 30

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")


settings = Settings()
