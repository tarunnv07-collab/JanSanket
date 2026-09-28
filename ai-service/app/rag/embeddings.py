import numpy as np
import logging
from typing import List

logger = logging.getLogger(__name__)

class EmbeddingProvider:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        self._model = None

    @property
    def model(self):
        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer
                self._model = SentenceTransformer(self.model_name)
                logger.info(f"Loaded SentenceTransformer model: {self.model_name}")
            except Exception as e:
                logger.warning(f"Could not load SentenceTransformer ({e}). Using lightweight hash vectorizer fallback.")
                self._model = "fallback"
        return self._model

    def encode(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []

        model_obj = self.model
        if model_obj != "fallback":
            embeddings = model_obj.encode(texts, convert_to_numpy=True)
            return embeddings.tolist()

        # Fallback deterministic vectorizer (128-dim TF-IDF hash)
        result = []
        for text in texts:
            vec = np.zeros(128, dtype=np.float32)
            words = text.lower().split()
            for w in words:
                h = abs(hash(w)) % 128
                vec[h] += 1.0
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec = vec / norm
            result.append(vec.tolist())
        return result

embedding_provider = EmbeddingProvider()
