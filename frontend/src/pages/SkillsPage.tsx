/**
 * SkillsPage.tsx — Multi-select skill picker.
 * Sends selected skills + department to /predict and stores result.
 */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDepartmentSkills, saveSkills, runPrediction } from "../utils/api";
import Sidebar from "../components/Sidebar";
import StepBar from "../components/StepBar";
import { runClientML } from "../utils/mlFallback";

const SkillsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const profile: any = (() => {
    try { return JSON.parse(localStorage.getItem("sg_profile") || "{}"); } catch { return {}; }
  })();

  const [skills,   setSkills]   = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("sg_skills") || "[]"); } catch { return []; }
  });
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(true);

  const dept = profile.department || "Computer Science";

  /* Fetch department skills from backend (or use fallback) */
  useEffect(() => {
    const fetch = async () => {
      setFetching(true);
      try {
        const list = await getDepartmentSkills(dept);
        setSkills(list);
      } catch {
        // Inline fallback dataset
        const FALLBACK: Record<string, string[]> = {
          "Computer Science": ["Python","Machine Learning","Deep Learning","Data Analysis","SQL","TensorFlow","PyTorch","Natural Language Processing","Computer Vision","React.js","Node.js","JavaScript","TypeScript","Docker","Kubernetes","AWS","Azure","Git","REST API","GraphQL","MongoDB","PostgreSQL","Redis","Flask","Django","Cybersecurity","Blockchain","IoT","Data Visualization","Power BI","Tableau","Java","C++","C","HTML/CSS","PHP"],
          "Finance": ["Financial Modeling","Risk Analysis","Investment Banking","Data Analytics","Excel Advanced","Python for Finance","Valuation","Accounting","Taxation","Auditing","Bloomberg Terminal","CFA Knowledge","Forex Trading","Financial Reporting","SAP Finance"],
          "Electronics": ["Circuit Design","VLSI Design","Embedded Systems","PCB Design","MATLAB","Verilog","FPGA Programming","Signal Processing","PLC Programming","AutoCAD"],
          "Mechanical": ["ANSYS","CAD Design","Thermodynamics","Fluid Mechanics","Robotics","3D Printing","AutoCAD"],
          "MBA": ["Digital Marketing","Product Management","Business Analytics","Supply Chain Management","HR Analytics","Operations Management","Entrepreneurship","Leadership","Strategic Planning","Market Research","CRM Tools","ERP Systems"],
          "Biotechnology": ["Clinical Research","Bioinformatics","Genomics","Drug Discovery","Molecular Biology","Microbiology","Cell Culture","PCR Techniques","CRISPR","Data Science in Healthcare"],
          "General": ["Communication Skills","Problem Solving","Teamwork","Project Management","Agile/Scrum","Critical Thinking"],
        };
        setSkills(FALLBACK[dept] || FALLBACK["General"]);
      } finally { setFetching(false); }
    };
    fetch();
  }, [dept]);

  const toggle = (s: string) =>
    setSelected((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const handleAnalyze = async () => {
    if (selected.length === 0) return;
    setLoading(true);
    try {
      await saveSkills(user!.user_id, selected).catch(() => {});
      let result;
      try {
        result = await runPrediction(user!.user_id, dept, selected);
      } catch {
        result = runClientML(selected, dept, skills);
      }
      localStorage.setItem("sg_skills", JSON.stringify(selected));
      localStorage.setItem("sg_analysis", JSON.stringify(result));
      navigate("/dashboard");
    } finally { setLoading(false); }
  };

  const pct = Math.round((selected.length / Math.max(skills.length, 1)) * 100);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content fade-in">
        <div className="page-header">
          <h1 className="page-title">🎯 Skill Selection</h1>
          <p className="page-subtitle">
            Select skills you already know in <strong>{dept}</strong>
          </p>
        </div>

        <StepBar current={1} />

        {fetching ? (
          <div className="loading-overlay">
            <span className="spinner" />
            Loading skills…
          </div>
        ) : (
          <>
            <div className="card" style={{ marginBottom: 20 }}>
              {/* Header row */}
              <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
                <div>
                  <div className="card-title">🧠 Available Skills ({skills.length})</div>
                  <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>
                    {selected.length} selected ({pct}% coverage)
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-outline btn-sm" onClick={() => setSelected(skills)}>
                    Select All
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => setSelected([])}>
                    Clear
                  </button>
                </div>
              </div>

              {/* Progress */}
              <div className="progress-bar" style={{ marginBottom: 18 }}>
                <div
                  className="progress-fill"
                  style={{
                    width: `${pct}%`,
                    background: "linear-gradient(90deg, var(--accent), var(--accent2))",
                  }}
                />
              </div>

              {/* Skill chips */}
              <div className="skills-grid">
                {skills.map((s) => (
                  <div
                    key={s}
                    className={`skill-chip ${selected.includes(s) ? "selected" : ""}`}
                    onClick={() => toggle(s)}
                  >
                    <span className="skill-check">{selected.includes(s) ? "✓" : "○"}</span>
                    {s}
                  </div>
                ))}
              </div>
            </div>

            {/* Action row */}
            <div className="flex gap-3 items-center">
              <button
                className="btn btn-green"
                disabled={selected.length === 0 || loading}
                onClick={handleAnalyze}
                style={{ minWidth: 220 }}
              >
                {loading ? <span className="spinner" /> : "🔍"}
                {loading ? " Analyzing…" : ` Analyze My Skills (${selected.length})`}
              </button>
              {selected.length === 0 && (
                <span style={{ fontSize: 13, color: "var(--text2)" }}>
                  Select at least one skill to continue
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SkillsPage;
