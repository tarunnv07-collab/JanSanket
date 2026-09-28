import math
from typing import Dict, Any, Optional

class LocationVerifier:
    @staticmethod
    def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate the great circle distance between two points in kilometers."""
        R = 6371.0 # Radius of Earth in km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (math.sin(dlat / 2) ** 2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    def verify_location(
        self,
        complaint_lat: Optional[float],
        complaint_lng: Optional[float],
        claimed_location_name: Optional[str],
        exif_info: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Evaluate geographic consistency between coordinates, EXIF data, and claimed district."""
        exif_info = exif_info or {}
        has_coords = complaint_lat is not None and complaint_lng is not None
        has_exif_gps = exif_info.get("has_exif_gps", False)
        exif_lat = exif_info.get("latitude")
        exif_lng = exif_info.get("longitude")

        reasons = []
        score = 0.5 # Default baseline neutral score

        # 1. Evaluate Complaint Coordinates vs EXIF Coordinates (if EXIF exists)
        if has_coords and has_exif_gps and exif_lat is not None and exif_lng is not None:
            dist_km = self.haversine_distance_km(complaint_lat, complaint_lng, exif_lat, exif_lng)
            if dist_km <= 0.5: # Within 500 meters
                score = 0.95
                reasons.append(f"Image EXIF GPS coordinates match submitted location within {int(dist_km*1000)} meters.")
            elif dist_km <= 5.0:
                score = 0.80
                reasons.append(f"Image EXIF GPS is within {round(dist_km, 2)} km of submitted coordinates.")
            else:
                score = 0.40
                reasons.append(f"Image EXIF GPS differs from submitted coordinates by {round(dist_km, 2)} km.")

        elif has_coords:
            # Coordinates provided, but no EXIF GPS in photo
            score = 0.85
            reasons.append("Submitted geocoordinates provided. (Photo missing EXIF GPS metadata marked as unknown, not invalid).")
        
        elif claimed_location_name and claimed_location_name.lower() != "unspecified":
            score = 0.65
            reasons.append(f"Claimed location name provided: '{claimed_location_name}'. No precise GPS coordinates attached.")

        else:
            score = 0.40
            reasons.append("Missing precise location coordinates and named location details.")

        # Check district match heuristic (e.g. Pune district bounding coordinates ~ 18.52 N, 73.85 E)
        # ONLY if there is no strong EXIF coordinate contradiction!
        is_exif_contradiction = (has_coords and has_exif_gps and exif_lat is not None and exif_lng is not None and self.haversine_distance_km(complaint_lat, complaint_lng, exif_lat, exif_lng) > 5.0)

        if not is_exif_contradiction and claimed_location_name and "pune" in claimed_location_name.lower() and claimed_location_name.lower() != "unspecified":
            if has_coords:
                # Pune lat range: 18.2 to 18.8, lng range: 73.6 to 74.2
                if 18.0 <= complaint_lat <= 19.0 and 73.0 <= complaint_lng <= 74.5:
                    reasons.append("Submitted coordinates verify inside Pune district boundary.")
                    score = max(score, 0.90)

        return {
            "score": round(score, 2),
            "reasons": reasons,
            "has_coords": has_coords,
            "has_exif_gps": has_exif_gps
        }

location_verifier = LocationVerifier()
