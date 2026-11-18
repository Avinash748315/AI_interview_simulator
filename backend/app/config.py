from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "sqlite:///./clarivo.db"
    jwt_secret: str = "dev-only-change-me"
    jwt_exp_hours: int = 24 * 7
    frontend_origin: str = "http://localhost:3000"
    upload_dir: str = "./uploads"
    max_upload_bytes: int = 5 * 1024 * 1024
    ai_mode: str = "auto"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-3-5-haiku-20241022"
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = "21m00Tcm4TlvDq8ikWAM"
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    payment_test_secret: str = "clarivo_local_test_secret"

    @property
    def cors_origins(self) -> list[str]:
        return [item.strip() for item in self.frontend_origin.split(",") if item.strip()]

    def ai_provider(self) -> str:
        if self.ai_mode.strip().lower() == "local":
            return "local"
        if self.openai_api_key.strip():
            return "openai"
        if self.anthropic_api_key.strip():
            return "anthropic"
        return "local"

    def stt_provider(self) -> str:
        if self.openai_api_key.strip():
            return "openai"
        return "browser"

    def tts_provider(self) -> str:
        if self.elevenlabs_api_key.strip():
            return "elevenlabs"
        return "browser"

    def payment_mode(self) -> str:
        if self.razorpay_key_id.strip() and self.razorpay_key_secret.strip():
            return "razorpay"
        return "test"


settings = Settings()
