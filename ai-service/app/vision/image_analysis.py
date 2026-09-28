import io
import base64
import cv2
import numpy as np
from PIL import Image
from typing import Dict, Any, Union
from app.vision.metadata import metadata_extractor
from app.vision.ocr import ocr_extractor
from app.config import settings

class MultimodalImageAnalyzer:
    def decode_image(self, image_input: str) -> bytes:
        """Decode base64 image string or load raw bytes."""
        if not image_input:
            raise ValueError("No image provided")

        if image_input.startswith("data:image"):
            # Strip data URI header
            header, base64_str = image_input.split(",", 1)
            return base64.b64decode(base64_str)

        # Check if base64 string
        try:
            return base64.b64decode(image_input)
        except Exception:
            # Assume file path or raw string
            with open(image_input, "rb") as f:
                return f.read()

    def analyze(self, image_input: str, category: str, complaint_text: str) -> Dict[str, Any]:
        """Perform multimodal visual analysis on complaint photograph."""
        if not image_input:
            return {
                "imageEvidence": "insufficient",
                "score": 0.0,
                "reasons": ["No photograph attached to complaint."],
                "ocr_text": "",
                "exif": {"has_exif_gps": False, "status": "no_image"}
            }

        try:
            image_bytes = self.decode_image(image_input)
        except Exception as e:
            return {
                "imageEvidence": "insufficient",
                "score": 0.0,
                "reasons": [f"Failed to decode image file: {str(e)}"],
                "ocr_text": "",
                "exif": {"has_exif_gps": False, "status": "corrupt_image"}
            }

        # 1. Image Integrity & Format Check
        try:
            pil_image = Image.open(io.BytesIO(image_bytes))
            format_name = (pil_image.format or "JPEG").lower()
            mime_type = f"image/{format_name}"
            if mime_type not in settings.ALLOWED_IMAGE_MIME_TYPES and format_name not in ["jpg", "jpeg", "png", "webp"]:
                return {
                    "imageEvidence": "insufficient",
                    "score": 0.0,
                    "reasons": [f"Unsupported image format: {format_name}"],
                    "ocr_text": "",
                    "exif": {"has_exif_gps": False}
                }
        except Exception as e:
            return {
                "imageEvidence": "insufficient",
                "score": 0.0,
                "reasons": [f"Image file corruption detected: {str(e)}"],
                "ocr_text": "",
                "exif": {"has_exif_gps": False}
            }

        # 2. Extract EXIF & GPS Metadata
        exif_info = metadata_extractor.extract_exif(image_bytes)

        # 3. Quality & Blurriness Check (Laplacian Variance)
        nparr = np.frombuffer(image_bytes, np.uint8)
        img_cv = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        is_blurry = False
        blur_score = 100.0
        if img_cv is not None:
            gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
            blur_score = float(cv2.Laplacian(gray, cv2.CV_64F).var())
            if blur_score < 15.0: # Extremely low quality / blurry
                is_blurry = True

        if is_blurry:
            return {
                "imageEvidence": "insufficient",
                "score": 0.2,
                "reasons": ["Image is extremely low quality or severely blurry, rendering visual evidence inconclusive."],
                "ocr_text": "",
                "exif": exif_info,
                "blur_score": blur_score
            }

        # 4. OCR Text Extraction
        ocr_text = ocr_extractor.extract_text(image_bytes)
        ocr_text_lower = ocr_text.lower()

        # 5. Visual & OCR Keyword Relevance Analysis
        relevance_score = 0.5
        visual_findings = []

        category_visual_keywords = {
            "ration_card": ["ration", "fps", "shop", "fair price", "grain", "dukan", "aay", "phh", "pds", "store", "closed", "notice"],
            "road_infrastructure": ["road", "pothole", "tar", "crack", "asphalt", "street", "accident"],
            "water_supply": ["water", "leak", "pipe", "drain", "waterlog"],
            "sanitation_garbage": ["garbage", "trash", "waste", "dump", "bin", "clean"]
        }

        cat_kws = category_visual_keywords.get(category, [])
        matching_kws = [kw for kw in cat_kws if kw in ocr_text_lower]

        if matching_kws:
            relevance_score += 0.35
            visual_findings.append(f"Signboard/text inside image contains relevant category terms: {', '.join(matching_kws)}")
        else:
            relevance_score = 0.30
            visual_findings.append("Photograph does not contain clear category-specific text or verifiable storefront signboards.")

        # Heuristic visual checks (image dimensions & color variance)
        h, w, c = img_cv.shape if img_cv is not None else (0,0,0)
        if w < 150 or h < 150: # Thumbnail size image
            return {
                "imageEvidence": "insufficient",
                "score": 0.2,
                "reasons": ["Image dimensions are too small to serve as verifiable evidence."],
                "ocr_text": ocr_text,
                "exif": exif_info
            }

        # Category mismatch check
        irrelevant_keywords = ["cat", "dog", "meme", "screenshot", "receipt", "game"]
        is_mismatch = any(kw in ocr_text_lower for kw in irrelevant_keywords)
        if is_mismatch:
            return {
                "imageEvidence": 0.1,
                "score": 0.1,
                "reasons": ["Image content appears inconsistent with reported civic complaint category."],
                "ocr_text": ocr_text,
                "exif": exif_info
            }

        # Manipulation Signal (Indicator only, NOT proof of fraud)
        manipulation_detected = False
        if exif_info.get("camera_model") and "photoshop" in str(exif_info.get("camera_model")).lower():
            manipulation_detected = True
            visual_findings.append("EXIF metadata indicates software edit tool. (Treated as signal, not proof of fraud).")

        if relevance_score > 0.6:
            visual_findings.append("Photograph shows visible infrastructure / storefront consistent with complaint context.")
        else:
            visual_findings.append("Photograph provides supporting environmental context.")

        score = min(0.95, relevance_score)

        return {
            "imageEvidence": round(score, 2),
            "score": round(score, 2),
            "reasons": visual_findings,
            "ocr_text": ocr_text,
            "exif": exif_info,
            "manipulation_signal": manipulation_detected
        }

image_analyzer = MultimodalImageAnalyzer()
