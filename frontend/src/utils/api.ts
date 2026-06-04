/**
 * API service layer — all Axios calls to Flask backend.
 * Base URL points to localhost:5000 (Flask dev server).
 */

import axios from "axios";
import type {
  AnalysisResult,
  DashboardData,
  Profile,
} from "../types";

const api = axios.create({
  baseURL: "https://skillgap-intelligence-system.onrender.com",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// ── Auth ──────────────────────────────────────────────────────────────────────

export const signup = async (email: string, password: string) => {
  const res = await api.post("/signup", { email, password });
  return res.data as { user_id: number; email: string; message: string };
};

export const login = async (email: string, password: string) => {
  const res = await api.post("/login", { email, password });
  return res.data as { user_id: number; email: string; message: string };
};

// ── Profile ───────────────────────────────────────────────────────────────────

export const saveProfile = async (data: {
  user_id: number;
  full_name: string;
  college: string;
  department: string;
  graduation_year: number;
}) => {
  const res = await api.post("/profile", data);
  return res.data;
};

export const getProfile = async (user_id: number) => {
  const res = await api.get(`/profile/${user_id}`);
  return res.data.profile as Profile | null;
};

// ── Skills ────────────────────────────────────────────────────────────────────

export const getDepartments = async (): Promise<string[]> => {
  const res = await api.get("/departments");
  return res.data.departments;
};

export const getDepartmentSkills = async (department: string): Promise<string[]> => {
  const res = await api.get(`/dept-skills/${encodeURIComponent(department)}`);
  return res.data.skills;
};

export const saveSkills = async (user_id: number, skills: string[]) => {
  const res = await api.post("/skills", { user_id, skills });
  return res.data;
};

export const getUserSkills = async (user_id: number): Promise<string[]> => {
  const res = await api.get(`/skills/${user_id}`);
  return res.data.skills;
};

// ── ML Prediction ─────────────────────────────────────────────────────────────

export const runPrediction = async (
  user_id: number,
  department: string,
  skills: string[]
): Promise<AnalysisResult> => {
  const res = await api.post("/predict", { user_id, department, skills });
  return res.data;
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const getDashboard = async (user_id: number): Promise<DashboardData> => {
  const res = await api.get(`/dashboard/${user_id}`);
  return res.data;
};

export default api;
