import os
import json
import glob
import logging
from typing import List, Dict, Any
import chromadb
from chromadb.config import Settings as ChromaSettings
from app.config import settings
from app.rag.embeddings import embedding_provider

logger = logging.getLogger(__name__)

class KnowledgeBaseIngestor:
    def __init__(self):
        self.chroma_client = chromadb.PersistentClient(
            path=settings.CHROMA_PERSIST_DIR,
            settings=ChromaSettings(anonymized_telemetry=False)
        )
        self.policies_col = self.chroma_client.get_or_create_collection("civic_policies")
        self.historical_col = self.chroma_client.get_or_create_collection("historical_complaints")

    def ingest_all(self):
        """Ingest legal documents, scheme guidelines, and historical cases into ChromaDB."""
        kb_dir = settings.KNOWLEDGE_BASE_DIR
        logger.info(f"Ingesting knowledge base from: {kb_dir}")

        # 1. Ingest Markdown Laws and Schemes
        policy_files = glob.glob(os.path.join(kb_dir, "**", "*.md"), recursive=True)
        for filepath in policy_files:
            rel_path = os.path.relpath(filepath, kb_dir)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()

            # Split into section blocks
            blocks = content.split("\n## ")
            doc_title = blocks[0].replace("# ", "").strip()

            for idx, block in enumerate(blocks):
                block_text = ("## " + block) if idx > 0 else block
                if len(block_text.strip()) < 20:
                    continue

                doc_id = f"{os.path.basename(filepath)}_{idx}"
                embedding = embedding_provider.encode([block_text])[0]

                self.policies_col.upsert(
                    ids=[doc_id],
                    embeddings=[embedding],
                    documents=[block_text],
                    metadatas=[{
                        "sourceId": os.path.basename(filepath),
                        "title": doc_title,
                        "rel_path": rel_path
                    }]
                )

        # 2. Ingest Historical Cases JSON
        cases_files = glob.glob(os.path.join(kb_dir, "**", "*.json"), recursive=True)
        for filepath in cases_files:
            with open(filepath, "r", encoding="utf-8") as f:
                cases = json.load(f)

            for case in cases:
                case_id = case.get("id", f"case_{hash(case['complaint_text'])}")
                text = f"{case.get('complaint_text', '')} Category: {case.get('category', '')} Location: {case.get('location_name', '')}"
                embedding = embedding_provider.encode([text])[0]

                self.historical_col.upsert(
                    ids=[case_id],
                    embeddings=[embedding],
                    documents=[text],
                    metadatas=[{
                        "category": case.get("category", "other"),
                        "location_name": case.get("location_name", ""),
                        "latitude": case.get("latitude", 0.0),
                        "longitude": case.get("longitude", 0.0),
                        "timestamp": case.get("timestamp", ""),
                        "status": case.get("status", "SUPPORTED")
                    }]
                )

        logger.info(f"Ingestion complete. Policy count: {self.policies_col.count()}, Historical count: {self.historical_col.count()}")

ingestor = KnowledgeBaseIngestor()
