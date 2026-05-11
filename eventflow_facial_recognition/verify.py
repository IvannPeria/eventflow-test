"""
EventFlow - Facial Recognition Module
File: verify.py

Real-Time Verification / Attendance Check-In Script
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Run this script DURING an event to verify and log attendance.

Usage:
    python verify.py

The script will:
  1. Load all registered participant embeddings into an in-memory gallery.
  2. Open the webcam in real-time mode.
  3. On each frame: detect face → embed → match → display result.
  4. Press SPACE to log the current match as attendance.
  5. Press Q / ESC to exit.

Performance notes:
  - Matching runs every MATCH_INTERVAL frames to reduce CPU load.
  - The gallery is loaded ONCE at startup for O(1) lookup speed.
"""

import sys
import time
import logging
import cv2
import numpy as np
from pathlib import Path
from typing import Optional

# ── Project imports ──────────────────────────────────────────────────────────
sys.path.insert(0, str(Path(__file__).resolve().parent))

from face_recognition_module.database import DatabaseManager
from face_recognition_module.face_engine import FaceEngine
from face_recognition_module.webcam import CameraCapture, DEFAULT_CAMERA_INDEX

# ── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("eventflow.verify")

# ── Tunable constants ────────────────────────────────────────────────────────
EVENT_NAME     = "Capstone Defense 2025"   # Change per event
MATCH_INTERVAL = 5          # Run face matching every N frames (performance)
LOCK_DURATION  = 3.0        # Seconds to hold the match result on screen
WINDOW_TITLE   = "EventFlow — Attendance Verification"


def build_gallery(db: DatabaseManager) -> list[dict]:
    """
    Loads and pre-normalizes all participant embeddings from the database.
    Pre-normalization means each match is a single fast dot product.
    """
    participants = db.get_all_participants()
    for p in participants:
        emb = p["embedding"].astype(np.float32)
        norm = np.linalg.norm(emb)
        p["embedding"] = emb / norm if norm > 0 else emb
    logger.info("Gallery built: %d participant(s).", len(participants))
    return participants


