// ── Core domain types ─────────────────────────────────────────────────────────

export interface User {
  user_id: number;
  email: string;
}

export interface Profile {
  user_id: number;
  full_name: string;
  college: string;
  department: string;
  graduation_year: number;
  avatar_initials: string;
}

export interface SkillDetail {
  skill: string;
  demand_level: "High" | "Medium" | "Low" | "Unknown";
  confidence: number;
  trend_score: number;
  growth_rate: number;
  average_salary_score: number;
  emerging_role: boolean;
  required_experience: number;
}

export interface RoadmapPhase {
  phase: number;
  title: string;
  duration: string;
  skills: string[];
  description: string;
  color: string;
}

export interface RecommendedSkill {
  skill: string;
  demand_level: "High" | "Medium" | "Low";
  trend_score: number;
  growth_rate: number;
  priority: number;
}

export interface RadarDataPoint {
  category: string;
  score: number;
  fullMark: number;
}

export interface DemandBreakdown {
  High: number;
  Medium: number;
  Low: number;
  Unknown: number;
}

export interface AnalysisResult {
  skill_score: number;
  level: "Beginner" | "Intermediate" | "Advanced";
  total_dept_skills: number;
  student_skill_count: number;
  student_skills: SkillDetail[];
  missing_skills_count: number;
  demand_breakdown: DemandBreakdown;
  recommendations: RecommendedSkill[];
  roadmap: RoadmapPhase[];
  radar_data: RadarDataPoint[];
}

export interface DashboardData extends AnalysisResult {
  profile: Profile;
  skills: string[];
}

// ── Auth context ──────────────────────────────────────────────────────────────
export interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}
