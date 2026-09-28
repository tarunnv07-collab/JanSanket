import pytest
import base64
import os
import io
from PIL import Image, ImageDraw
from fastapi.testclient import TestClient
from app.main import app
from app.nlp.claim_extractor import claim_extractor
from app.vision.image_analysis import image_analyzer
from app.geo.location_verifier import location_verifier
from app.rag.ingestion import ingestor
from app.rag.retriever import retriever
from app.patterns.systemic_detection import systemic_detector

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_knowledge_base():
    """Ensure ChromaDB knowledge base is ingested before tests run."""
    ingestor.ingest_all()

def create_sample_image_base64(color="green", text="RATION SHOP"):
    """Helper to generate a valid test image in base64."""
    img = Image.new("RGB", (300, 300), color=color)
    d = ImageDraw.Draw(img)
    d.text((10, 10), text, fill="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")

# 1. API Validation & Health Check
def test_api_validation_and_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

    # Test empty payload failure
    bad_resp = client.post("/api/v1/verify", json={"complaint_text": ""})
    assert bad_resp.status_code == 400

# 2. Valid Complaint Endpoint Test
def test_valid_complaint_endpoint():
    img_b64 = create_sample_image_base64("blue", "PDS FAIR PRICE RATION SHOP")
    payload = {
        "complaint_text": "I have not received my ration for two months. The ration shop in my area is closed whenever I visit.",
        "latitude": 18.5204,
        "longitude": 73.8567,
        "timestamp": "2026-08-26T10:30:00Z",
        "location_name": "Pune District",
        "image": img_b64
    }

    resp = client.post("/api/v1/verify", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert data["decision"] in ["SUPPORTED", "LIKELY_SUPPORTED"]
    assert data["confidence"] >= 0.65
    assert data["claim"]["category"] == "ration_card"
    assert len(data["retrievedSources"]) > 0
    assert data["systemicPattern"]["detected"] is True

# 3. Invalid Image (Corrupted/Unsupported) Test
def test_invalid_image():
    payload = {
        "complaint_text": "Pothole on main road causing accidents.",
        "latitude": 18.5204,
        "longitude": 73.8567,
        "image": "not_a_valid_base64_string_xyz!!!"
    }
    resp = client.post("/api/v1/verify", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["evidence"]["imageEvidence"] == "insufficient"

# 4. Missing Location Test
def test_missing_location():
    payload = {
        "complaint_text": "Water pipeline leakage near school area.",
        "latitude": None,
        "longitude": None,
        "location_name": None
    }
    resp = client.post("/api/v1/verify", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["evidence"]["locationEvidence"] <= 0.50
    assert any("unknown" in m.lower() or "missing" in m.lower() for m in data["missingEvidence"])

# 5. Irrelevant Image Test
def test_irrelevant_image():
    img_b64 = create_sample_image_base64("pink", "cat screenshot meme receipt")
    payload = {
        "complaint_text": "Deep pothole damaged road surface.",
        "latitude": 18.5204,
        "longitude": 73.8567,
        "image": img_b64
    }
    resp = client.post("/api/v1/verify", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["evidence"]["imageEvidence"] <= 0.30 or data["evidence"]["imageEvidence"] == "insufficient"

# 6. Insufficient Evidence Test
def test_insufficient_evidence():
    payload = {
        "complaint_text": "Bad service.",
        "latitude": None,
        "longitude": None,
        "image": None
    }
    resp = client.post("/api/v1/verify", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["decision"] in ["INCONCLUSIVE", "LIKELY_UNSUPPORTED"]

# 7. Contradictory Evidence Test
def test_contradictory_evidence():
    res = location_verifier.verify_location(
        complaint_lat=18.5204,
        complaint_lng=73.8567,
        claimed_location_name="Pune",
        exif_info={"has_exif_gps": True, "latitude": 28.6139, "longitude": 77.2090} # Delhi lat/lng (1000km away!)
    )
    assert res["score"] <= 0.40
    assert any("differs" in r.lower() for r in res["reasons"])

# 8. Matching Legal Rule Test (RAG)
def test_matching_legal_rule():
    policies = retriever.retrieve_policies("ration card food grains distribution fair price shop", top_k=2)
    assert len(policies) > 0
    assert any("Public Distribution" in p["title"] or "Food" in p["title"] for p in policies)

# 9. No Matching Legal Rule (Fallback Context)
def test_no_matching_legal_rule():
    policies = retriever.retrieve_policies("quantum satellite telecommunications anomaly", top_k=1)
    # RAG returns low relevance or empty set without breaking
    if policies:
        assert policies[0]["relevance"] <= 0.60

# 10. Similar Complaint Detection & Systemic Pattern Test
def test_systemic_pattern_detection():
    pattern = systemic_detector.detect_patterns(
        complaint_text="Ration shop closed for two months in Pune.",
        category="ration_card",
        location_name="Pune District",
        latitude=18.5204,
        longitude=73.8567
    )
    assert pattern["result"].detected is True
    assert pattern["result"].similarComplaintCount >= 3
    assert "Pune" in pattern["result"].affectedArea

# 11. Strict Anti-Hallucination Guardrails Test
def test_hallucination_prevention():
    payload = {
        "complaint_text": "I suspect my local official is not working.",
        "latitude": 18.5204,
        "longitude": 73.8567
    }
    resp = client.post("/api/v1/verify", json=payload)
    assert resp.status_code == 200
    text_content = str(resp.json())
    # Strict anti-hallucination language check: ensure neutral phrasing
    forbidden_terms = ["citizen is lying", "definitely fake", "fraudulent citizen", "liar"]
    for term in forbidden_terms:
        assert term not in text_content.lower()

# 12. Complete End-to-End Pune Ration Demo Scenario Test
def test_e2e_pune_demo_scenario():
    img_b64 = create_sample_image_base64("green", "FAIR PRICE RATION SHOP PUNE")
    payload = {
        "complaint_text": "I have not received my ration for two months. The ration shop in my area is closed whenever I visit.",
        "latitude": 18.5204,
        "longitude": 73.8567,
        "timestamp": "2026-08-26T10:30:00Z",
        "location_name": "Pune",
        "image": img_b64
    }

    resp = client.post("/api/v1/verify", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    print("\n--- E2E DEMO SCENARIO OUTPUT ---")
    print("Decision:", data["decision"])
    print("Confidence:", data["confidence"])
    print("Systemic Pattern:", data["systemicPattern"])
    print("Explanation:\n", data["explanation"])

    assert data["decision"] in ["SUPPORTED", "LIKELY_SUPPORTED"]
    assert data["systemicPattern"]["detected"] is True
    assert "PDS" in data["claim"]["entities"]["scheme"] or "Public Distribution" in data["claim"]["entities"]["scheme"]
