from typing import Dict, Any, Union
from app.models.schemas import EvidenceBreakdown, ExtractedClaim
from app.vision.image_analysis import image_analyzer
from app.geo.location_verifier import location_verifier
from app.rag.context import rag_context_builder
from app.patterns.systemic_detection import systemic_detector

class EvidenceSynthesizer:
    def synthesize_signals(
        self,
        complaint_text: str,
        claim: ExtractedClaim,
        latitude: float = None,
        longitude: float = None,
        timestamp: str = None,
        image_input: str = None,
        location_name: str = None
    ) -> Dict[str, Any]:
        """Extract and compute independent evidentiary signals across 6 modalities."""
        
        # 1. Text Evidence Signal
        text_len = len(complaint_text)
        text_score = 0.50
        if len(claim.measurable_assertions) >= 2:
            text_score = 0.91
        elif len(claim.measurable_assertions) >= 1:
            text_score = 0.75
        elif text_len > 30:
            text_score = 0.65

        # 2. Multimodal Image Signal
        image_res = image_analyzer.analyze(
            image_input=image_input,
            category=claim.category,
            complaint_text=complaint_text
        )
        img_signal: Union[float, str] = image_res["imageEvidence"]

        # 3. Location Signal
        geo_res = location_verifier.verify_location(
            complaint_lat=latitude,
            complaint_lng=longitude,
            claimed_location_name=location_name or claim.entities.get("location"),
            exif_info=image_res.get("exif", {})
        )
        location_score = geo_res["score"]

        # 4. Temporal Signal
        temporal_score = 0.76
        if timestamp:
            temporal_score = 0.90

        # 5. RAG Policy & Legal Signal
        rag_res = rag_context_builder.build_context(
            query_text=complaint_text,
            category=claim.category
        )
        policy_score = rag_res["policyEvidenceScore"]

        # 6. Historical Systemic Pattern Signal
        pattern_res = systemic_detector.detect_patterns(
            complaint_text=complaint_text,
            category=claim.category,
            location_name=location_name or claim.entities.get("location"),
            latitude=latitude,
            longitude=longitude
        )
        historical_score = pattern_res["historicalPatternScore"]

        evidence_breakdown = EvidenceBreakdown(
            textEvidence=round(text_score, 2),
            imageEvidence=img_signal,
            locationEvidence=round(location_score, 2),
            temporalEvidence=round(temporal_score, 2),
            policyEvidence=round(policy_score, 2),
            historicalPatternEvidence=round(historical_score, 2)
        )

        return {
            "breakdown": evidence_breakdown,
            "image_details": image_res,
            "geo_details": geo_res,
            "rag_details": rag_res,
            "pattern_details": pattern_res
        }

evidence_synthesizer = EvidenceSynthesizer()
