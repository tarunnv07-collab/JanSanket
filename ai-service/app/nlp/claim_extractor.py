import re
from typing import Dict, Any, List
from app.models.schemas import ExtractedClaim, SingleClaim

class ClaimExtractor:
    def __init__(self):
        # Category keyword mappings
        self.category_keywords = {
            "ration_card": ["ration", "pds", "food grain", "fair price shop", "grain", "wheat", "rice", "ration card", "dso", "fps", "aay", "phh"],
            "road_infrastructure": ["pothole", "road", "tar", "asphalt", "highway", "street", "footpath", "accident", "pavement", "bridge", "divider"],
            "water_supply": ["water", "leak", "pipeline", "drainage", "tap", "sewage", "waterlogging", "drinking water", "supply"],
            "sanitation_garbage": ["garbage", "trash", "waste", "bin", "dustbin", "cleanliness", "sanitation", "filth", "dump"],
            "electricity": ["power", "electricity", "transformer", "wire", "light", "street light", "outage", "blackout"]
        }

    def extract(self, text: str, claimed_location: str = None) -> ExtractedClaim:
        text_lower = text.lower()

        # 1. Determine Category
        category = "other"
        max_hits = 0
        for cat, kw_list in self.category_keywords.items():
            hits = sum(1 for kw in kw_list if kw in text_lower)
            if hits > max_hits:
                max_hits = hits
                category = cat

        # 2. Extract Claims
        claims: List[SingleClaim] = []
        if "ration" in text_lower or "grain" in text_lower:
            if "not received" in text_lower or "haven't received" in text_lower or "delayed" in text_lower or "didn't get" in text_lower:
                claims.append(SingleClaim(claim="ration not received", type="welfare_delivery_failure"))
            if "closed" in text_lower or "locked" in text_lower or "unavailable" in text_lower:
                claims.append(SingleClaim(claim="ration shop unavailable", type="service_availability"))
        
        if "pothole" in text_lower or "damaged road" in text_lower:
            claims.append(SingleClaim(claim="hazardous road surface", type="infrastructure_damage"))
            if "accident" in text_lower:
                claims.append(SingleClaim(claim="road hazard causing accidents", type="public_safety_risk"))

        if "water" in text_lower and ("leak" in text_lower or "broken" in text_lower):
            claims.append(SingleClaim(claim="water pipeline damage", type="utility_failure"))

        if "garbage" in text_lower or "trash" in text_lower:
            claims.append(SingleClaim(claim="uncollected waste", type="sanitation_issue"))

        if not claims:
            claims.append(SingleClaim(claim=text[:60].strip(), type="general_civic_grievance"))

        # 3. Extract Duration / Temporal Entities
        duration_match = re.search(r"(\d+|two|three|four|five|several)\s+(days|weeks|months|years)", text_lower)
        duration = duration_match.group(0) if duration_match else "unspecified"

        # 4. Extract Entities
        scheme_name = "Public Distribution System (PDS)" if category == "ration_card" else "Municipal Services"
        org_name = "Fair Price Shop / DSO" if category == "ration_card" else "Public Works Department"
        
        entities = {
            "scheme": scheme_name,
            "claimed_organization": org_name,
            "duration": duration,
            "location": claimed_location or "unspecified"
        }

        # 5. Measureable Assertions
        measurable_assertions = []
        if duration != "unspecified":
            measurable_assertions.append(f"Service non-delivery spanning {duration}")
        if "closed" in text_lower:
            measurable_assertions.append("Service establishment closed during visit")
        if "pothole" in text_lower:
            measurable_assertions.append("Physical damage present on road surface")

        # 6. Severity
        severity = "MEDIUM"
        if "accident" in text_lower or "danger" in text_lower or "critical" in text_lower or "2 months" in text_lower or "60 days" in text_lower:
            severity = "HIGH"

        # 7. Summary
        summary = text[:120].strip() + ("..." if len(text) > 120 else "")

        return ExtractedClaim(
            category=category,
            summary=summary,
            claims=claims,
            entities=entities,
            severity=severity,
            measurable_assertions=measurable_assertions
        )

claim_extractor = ClaimExtractor()
