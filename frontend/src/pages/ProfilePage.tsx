/**
 * ProfilePage.tsx — Collects user profile: name, college, department, graduation year.
 * Saves to Flask /profile and localStorage.
 */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { saveProfile } from "../utils/api";
import Sidebar from "../components/Sidebar";
import StepBar from "../components/StepBar";

const DEPARTMENTS = [
  { key: "Computer Science", icon: "💻" },
  { key: "Finance",          icon: "💰" },
  { key: "Electronics",      icon: "⚡" },
  { key: "Mechanical",       icon: "⚙️" },
  { key: "MBA",              icon: "📈" },
  { key: "Biotechnology",    icon: "🧬" },
  { key: "General",          icon: "🌐" },
];

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const stored = (() => {
    try { return JSON.parse(localStorage.getItem("sg_profile") || "{}"); } catch { return {}; }
  })();

  const [fullName,       setFullName]       = useState<string>(stored.full_name       || "");
  const [college,        setCollege]        = useState<string>(stored.college         || "");
  const [department,     setDepartment]     = useState<string>(stored.department      || "");
  const [graduationYear, setGraduationYear] = useState<string>(String(stored.graduation_year || ""));
  const [loading,        setLoading]        = useState(false);
  const [saved,          setSaved]          = useState(false);

  const handleSave = async () => {
    if (!fullName.trim() || !department) return;
    setLoading(true);

    const initials = fullName.trim().split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2) || "U";
    const profilePayload = {
      user_id:         user!.user_id,
      full_name:       fullName.trim(),
      college:         college.trim(),
      department,
      graduation_year: parseInt(graduationYear) || new Date().getFullYear(),
      avatar_initials: initials,
    };

    try { await saveProfile(profilePayload); } catch (_) { /* offline fallback */ }
    localStorage.setItem("sg_profile", JSON.stringify(profilePayload));
    setSaved(true);
    setTimeout(() => navigate("/skills"), 900);
    setLoading(false);
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content fade-in">
        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">👤 Your Profile</h1>
          <p className="page-subtitle">Tell us about yourself to personalize your analysis</p>
        </div>

        <StepBar current={0} />

        {saved && <div className="alert alert-success">✅ Profile saved! Redirecting…</div>}

        <div className="card" style={{ maxWidth: 680 }}>
          <div className="card-header">
            <h2 className="card-title">📋 Personal Information</h2>
          </div>

          {/* Name + College row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="form-group" style={{ gridColumn: "span 2" }}>
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Priya Sharma"
              />
            </div>
            <div className="form-group">
              <label className="form-label">College / University</label>
              <input
                className="form-input"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="e.g. IIT Hyderabad"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Graduation Year</label>
              <input
                className="form-input"
                type="number"
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
                placeholder="2025"
                min={2020}
                max={2030}
              />
            </div>
          </div>

          {/* Department selector */}
          <div className="form-group">
            <label className="form-label" style={{ marginBottom: 12 }}>
              Department / Stream
            </label>
            <div className="dept-grid">
              {DEPARTMENTS.map((d) => (
                <div
                  key={d.key}
                  className={`dept-card ${department === d.key ? "selected" : ""}`}
                  onClick={() => setDepartment(d.key)}
                >
                  <div className="dept-icon">{d.icon}</div>
                  <div className="dept-name">{d.key}</div>
                </div>
              ))}
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={loading || !fullName.trim() || !department}
            style={{ maxWidth: 220 }}
          >
            {loading ? <span className="spinner" /> : null}
            {loading ? " Saving…" : "Save & Continue →"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
