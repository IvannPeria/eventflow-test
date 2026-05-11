"""
EventFlow - Facial Recognition Module
File: register.py

Registration/Enrollment Script
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Run this script BEFORE an event to enroll participants.

Usage:
    python register.py

The script will:
  1. Prompt for participant name and student ID.
  2. Open the webcam with a live preview.
  3. Capture a face on SPACE press (with countdown).
  4. Extract a 512-D ArcFace embedding via InsightFace.
  5. Save the embedding to eventflow.db.
  6. Ask if you want to enroll another participant.
"""

import sys
import logging
from pathlib import Path

# ── Project imports ──────────────────────────────────────────────────────────
sys.path.insert(0, str(Path(__file__).resolve().parent))

from face_recognition_module.database import DatabaseManager
from face_recognition_module.face_engine import FaceEngine
from face_recognition_module.webcam import capture_stable_frame

# ── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("eventflow.register")


def collect_participant_info() -> tuple[str, str]:
    """Prompts the operator for participant details with basic validation."""
    print("\n" + "=" * 50)
    print("  EventFlow — Participant Registration")
    print("=" * 50)

    while True:
        name = input("Full Name       : ").strip()
        if name:
            break
        print("  [!] Name cannot be empty.")

    while True:
        student_id = input("Student/Employee ID : ").strip()
        if student_id:
            break
        print("  [!] ID cannot be empty.")

    return name, student_id


def enroll_participant(
    db: DatabaseManager,
    engine: FaceEngine,
    name: str,
    student_id: str,
    re_enroll: bool = False,
) -> bool:
    """
    Captures a frame, extracts the embedding, and saves it to the DB.

    Args:
        db:         Open DatabaseManager instance.
        engine:     Initialized FaceEngine.
        name:       Participant's full name.
        student_id: Unique participant ID.
        re_enroll:  If True, updates an existing record instead of inserting.

    Returns:
        True on success, False on failure.
    """
    print(f"\n[INFO] Enrolling: {name} ({student_id})")

    # ── Capture frame ────────────────────────────────────────────────────────
    frame = capture_stable_frame(engine, window_title=f"Register — {name}")
    if frame is None:
        print("[ERROR] Capture cancelled or failed — participant NOT registered.")
        return False

    # ── Extract embedding ────────────────────────────────────────────────────
    embedding = engine.detect_and_embed(frame)
    if embedding is None:
        print("[ERROR] Could not extract a face embedding from the captured frame.")
        print("        Ensure your face is clearly visible, well-lit, and centred.")
        return False

    print(f"[INFO] Embedding extracted — shape: {embedding.shape}")

    # ── Persist to database ──────────────────────────────────────────────────
    if re_enroll:
        success = db.update_participant_embedding(student_id, embedding)
        if success:
            print(f"[OK] Embedding updated for '{name}' ({student_id}).")
        else:
            print(f"[WARN] student_id '{student_id}' not found — switching to new registration.")
            row_id = db.register_participant(name, student_id, embedding)
            success = row_id is not None
    else:
        row_id = db.register_participant(name, student_id, embedding)
        if row_id is not None:
            print(f"[OK] Participant '{name}' registered with DB id={row_id}.")
            success = True
        else:
            # Duplicate — ask operator whether to update
            choice = input(
                f"[WARN] student_id '{student_id}' already exists.\n"
                "       Re-enroll (overwrite embedding)? [y/N]: "
            ).strip().lower()
            if choice == "y":
                success = db.update_participant_embedding(student_id, embedding)
            else:
                print("[INFO] Skipped — existing record kept.")
                success = False

    return success


def main() -> None:
    db     = DatabaseManager()
    engine = FaceEngine(
        model_name="buffalo_l",
        det_size=(640, 640),
        use_gpu=False,          # ← Set True if you have an NVIDIA GPU
    )

    enrolled_count = 0

    while True:
        name, student_id = collect_participant_info()
        success = enroll_participant(db, engine, name, student_id)
        if success:
            enrolled_count += 1

        again = input("\nEnroll another participant? [y/N]: ").strip().lower()
        if again != "y":
            break

    print(f"\n[DONE] Session complete — {enrolled_count} participant(s) enrolled.")


if __name__ == "__main__":
    main()