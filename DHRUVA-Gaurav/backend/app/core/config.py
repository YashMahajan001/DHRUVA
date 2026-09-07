import os
from typing import List
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "SIH26054 Digital Twin UAV")
    API_V1_STR: str = os.getenv("API_V1_STR", "/api")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")
    
    # Database Settings
    # Defaults to PostgreSQL, but falls back gracefully to SQLite if PostgreSQL is not active
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./digital_twin_uav.db")
    SQLITE_FALLBACK_URL: str = os.getenv("SQLITE_FALLBACK_URL", "sqlite:///./digital_twin_uav.db")
    
    # MQTT Broker Settings
    MQTT_BROKER_HOST: str = os.getenv("MQTT_BROKER_HOST", "localhost")
    MQTT_BROKER_PORT: int = int(os.getenv("MQTT_BROKER_PORT", "1883"))
    MQTT_TELEMETRY_TOPIC: str = os.getenv("MQTT_TELEMETRY_TOPIC", "uav/+/telemetry")
    
    # CORS Origins
    _allowed_origins_raw: str = os.getenv(
        "ALLOWED_ORIGINS", 
        "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000,*"
    )
    
    @property
    def ALLOWED_ORIGINS(self) -> List[str]:
        return [origin.strip() for origin in self._allowed_origins_raw.split(",") if origin.strip()]

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "sih26054-digital-twin-uav-secret-key-super-secure")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

settings = Settings()
