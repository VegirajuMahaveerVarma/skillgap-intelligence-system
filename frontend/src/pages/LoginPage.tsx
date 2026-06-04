/**
 * LoginPage.tsx — Handles user login via Flask /login endpoint.
 * Falls back to demo mode if backend is offline.
 */
import React, { useState, KeyboardEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { login as apiLogin } from "../utils/api";

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("demo@skillgap.ai");
  const [password, setPassword] = useState("demo123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const data = await apiLogin(email, password);
      login({ user_id: data.user_id, email: data.email });
      navigate("/dashboard");
    } catch (err: any) {
      // Demo fallback — allow login when backend is offline
      if (password.length >= 6) {
        login({ user_id: 1, email });
        navigate("/dashboard");
      } else {
        setError(err?.response?.data?.error || err.message || "Login failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: KeyboardEvent) => e.key === "Enter" && handleLogin();

  return (
    <div className="auth-bg">
      <div className="auth-card">
        {/* Brand */}
        <div className="brand">
          <div className="brand-icon">🧠</div>
          <span className="brand-name">SkillGap AI</span>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your SkillGap Intelligence account</p>

        {error && (
          <div className="alert alert-error">⚠️ {error}</div>
        )}

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            className="form-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            onKeyDown={onKeyDown}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            className="form-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            onKeyDown={onKeyDown}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={handleLogin}
          disabled={loading}
          style={{ marginTop: 8 }}
        >
          {loading ? <span className="spinner" /> : null}
          {loading ? " Signing in…" : "Sign In"}
        </button>

        <div className="auth-link">
          Don't have an account?{" "}
          <Link to="/signup">Sign up</Link>
        </div>

        <div
          style={{
            marginTop: 16,
            padding: "10px 14px",
            background: "rgba(99,102,241,0.08)",
            borderRadius: 8,
            fontSize: 12,
            color: "var(--text2)",
            lineHeight: 1.6,
          }}
        >
          💡 <strong>Demo mode:</strong> Backend not required. Use any email + 6+
          char password to explore the full app.
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
