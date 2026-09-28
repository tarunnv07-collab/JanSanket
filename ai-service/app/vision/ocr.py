from PIL import Image
import pytesseract
import io
import logging

logger = logging.getLogger(__name__)

class OCRExtractor:
    def extract_text(self, image_bytes: bytes) -> str:
        """Extract text embedded in photographs using Tesseract OCR with fallback."""
        try:
            image = Image.open(io.BytesIO(image_bytes))
            # Convert to grayscale for OCR accuracy
            gray_image = image.convert('L')
            text = pytesseract.image_to_string(gray_image)
            return text.strip()
        except Exception as e:
            logger.warning(f"Tesseract OCR not available or failed: {e}")
            return ""

ocr_extractor = OCRExtractor()
