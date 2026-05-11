"""
EventFlow - Facial Recognition Module
File: webcam.py

Manages the webcam lifecycle for both registration and verification.
Provides:
  - CameraCapture context manager (safe open/close)
  - capture_stable_frame() for enrollment (waits for a clear face)
  - stream_frames() generator for real-time verification loop
"""

import cv2
import logging
import time
import numpy as np
from typing import Optional, Generator

logger = logging.getLogger("eventflow.webcam")

# ── Constants ────────────────────────────────────────────────────────────────
DEFAULT_CAMERA_INDEX = 0      # 0 = first webcam; change if using USB secondary
FRAME_WIDTH          = 1280   # Preferred resolution width
FRAME_HEIGHT         = 720    # Preferred resolution height
CAPTURE_FPS          = 30     # Request 30 fps from the camera driver
WARMUP_FRAMES        = 20     # Discard first N frames for auto-exposure to settle


class CameraCapture:
    """
    Context manager for a webcam capture session.

    Usage:
        with CameraCapture() as cam:
            frame = cam.read_frame()
    """

    def __init__(self, camera_index: int = DEFAULT_CAMERA_INDEX) -> None:
        self.camera_index = camera_index
        self._cap: Optional[cv2.VideoCapture] = None

    def __enter__(self) -> "CameraCapture":
        self._cap = cv2.VideoCapture(self.camera_index, cv2.CAP_DSHOW)  # CAP_DSHOW = DirectShow (Windows)

        if not self._cap.isOpened():
            raise RuntimeError(
                f"Cannot open camera index {self.camera_index}. "
                "Check that no other application is using the webcam."
            )

        # Request high-quality settings (driver will use closest supported values)
        self._cap.set(cv2.CAP_PROP_FRAME_WIDTH,  FRAME_WIDTH)
        self._cap.set(cv2.CAP_PROP_FRAME_HEIGHT, FRAME_HEIGHT)
        self._cap.set(cv2.CAP_PROP_FPS,          CAPTURE_FPS)

        # Warm up: discard early frames while auto-exposure adjusts
        logger.info("Warming up camera (%d frames)…", WARMUP_FRAMES)
        for _ in range(WARMUP_FRAMES):
            self._cap.read()

        actual_w = int(self._cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        actual_h = int(self._cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        logger.info("Camera ready: %dx%d @ index %d", actual_w, actual_h, self.camera_index)
        return self

    def __exit__(self, *_) -> None:
        self.release()

    def read_frame(self) -> Optional[np.ndarray]:
        """
        Reads one BGR frame from the camera.

        Returns:
            The captured frame, or None if the read failed.
        """
        if self._cap is None or not self._cap.isOpened():
            return None
        ret, frame = self._cap.read()
        if not ret or frame is None:
            logger.warning("Frame grab failed — camera may be disconnected.")
            return None
        return frame

    def release(self) -> None:
        if self._cap and self._cap.isOpened():
            self._cap.release()
            logger.info("Camera released.")


# ── Registration Helper ───────────────────────────────────────────────────────

def capture_stable_frame(
    face_engine,
    camera_index: int = DEFAULT_CAMERA_INDEX,
    window_title: str = "EventFlow — Registration",
    countdown: int = 3,
) -> Optional[np.ndarray]:
    """
    Opens the webcam with a live preview and captures a single high-quality
    frame for enrollment once the user is ready.

    Workflow:
      1. Show live feed with detection overlay.
      2. Press SPACE to start a countdown.
      3. Capture the frame at the end of the countdown.
      4. Press Q to cancel.

    Args:
        face_engine:   An initialized FaceEngine instance.
        camera_index:  Webcam index.
        window_title:  OpenCV window title.
        countdown:     Seconds to count down before capture.

    Returns:
        A BGR frame suitable for embedding extraction, or None on cancellation.
    """
    captured_frame = None

    with CameraCapture(camera_index) as cam:
        print("\n[REGISTRATION] Live preview started.")
        print("  → Position your face inside the box.")
        print("  → Press [SPACE] to capture  |  [Q] to cancel.\n")

        capture_start: Optional[float] = None

        while True:
            frame = cam.read_frame()
            if frame is None:
                break

            display = frame.copy()
            faces = face_engine.detect_faces_raw(frame)

            if faces:
                # Draw bounding box + landmarks
                face_engine.draw_faces(display, faces, color=(0, 255, 0))
                status_text = f"Face detected ({len(faces)})"
                status_color = (0, 255, 0)
            else:
                status_text = "No face detected"
                status_color = (0, 0, 255)

            # Countdown logic
            if capture_start is not None:
                elapsed = time.time() - capture_start
                remaining = countdown - int(elapsed)

                if remaining > 0:
                    cv2.putText(
                        display, str(remaining),
                        (display.shape[1] // 2 - 20, display.shape[0] // 2),
                        cv2.FONT_HERSHEY_SIMPLEX, 3.0, (0, 255, 255), 5,
                    )
                else:
                    if faces:
                        captured_frame = frame.copy()
                        print("[REGISTRATION] Frame captured successfully.")
                    else:
                        print("[REGISTRATION] No face in frame — try again.")
                        capture_start = None
                    break

            # HUD overlay
            cv2.putText(display, status_text, (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, status_color, 2)
            cv2.putText(display, "SPACE: Capture | Q: Quit", (10, display.shape[0] - 15),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1)
            cv2.imshow(window_title, display)

            key = cv2.waitKey(1) & 0xFF
            if key == ord("q") or key == 27:   # Q or ESC
                print("[REGISTRATION] Cancelled by user.")
                break
            elif key == ord(" "):              # SPACE
                if faces:
                    capture_start = time.time()
                    print(f"[REGISTRATION] Capturing in {countdown}s…")
                else:
                    print("[REGISTRATION] No face detected — move into frame first.")

    cv2.destroyAllWindows()
    return captured_frame


# ── Verification Stream ───────────────────────────────────────────────────────

def stream_frames(
    camera_index: int = DEFAULT_CAMERA_INDEX,
) -> Generator[np.ndarray, None, None]:
    """
    Generator that yields BGR frames from the webcam indefinitely.
    Stops when the camera is closed or an error occurs.

    Usage (in verify.py):
        for frame in stream_frames():
            result = engine.detect_and_embed(frame)
            ...
            if done:
                break
    """
    with CameraCapture(camera_index) as cam:
        while True:
            frame = cam.read_frame()
            if frame is None:
                break
            yield frame