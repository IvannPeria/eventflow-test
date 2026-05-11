"""
EventFlow - Facial Recognition Module
File: api.py

FastAPI server — active event is fetched dynamically from Supabase.
No hardcoded event IDs. The active event is whichever row in `events`
has is_active = true.

Run with:
    uvicorn api:app --host 0.0.0.0 --port 8000 --reload

Environment variables (eventflow_facial_recognition/.env):
    SUPABASE_URL=https://your-project.supabase.co
    SUPABASE_SERVICE_KEY=your-service-role-key
"""

import os
import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import Optional
import logging
from dotenv import load_dotenv
from supabase import create_client, Client

from face_recognition_module.face_engine import FaceEngine

# ── Config ────────────────────────────────────────────────────────────────────
load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("eventflow.api")

# ── App state ─────────────────────────────────────────────────────────────────
supabase:      Optional[Client]    = None
engine:        Optional[FaceEngine] = None
gallery:       list[dict]           = []
active_event:  Optional[dict]       = None  # { event_id, event_name, ... }


# ── Active event ──────────────────────────────────────────────────────────────

def fetch_active_event() -> Optional[dict]:
    """
    Fetches the single event where is_active = true from Supabase.
    Returns the full event row as a dict, or None if no event is active.
    """
    res = (
        supabase.table("events")
        .select("event_id, event_name, event_type, event_date, venue_name")
        .eq("is_active", True)
        .limit(1)
        .execute()
    )
    if res.data:
        return res.data[0]
    return None


# ── Gallery ───────────────────────────────────────────────────────────────────

