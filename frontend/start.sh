#!/bin/bash
# ── SkillGap Intelligence — Frontend Startup ─────────────────────────────────
echo "🎨 SkillGap Intelligence System — Frontend"
echo "==========================================="
echo ""
echo "Option 1 (Recommended — No install needed):"
echo "  Open frontend/index.html directly in your browser."
echo "  This is the complete self-contained app."
echo ""
echo "Option 2 (React + TypeScript with npm):"
cd "$(dirname "$0")"
echo "  cd frontend"
echo "  npm install"
echo "  npm start"
echo ""
echo "Opening index.html..."

# Try to open in browser (Linux/Mac/WSL)
if command -v xdg-open &> /dev/null; then
  xdg-open "$(pwd)/index.html"
elif command -v open &> /dev/null; then
  open "$(pwd)/index.html"
else
  echo "  → Manually open: $(pwd)/index.html"
fi
