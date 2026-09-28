import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.verification import router as verification_router
from app.rag.ingestion import ingestor

import os
os.environ["TRANSFORMERS_VERBOSITY"] = "error"
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
os.environ["PYTHONWARNINGS"] = "ignore"

logging.basicConfig(level=logging.WARNING)
logging.getLogger("httpx").setLevel(logging.ERROR)
logging.getLogger("sentence_transformers").setLevel(logging.ERROR)
logging.getLogger("huggingface_hub").setLevel(logging.ERROR)
logging.getLogger("chromadb").setLevel(logging.ERROR)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Perform startup tasks: ingest knowledge base into ChromaDB."""
    logger.info("Initializing CivicShield Multimodal Verification Engine...")
    try:
        ingestor.ingest_all()
        logger.info("Knowledge Base successfully ingested into ChromaDB.")
    except Exception as e:
        logger.error(f"Error during startup ingestion: {e}")
    yield
    logger.info("Shutting down CivicShield AI Service.")

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Multimodal Evidence-Based Complaint Verification Engine for CivicShield",
    lifespan=lifespan
)

# Enable CORS for Node.js backend and frontend dashboards
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(verification_router, prefix=settings.API_V1_STR)

@app.get("/", status_code=200)
def root():
    return {
        "service": settings.APP_NAME,
        "status": "online",
        "health": "/health",
        "documentation": "/docs",
        "verify_endpoint": f"{settings.API_V1_STR}/verify"
    }

@app.get("/health", status_code=200)
@app.get(f"{settings.API_V1_STR}/health", status_code=200)
def health_check():
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
