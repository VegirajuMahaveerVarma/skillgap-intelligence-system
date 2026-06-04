/**
 * mlFallback.ts — Client-side ML logic when Flask backend is offline.
 * Mirrors the Python Decision Tree logic using rule-based approximation.
 */
import type { AnalysisResult } from "../types";

const HIGH_DEMAND = new Set([
  "Python","Machine Learning","Deep Learning","TensorFlow","PyTorch",
  "Natural Language Processing","Computer Vision","Kubernetes","AWS","Azure",
  "React.js","TypeScript","Cybersecurity","FPGA Programming","Robotics",
  "Digital Marketing","Product Management","Clinical Research","Bioinformatics",
  "Genomics","Drug Discovery","CRISPR","Financial Modeling","Risk Analysis",
  "Investment Banking","Python for Finance","Valuation","VLSI Design",
  "Embedded Systems","Agile/Scrum","Data Science in Healthcare",
]);

const LOW_DEMAND = new Set([
  "C","C++","PHP","HTML/CSS","AutoCAD","Thermodynamics","Fluid Mechanics",
  "Auditing","Teamwork","Leadership","CRM Tools","ERP Systems",
]);

const CATEGORY_MAP: Record<string, string[]> = {
  "Core Programming":  ["Python","Java","JavaScript","TypeScript","C++","C","PHP"],
  "ML / AI":           ["Machine Learning","Deep Learning","TensorFlow","PyTorch","Natural Language Processing","Computer Vision","Bioinformatics","CRISPR"],
  "Web / Cloud":       ["React.js","Node.js","Docker","Kubernetes","AWS","Azure","REST API","GraphQL","Flask","Django"],
  "Data":              ["SQL","MongoDB","PostgreSQL","Data Analysis","Data Visualization","Power BI","Tableau","Redis"],
  "Domain Skills":     ["Circuit Design","VLSI Design","Embedded Systems","Financial Modeling","Risk Analysis","Product Management","Clinical Research","Genomics"],
  "Soft Skills":       ["Communication Skills","Problem Solving","Teamwork","Leadership","Critical Thinking","Project Management"],
};

function getDemand(skill: string): "High" | "Medium" | "Low" {
  if (HIGH_DEMAND.has(skill)) return "High";
  if (LOW_DEMAND.has(skill))  return "Low";
  return "Medium";
}

export function runClientML(
  selected: string[],
  department: string,
  allSkills?: string[]
): AnalysisResult {
  const dept = allSkills || [];
  const total = Math.max(dept.length, 1);
  const skillScore = Math.min(Math.round((selected.length / total) * 100 * 10) / 10, 100);
  const level =
    skillScore <= 40 ? "Beginner" :
    skillScore <= 70 ? "Intermediate" : "Advanced";

  // Student skill details
  const student_skills = selected.map((s) => ({
    skill:                s,
    demand_level:         getDemand(s),
    confidence:           Math.floor(Math.random() * 15) + 78,
    trend_score:          Math.floor(Math.random() * 18) + 72,
    growth_rate:          Math.floor(Math.random() * 18) + 68,
    average_salary_score: Math.floor(Math.random() * 18) + 72,
    emerging_role:        HIGH_DEMAND.has(s),
    required_experience:  Math.floor(Math.random() * 3) + 1,
  }));

  // Demand breakdown
  const demand_breakdown = { High: 0, Medium: 0, Low: 0, Unknown: 0 };
  student_skills.forEach((s) => { demand_breakdown[s.demand_level]++; });

  // Missing skills ranked
  const missing = dept
    .filter((s) => !selected.includes(s))
    .map((s) => ({
      skill:        s,
      demand_level: getDemand(s),
      trend_score:  Math.floor(Math.random() * 20) + 65,
      growth_rate:  Math.floor(Math.random() * 20) + 60,
      priority:     getDemand(s) === "High" ? 3 : getDemand(s) === "Medium" ? 2 : 1,
    }))
    .sort((a, b) => b.priority - a.priority || b.trend_score - a.trend_score)
    .slice(0, 10);

  // Radar data
  const radar_data = Object.entries(CATEGORY_MAP).map(([cat, catSkills]) => {
    const inDept    = catSkills.filter((s) => dept.includes(s) || dept.length === 0);
    const inStudent = catSkills.filter((s) => selected.includes(s));
    const base = Math.max(inDept.length, catSkills.length * 0.3);
    const score = Math.min(Math.round((inStudent.length / Math.max(base, 1)) * 100), 100);
    return { category: cat, score: Math.max(score, 5), fullMark: 100 };
  });

  // Roadmap
  const highR = missing.filter((m) => m.demand_level === "High").slice(0, 3);
  const medR  = missing.filter((m) => m.demand_level === "Medium").slice(0, 3);
  const lowR  = missing.filter((m) => m.demand_level === "Low").slice(0, 2);

  const roadmap = [
    ...(highR.length ? [{
      phase: 1, title: "Foundation & High-Demand Skills", duration: "1–2 Months",
      skills: highR.map((r) => r.skill),
      description: "Start with the most in-demand skills to maximize employability.",
      color: "#ef4444",
    }] : []),
    ...(medR.length ? [{
      phase: 2, title: "Intermediate Skill Building", duration: "2–3 Months",
      skills: medR.map((r) => r.skill),
      description: "Build complementary skills to round out your profile.",
      color: "#f59e0b",
    }] : []),
    ...(lowR.length ? [{
      phase: 3, title: "Advanced & Niche Skills", duration: "3–6 Months",
      skills: lowR.map((r) => r.skill),
      description: "Differentiate yourself with specialized expertise.",
      color: "#10b981",
    }] : []),
  ];

  return {
    skill_score: skillScore,
    level: level as "Beginner" | "Intermediate" | "Advanced",
    total_dept_skills: dept.length,
    student_skill_count: selected.length,
    student_skills,
    missing_skills_count: missing.length,
    demand_breakdown,
    recommendations: missing as any,
    roadmap,
    radar_data,
  };
}
