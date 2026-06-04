/**
 * Sidebar.tsx — App navigation sidebar.
 */
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { path: "/dashboard", icon: "📊", label: "Dashboard"      },
  { path: "/profile",   icon: "👤", label: "Profile"        },
  { path: "/skills",    icon: "🎯", label: "Skills & Analysis" },
];

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const { pathname } = useLocation();

  const profile: any = (() => {
    try { return JSON.parse(localStorage.getItem("sg_profile") || "{}"); } catch { return {}; }
  })();

  const initials = profile?.avatar_initials || user?.email?.[0]?.toUpperCase() || "U";
  const displayName = profile?.full_name || "User";

  return (
    <div className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-icon">🧠</div>
        <span className="brand-name">SkillGap AI</span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV.map((n) => (
          <div
            key={n.path}
            className={`nav-item ${pathname === n.path ? "active" : ""}`}
            onClick={() => navigate(n.path)}
          >
            <span className="nav-icon">{n.icon}</span>
            {n.label}
          </div>
        ))}
      </nav>

      {/* Footer / user */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="avatar">{initials}</div>
          <div className="user-info">
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
              {displayName}
            </div>
            <div className="user-email">{user?.email}</div>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { logout(); navigate("/login"); }}
            title="Logout"
          >
            ↩
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
