#!/bin/bash
# ── SkillGap Intelligence — Backend Startup ───────────────────────────────────
set -e

echo "🧠 SkillGap Intelligence System — Backend"
echo "=========================================="

# Step 1: Install Python deps
echo ""
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt --break-system-packages -q

# Step 2: Train ML model if not already trained
cd ../ml_model
if [ ! -f "skill_model.pkl" ]; then
  echo ""
  echo "🤖 Training ML model (first-time setup)..."
  python train_model.py
else
  echo "✅ ML model already trained."
fi

# Step 3: Start Flask
cd ../backend
echo ""
echo "🚀 Starting Flask API on http://localhost:5000"
echo "   Press Ctrl+C to stop"
echo ""
python app.py
