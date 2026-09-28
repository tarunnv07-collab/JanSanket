from PIL import Image, ExifTags
from typing import Dict, Any, Tuple, Optional
import io

class ImageMetadataExtractor:
    @staticmethod
    def _convert_to_degrees(value) -> float:
        """Helper to convert EXIF GPS tuples (deg, min, sec) to decimal degrees."""
        try:
            d = float(value[0])
            m = float(value[1])
            s = float(value[2])
            return d + (m / 60.0) + (s / 3600.0)
        except Exception:
            return 0.0

    def extract_exif(self, image_bytes: bytes) -> Dict[str, Any]:
        """Extract EXIF data including GPS coordinates if present."""
        result = {
            "has_exif": False,
            "has_exif_gps": False,
            "latitude": None,
            "longitude": None,
            "datetime_original": None,
            "camera_model": None,
            "status": "missing_gps_metadata" # Missing GPS = unknown, not fake
        }

        try:
            image = Image.open(io.BytesIO(image_bytes))
            exif_raw = image._getexif() if hasattr(image, '_getexif') else None
            
            if not exif_raw:
                return result

            result["has_exif"] = True
            exif_data = {}
            for tag, val in exif_raw.items():
                tag_name = ExifTags.TAGS.get(tag, tag)
                exif_data[tag_name] = val

            if "Model" in exif_data:
                result["camera_model"] = str(exif_data["Model"])
            if "DateTimeOriginal" in exif_data:
                result["datetime_original"] = str(exif_data["DateTimeOriginal"])

            # Extract GPS Info
            gps_info = exif_data.get("GPSInfo")
            if gps_info:
                gps_data = {}
                for t in gps_info:
                    sub_tag = ExifTags.GPSTAGS.get(t, t)
                    gps_data[sub_tag] = gps_info[t]

                lat_ref = gps_data.get("GPSLatitudeRef")
                lat = gps_data.get("GPSLatitude")
                lon_ref = gps_data.get("GPSLongitudeRef")
                lon = gps_data.get("GPSLongitude")

                if lat and lon:
                    lat_deg = self._convert_to_degrees(lat)
                    if lat_ref == "S":
                        lat_deg = -lat_deg

                    lon_deg = self._convert_to_degrees(lon)
                    if lon_ref == "W":
                        lon_deg = -lon_deg

                    result["has_exif_gps"] = True
                    result["latitude"] = lat_deg
                    result["longitude"] = lon_deg
                    result["status"] = "exif_gps_verified"

        except Exception as e:
            result["error"] = str(e)

        return result

metadata_extractor = ImageMetadataExtractor()
