"""
ML-Based Skill Gap Intelligence System — Flask API + Frontend Server
Run: python app.py
Visit: http://localhost:5000
"""

import sys
import os

# Add project root to path for ml_model imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "ml_model"))

from flask import Flask, jsonify, send_file, send_from_directory
from models.db import init_db
from routes.auth import auth_bp
from routes.profile import profile_bp
from routes.skills import skills_bp

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR     = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "..", "frontend")
INDEX_HTML   = os.path.join(FRONTEND_DIR, "index.html")

app = Flask(__name__, static_folder=None)
app.config["JSON_SORT_KEYS"] = False


# ── CORS ───────────────────────────────────────────────────────────────────────
@app.after_request
def add_cors(response):
    response.headers["Access-Control-Allow-Origin"]  = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
    return response


@app.before_request
def handle_options():
    from flask import request
    if request.method == "OPTIONS":
        return jsonify({}), 200


# ── Serve frontend ─────────────────────────────────────────────────────────────
@app.route("/")
def serve_frontend():
    """Serve the main React app (index.html)."""
    if os.path.exists(INDEX_HTML):
        return send_file(os.path.abspath(INDEX_HTML))
    return jsonify({"message": "SkillGap API running. Frontend not found at ../frontend/index.html"}), 200


@app.route("/app")
@app.route("/app/")
def serve_app():
    """Alias — same as root."""
    return serve_frontend()


# Serve any static asset from the frontend folder (css, js, images, etc.)
@app.route("/static/frontend/<path:filename>")
def serve_static(filename):
    return send_from_directory(FRONTEND_DIR, filename)


# ── API Blueprints ─────────────────────────────────────────────────────────────
app.register_blueprint(auth_bp)
app.register_blueprint(profile_bp)
app.register_blueprint(skills_bp)


# ── Health check ───────────────────────────────────────────────────────────────
@app.route("/health")
def health():
    frontend_exists = os.path.exists(INDEX_HTML)
    return jsonify({
        "status":           "ok",
        "service":          "SkillGap Intelligence API",
        "frontend_served":  frontend_exists,
        "frontend_path":    INDEX_HTML,
    }), 200


# ── Bootstrap ──────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    init_db()
    print("")
    print("╔══════════════════════════════════════════════════════╗")
    print("║   🧠  SkillGap Intelligence System — RUNNING         ║")
    print("╠══════════════════════════════════════════════════════╣")
    print("║                                                      ║")
    print("║   🌐  Open in browser:  http://localhost:5000        ║")
    print("║   📡  API health:       http://localhost:5000/health  ║")
    print("║                                                      ║")
    print("║   Press  Ctrl+C  to stop the server                 ║")
    print("╚══════════════════════════════════════════════════════╝")
    print("")
    app.run(debug=True, host="0.0.0.0", port=5000)
