import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "CivicShield Multimodal Complaint Verification Engine"
    API_V1_STR: str = "/api/v1"
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # ChromaDB & Embeddings Configuration
    CHROMA_PERSIST_DIR: str = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), "chroma_db"))
    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"
    KNOWLEDGE_BASE_DIR: str = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), "knowledge_base"))

    # Image upload limits
    MAX_IMAGE_SIZE_MB: int = 10
    ALLOWED_IMAGE_MIME_TYPES: list[str] = ["image/jpeg", "image/png", "image/webp"]

    # Decision Thresholds (Configurable)
    THRESHOLD_SUPPORTED: float = 0.85
    THRESHOLD_LIKELY_SUPPORTED: float = 0.65
    THRESHOLD_INCONCLUSIVE: float = 0.40

    # Geographic threshold in kilometers for high location score
    GEO_MATCH_RADIUS_KM: float = 2.0
    GEO_DISTRICT_RADIUS_KM: float = 25.0

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
