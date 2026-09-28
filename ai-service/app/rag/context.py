from typing import List, Dict, Any
from app.rag.retriever import retriever
from app.models.schemas import RetrievedSource

class RAGContextBuilder:
    def build_context(self, query_text: str, category: str) -> Dict[str, Any]:
        """Assemble structured context and legal citations for verification engine."""
        raw_policies = retriever.retrieve_policies(query_text=query_text, top_k=3)

        retrieved_sources: List[RetrievedSource] = []
        policy_statements: List[str] = []
        max_relevance = 0.50

        for item in raw_policies:
            retrieved_sources.append(RetrievedSource(
                sourceId=item["sourceId"],
                title=item["title"],
                relevance=item["relevance"]
            ))
            snippet = item["document"].split("\n")[0].replace("#", "").strip()
            policy_statements.append(f"[{item['title']}] {snippet}")
            if item["relevance"] > max_relevance:
                max_relevance = item["relevance"]

        policy_evidence_score = round(max_relevance, 2) if retrieved_sources else 0.50

        return {
            "policyEvidenceScore": policy_evidence_score,
            "retrievedSources": retrieved_sources,
            "policyStatements": policy_statements
        }

rag_context_builder = RAGContextBuilder()
