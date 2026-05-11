#!/usr/bin/env bash
# render-build.sh
# Render.com build script for EventFlow facial recognition backend.
# Installs system dependencies needed by InsightFace and OpenCV,
# then installs all Python packages from requirements.txt.

set -e  # Exit immediately if any command fails

echo "=== EventFlow Build Script ==="

# ── System dependencies ───────────────────────────────────────────────────────
# OpenCV needs these system libraries on Linux (Render runs Ubuntu)
echo "[1/3] Installing system dependencies..."
apt-get update -qq
apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1

echo "[1/3] System dependencies installed."

# ── Python dependencies ───────────────────────────────────────────────────────
echo "[2/3] Installing Python packages..."
pip install --upgrade pip
pip install -r requirements.txt
echo "[2/3] Python packages installed."

# ── Pre-download InsightFace model ────────────────────────────────────────────
# Download buffalo_l during build so the first request isn't slow.
# The model is saved to ~/.insightface/models/buffalo_l/
echo "[3/3] Pre-downloading InsightFace buffalo_l model..."
python -c "
from insightface.app import FaceAnalysis
app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
app.prepare(ctx_id=-1, det_size=(640, 640))
print('Model downloaded and ready.')
"
echo "[3/3] Model ready."

echo "=== Build complete ==="