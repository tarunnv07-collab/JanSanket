from typing import Dict, Any, List
from app.config import settings
from app.models.schemas import ExtractedClaim, EvidenceBreakdown, SystemicPatternResult

class VerificationDecisionEngine:
    def make_decision(
        self,
        confidence: float,
        claim: ExtractedClaim,
        breakdown: EvidenceBreakdown,
        supporting: List[str],
        contradicting: List[str],
        missing: List[str],
        systemic_pattern: SystemicPatternResult
    ) -> Dict[str, Any]:
        """Determine final verification decision and format auditable explainable report."""

        # 1. Decision Logic using Configurable Thresholds
        if contradicting and len(contradicting) > len(supporting) and confidence < 0.45:
            decision = "LIKELY_UNSUPPORTED"
        elif confidence >= settings.THRESHOLD_SUPPORTED:
            decision = "SUPPORTED"
        elif confidence >= settings.THRESHOLD_LIKELY_SUPPORTED:
            decision = "LIKELY_SUPPORTED"
        elif confidence >= settings.THRESHOLD_INCONCLUSIVE:
            decision = "INCONCLUSIVE"
        else:
            decision = "LIKELY_UNSUPPORTED"

        # 2. Build Structured Explanation Narrative (Section 9)
        explanation_lines = [
            f"Assessment: {decision} (Confidence: {confidence})",
            "",
            "1. Claim Summary:",
            f"   Citizen reported {claim.category.replace('_', ' ')} issue: '{claim.summary}'.",
            f"   Entities identified: Scheme: {claim.entities.get('scheme', 'N/A')}, Duration: {claim.entities.get('duration', 'N/A')}.",
            "",
            "2. Evidence Analysis:",
            f"   - Multimodal Image: {breakdown.imageEvidence}",
            f"   - Geographic Consistency: Score {breakdown.locationEvidence}",
            f"   - Policy/SLA Alignment: Score {breakdown.policyEvidence}",
            f"   - Historical Pattern Score: Score {breakdown.historicalPatternEvidence}",
            "",
            "3. Key Findings:",
        ]

        if supporting:
            explanation_lines.append("   [Supporting Evidence]:")
            for item in supporting:
                explanation_lines.append(f"   • {item}")
        else:
            explanation_lines.append("   • No direct supporting empirical evidence identified.")

        if contradicting:
            explanation_lines.append("   [Contradicting Evidence]:")
            for item in contradicting:
                explanation_lines.append(f"   • {item}")

        if missing:
            explanation_lines.append("   [Missing Evidence]:")
            for item in missing:
                explanation_lines.append(f"   • {item}")

        if systemic_pattern.detected:
            explanation_lines.extend([
                "",
                "4. Systemic Pattern Alert:",
                f"   • {systemic_pattern.patternDescription}"
            ])

        explanation_lines.extend([
            "",
            "5. Rationale:",
            f"   The available evidence was evaluated across text, image, geocoordinates, RAG statutory provisions, and historical patterns. Based on the aggregated evidence score of {confidence}, the complaint is assessed as {decision}."
        ])

        explanation_text = "\n".join(explanation_lines)

        return {
            "decision": decision,
            "explanation": explanation_text
        }

decision_engine = VerificationDecisionEngine()
