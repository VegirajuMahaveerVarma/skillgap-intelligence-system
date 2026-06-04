/**
 * DashboardPage.tsx — Full analytics dashboard.
 * Shows Skill Score, Radar Chart, Bar Chart, Recommendations, Roadmap.
 */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
  ResponsiveContainer, PieChart, Pie, Legend,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { getDashboard } from "../utils/api";
import Sidebar from "../components/Sidebar";
import type { DashboardData } from "../types";
import { runClientML } from "../utils/mlFallback";

// ── Sub-components ────────────────────────────────────────────────────────────

const DemandBadge: React.FC<{ level: string }> = ({ level }) => {
  const cls =
    level === "High"   ? "badge-high"   :
    level === "Medium" ? "badge-medium" : "badge-low";
  return <span className={`badge ${cls}`}>{level}</span>;
};

const ScoreRing: React.FC<{ score: number; level: string }> = ({ score, level }) => {
  const r = 70;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color =
    score <= 40 ? "#6366f1" :
    score <= 70 ? "#f59e0b" : "#10b981";
  const lvlCls =
    level === "Beginner"     ? "badge-beginner"     :
    level === "Intermediate" ? "badge-intermediate" : "badge-advanced";

  return (
    <div className="score-ring-wrap">
      <div className="score-ring">
        <svg width={160} height={160} viewBox="0 0 160 160">
          <circle className="score-ring-bg" cx={80} cy={80} r={r} />
          <circle
            className="score-ring-fill"
            cx={80} cy={80} r={r}
            stroke={color}
            strokeDasharray={circ}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="score-ring-label">
          <span className="score-ring-value" style={{ color }}>{score}%</span>
          <span className="score-ring-unit">Skill Score</span>
        </div>
      </div>
      <span className={`badge ${lvlCls}`} style={{ fontSize: 13, padding: "5px 18px" }}>
        {level}
      </span>
    </div>
  );
};

