from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class ComplaintInput(BaseModel):
    complaint_text: str = Field(..., description="The narrative complaint submitted by citizen")
    latitude: Optional[float] = Field(None, description="Latitude coordinate of reported location")
    longitude: Optional[float] = Field(None, description="Longitude coordinate of reported location")
    timestamp: Optional[str] = Field(None, description="ISO timestamp of complaint submission")
    image: Optional[str] = Field(None, description="Base64 encoded image or file path/URL")
    location_name: Optional[str] = Field(None, description="Named location or district claimed by citizen")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional client metadata")

class SingleClaim(BaseModel):
    claim: str
    type: str

class ExtractedClaim(BaseModel):
    category: str
    summary: str
    claims: List[SingleClaim] = Field(default_factory=list)
    entities: Dict[str, Any] = Field(default_factory=dict)
    severity: str = "MEDIUM"
    measurable_assertions: List[str] = Field(default_factory=list)

class EvidenceBreakdown(BaseModel):
    textEvidence: float = Field(..., ge=0.0, le=1.0)
    imageEvidence: Any = Field(..., description="Float score 0.0-1.0 or string 'insufficient'")
    locationEvidence: float = Field(..., ge=0.0, le=1.0)
    temporalEvidence: float = Field(..., ge=0.0, le=1.0)
    policyEvidence: float = Field(..., ge=0.0, le=1.0)
    historicalPatternEvidence: float = Field(..., ge=0.0, le=1.0)

class RetrievedSource(BaseModel):
    sourceId: str
    title: str
    relevance: float

class SystemicPatternResult(BaseModel):
    detected: bool
    similarComplaintCount: int
    affectedArea: str
    patternDescription: str

class VerificationResponse(BaseModel):
    decision: str = Field(..., description="SUPPORTED, LIKELY_SUPPORTED, INCONCLUSIVE, or LIKELY_UNSUPPORTED")
    confidence: float = Field(..., ge=0.0, le=1.0)
    claim: ExtractedClaim
    evidence: EvidenceBreakdown
    supportingEvidence: List[str]
    contradictingEvidence: List[str]
    missingEvidence: List[str]
    retrievedSources: List[RetrievedSource]
    systemicPattern: SystemicPatternResult
    explanation: str
    limitations: List[str]
