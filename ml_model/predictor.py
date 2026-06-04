"""
Predictor utility: loads saved model artifacts and exposes predict() for Flask routes.
Updated: removed General dept, added trend data per dept, dept-aware radar categories.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd

BASE_DIR      = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH    = os.path.join(BASE_DIR, "skill_model.pkl")
ENCODERS_PATH = os.path.join(BASE_DIR, "encoders.pkl")
METADATA_PATH = os.path.join(BASE_DIR, "model_metadata.json")
DATASET_PATH  = os.path.join(BASE_DIR, "skill_dataset.csv")

# ── Lazy singletons ────────────────────────────────────────────────────────────
_clf = _encoders = _metadata = _df = None

def _load():
    global _clf, _encoders, _metadata, _df
    if _clf is None:
        _clf      = joblib.load(MODEL_PATH)
        _encoders = joblib.load(ENCODERS_PATH)
        with open(METADATA_PATH) as f:
            _metadata = json.load(f)
        _df = pd.read_csv(DATASET_PATH)

# ── Skill trend data (2021-2025) ───────────────────────────────────────────────
SKILL_TRENDS = {
    # Computer Science
    "Python":               {"v": [72,78,83,88,95], "dir": "rising"},
    "Machine Learning":     {"v": [60,70,79,87,93], "dir": "rising"},
    "Deep Learning":        {"v": [55,65,74,82,90], "dir": "rising"},
    "TensorFlow":           {"v": [62,70,76,82,87], "dir": "rising"},
    "PyTorch":              {"v": [48,58,68,78,87], "dir": "rising"},
    "Natural Language Processing": {"v": [50,62,73,83,92], "dir": "rising"},
    "Computer Vision":      {"v": [45,57,68,78,88], "dir": "rising"},
    "Cybersecurity":        {"v": [65,70,76,83,90], "dir": "rising"},
    "Docker":               {"v": [55,63,70,77,83], "dir": "rising"},
    "Kubernetes":           {"v": [40,52,63,72,82], "dir": "rising"},
    "AWS":                  {"v": [65,70,76,82,88], "dir": "rising"},
    "Azure":                {"v": [55,62,70,77,84], "dir": "rising"},
    "React.js":             {"v": [68,73,77,80,83], "dir": "rising"},
    "TypeScript":           {"v": [45,55,65,74,82], "dir": "rising"},
    "Data Analysis":        {"v": [70,73,76,79,82], "dir": "rising"},
    "SQL":                  {"v": [80,80,82,82,83], "dir": "stable"},
    "JavaScript":           {"v": [85,85,84,83,82], "dir": "stable"},
    "Git":                  {"v": [78,80,82,83,84], "dir": "stable"},
    "MongoDB":              {"v": [60,65,70,74,78], "dir": "rising"},
    "Blockchain":           {"v": [40,65,60,50,45], "dir": "falling"},
    "PHP":                  {"v": [65,58,52,46,40], "dir": "falling"},
    "C++":                  {"v": [60,56,52,48,45], "dir": "falling"},
    "C":                    {"v": [55,50,46,42,38], "dir": "falling"},
    # Finance
    "Financial Modeling":   {"v": [70,73,77,81,85], "dir": "rising"},
    "Risk Analysis":        {"v": [68,72,76,80,84], "dir": "rising"},
    "Investment Banking":   {"v": [65,67,69,71,73], "dir": "stable"},
    "Data Analytics":       {"v": [60,67,74,81,87], "dir": "rising"},
    "Excel Advanced":       {"v": [80,78,76,74,72], "dir": "falling"},
    "Python for Finance":   {"v": [40,52,64,75,85], "dir": "rising"},
    "Valuation":            {"v": [65,67,69,71,73], "dir": "stable"},
    "Accounting":           {"v": [75,73,71,69,68], "dir": "falling"},
    "Bloomberg Terminal":   {"v": [60,62,64,65,66], "dir": "stable"},
    "CFA Knowledge":        {"v": [58,61,64,67,70], "dir": "rising"},
    # Electronics
    "VLSI Design":          {"v": [55,60,66,73,80], "dir": "rising"},
    "Embedded Systems":     {"v": [60,64,68,73,78], "dir": "rising"},
    "FPGA Programming":     {"v": [50,56,63,70,78], "dir": "rising"},
    "Signal Processing":    {"v": [58,61,64,67,70], "dir": "rising"},
    "Circuit Design":       {"v": [62,63,64,65,66], "dir": "stable"},
    "Verilog":              {"v": [55,58,61,64,67], "dir": "rising"},
    "PCB Design":           {"v": [60,61,62,63,64], "dir": "stable"},
    "MATLAB":               {"v": [65,64,63,62,61], "dir": "falling"},
    # Mechanical
    "Robotics":             {"v": [50,58,66,75,84], "dir": "rising"},
    "3D Printing":          {"v": [45,54,63,71,79], "dir": "rising"},
    "CAD Design":           {"v": [68,68,69,69,70], "dir": "stable"},
    "ANSYS":                {"v": [60,61,62,63,64], "dir": "stable"},
    "AutoCAD":              {"v": [72,68,64,60,57], "dir": "falling"},
    "Fluid Mechanics":      {"v": [65,64,63,62,61], "dir": "falling"},
    "Thermodynamics":       {"v": [65,64,63,62,61], "dir": "falling"},
    # MBA
    "Product Management":   {"v": [60,67,74,82,90], "dir": "rising"},
    "Digital Marketing":    {"v": [65,70,76,82,88], "dir": "rising"},
    "Business Analytics":   {"v": [58,65,72,79,86], "dir": "rising"},
    "HR Analytics":         {"v": [45,52,60,68,75], "dir": "rising"},
    "Supply Chain Management": {"v": [62,66,70,74,78], "dir": "rising"},
    "Entrepreneurship":     {"v": [55,59,63,67,72], "dir": "rising"},
    "Market Research":      {"v": [60,62,64,66,68], "dir": "stable"},
    "Leadership":           {"v": [72,72,73,73,74], "dir": "stable"},
    "Operations Management":{"v": [65,65,66,66,67], "dir": "stable"},
    "Strategic Planning":   {"v": [63,64,65,66,67], "dir": "stable"},
    # Biotechnology
    "Bioinformatics":       {"v": [45,55,66,77,87], "dir": "rising"},
    "Genomics":             {"v": [40,52,64,75,85], "dir": "rising"},
    "CRISPR":               {"v": [30,42,55,68,82], "dir": "rising"},
    "Drug Discovery":       {"v": [50,57,64,71,78], "dir": "rising"},
    "Clinical Research":    {"v": [58,62,66,70,74], "dir": "rising"},
    "Molecular Biology":    {"v": [62,63,64,65,66], "dir": "stable"},
    "Data Science in Healthcare": {"v": [42,53,65,76,86], "dir": "rising"},
    "Microbiology":         {"v": [60,60,61,61,62], "dir": "stable"},
}

TREND_YEARS = ["2021", "2022", "2023", "2024", "2025"]


def get_metadata():
    _load()
    return _metadata


def get_department_skills(department: str):
    """Return all skills for a given department. General dept is excluded."""
    _load()
    dept_skills = _metadata["dept_skills"]
    return dept_skills.get(department, [])


def get_departments():
    """Return list of valid departments (excludes General)."""
    _load()
    return [d for d in _metadata["departments"] if d != "General"]


def get_skill_trends(department: str) -> dict:
    """
    Return trend data for ALL skills in a department.
    Used by /skill-trends/<dept> endpoint.
    """
    dept_skills = get_department_skills(department)
    trend_skills = [s for s in dept_skills if s in SKILL_TRENDS]

    chart_data = []
    for i, yr in enumerate(TREND_YEARS):
        pt = {"year": yr}
        for s in trend_skills:
            pt[s] = SKILL_TRENDS[s]["v"][i]
        chart_data.append(pt)

    legend = [
        {"skill": s, "dir": SKILL_TRENDS[s]["dir"]}
        for s in trend_skills
    ]
    return {"chart_data": chart_data, "skills": trend_skills, "legend": legend}


def predict_skill_demand(skill: str, department: str) -> dict:
    """Predict demand level for a (skill, department) pair."""
    _load()

    row = _df[(_df["skill"] == skill) & (_df["department"] == department)]
    if row.empty:
        row = _df[_df["skill"] == skill]
    if row.empty:
        return {"demand_level": "Unknown", "confidence": 0.0, "skill": skill}

    row = row.iloc[0]
    dept_enc   = _encoders["department"].transform([row["department"]])[0]
    sector_enc = _encoders["sector"].transform([row["sector"]])[0]

    features = np.array([[
        dept_enc, sector_enc,
        row["job_frequency"], row["trend_score"], row["growth_rate"],
        row["average_salary_score"], row["emerging_role"], row["required_experience"],
    ]])

    pred_enc   = _clf.predict(features)[0]
    proba      = _clf.predict_proba(features)[0]
    demand_lvl = _encoders["demand_level"].inverse_transform([pred_enc])[0]
    confidence = round(float(np.max(proba)) * 100, 2)

    return {
        "skill": skill,
        "demand_level": demand_lvl,
        "confidence": confidence,
        "trend_score": int(row["trend_score"]),
        "growth_rate": int(row["growth_rate"]),
        "average_salary_score": int(row["average_salary_score"]),
        "emerging_role": bool(row["emerging_role"]),
        "required_experience": int(row["required_experience"]),
    }


def analyze_skill_gap(student_skills: list, department: str) -> dict:
    """
    Full skill-gap analysis scoped strictly to the given department.
    student_skills must all belong to that department — unrelated skills are ignored.
    """
    _load()

    # ── Strict dept filtering ──────────────────────────────────────────────────
    all_dept_skills   = get_department_skills(department)
    # Only count skills that actually belong to this department
    valid_student_skills = [s for s in student_skills if s in all_dept_skills]
    total_dept_skills    = len(all_dept_skills)

    # Predict demand for each valid student skill
    student_skill_details = [
        predict_skill_demand(s, department) for s in valid_student_skills
    ]

    # Skill score
    skill_score = round((len(valid_student_skills) / max(total_dept_skills, 1)) * 100, 2)
    if skill_score > 100:
        skill_score = 100.0

    level = "Beginner" if skill_score <= 40 else ("Intermediate" if skill_score <= 70 else "Advanced")

    # Missing skills (from THIS department only)
    missing_raw = [s for s in all_dept_skills if s not in valid_student_skills]
    missing_with_details = []
    for skill in missing_raw:
        row = _df[(_df["skill"] == skill) & (_df["department"] == department)]
        if row.empty:
            row = _df[_df["skill"] == skill]
        if not row.empty:
            r = row.iloc[0]
            missing_with_details.append({
                "skill": skill,
                "demand_level": r["demand_level"],
                "trend_score": int(r["trend_score"]),
                "growth_rate": int(r["growth_rate"]),
                "priority": 3 if r["demand_level"] == "High" else (2 if r["demand_level"] == "Medium" else 1),
            })

    missing_with_details.sort(key=lambda x: (x["priority"], x["trend_score"]), reverse=True)
    recommendations = missing_with_details[:10]

    # Demand breakdown
    demand_breakdown = {"High": 0, "Medium": 0, "Low": 0, "Unknown": 0}
    for s in student_skill_details:
        demand_breakdown[s.get("demand_level", "Unknown")] += 1

    # Radar data (dept-aware)
    radar_data = _build_radar_data(valid_student_skills, all_dept_skills, department)

    # Roadmap
    roadmap = _build_roadmap(recommendations, department)

    # Trend data for ALL dept skills
    trend_info = get_skill_trends(department)

    return {
        "skill_score":          skill_score,
        "level":                level,
        "total_dept_skills":    total_dept_skills,
        "student_skill_count":  len(valid_student_skills),
        "student_skills":       student_skill_details,
        "missing_skills_count": len(missing_raw),
        "demand_breakdown":     demand_breakdown,
        "recommendations":      recommendations,
        "roadmap":              roadmap,
        "radar_data":           radar_data,
        "trend_data":           trend_info,         # ← NEW: full dept trend for dashboard
    }


def _build_radar_data(student_skills, all_skills, department):
    """Dept-aware radar chart — categories adapt to the department."""
    _load()

    # Build dept-specific categories
    categories = {}

    if department == "Computer Science":
        categories = {
            "Core Programming": ["Python","Java","JavaScript","TypeScript","C++","C","PHP"],
            "ML / AI":          ["Machine Learning","Deep Learning","TensorFlow","PyTorch",
                                 "Natural Language Processing","Computer Vision"],
            "Web / Cloud":      ["React.js","Node.js","Docker","Kubernetes","AWS","Azure",
                                 "REST API","GraphQL"],
            "Data":             ["SQL","MongoDB","PostgreSQL","Data Analysis","Data Visualization",
                                 "Power BI","Tableau","Redis"],
            "Security":         ["Cybersecurity","Blockchain"],
            "Frameworks":       ["Flask","Django"],
        }
    elif department == "Finance":
        categories = {
            "Modeling":         ["Financial Modeling","Valuation","Risk Analysis"],
            "Analytics":        ["Data Analytics","Python for Finance","Excel Advanced"],
            "Banking":          ["Investment Banking","CFA Knowledge","Bloomberg Terminal",
                                 "Forex Trading"],
            "Accounting":       ["Accounting","Taxation","Auditing","Financial Reporting"],
            "ERP":              ["SAP Finance"],
        }
    elif department == "Electronics":
        categories = {
            "Design":           ["Circuit Design","PCB Design","VLSI Design"],
            "Programming":      ["Verilog","FPGA Programming","Embedded Systems"],
            "Tools":            ["MATLAB","AutoCAD"],
            "Signal":           ["Signal Processing"],
            "Industrial":       ["PLC Programming"],
        }
    elif department == "Mechanical":
        categories = {
            "CAD Tools":        ["CAD Design","AutoCAD","ANSYS","3D Printing"],
            "Robotics":         ["Robotics"],
            "Fundamentals":     ["Thermodynamics","Fluid Mechanics"],
        }
    elif department == "MBA":
        categories = {
            "Strategy":         ["Product Management","Strategic Planning","Entrepreneurship"],
            "Marketing":        ["Digital Marketing","Market Research","CRM Tools"],
            "Analytics":        ["Business Analytics","HR Analytics"],
            "Operations":       ["Supply Chain Management","Operations Management","ERP Systems"],
            "Leadership":       ["Leadership"],
            "Agile":            ["Agile/Scrum","Project Management"],
        }
    elif department == "Biotechnology":
        categories = {
            "Genomics":         ["Genomics","CRISPR","Bioinformatics"],
            "Research":         ["Clinical Research","Drug Discovery","Molecular Biology"],
            "Lab Skills":       ["Microbiology","Cell Culture","PCR Techniques"],
            "Data Science":     ["Data Science in Healthcare"],
        }
    else:
        # Generic fallback
        categories = {"All Skills": list(all_skills)}

    radar = []
    for cat, skills_list in categories.items():
        dept_in_cat    = [s for s in skills_list if s in all_skills]
        student_in_cat = [s for s in skills_list if s in student_skills]
        total          = max(len(dept_in_cat), 1)
        score          = round((len(student_in_cat) / total) * 100, 1)
        radar.append({"category": cat, "score": min(score, 100), "fullMark": 100})

    return radar


def _build_roadmap(recommendations, department):
    """Build a 3-phase learning roadmap from recommendations."""
    high   = [r for r in recommendations if r["demand_level"] == "High"][:3]
    medium = [r for r in recommendations if r["demand_level"] == "Medium"][:3]
    low    = [r for r in recommendations if r["demand_level"] == "Low"][:2]

    roadmap = []
    if high:
        roadmap.append({
            "phase": 1, "title": "Foundation & High-Demand Skills",
            "duration": "1-2 Months",
            "skills": [r["skill"] for r in high],
            "description": "Start with the most in-demand skills to maximize employability.",
            "color": "#ef4444",
        })
    if medium:
        roadmap.append({
            "phase": 2, "title": "Intermediate Skill Building",
            "duration": "2-3 Months",
            "skills": [r["skill"] for r in medium],
            "description": "Build complementary skills to round out your profile.",
            "color": "#f59e0b",
        })
    remaining = low or (recommendations[:2] if not high and not medium else [])
    if remaining:
        roadmap.append({
            "phase": 3, "title": "Advanced & Niche Skills",
            "duration": "3-6 Months",
            "skills": [r["skill"] for r in remaining],
            "description": "Differentiate yourself with specialized expertise.",
            "color": "#10b981",
        })

    return roadmap
