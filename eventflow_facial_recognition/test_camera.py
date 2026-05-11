import cv2
import numpy as np
from insightface.app import FaceAnalysis
import warnings
warnings.filterwarnings("ignore")  # suppress the FutureWarning noise

print("Loading model...")
app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
app.prepare(ctx_id=-1, det_size=(640, 640))
print("Model ready. Starting camera...\n")

cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
for _ in range(30):
    cap.read()
print("Camera ready. Press Q to quit.\n")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    display = frame.copy()
    faces = app.get(frame)

    for face in faces:
        x1, y1, x2, y2 = [int(v) for v in face.bbox]
        cv2.rectangle(display, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(display, f"Face detected | Norm: {np.linalg.norm(face.embedding):.2f}",
                    (x1, max(y1 - 10, 20)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

    status = f"Faces: {len(faces)}" if faces else "No face detected"
    color = (0, 255, 0) if faces else (0, 0, 255)
    cv2.putText(display, status, (10, 35),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)

    cv2.imshow("EventFlow - Camera Test", display)

    if cv2.waitKey(30) & 0xFF in (ord("q"), 27):
        break

cap.release()
cv2.destroyAllWindows()
print("Done.")