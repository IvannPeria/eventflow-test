"""
EventFlow - Facial Recognition Module
File: database.py

Handles all SQLite database operations for storing and retrieving
participant facial embeddings. Embeddings are stored as binary BLOBs
using numpy's efficient serialization format.
"""

import sqlite3
import numpy as np
import os
import logging
from pathlib import Path
from datetime import datetime
from typing import Optional

# ── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("eventflow.database")

# ── Constants ────────────────────────────────────────────────────────────────
DB_PATH = Path("eventflow.db")


# ── Database Manager ─────────────────────────────────────────────────────────
class DatabaseManager:
    """
    Manages the SQLite database for EventFlow facial recognition.

    Tables:
      participants  — stores participant info and their face embedding
      attendance    — stores verification logs per event
    """

    def __init__(self, db_path: Path = DB_PATH) -> None:
        self.db_path = db_path
        self._initialize_db()

    # ── Internal ─────────────────────────────────────────────────────────────

    def _get_connection(self) -> sqlite3.Connection:
        """
        Returns a thread-safe SQLite connection with WAL journal mode
        enabled for better concurrent read performance.
        """
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.execute("PRAGMA journal_mode=WAL;")  # Better concurrency
        conn.execute("PRAGMA foreign_keys=ON;")   # Enforce FK constraints
        conn.row_factory = sqlite3.Row            # Named-column access
        return conn

    def _initialize_db(self) -> None:
        """Creates tables if they do not yet exist."""
        with self._get_connection() as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS participants (
                    id          INTEGER PRIMARY KEY AUTOINCREMENT,
                    name        TEXT    NOT NULL,
                    student_id  TEXT    UNIQUE NOT NULL,
                    embedding   BLOB    NOT NULL,       -- numpy float32 array (512-D)
                    created_at  TEXT    NOT NULL,
                    updated_at  TEXT    NOT NULL
                );

                CREATE TABLE IF NOT EXISTS attendance (
                    id              INTEGER PRIMARY KEY AUTOINCREMENT,
                    participant_id  INTEGER NOT NULL REFERENCES participants(id),
                    event_name      TEXT    NOT NULL,
                    similarity      REAL    NOT NULL,   -- cosine similarity score
                    verified        INTEGER NOT NULL,   -- 1 = passed, 0 = failed
                    verified_at     TEXT    NOT NULL
                );

                CREATE INDEX IF NOT EXISTS idx_participants_student_id
                    ON participants(student_id);
                CREATE INDEX IF NOT EXISTS idx_attendance_participant
                    ON attendance(participant_id);
            """)
        logger.info("Database initialized at: %s", self.db_path.resolve())

    # ── Embedding serialization ───────────────────────────────────────────────

    @staticmethod
    def _embedding_to_blob(embedding: np.ndarray) -> bytes:
        """Converts a numpy float32 array to raw bytes for BLOB storage."""
        return embedding.astype(np.float32).tobytes()

    @staticmethod
    def _blob_to_embedding(blob: bytes) -> np.ndarray:
        """Restores a numpy float32 array from stored BLOB bytes."""
        return np.frombuffer(blob, dtype=np.float32)

    # ── Participant CRUD ──────────────────────────────────────────────────────

    def register_participant(
        self,
        name: str,
        student_id: str,
        embedding: np.ndarray,
    ) -> Optional[int]:
        """
        Inserts a new participant with their face embedding.

        Args:
            name:       Full name of the participant.
            student_id: Unique student/employee ID.
            embedding:  512-D face embedding from InsightFace.

        Returns:
            The new row's primary key, or None on failure.
        """
        now = datetime.now().isoformat()
        blob = self._embedding_to_blob(embedding)
        try:
            with self._get_connection() as conn:
                cursor = conn.execute(
                    """
                    INSERT INTO participants (name, student_id, embedding, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (name, student_id, blob, now, now),
                )
                row_id = cursor.lastrowid
            logger.info("Registered participant '%s' (ID: %s) → row %d", name, student_id, row_id)
            return row_id
        except sqlite3.IntegrityError:
            logger.warning(
                "student_id '%s' already exists — use update_participant() to refresh.", student_id
            )
            return None

    def update_participant_embedding(
        self,
        student_id: str,
        embedding: np.ndarray,
    ) -> bool:
        """
        Replaces an existing participant's embedding (re-enrollment).

        Returns:
            True if the record was updated, False if not found.
        """
        now = datetime.now().isoformat()
        blob = self._embedding_to_blob(embedding)
        with self._get_connection() as conn:
            cursor = conn.execute(
                "UPDATE participants SET embedding = ?, updated_at = ? WHERE student_id = ?",
                (blob, now, student_id),
            )
            updated = cursor.rowcount > 0
        if updated:
            logger.info("Updated embedding for student_id '%s'.", student_id)
        else:
            logger.warning("student_id '%s' not found — nothing updated.", student_id)
        return updated

    def get_participant(self, student_id: str) -> Optional[dict]:
        """
        Fetches a single participant by student_id.

        Returns:
            A dict with keys {id, name, student_id, embedding, created_at, updated_at},
            or None if not found.
        """
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM participants WHERE student_id = ?", (student_id,)
            ).fetchone()
        if row is None:
            return None
        result = dict(row)
        result["embedding"] = self._blob_to_embedding(result["embedding"])
        return result

    def get_all_participants(self) -> list[dict]:
        """
        Returns ALL registered participants with their embeddings.
        Used during the verification phase to build the in-memory gallery.
        """
        with self._get_connection() as conn:
            rows = conn.execute("SELECT * FROM participants").fetchall()
        results = []
        for row in rows:
            item = dict(row)
            item["embedding"] = self._blob_to_embedding(item["embedding"])
            results.append(item)
        logger.info("Loaded %d participant(s) from database.", len(results))
        return results

    def delete_participant(self, student_id: str) -> bool:
        """Removes a participant and their attendance records."""
        with self._get_connection() as conn:
            cursor = conn.execute(
                "DELETE FROM participants WHERE student_id = ?", (student_id,)
            )
            deleted = cursor.rowcount > 0
        if deleted:
            logger.info("Deleted participant '%s'.", student_id)
        return deleted

    # ── Attendance logging ────────────────────────────────────────────────────

    def log_attendance(
        self,
        participant_id: int,
        event_name: str,
        similarity: float,
        verified: bool,
    ) -> None:
        """
        Records a verification attempt in the attendance table.

        Args:
            participant_id: FK to participants.id
            event_name:     Name/code of the event being checked into.
            similarity:     Cosine similarity score from the matcher.
            verified:       Whether the threshold was met.
        """
        now = datetime.now().isoformat()
        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO attendance (participant_id, event_name, similarity, verified, verified_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (participant_id, event_name, float(similarity), int(verified), now),
            )
        status = "VERIFIED" if verified else "REJECTED"
        logger.info(
            "Attendance [%s] participant_id=%d event='%s' score=%.4f",
            status, participant_id, event_name, similarity,
        )

    def get_attendance_records(self, event_name: Optional[str] = None) -> list[dict]:
        """
        Fetches attendance records, optionally filtered by event.

        Returns:
            List of attendance row dicts joined with participant info.
        """
        query = """
            SELECT
                a.id, a.event_name, a.similarity, a.verified, a.verified_at,
                p.name, p.student_id
            FROM attendance a
            JOIN participants p ON a.participant_id = p.id
        """
        params: tuple = ()
        if event_name:
            query += " WHERE a.event_name = ?"
            params = (event_name,)
        query += " ORDER BY a.verified_at DESC"

        with self._get_connection() as conn:
            rows = conn.execute(query, params).fetchall()   
        return [dict(row) for row in rows]

    def close(self) -> None:
        """No persistent connection is kept; this is a no-op placeholder."""
        logger.info("DatabaseManager closed.")