def draw_hud(
    frame: np.ndarray,
    match: Optional[dict],
    score: float,
    threshold: float,
    event_name: str,
    locked: bool,
) -> np.ndarray:
    """
    Overlays verification result and instructions on the live frame.

    Args:
        frame:      BGR frame to annotate (modified in-place).
        match:      Best-match participant dict, or None.
        score:      Cosine similarity score.
        threshold:  Configured threshold for acceptance.
        event_name: Current event name.
        locked:     Whether the result is in the lock/hold period.

    Returns:
        Annotated frame.
    """
    h, w = frame.shape[:2]

    # ── Top banner ────────────────────────────────────────────────────────────
    cv2.rectangle(frame, (0, 0), (w, 50), (30, 30, 30), -1)
    cv2.putText(frame, f"EventFlow  |  {event_name}", (10, 33),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

    # ── Result panel ─────────────────────────────────────────────────────────
    if match is not None:
        label = f"VERIFIED: {match['name']}  (ID: {match['student_id']})"
        score_text = f"Score: {score:.4f} >= {threshold}"
        box_color = (0, 200, 0)   # Green
    else:
        label = "UNKNOWN — Not Registered / Low Score"
        score_text = f"Score: {score:.4f} < {threshold}"
        box_color = (0, 0, 220)   # Red

    cv2.rectangle(frame, (0, h - 80), (w, h), (20, 20, 20), -1)
    cv2.putText(frame, label, (10, h - 52),
                cv2.FONT_HERSHEY_SIMPLEX, 0.65, box_color, 2)
    cv2.putText(frame, score_text, (10, h - 28),
                cv2.FONT_HERSHEY_SIMPLEX, 0.55, (180, 180, 180), 1)

    # ── Controls hint ─────────────────────────────────────────────────────────
    hint = "SPACE: Log Attendance  |  Q / ESC: Quit"
    if locked:
        hint = "Attendance logged!  Next participant…"
    cv2.putText(frame, hint, (10, h - 8),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (140, 140, 140), 1)

    return frame


def run_verification(
    db: DatabaseManager,
    engine: FaceEngine,
    camera_index: int = DEFAULT_CAMERA_INDEX,
) -> None:
    """
    Main real-time verification loop.

    Runs the webcam stream, performs face detection and matching on every
    MATCH_INTERVAL-th frame, and lets the operator press SPACE to log
    attendance for the currently matched participant.
    """
    gallery = build_gallery(db)
    if not gallery:
        print("[ERROR] No registered participants found in the database.")
        print("        Run register.py first.")
        return

    # Track already-logged participants to prevent duplicate entries
    logged_ids: set[str] = set()

    frame_count   = 0
    current_match: Optional[dict] = None
    current_score: float = 0.0
    lock_until: float = 0.0   # Timestamp until which the result is locked

    print(f"\n[INFO] Starting real-time verification for event: '{EVENT_NAME}'")
    print("[INFO] Press [SPACE] to log attendance | [Q] / [ESC] to quit.\n")

    with CameraCapture(camera_index) as cam:
        while True:
            frame = cam.read_frame()
            if frame is None:
                logger.error("Frame read failed — stopping.")
                break

            display = frame.copy()
            locked = time.time() < lock_until

            # ── Face detection and matching ──────────────────────────────────
            if not locked and frame_count % MATCH_INTERVAL == 0:
                embedding = engine.detect_and_embed(frame)

                if embedding is not None:
                    match, score = engine.match(embedding, gallery)
                    current_match = match
                    current_score = score
                else:
                    # No face in frame — reset
                    current_match = None
                    current_score = 0.0

            # ── Draw bounding boxes ──────────────────────────────────────────
            raw_faces = engine.detect_faces_raw(frame)
            if raw_faces:
                box_color = (0, 200, 0) if current_match else (0, 80, 220)
                face_label = current_match["name"] if current_match else "Unknown"
                engine.draw_faces(display, raw_faces, label=face_label, color=box_color)

            # ── HUD overlay ──────────────────────────────────────────────────
            draw_hud(
                display, current_match, current_score,
                engine.threshold, EVENT_NAME, locked,
            )

            cv2.imshow(WINDOW_TITLE, display)
            frame_count += 1

            # ── Keyboard handling ────────────────────────────────────────────
            key = cv2.waitKey(1) & 0xFF

            if key in (ord("q"), 27):   # Q or ESC — quit
                print("\n[INFO] Verification session ended by operator.")
                break

            elif key == ord(" "):       # SPACE — log attendance
                if locked:
                    print("[WARN] Already logged — wait for next participant.")
                    continue

                if current_match is None:
                    print("[WARN] No verified face to log — ensure participant is in frame.")
                    continue

                sid = current_match["student_id"]

                if sid in logged_ids:
                    print(f"[WARN] '{current_match['name']}' already checked in for this session.")
                else:
                    db.log_attendance(
                        participant_id=current_match["id"],
                        event_name=EVENT_NAME,
                        similarity=current_score,
                        verified=True,
                    )
                    logged_ids.add(sid)
                    print(
                        f"[ATTENDANCE] ✔ {current_match['name']} ({sid}) "
                        f"checked in — score={current_score:.4f}"
                    )
                    lock_until = time.time() + LOCK_DURATION

    cv2.destroyAllWindows()
    print(f"\n[DONE] Session complete — {len(logged_ids)} attendance record(s) logged.")


def main() -> None:
    db = DatabaseManager()
    engine = FaceEngine(
        model_name="buffalo_l",
        det_size=(640, 640),
        threshold=0.45,    # Adjust between 0.40 – 0.50 as needed
        use_gpu=False,     # ← Set True if you have an NVIDIA GPU
    )
    run_verification(db, engine)


if __name__ == "__main__":
    main()