def reload_gallery() -> None:
    """
    Reloads the active event from Supabase, then loads all face embeddings
    for that event into the in-memory gallery.

    If no event is active, the gallery is cleared and verification is blocked.
    """
    global gallery, active_event

    active_event = fetch_active_event()

    if active_event is None:
        gallery = []
        logger.warning("No active event found. Set is_active=true on an event in Supabase.")
        return

    event_id = active_event["event_id"]

    res = (
        supabase.table("face_embeddings")
        .select(
            "embedding_id, participant_id, embedding, event_id, "
            "participants(participant_id, name, student_id, email)"
        )
        .eq("is_active", True)
        .eq("event_id", event_id)
        .execute()
    )

    rows    = res.data or []
    gallery = []

    for row in rows:
        emb  = np.array(row["embedding"], dtype=np.float32)
        norm = np.linalg.norm(emb)
        if norm == 0:
            continue
        gallery.append({
            "participant_id": row["participants"]["participant_id"],
            "name":           row["participants"]["name"],
            "student_id":     row["participants"]["student_id"],
            "email":          row["participants"].get("email", ""),
            "embedding":      emb / norm,
        })

    logger.info(
        "Gallery reloaded | event='%s' (id=%d) | %d participant(s).",
        active_event["event_name"], event_id, len(gallery),
    )


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    global supabase, engine
    logger.info("Starting EventFlow API...")

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    engine   = FaceEngine(
        model_name="buffalo_sc",
        det_size=(320, 320),
        threshold=0.45,
        use_gpu=False,
    )
    reload_gallery()
    logger.info("EventFlow API ready.")
    yield
    logger.info("Shutting down.")


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(title="EventFlow Facial Recognition API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://event-flow-mu-pink.vercel.app/",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Utility ───────────────────────────────────────────────────────────────────

def decode_image(file_bytes: bytes) -> np.ndarray:
    """Decodes raw JPEG/PNG bytes from the browser into a BGR numpy array."""
    arr   = np.frombuffer(file_bytes, dtype=np.uint8)
    frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if frame is None:
        raise HTTPException(
            status_code=400,
            detail="Could not decode image. Send a valid JPEG or PNG."
        )
    return frame


def require_active_event() -> dict:
    """
    Returns the active event or raises 503 if none is set.
    Call this at the start of any route that needs an active event.
    """
    if active_event is None:
        raise HTTPException(
            status_code=503,
            detail="No active event. Set is_active=true on an event in Supabase."
        )
    return active_event


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health_check():
    """Returns server status, active event info, and gallery size."""
    return {
        "status":       "ok",
        "active_event": active_event,   # None if no event is active
        "gallery_size": len(gallery),
        "model":        "buffalo_l",
    }


# ── Active event management ───────────────────────────────────────────────────

@app.get("/api/active-event")
def get_active_event():
    """Returns the currently active event."""
    event = fetch_active_event()
    if event is None:
        return {"active_event": None, "message": "No active event."}
    return {"active_event": event}


@app.post("/api/active-event/{event_id}")
def set_active_event(event_id: int):
    """
    Switches the active event to the given event_id.
    Deactivates the previous active event and reloads the gallery.

    Call this from your admin panel when starting a new event.
    """
    # Verify the event exists
    check = (
        supabase.table("events")
        .select("event_id, event_name")
        .eq("event_id", event_id)
        .single()
        .execute()
    )
    if not check.data:
        raise HTTPException(status_code=404, detail=f"Event ID {event_id} not found.")

    # Use the SQL function to safely switch active event
    supabase.rpc("set_active_event", {"new_event_id": event_id}).execute()

    # Reload gallery for the new active event
    reload_gallery()

    logger.info("Active event switched to: %s (id=%d)", check.data["event_name"], event_id)

    return {
        "success":      True,
        "message":      f"Active event set to '{check.data['event_name']}'.",
        "active_event": active_event,
        "gallery_size": len(gallery),
    }


@app.post("/api/reload-gallery")
def trigger_reload():
    """
    Manually reloads the gallery from Supabase.
    Useful after bulk-registering participants outside the API.
    """
    reload_gallery()
    return {
        "success":      True,
        "active_event": active_event,
        "gallery_size": len(gallery),
    }


# ── Registration ──────────────────────────────────────────────────────────────

@app.post("/api/register")
async def register_participant(
    name:       str        = Form(...),
    student_id: str        = Form(...),
    email:      str        = Form(""),
    image:      UploadFile = File(...),
    event_id:   Optional[int] = Form(None),
):
    """
    Enrolls a participant's face for a selected event.

    - If participant doesn't exist yet, creates them in `participants`.
    - If they already exist, reuses their participant row.
    - Inserts a new embedding in `face_embeddings` for the selected event.
    - One active embedding per participant per event.
    """
    if event_id is not None:
        event_res = (
            supabase.table("events")
            .select("event_id, event_name")
            .eq("event_id", event_id)
            .limit(1)
            .execute()
        )
        if not event_res.data:
            raise HTTPException(
                status_code=404,
                detail=f"Event ID {event_id} not found."
            )
        event = event_res.data[0]
    else:
        event = require_active_event()
    event_id = event["event_id"]

    # Extract embedding
    frame     = decode_image(await image.read())
    embedding = engine.detect_and_embed(frame)

    if embedding is None:
        raise HTTPException(
            status_code=422,
            detail="No face detected. Ensure the participant is clearly visible and well-lit."
        )

    # Get or create participant
    existing = (
        supabase.table("participants")
        .select("participant_id, name")
        .eq("student_id", student_id)
        .execute()
    )

    if existing.data:
        participant = existing.data[0]
        # Update email for existing participant
        supabase.table("participants").update(
            {"email": email}
        ).eq("participant_id", participant["participant_id"]).execute()
    else:
        p_res = (
            supabase.table("participants")
            .insert({"name": name, "student_id": student_id, "email": email})  # ← add email
            .execute()
        )
        participant = p_res.data[0]

    # Check if already registered for this event
    already = (
        supabase.table("face_embeddings")
        .select("embedding_id")
        .eq("participant_id", participant["participant_id"])
        .eq("event_id", event_id)
        .eq("is_active", True)
        .execute()
    )

    if already.data:
        raise HTTPException(
            status_code=409,
            detail=(
                f"'{participant['name']}' is already registered for "
                f"'{event['event_name']}'. Use /api/re-enroll to update."
            )
        )

    # Insert embedding for this event
    supabase.table("face_embeddings").insert({
        "participant_id": participant["participant_id"],
        "event_id":       event_id,
        "embedding":      embedding.tolist(),
        "is_active":      True,
    }).execute()

    reload_gallery()

    logger.info(
        "Registered: %s (student_id=%s) for event='%s' (id=%d)",
        participant["name"], student_id, event["event_name"], event_id,
    )

    return {
        "success":        True,
        "message":        f"{participant['name']} registered for '{event['event_name']}'.",
        "participant_id": participant["participant_id"],
        "event_id":       event_id,
        "event_name":     event["event_name"],
    }


@app.post("/api/re-enroll")
async def re_enroll_participant(
    student_id: str        = Form(...),
    image:      UploadFile = File(...),
):
    """
    Replaces a participant's face embedding for the active event.
    Old embedding is marked inactive. New one is inserted as active.
    """
    event    = require_active_event()
    event_id = event["event_id"]

    p_res = (
        supabase.table("participants")
        .select("participant_id, name")
        .eq("student_id", student_id)
        .single()
        .execute()
    )
    if not p_res.data:
        raise HTTPException(status_code=404, detail=f"Student ID '{student_id}' not found.")

    participant = p_res.data

    frame     = decode_image(await image.read())
    embedding = engine.detect_and_embed(frame)
    if embedding is None:
        raise HTTPException(status_code=422, detail="No face detected in the image.")

    # Deactivate old embedding for this event only
    supabase.table("face_embeddings").update({"is_active": False}).eq(
        "participant_id", participant["participant_id"]
    ).eq("event_id", event_id).eq("is_active", True).execute()

    # Insert fresh embedding
    supabase.table("face_embeddings").insert({
        "participant_id": participant["participant_id"],
        "event_id":       event_id,
        "embedding":      embedding.tolist(),
        "is_active":      True,
    }).execute()

    reload_gallery()

    return {
        "success":    True,
        "message":    f"Face updated for '{participant['name']}' ({event['event_name']}).",
        "event_name": event["event_name"],
    }


# ── Verification ──────────────────────────────────────────────────────────────

@app.post("/api/verify")
async def verify_participant(
    image:          UploadFile = File(...),
    log_attendance: bool       = Form(True),
):
    """
    Verifies a face against the active event's gallery.
    Only participants registered for the active event can be matched.
    """
    event = require_active_event()

    if not gallery:
        raise HTTPException(
            status_code=503,
            detail=f"No participants registered for '{event['event_name']}' yet."
        )

    frame     = decode_image(await image.read())
    embedding = engine.detect_and_embed(frame)

    if embedding is None:
        return {
            "verified":   False,
            "similarity": 0.0,
            "threshold":  engine.threshold,
            "message":    "No face detected in the image.",
        }

    match, score = engine.match(embedding, gallery)

    if match and log_attendance:
        supabase.table("attendance").upsert(
            {
                "participant_id": match["participant_id"],
                "event_id":       event["event_id"],
                "similarity":     float(score),
                "verified":       True,
            },
            on_conflict="participant_id,event_id",
        ).execute()

        logger.info(
            "Verified: %s (student_id=%s, event='%s', score=%.4f)",
            match["name"], match["student_id"], event["event_name"], score,
        )

    if match:
        return {
            "verified":       True,
            "name":           match["name"],
            "student_id":     match["student_id"],
            "email":          match.get("email", ""),
            "participant_id": match["participant_id"],
            "similarity":     round(score, 4),
            "threshold":      engine.threshold,
            "event_name":     event["event_name"],
            "message":        f"Welcome, {match['name']}!",
        }

    return {
        "verified":   False,
        "similarity": round(score, 4),
        "threshold":  engine.threshold,
        "message":    "Face not recognized or not registered for this event.",
    }


# ── Participants ──────────────────────────────────────────────────────────────

@app.get("/api/participants")
def list_participants(event_id: Optional[int] = None):
    """
    Lists participants. If event_id is given, only returns those registered
    for that event. Defaults to the active event if no event_id provided.
    """
    filter_id = event_id if event_id is not None else (
        active_event["event_id"] if active_event else None
    )

    if filter_id is not None:
        res = (
            supabase.table("face_embeddings")
            .select("participants(participant_id, name, student_id, email, created_at)")
            .eq("event_id", filter_id)
            .eq("is_active", True)
            .execute()
        )
        participants = [row["participants"] for row in (res.data or [])]
    else:
        res = (
            supabase.table("participants")
            .select("participant_id, name, student_id, email, created_at")
            .order("created_at", desc=True)
            .execute()
        )
        participants = res.data or []

    return {"count": len(participants), "participants": participants}


@app.delete("/api/participants/{student_id}")
def delete_participant(student_id: str):
    """Deletes a participant. Cascades to face_embeddings and attendance."""
    res = (
        supabase.table("participants")
        .delete()
        .eq("student_id", student_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail=f"Student ID '{student_id}' not found.")
    reload_gallery()
    return {"success": True, "message": f"Participant '{student_id}' deleted."}


# ── Attendance ────────────────────────────────────────────────────────────────

@app.get("/api/attendance")
def get_attendance(event_id: Optional[int] = None):
    """
    Returns attendance records for the given event_id.
    Defaults to the active event if not specified.
    """
    filter_id = event_id if event_id is not None else (
        active_event["event_id"] if active_event else None
    )

    if filter_id is None:
        return {"count": 0, "records": [], "message": "No active event."}

    res = (
        supabase.table("attendance")
        .select(
            "attendance_id, similarity, verified, verified_at, "
            "participants(name, student_id), "
            "events(event_name)"
        )
        .eq("event_id", filter_id)
        .order("verified_at", desc=True)
        .execute()
    )

    records = [
        {
            "attendance_id": r["attendance_id"],
            "name":          r["participants"]["name"],
            "student_id":    r["participants"]["student_id"],
            "event_name":    r["events"]["event_name"],
            "similarity":    round(r["similarity"], 4),
            "verified":      r["verified"],
            "verified_at":   r["verified_at"],
        }
        for r in (res.data or [])
    ]

    return {"count": len(records), "records": records}