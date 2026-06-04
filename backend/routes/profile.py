"""
Profile routes: POST /profile  GET /profile/<user_id>
Updated: graduation_year validated to range 2022-2029.
"""

from flask import Blueprint, request, jsonify
from models.db import get_connection

profile_bp = Blueprint("profile", __name__)

VALID_GRAD_YEARS = list(range(2022, 2030))  # 2022 to 2029


@profile_bp.route("/profile", methods=["POST"])
def save_profile():
    data = request.get_json()
    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id required."}), 400

    full_name       = data.get("full_name", "")
    college         = data.get("college", "")
    department      = data.get("department", "")
    graduation_year = data.get("graduation_year")
    gmail           = data.get("gmail", "")

    # Validate graduation year
    if graduation_year is not None:
        try:
            graduation_year = int(graduation_year)
            if graduation_year not in VALID_GRAD_YEARS:
                return jsonify({
                    "error": f"Graduation year must be between 2022 and 2029."
                }), 400
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid graduation year."}), 400

    # Build initials for avatar
    parts    = full_name.strip().split()
    initials = "".join(p[0].upper() for p in parts[:2]) if parts else "U"

    conn     = get_connection()
    existing = conn.execute(
        "SELECT id FROM profiles WHERE user_id = ?", (user_id,)
    ).fetchone()

    if existing:
        conn.execute(
            """UPDATE profiles SET full_name=?, college=?, department=?,
               graduation_year=?, avatar_initials=?, gmail=? WHERE user_id=?""",
            (full_name, college, department, graduation_year, initials, gmail, user_id),
        )
    else:
        conn.execute(
            """INSERT INTO profiles (user_id, full_name, college, department,
               graduation_year, avatar_initials, gmail) VALUES (?,?,?,?,?,?,?)""",
            (user_id, full_name, college, department, graduation_year, initials, gmail),
        )

    conn.commit()
    conn.close()
    return jsonify({"message": "Profile saved.", "avatar_initials": initials}), 200


@profile_bp.route("/profile/<int:user_id>", methods=["GET"])
def get_profile(user_id):
    conn = get_connection()
    row  = conn.execute(
        "SELECT * FROM profiles WHERE user_id = ?", (user_id,)
    ).fetchone()
    conn.close()

    if not row:
        return jsonify({"profile": None}), 200

    return jsonify({"profile": dict(row)}), 200
