# EventFlow — Face Recognition Module
# Makes this directory a Python package so imports work correctly.

from .database import DatabaseManager
from .face_engine import FaceEngine, DEFAULT_THRESHOLD
from .webcam import CameraCapture, capture_stable_frame, stream_frames

__all__ = [
    "DatabaseManager",
    "FaceEngine",
    "DEFAULT_THRESHOLD",
    "CameraCapture",
    "capture_stable_frame",
    "stream_frames",
]