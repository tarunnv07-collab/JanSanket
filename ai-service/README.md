# CivicShield Multimodal Complaint Verification Engine

Production-quality Python AI microservice for **CivicShield**, providing an auditable, evidence-based verification pipeline for citizen complaints.

## Key Features

1. **Multimodal Analysis**: Combines complaint narrative, uploaded photograph(s) (JPG, PNG, WebP), geocoordinates, timestamp, and metadata.
2. **NLP Claim Extractor**: Identifies structured claims, welfare schemes, duration, severity, and measurable assertions.
3. **Computer Vision & OCR**: Inspects photograph quality, storefront signboards, infrastructure damage, and manipulation indicators.
4. **Geographic Verification**: Haversine distance verification matching complaint lat/lng, EXIF GPS, and district boundaries. Missing EXIF GPS is gracefully handled as `unknown`, not fraudulent.
5. **RAG Vector Knowledge Base**: Integrates ChromaDB with `sentence-transformers` for semantic retrieval of legal statutes, welfare scheme SLAs, and historical complaints.
6. **Transparent 6-Signal Evidence Correlation Engine**: Calculates explicit scores for `textEvidence`, `imageEvidence`, `locationEvidence`, `temporalEvidence`, `policyEvidence`, and `historicalPatternEvidence`.
7. **Systemic Pattern Detection**: Correlates incoming complaints against historical district complaints (e.g. Pune district ration non-delivery) to raise systemic accountability alerts.
8. **Strict Anti-Hallucination Guardrails**: Employs neutral, non-accusatory evaluation language (`SUPPORTED`, `LIKELY_SUPPORTED`, `INCONCLUSIVE`, `LIKELY_UNSUPPORTED`).

---

## Service Architecture

```text
Citizen Complaint Payload
    ↓
POST /api/v1/verify
    ↓
NLP Claim Extraction
    ↓
Multimodal Image & OCR Analysis + Geo Verification
    ↓
ChromaDB RAG Retrieval (Laws + Scheme Guidelines + Historical Cases)
    ↓
6-Signal Evidence Correlation Matrix
    ↓
Systemic Pattern Correlation (Accountability Alert)
    ↓
Auditable Verification Response
```

---

## API Contract

### Request: `POST /api/v1/verify`
```json
{
  "complaint_text": "I have not received my ration for two months. The ration shop in my area is closed whenever I visit.",
  "latitude": 18.5204,
  "longitude": 73.8567,
  "timestamp": "2026-08-26T10:30:00Z",
  "location_name": "Pune District",
  "image": "data:image/png;base64,..."
}
```

### Response: `200 OK`
```json
{
  "decision": "LIKELY_SUPPORTED",
  "confidence": 0.87,
  "claim": {
    "category": "ration_card",
    "summary": "I have not received my ration for two months...",
    "claims": [
      {
        "claim": "ration not received",
        "type": "welfare_delivery_failure"
      }
    ],
    "entities": {
      "scheme": "Public Distribution System (PDS)",
      "location": "Pune District",
      "duration": "2 months"
    }
  },
  "evidence": {
    "textEvidence": 0.91,
    "imageEvidence": 0.82,
    "locationEvidence": 0.95,
    "temporalEvidence": 0.76,
    "policyEvidence": 0.94,
    "historicalPatternEvidence": 0.88
  },
  "supportingEvidence": [
    "Complaint narrative provides clear, specific, and measurable assertions.",
    "Retrieved official scheme rule: [Targeted Public Distribution System Act]...",
    "Systemic Pattern Alert: 5 correlated complaints identified within Pune District..."
  ],
  "contradictingEvidence": [],
  "missingEvidence": [
    "No EXIF GPS metadata embedded in uploaded photograph (treated as unknown)."
  ],
  "retrievedSources": [
    {
      "sourceId": "public_distribution_system_act.md",
      "title": "Targeted Public Distribution System (Control) Act",
      "relevance": 0.94
    }
  ],
  "systemicPattern": {
    "detected": true,
    "similarComplaintCount": 5,
    "affectedArea": "Pune District",
    "patternDescription": "Systemic Pattern Alert: 5 correlated complaints identified..."
  },
  "explanation": "Assessment: LIKELY_SUPPORTED...",
  "limitations": [
    "Confidence represents strength of available empirical evidence, not subjective truthfulness."
  ]
}
```

---

## Running Locally

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Launch server:
   ```bash
   python -m app.main
   ```
   Or using uvicorn:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

3. Run automated tests:
   ```bash
   pytest tests/ -v
   ```
