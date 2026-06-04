"""
Authentication routes: /signup and /login
Uses SHA-256 password hashing (no external deps required).
"""

import hashlib
import json
from flask import Blueprint, request, jsonify
from models.db import get_connection

auth_bp = Blueprint("auth", __name__)


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters."}), 400

    hashed = _hash_password(password)

    try:
        conn = get_connection()
        conn.execute(
            "INSERT INTO users (email, password) VALUES (?, ?)", (email, hashed)
        )
        conn.commit()
        user_id = conn.execute(
            "SELECT id FROM users WHERE email = ?", (email,)
        ).fetchone()["id"]
        conn.close()
        return jsonify({"message": "Account created.", "user_id": user_id, "email": email}), 201
    except Exception as e:
        if "UNIQUE" in str(e):
            return jsonify({"error": "Email already registered."}), 409
        return jsonify({"error": str(e)}), 500


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    hashed = _hash_password(password)

    conn = get_connection()
    user = conn.execute(
        "SELECT id, email FROM users WHERE email = ? AND password = ?",
        (email, hashed),
    ).fetchone()
    conn.close()

    if not user:
        return jsonify({"error": "Invalid email or password."}), 401

    return jsonify({"message": "Login successful.", "user_id": user["id"], "email": user["email"]}), 200
