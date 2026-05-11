"""
EventFlow - Facial Recognition Module
File: register_from_image.py

Registration script that takes an image file instead of webcam capture.
Used by the web API to register faces from uploaded images.
"""

import sys
import logging
import base64
import cv2
import numpy as np
from pathlib import Path
from io import BytesIO
from PIL import Image

# ── Project imports ──────────────────────────────────────────────────────────
sys.path.insert(0, str(Path(__file__).resolve().parent))

from face_recognition_module.database import DatabaseManager
from face_recognition_module.face_engine import FaceEngine

# ── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("eventflow.register_from_image")


def register_from_base64_image(name: str, student_id: str, base64_image: str) -> bool:
    """
    Registers a participant from a base64-encoded image.

    Args:
        name: Full name
        student_id: Unique ID
        base64_image: Base64 string of the image (data:image/png;base64,...)

    Returns:
        True if registration successful, False otherwise
    """
    try:
        # Remove data URL prefix if present
        if ',' in base64_image:
            base64_image = base64_image.split(',')[1]

        # Decode base64 to bytes
        image_bytes = base64.b64decode(base64_image)

        # Convert to PIL Image
        pil_image = Image.open(BytesIO(image_bytes))

        # Convert to OpenCV format (BGR)
        opencv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)

        # Initialize face engine
        face_engine = FaceEngine()

        # Extract embedding
        embedding = face_engine.detect_and_embed(opencv_image)

        if embedding is None:
            logger.error("No face detected in the image")
            return False

        # Initialize database
        db = DatabaseManager()

        # Register participant
        result = db.register_participant(name, student_id, embedding)

        if result is None:
            logger.error("Failed to register participant (possibly duplicate student_id)")
            return False

        logger.info("Successfully registered %s (%s)", name, student_id)
        return True

    except Exception as e:
        logger.error("Error during registration: %s", str(e))
        return False


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python register_from_image.py <name> <student_id> <base64_image>")
        sys.exit(1)

    name = sys.argv[1]
    student_id = sys.argv[2]
    base64_image = sys.argv[3]

    success = register_from_base64_image(name, student_id, base64_image)
    sys.exit(0 if success else 1)