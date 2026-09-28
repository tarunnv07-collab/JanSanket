import logging
from typing import List, Dict, Any
import chromadb
from chromadb.config import Settings as ChromaSettings
from app.config import settings
from app.rag.embeddings import embedding_provider
from app.models.schemas import RetrievedSource

logger = logging.getLogger(__name__)

class RAGRetriever:
    def __init__(self):
        self.chroma_client = chromadb.PersistentClient(
            path=settings.CHROMA_PERSIST_DIR,
            settings=ChromaSettings(anonymized_telemetry=False)
        )
        self.policies_col = self.chroma_client.get_or_create_collection("civic_policies")
        self.historical_col = self.chroma_client.get_or_create_collection("historical_complaints")

    def retrieve_policies(self, query_text: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Retrieve relevant legal provisions and scheme guidelines from ChromaDB."""
        if self.policies_col.count() == 0:
            return []

        query_vec = embedding_provider.encode([query_text])[0]
        results = self.policies_col.query(
            query_embeddings=[query_vec],
            n_results=min(top_k, self.policies_col.count())
        )

        retrieved = []
        if results and results.get("documents"):
            docs = results["documents"][0]
            metas = results["metadatas"][0]
            distances = results["distances"][0] if "distances" in results and results["distances"] else [0.2]*len(docs)

            for doc, meta, dist in zip(docs, metas, distances):
                # Convert distance to similarity relevance (0.0 - 1.0)
                relevance = max(0.0, min(1.0, 1.0 - (dist / 2.0)))
                retrieved.append({
                    "sourceId": meta.get("sourceId", "DOC"),
                    "title": meta.get("title", "Policy Document"),
                    "document": doc,
                    "relevance": round(relevance, 2)
                })

        return retrieved

    def retrieve_historical_cases(self, query_text: str, category: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Retrieve similar past complaints for systemic pattern matching."""
        if self.historical_col.count() == 0:
            return []

        query_vec = embedding_provider.encode([query_text])[0]
        results = self.historical_col.query(
            query_embeddings=[query_vec],
            n_results=min(top_k, self.historical_col.count())
        )

        similar_cases = []
        if results and results.get("documents"):
            docs = results["documents"][0]
            metas = results["metadatas"][0]
            for doc, meta in zip(docs, metas):
                similar_cases.append({
                    "text": doc,
                    "metadata": meta
                })

        return similar_cases

retriever = RAGRetriever()
