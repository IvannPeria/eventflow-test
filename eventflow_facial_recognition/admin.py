"""
EventFlow - Facial Recognition Module
File: admin.py

Admin / Diagnostic Utility
━━━━━━━━━━━━━━━━━━━━━━━━━━
Run this script to inspect the database, view attendance reports,
test embeddings, or delete participants.

Usage:
    python admin.py
"""

import sys
import logging
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from face_recognition_module.database import DatabaseManager

logging.basicConfig(level=logging.WARNING)   # Suppress info noise in admin mode


# ── Menu helpers ─────────────────────────────────────────────────────────────

def print_header(title: str) -> None:
    print(f"\n{'=' * 55}")
    print(f"  {title}")
    print("=" * 55)


def list_participants(db: DatabaseManager) -> None:
    print_header("Registered Participants")
    participants = db.get_all_participants()
    if not participants:
        print("  (no participants registered)")
        return
    print(f"  {'ID':>4}  {'Student ID':<15}  {'Name':<25}  {'Enrolled At'}")
    print(f"  {'-'*4}  {'-'*15}  {'-'*25}  {'-'*19}")
    for p in participants:
        print(f"  {p['id']:>4}  {p['student_id']:<15}  {p['name']:<25}  {p['created_at'][:19]}")
    print(f"\n  Total: {len(participants)} participant(s)")


def view_attendance(db: DatabaseManager) -> None:
    print_header("Attendance Records")
    event = input("  Filter by event name (leave blank for all): ").strip() or None
    records = db.get_attendance_records(event_name=event)
    if not records:
        print("  (no attendance records found)")
        return
    print(
        f"\n  {'#':>3}  {'Name':<20}  {'Student ID':<12}  {'Event':<20}  "
        f"{'Score':>6}  {'Status':<8}  {'Time'}"
    )
    print(f"  {'-'*3}  {'-'*20}  {'-'*12}  {'-'*20}  {'-'*6}  {'-'*8}  {'-'*19}")
    for i, r in enumerate(records, 1):
        status = "✔ VERIFIED" if r["verified"] else "✘ REJECTED"
        print(
            f"  {i:>3}  {r['name']:<20}  {r['student_id']:<12}  "
            f"{r['event_name']:<20}  {r['similarity']:>6.4f}  {status:<10}  {r['verified_at'][:19]}"
        )
    print(f"\n  Total: {len(records)} record(s)")


def delete_participant(db: DatabaseManager) -> None:
    print_header("Delete Participant")
    sid = input("  Enter Student ID to delete: ").strip()
    if not sid:
        print("  Cancelled.")
        return
    confirm = input(f"  Delete '{sid}' and ALL their attendance records? [yes/N]: ").strip().lower()
    if confirm == "yes":
        success = db.delete_participant(sid)
        print(f"  {'Deleted successfully.' if success else 'Student ID not found.'}")
    else:
        print("  Cancelled.")


def test_embedding(db: DatabaseManager) -> None:
    """Sanity-checks the stored embedding for a given participant."""
    print_header("Test Stored Embedding")
    sid = input("  Enter Student ID to inspect: ").strip()
    p = db.get_participant(sid)
    if p is None:
        print(f"  Student ID '{sid}' not found.")
        return
    emb = p["embedding"]
    import numpy as np
    norm = float(np.linalg.norm(emb))
    print(f"\n  Name       : {p['name']}")
    print(f"  Student ID : {p['student_id']}")
    print(f"  Embedding  : shape={emb.shape}  dtype={emb.dtype}")
    print(f"  L2 Norm    : {norm:.6f}  (should be ~1.0 if normalized)")
    print(f"  Min / Max  : {emb.min():.4f} / {emb.max():.4f}")
    print(f"  Enrolled   : {p['created_at'][:19]}")
    print(f"  Updated    : {p['updated_at'][:19]}")


# ── Main menu ─────────────────────────────────────────────────────────────────

def main() -> None:
    db = DatabaseManager()

    menu = {
        "1": ("List all participants",     lambda: list_participants(db)),
        "2": ("View attendance records",   lambda: view_attendance(db)),
        "3": ("Delete a participant",      lambda: delete_participant(db)),
        "4": ("Inspect stored embedding",  lambda: test_embedding(db)),
        "5": ("Exit",                      None),
    }

    while True:
        print_header("EventFlow Admin Panel")
        for key, (label, _) in menu.items():
            print(f"  [{key}] {label}")

        choice = input("\n  Select option: ").strip()

        if choice not in menu:
            print("  Invalid choice.")
            continue

        label, action = menu[choice]
        if action is None:
            print("  Goodbye.")
            break
        action()


if __name__ == "__main__":
    main()