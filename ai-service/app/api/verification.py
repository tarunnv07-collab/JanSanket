from fastapi import APIRouter, HTTPException, status
from app.models.schemas import ComplaintInput, VerificationResponse
from app.nlp.claim_extractor import claim_extractor
from app.verification.evidence import evidence_synthesizer
from app.verification.scoring import scorer
from app.verification.decision import decision_engine

router = APIRouter()

@router.post("/verify", response_model=VerificationResponse, status_code=status.HTTP_200_OK)
async def verify_complaint(payload: ComplaintInput):
    """Primary verification endpoint analyzing multimodal complaint evidence."""
    if not payload.complaint_text or len(payload.complaint_text.strip()) == 0:
        raise HTTPException(status_code=400, detail="complaint_text must not be empty")

    try:
        # 1. NLP Structured Claim Extraction
        claim = claim_extractor.extract(
            text=payload.complaint_text,
            claimed_location=payload.location_name
        )

        # 2. Multimodal Evidence Signal Synthesis
        signals = evidence_synthesizer.synthesize_signals(
            complaint_text=payload.complaint_text,
            claim=claim,
            latitude=payload.latitude,
            longitude=payload.longitude,
            timestamp=payload.timestamp,
            image_input=payload.image,
            location_name=payload.location_name
        )

        # 3. Transparent Scoring Matrix
        score_res = scorer.calculate_score(
            breakdown=signals["breakdown"],
            image_details=signals["image_details"],
            geo_details=signals["geo_details"],
            rag_details=signals["rag_details"],
            pattern_details=signals["pattern_details"]
        )

        # 4. Verification Decision & Explanation Synthesis
        dec_res = decision_engine.make_decision(
            confidence=score_res["confidence"],
            claim=claim,
            breakdown=signals["breakdown"],
            supporting=score_res["supportingEvidence"],
            contradicting=score_res["contradictingEvidence"],
            missing=score_res["missingEvidence"],
            systemic_pattern=signals["pattern_details"]["result"]
        )

        # 5. Assemble Final Auditable Response
        return VerificationResponse(
            decision=dec_res["decision"],
            confidence=score_res["confidence"],
            claim=claim,
            evidence=signals["breakdown"],
            supportingEvidence=score_res["supportingEvidence"],
            contradictingEvidence=score_res["contradictingEvidence"],
            missingEvidence=score_res["missingEvidence"],
            retrievedSources=signals["rag_details"]["retrievedSources"],
            systemicPattern=signals["pattern_details"]["result"],
            explanation=dec_res["explanation"],
            limitations=score_res["limitations"]
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification engine internal error: {str(e)}")
