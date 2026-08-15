from pydantic_settings import BaseSettings
import json

class Settings(BaseSettings):
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "FraudGuard AI"
    DATABASE_URL: str
    API_KEY: str
    ALLOWED_ORIGINS: str = '["http://localhost:5173", "http://127.0.0.1:5173"]'

    @property
    def get_allowed_origins(self) -> list:
        try:
            return json.loads(self.ALLOWED_ORIGINS)
        except json.JSONDecodeError:
            return [x.strip() for x in self.ALLOWED_ORIGINS.split(",") if x.strip()]

    class Config:
        env_file = ".env"

settings = Settings()
