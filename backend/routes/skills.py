"""
Skills + ML prediction routes.
POST /skills              – save user skill selection
GET  /skills/<id>         – get user skills
GET  /dept-skills/<dept>  – get all skills for a department
GET  /departments         – list departments (no General)
GET  /skill-trends/<dept> – trend data for all skills in a department
POST /predict             – run full ML analysis
GET  /dashboard/<id>      – return cached analysis result
"""

import json
import sys
import os
from flask import Blueprint, request, jsonify
from models.db import get_connection

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "ml_model"))
from predictor import (
    analyze_skill_gap,
    get_department_skills,
    get_departments,
    get_metadata,
    get_skill_trends,
)

skills_bp = Blueprint("skills", __name__)


@skills_bp.route("/departments", methods=["GET"])
def list_departments():
    """Return all valid departments — General is excluded."""
    return jsonify({"departments": get_departments()}), 200


@skills_bp.route("/dept-skills/<department>", methods=["GET"])
def department_skills(department):
    """Return all skills available in a department."""
    skills = get_department_skills(department)
    return jsonify({"department": department, "skills": skills}), 200


@skills_bp.route("/skill-trends/<department>", methods=["GET"])
def skill_trends(department):
    """Return 2021-2025 trend data for ALL skills in the given department."""
    if not department:
        return jsonify({"error": "department required."}), 400
    data = get_skill_trends(department)
    return jsonify(data), 200


@skills_bp.route("/skills", methods=["POST"])
def save_skills():
    data    = request.get_json()
    user_id = data.get("user_id")
    skills  = data.get("skills", [])
    dept    = data.get("department", "")

    if not user_id:
        return jsonify({"error": "user_id required."}), 400

    # Only save skills that belong to the given department
    dept_skills   = get_department_skills(dept) if dept else []
    valid_skills  = [s for s in skills if s in dept_skills] if dept_skills else skills

    conn = get_connection()
    conn.execute("DELETE FROM user_skills WHERE user_id = ?", (user_id,))
    for skill in valid_skills:
        conn.execute(
            "INSERT INTO user_skills (user_id, skill, department) VALUES (?, ?, ?)",
            (user_id, skill, dept)
        )
    conn.commit()
    conn.close()
    return jsonify({"message": f"{len(valid_skills)} skills saved."}), 200


@skills_bp.route("/skills/<int:user_id>", methods=["GET"])
def get_user_skills(user_id):
    conn = get_connection()
    rows = conn.execute(
        "SELECT skill FROM user_skills WHERE user_id = ?", (user_id,)
    ).fetchall()
    conn.close()
    return jsonify({"skills": [r["skill"] for r in rows]}), 200


@skills_bp.route("/predict", methods=["POST"])
def predict():
    """Run full ML skill-gap analysis for the given department and cache result."""
    data       = request.get_json()
    user_id    = data.get("user_id")
    department = data.get("department")
    skills     = data.get("skills", [])

    if not user_id or not department:
        return jsonify({"error": "user_id and department required."}), 400

    if department == "General":
        return jsonify({"error": "General department is not supported."}), 400

    result = analyze_skill_gap(skills, department)

    # Cache in DB — store all fields including new ones needed by dashboard
    conn     = get_connection()
    existing = conn.execute(
        "SELECT id FROM analysis_results WHERE user_id = ?", (user_id,)
    ).fetchone()

    payload = (
        result["skill_score"],
        result["level"],
        json.dumps(result["demand_breakdown"]),
        json.dumps(result["recommendations"]),
        json.dumps(result["roadmap"]),
        json.dumps(result["radar_data"]),
        json.dumps(result.get("trend_data", {})),
        result["total_dept_skills"],
        result["missing_skills_count"],
        json.dumps(result.get("student_skills", [])),
        user_id,
    )

    if existing:
        conn.execute(
            """UPDATE analysis_results
               SET skill_score=?, level=?, demand_breakdown=?,
                   recommendations=?, roadmap=?, radar_data=?,
                   trend_data=?, total_dept_skills=?, missing_skills_count=?,
                   student_skills=?, updated_at=CURRENT_TIMESTAMP
               WHERE user_id=?""",
            payload,
        )
    else:
        conn.execute(
            """INSERT INTO analysis_results
               (skill_score, level, demand_breakdown, recommendations,
                roadmap, radar_data, trend_data, total_dept_skills,
                missing_skills_count, student_skills, user_id)
               VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
            payload,
        )
    conn.commit()
    conn.close()

    return jsonify(result), 200


@skills_bp.route("/dashboard/<int:user_id>", methods=["GET"])
def get_dashboard(user_id):
    """Return cached analysis for dashboard rendering — all fields required by frontend."""
    conn     = get_connection()
    analysis = conn.execute(
        "SELECT * FROM analysis_results WHERE user_id = ?", (user_id,)
    ).fetchone()
    profile = conn.execute(
        "SELECT * FROM profiles WHERE user_id = ?", (user_id,)
    ).fetchone()
    skills = conn.execute(
        "SELECT skill FROM user_skills WHERE user_id = ?", (user_id,)
    ).fetchall()
    conn.close()

    if not analysis:
        return jsonify({"error": "No analysis found. Please complete skill assessment."}), 404

    skill_list = [r["skill"] for r in skills]

    return jsonify({
        # Profile info
        "profile":              dict(profile) if profile else {},

        # Skill lists
        "skills":               skill_list,
        "student_skills":       json.loads(analysis["student_skills"])
                                if analysis["student_skills"] else [],

        # Scores & levels
        "skill_score":          analysis["skill_score"],
        "level":                analysis["level"],

        # Counts — needed by stat cards in dashboard
        "total_dept_skills":    analysis["total_dept_skills"]
                                if analysis["total_dept_skills"] else 0,
        "student_skill_count":  len(skill_list),
        "missing_skills_count": analysis["missing_skills_count"]
                                if analysis["missing_skills_count"] else 0,

        # Charts & analysis
        "demand_breakdown":     json.loads(analysis["demand_breakdown"]),
        "recommendations":      json.loads(analysis["recommendations"]),
        "roadmap":              json.loads(analysis["roadmap"]),
        "radar_data":           json.loads(analysis["radar_data"]),
        "trend_data":           json.loads(analysis["trend_data"])
                                if analysis["trend_data"] else {},
    }), 200