// ── Main Dashboard ────────────────────────────────────────────────────────────
const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [data,    setData]    = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const profile: any = (() => {
    try { return JSON.parse(localStorage.getItem("sg_profile") || "{}"); } catch { return {}; }
  })();
  const storedSkills: string[] = (() => {
    try { return JSON.parse(localStorage.getItem("sg_skills") || "[]"); } catch { return []; }
  })();

  useEffect(() => {
    const load = async () => {
      // 1. Try cached analysis
      const cached = localStorage.getItem("sg_analysis");
      if (cached) {
        const parsed = JSON.parse(cached);
        setData({ ...parsed, profile, skills: storedSkills });
        setLoading(false);
        return;
      }
      // 2. Try backend
      try {
        const res = await getDashboard(user!.user_id);
        setData(res);
        localStorage.setItem("sg_analysis", JSON.stringify(res));
      } catch {
        // 3. Client-side ML fallback
        if (storedSkills.length > 0 && profile.department) {
          const result = runClientML(storedSkills, profile.department);
          const full = { ...result, profile, skills: storedSkills };
          setData(full as any);
          localStorage.setItem("sg_analysis", JSON.stringify(result));
        }
      } finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <div className="main-content center">
          <div className="loading-overlay">
            <span className="spinner" />
            Loading your intelligence report…
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <div className="empty-state" style={{ marginTop: 80 }}>
            <div className="empty-icon">📊</div>
            <h3>No Analysis Found</h3>
            <p style={{ marginBottom: 20 }}>
              Complete your profile and skill selection to see your dashboard.
            </p>
            <button
              className="btn btn-primary"
              style={{ display: "inline-flex", width: "auto" }}
              onClick={() => navigate("/profile")}
            >
              Get Started →
            </button>
          </div>
        </div>
      </div>
    );
  }

  const {
    skill_score, level,
    demand_breakdown, recommendations,
    roadmap, radar_data,
    total_dept_skills, student_skill_count,
    missing_skills_count, student_skills,
  } = data;

  const barData = [
    { name: "High",   value: demand_breakdown.High   || 0, color: "#ef4444" },
    { name: "Medium", value: demand_breakdown.Medium || 0, color: "#f59e0b" },
    { name: "Low",    value: demand_breakdown.Low    || 0, color: "#6366f1" },
  ];

  const pieData = barData.filter((b) => b.value > 0);

  const statCards = [
    {
      icon: "📊", label: "Skill Score",    value: skill_score + "%", sub: level,
      iconBg: "rgba(99,102,241,0.15)",  iconClr: "#a5b4fc",
    },
    {
      icon: "✅", label: "Skills Known",   value: String(student_skill_count), sub: `of ${total_dept_skills} total`,
      iconBg: "rgba(16,185,129,0.15)",  iconClr: "#6ee7b7",
    },
    {
      icon: "🎯", label: "Skills to Learn", value: String(missing_skills_count), sub: "gap identified",
      iconBg: "rgba(245,158,11,0.15)", iconClr: "#fcd34d",
    },
    {
      icon: "🔥", label: "High Demand", value: String(demand_breakdown.High || 0), sub: "your skills",
      iconBg: "rgba(239,68,68,0.15)",  iconClr: "#fca5a5",
    },
  ];

  const fname = profile?.full_name?.split(" ")[0] || "there";
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content fade-in">
        {/* ── Page Header ── */}
        <div
          className="page-header flex items-center justify-between"
          style={{ flexWrap: "wrap", gap: 12 }}
        >
          <div>
            <h1 className="page-title">👋 Hey {fname}!</h1>
            <p className="page-subtitle">
              {profile?.department || "Your"} Skill Intelligence Report &nbsp;•&nbsp; {today}
            </p>
          </div>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => { localStorage.removeItem("sg_analysis"); navigate("/skills"); }}
          >
            🔄 Reanalyze
          </button>
        </div>

        {/* ── Stat Cards ── */}
        <div className="stats-grid">
          {statCards.map((s) => (
            <div key={s.label} className="stat-card">
              <div
                className="stat-icon"
                style={{ background: s.iconBg, color: s.iconClr }}
              >
                {s.icon}
              </div>
              <div className="stat-info">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
                <div
                  className="stat-badge"
                  style={{ background: s.iconBg, color: s.iconClr }}
                >
                  {s.sub}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main Grid ── */}
        <div className="dashboard-grid">

          {/* Score Ring */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">🎯 Overall Skill Score</h3>
            </div>
            <div className="center" style={{ padding: "8px 0 16px" }}>
              <ScoreRing score={skill_score} level={level} />
            </div>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
              {[
                ["Dept. Skills",  total_dept_skills],
                ["Your Skills",   student_skill_count],
                ["Missing Skills", missing_skills_count],
              ].map(([l, v]) => (
                <div key={String(l)} className="info-row">
                  <span style={{ color: "var(--text2)" }}>{l}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bar Chart */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">📈 Demand Analysis</h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#8892a8", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#8892a8", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    color: "var(--text)",
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {barData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-3 justify-center" style={{ marginTop: 8 }}>
              {barData.map((b) => (
                <div
                  key={b.name}
                  className="flex items-center gap-1"
                  style={{ fontSize: 12, color: "var(--text2)" }}
                >
                  <div
                    style={{
                      width: 8, height: 8,
                      borderRadius: "50%",
                      background: b.color,
                      flexShrink: 0,
                    }}
                  />
                  {b.name} ({b.value})
                </div>
              ))}
            </div>
          </div>

          {/* Radar Chart */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">🕸️ Skill Radar</h3>
              <span style={{ fontSize: 12, color: "var(--text2)" }}>Category coverage</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radar_data}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{ fill: "#8892a8", fontSize: 11 }}
                />
                <Radar
                  name="Your Score"
                  dataKey="score"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.25}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Recommendations */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">💡 Top Recommendations</h3>
              <span className="badge badge-high">{recommendations.length} skills</span>
            </div>
            {recommendations.length === 0 ? (
              <div className="empty-state" style={{ padding: 24 }}>
                <div className="empty-icon">🏆</div>
                <p>Amazing! You've covered all department skills.</p>
              </div>
            ) : (
              <div style={{ maxHeight: 300, overflowY: "auto" }}>
                {recommendations.slice(0, 8).map((r) => (
                  <div key={r.skill} className="rec-item">
                    <div>
                      <div className="rec-name">{r.skill}</div>
                      <div className="rec-meta">
                        Trend: {r.trend_score ?? "–"} &nbsp;•&nbsp; Growth: {r.growth_rate ?? "–"}
                      </div>
                    </div>
                    <DemandBadge level={r.demand_level} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Roadmap — spans 2 columns */}
          <div className="card span-2">
            <div className="card-header">
              <h3 className="card-title">🗺️ Learning Roadmap</h3>
              <span style={{ fontSize: 12, color: "var(--text2)" }}>
                Personalized path to fill your skill gap
              </span>
            </div>
            {roadmap.length === 0 ? (
              <div className="empty-state" style={{ padding: 24 }}>
                <div className="empty-icon">🎉</div>
                <p>No roadmap needed — you're highly skilled!</p>
              </div>
            ) : (
              <div style={{ padding: "8px 0" }}>
                {roadmap.map((phase) => (
                  <div key={phase.phase} className="roadmap-phase">
                    <div
                      className="phase-dot"
                      style={{ background: phase.color }}
                    >
                      {phase.phase}
                    </div>
                    <div className="phase-content">
                      <div className="phase-title">{phase.title}</div>
                      <div
                        className="phase-duration"
                        style={{ color: phase.color }}
                      >
                        ⏱ {phase.duration}
                      </div>
                      <p
                        style={{
                          fontSize: 13,
                          color: "var(--text2)",
                          margin: "6px 0 10px",
                        }}
                      >
                        {phase.description}
                      </p>
                      <div className="phase-skills">
                        {phase.skills.map((s) => (
                          <span key={s} className="phase-skill">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current Skills */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">✅ Your Current Skills</h3>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => navigate("/skills")}
              >
                Edit
              </button>
            </div>
            <div className="flex wrap gap-2">
              {(storedSkills.length > 0 ? storedSkills : (student_skills || []).map((s) => s.skill)).map(
                (s: string) => (
                  <span
                    key={s}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 20,
                      background: "rgba(99,102,241,0.12)",
                      color: "#a5b4fc",
                      border: "1px solid rgba(99,102,241,0.25)",
                      fontSize: 12,
                    }}
                  >
                    {s}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Skill Demand Detail */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">🔍 Skill Demand Details</h3>
            </div>
            <div style={{ maxHeight: 260, overflowY: "auto" }}>
              {(student_skills || []).map((s) => (
                <div key={s.skill} className="info-row">
                  <span style={{ fontSize: 13 }}>{s.skill}</span>
                  <DemandBadge level={s.demand_level} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
