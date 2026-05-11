"""
EventFlow - Facial Recognition Module
File: face_engine.py

Core face recognition engine powered by InsightFace (buffalo_l).
Handles:
  - Model initialization
  - Face detection and embedding extraction
  - Cosine similarity matching against registered gallery
"""

import logging
import numpy as np
import cv2
from typing import Optional
from insightface.app import FaceAnalysis

# ── Logging ─────────────────────────────────────────────────────────────────
logger = logging.getLogger("eventflow.face_engine")

# ── Threshold Guidance ───────────────────────────────────────────────────────
# Cosine similarity ranges for buffalo_l ArcFace embeddings (512-D):
#   >= 0.50  →  Same person  (high confidence)
#   >= 0.40  →  Likely same person (acceptable)
#    < 0.40  →  Different person
#
# For an attendance system, 0.45 balances security vs. false rejections.
# Increase toward 0.50 for stricter security; decrease toward 0.40
# if legitimate participants are being rejected too often.
DEFAULT_THRESHOLD = 0.45


class FaceEngine:
    """
    Wraps InsightFace's FaceAnalysis to provide:
      - detect_and_embed()  → extract a 512-D embedding from a frame
      - match()             → compare a probe embedding to a gallery
    """

    def __init__(
        self,
        model_name: str = "buffalo_l",
        det_size: tuple[int, int] = (640, 640),
        threshold: float = DEFAULT_THRESHOLD,
        use_gpu: bool = False,
    ) -> None:
        """
        Initialises the InsightFace pipeline.

        Args:
            model_name: InsightFace model pack. 'buffalo_l' gives the best
                        accuracy; 'buffalo_s' is faster for slower machines.
            det_size:   Detection input resolution. (640, 640) is optimal.
                        Lower to (320, 320) for CPU-only setups if needed.
            threshold:  Cosine similarity cutoff for accepting a match.
            use_gpu:    Set True if an NVIDIA GPU + onnxruntime-gpu is installed.
        """
        self.threshold = threshold
        self.model_name = model_name

        providers = (
            ["CUDAExecutionProvider", "CPUExecutionProvider"]
            if use_gpu
            else ["CPUExecutionProvider"]
        )

        logger.info(
            "Initializing FaceEngine | model=%s | det_size=%s | providers=%s",
            model_name, det_size, providers,
        )

        # buffalo_l will auto-download (~320 MB) on first run to:
        #   Windows: C:\Users\<you>\.insightface\models\buffalo_l\
        self.app = FaceAnalysis(name=model_name, providers=providers)
        self.app.prepare(ctx_id=0 if use_gpu else -1, det_size=det_size)

        logger.info("FaceEngine ready.")

    # ── Core API ─────────────────────────────────────────────────────────────

    def detect_and_embed(self, frame: np.ndarray) -> Optional[np.ndarray]:
        """
        Runs detection + recognition on a BGR frame (from OpenCV).

        Returns:
            512-D float32 embedding of the LARGEST detected face,
            or None if no face was found.

        Note:
            We always pick the largest face (by bounding-box area) to avoid
            accidentally enrolling/matching a face in the background.
        """
        if frame is None or frame.size == 0:
            logger.warning("detect_and_embed() received an empty frame.")
            return None

        faces = self.app.get(frame)

        if not faces:
            logger.debug("No faces detected in frame.")
            return None

        # Pick the largest face by bounding-box area
        largest = max(faces, key=lambda f: self._bbox_area(f.bbox))
        embedding = largest.embedding  # shape: (512,)  dtype: float32

        # L2-normalize for cosine similarity (dot product shortcut)
        norm = np.linalg.norm(embedding)
        if norm == 0:
            logger.warning("Zero-norm embedding detected — skipping.")
            return None

        return embedding / norm

    def match(
        self,
        probe: np.ndarray,
        gallery: list[dict],
    ) -> tuple[Optional[dict], float]:
        """
        Compares a probe embedding against all registered participants.

        Args:
            probe:   Normalized 512-D embedding from the live camera frame.
            gallery: List of participant dicts from DatabaseManager.get_all_participants().
                     Each dict must contain 'embedding' (np.ndarray), 'name', 'student_id'.

        Returns:
            (best_match_dict, similarity_score)
            best_match_dict is None if no gallery entry exceeds the threshold.
        """
        if not gallery:
            logger.warning("Gallery is empty — no registered participants to match against.")
            return None, 0.0

        best_score = -1.0
        best_match = None

        for participant in gallery:
            stored_emb = participant["embedding"]

            # Normalize stored embedding (may not be normalized if imported)
            stored_norm = np.linalg.norm(stored_emb)
            if stored_norm == 0:
                continue
            stored_emb_normalized = stored_emb / stored_norm

            # Cosine similarity = dot product of two unit vectors
            score = float(np.dot(probe, stored_emb_normalized))

            if score > best_score:
                best_score = score
                best_match = participant

        if best_score >= self.threshold:
            logger.info(
                "Match found: '%s' (student_id=%s, score=%.4f)",
                best_match["name"], best_match["student_id"], best_score,
            )
            return best_match, best_score

        logger.info("No match above threshold (best_score=%.4f < %.4f)", best_score, self.threshold)
        return None, best_score

    def detect_faces_raw(self, frame: np.ndarray) -> list:
        """
        Returns the raw InsightFace face objects for a frame.
        Useful for drawing bounding boxes and landmarks on screen.
        """
        if frame is None or frame.size == 0:
            return []
        return self.app.get(frame)

    # ── Utilities ─────────────────────────────────────────────────────────────

    @staticmethod
    def _bbox_area(bbox: np.ndarray) -> float:
        """Computes bounding-box area from [x1, y1, x2, y2]."""
        x1, y1, x2, y2 = bbox
        return max(0.0, float((x2 - x1) * (y2 - y1)))

    @staticmethod
    def draw_faces(
        frame: np.ndarray,
        faces: list,
        label: Optional[str] = None,
        color: tuple[int, int, int] = (0, 255, 0),
    ) -> np.ndarray:
        """
        Draws bounding boxes and optional label text on a frame.

        Args:
            frame:  BGR image (modified in-place).
            faces:  Raw InsightFace face objects.
            label:  Text to display above the first face box.
            color:  BGR colour for box and text (default: green).

        Returns:
            The annotated frame.
        """
        for i, face in enumerate(faces):
            x1, y1, x2, y2 = [int(v) for v in face.bbox]
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

            # Draw 5 landmark points
            if face.kps is not None:
                for kp in face.kps:
                    cx, cy = int(kp[0]), int(kp[1])
                    cv2.circle(frame, (cx, cy), 2, (0, 0, 255), -1)

            # Draw label on the first (largest) face
            if label and i == 0:
                cv2.putText(
                    frame, label,
                    (x1, max(y1 - 10, 20)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2,
                )

        return frame