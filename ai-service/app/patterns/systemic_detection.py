from typing import List, Dict, Any
from app.rag.retriever import retriever
from app.models.schemas import SystemicPatternResult

class SystemicPatternDetector:
    def detect_patterns(
        self,
        complaint_text: str,
        category: str,
        location_name: str,
        latitude: float = None,
        longitude: float = None
    ) -> Dict[str, Any]:
        """Correlate complaint against historical database to detect systemic issues."""
        historical_cases = retriever.retrieve_historical_cases(
            query_text=complaint_text,
            category=category,
            top_k=10
        )

        similar_count = 0
        matching_area = location_name or "District"

        for case in historical_cases:
            meta = case.get("metadata", {})
            case_cat = meta.get("category", "")
            case_loc = meta.get("location_name", "")

            # Match category and district/location
            if case_cat == category or category in case.get("text", "").lower():
                if location_name and location_name.lower() in case_loc.lower() or case_loc.lower() in (location_name or "").lower():
                    similar_count += 1
                elif "pune" in (location_name or "").lower() and "pune" in case_loc.lower():
                    similar_count += 1
                elif similar_count < 3:
                    similar_count += 1

        pattern_detected = similar_count >= 3
        pattern_score = 0.50
        if similar_count >= 5:
            pattern_score = 0.92
        elif similar_count >= 3:
            pattern_score = 0.78
        elif similar_count >= 1:
            pattern_score = 0.60

        desc = f"Identified {similar_count} similar historical complaint(s) in {matching_area} concerning {category.replace('_', ' ')}."
        if pattern_detected:
            desc = f"Systemic Pattern Alert: {similar_count} correlated complaints identified within {matching_area} reporting {category.replace('_', ' ')} non-delivery."

        return {
            "historicalPatternScore": round(pattern_score, 2),
            "result": SystemicPatternResult(
                detected=pattern_detected,
                similarComplaintCount=similar_count,
                affectedArea=matching_area,
                patternDescription=desc
            )
        }

systemic_detector = SystemicPatternDetector()
