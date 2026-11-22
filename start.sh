#!/usr/bin/env bash
set -euo pipefail

echo "============================================"
echo "  Hermes ESP32 Studio v1.0.0"
echo "============================================"

if [ ! -d ".venv" ]; then
  echo "[1/3] Creating Python virtual environment..."
  python3 -m venv .venv
fi

echo "[2/3] Installing dependencies..."
.venv/bin/python -m pip install --upgrade pip -q
.venv/bin/python -m pip install -r requirements.txt -q

echo "[3/3] Starting Hermes ESP32 Studio at http://127.0.0.1:8765"
.venv/bin/python -m uvicorn server:app --host 127.0.0.1 --port 8765
