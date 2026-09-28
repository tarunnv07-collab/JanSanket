from typing import Dict, Any, List
from app.models.schemas import EvidenceBreakdown

class EvidenceScorer:
    def calculate_score(
        self,
        breakdown: EvidenceBreakdown,
        image_details: Dict[str, Any],
        geo_details: Dict[str, Any],
        rag_details: Dict[str, Any],
        pattern_details: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Transparent scoring matrix combining evidence signals with documented rationale."""

        supporting: List[str] = []
        contradicting: List[str] = []
        missing: List[str] = []
        limitations: List[str] = []

        # 1. Text Evidence Scrutiny
        if breakdown.textEvidence >= 0.75:
            supporting.append("Complaint narrative provides clear, specific, and measurable assertions.")
        else:
            missing.append("Complaint narrative lacks specific granular details or measurable timeline assertions.")

        # 2. Visual Evidence Scrutiny
        img_val = breakdown.imageEvidence
        if isinstance(img_val, float) and img_val >= 0.70:
            supporting.append("Uploaded photograph contains visible infrastructure / storefront matching complaint context.")
        elif img_val == "insufficient":
            missing.append("No photograph attached or photograph evidence evaluated as insufficient.")
            limitations.append("Image analysis inconclusive due to low resolution, blurriness, or absence of photograph.")
        elif isinstance(img_val, float) and img_val <= 0.30:
            contradicting.append("Uploaded photograph content appears inconsistent with reported complaint category.")

        # 3. Location Scrutiny
        for reason in geo_details.get("reasons", []):
            if "match" in reason.lower() or "verify" in reason.lower() or "provided" in reason.lower():
                supporting.append(f"Location verification: {reason}")
            elif "differs" in reason.lower():
                contradicting.append(f"Location anomaly: {reason}")

        if not geo_details.get("has_exif_gps", False):
            missing.append("No EXIF GPS metadata embedded in uploaded photograph (treated as unknown, not negative proof).")

        # 4. RAG Policy Scrutiny
        for stmt in rag_details.get("policyStatements", []):
            supporting.append(f"Retrieved official scheme rule: {stmt}")
        if not rag_details.get("retrievedSources"):
            missing.append("No specific statutory SLA rule retrieved for this niche complaint subset.")

        # 5. Historical Pattern Scrutiny
        sys_res = pattern_details.get("result")
        if sys_res and sys_res.detected:
            supporting.append(sys_res.patternDescription)

        # Compute weighted aggregate confidence score
        img_score_num = breakdown.imageEvidence if isinstance(breakdown.imageEvidence, float) else 0.40
        weights = {
            "text": 0.20,
            "image": 0.25,
            "location": 0.15,
            "policy": 0.20,
            "historical": 0.20
        }

        total_confidence = (
            breakdown.textEvidence * weights["text"] +
            img_score_num * weights["image"] +
            breakdown.locationEvidence * weights["location"] +
            breakdown.policyEvidence * weights["policy"] +
            breakdown.historicalPatternEvidence * weights["historical"]
        )

        limitations.append("Confidence represents strength of available empirical evidence, not subjective truthfulness.")

        return {
            "confidence": round(min(0.98, max(0.10, total_confidence)), 2),
            "supportingEvidence": supporting,
            "contradictingEvidence": contradicting,
            "missingEvidence": missing,
            "limitations": limitations
        }

scorer = EvidenceScorer()
