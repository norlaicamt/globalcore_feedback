import React, { useState, useEffect } from "react";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminFeedbacks from "./pages/AdminFeedbacks";
import AdminFeedbackTypes from "./pages/AdminFeedbackTypes";
import AdminBroadcast from "./pages/AdminBroadcast";
import AdminUserInfoFields from "./pages/AdminUserInfoFields";
import AdminSettings from "./pages/AdminSettings";
import CustomModal from "../CustomModal";

const NAV_ITEMS = [
  { id: "dashboard",      label: "Dashboard",           icon: <ChartIcon /> },
  { id: "users",          label: "User Oversight",      icon: <UsersIcon /> },
  { id: "feedbacks",      label: "Feedback Management",  icon: <FeedIcon /> },
  { id: "broadcast",      label: "Broadcast",            icon: <BellIcon /> },
  { type: "label",        label: "CONFIGURATION" },
  { id: "feedbacktypes",  label: "Category Setup",       icon: <TagIcon /> },
  { id: "userinfofields", label: "User Info Fields",     icon: <UsersIcon /> },
  { type: "label",        label: "SYSTEM" },
  { id: "settings",       label: "Settings",             icon: <SettingsIcon /> },
];

const AdminHub = ({ adminUser, onLogout }) => {
  const [view, setView] = useState(localStorage.getItem("adminView") || "dashboard");
  const [darkMode, setDarkMode] = useState(localStorage.getItem("adminDarkMode") === "true");
  const [logoutDialog, setLogoutDialog] = useState(false);

  useEffect(() => {
    localStorage.setItem("adminDarkMode", darkMode);
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  // --- PROFESSIONAL THEME TOKENS ---
  const theme = {
    bg: darkMode ? "#0F172A" : "#F1F5F9",
    surface: darkMode ? "#1E293B" : "#FFFFFF",
    text: darkMode ? "#F8FAFC" : "#1E293B",
    textMuted: darkMode ? "#94A3B8" : "#64748B",
    border: darkMode ? "rgba(255,255,255,0.06)" : "#E2E8F0",
    headerBg: darkMode ? "#1E293B" : "#FFFFFF",
    navActive: "rgba(255,255,255,0.12)",
    navHover: "rgba(255,255,255,0.07)"
  };

  useEffect(() => {
    localStorage.setItem("adminView", view);
  }, [view]);

  const handleLogout = () => {
    localStorage.removeItem("adminUser");
    localStorage.removeItem("adminView"); // cleanup view on logout
    onLogout();
  };

  const renderView = () => {
    const props = { onNavigate: setView, theme, darkMode };
    switch (view) {
      case "dashboard":     return <AdminDashboard {...props} />;
      case "users":         return <AdminUsers {...props} />;
      case "feedbacks":     return <AdminFeedbacks {...props} />;
      case "feedbacktypes": return <AdminFeedbackTypes {...props} />;
      case "userinfofields":return <AdminUserInfoFields {...props} />;
      case "broadcast":     return <AdminBroadcast {...props} />;
      case "settings":      return <AdminSettings {...props} />;
      default:              return <AdminDashboard {...props} />;
    }
  };

  return (
    <div style={{ ...styles.root, backgroundColor: theme.bg, color: theme.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        .nav-item:hover { background: rgba(255,255,255,0.07) !important; }
        .nav-item.active { background: rgba(255,255,255,0.12) !important; }
        .logout-btn:hover { background: rgba(255,255,255,0.08) !important; }
      `}</style>

      {/* SIDEBAR (always open) */}
      <aside style={styles.sidebar}>
        {/* Logo */}
        <div style={styles.sidebarLogo}>
          <div style={styles.logoIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <p style={styles.logoText}>GlobalCore</p>
            <p style={styles.logoSub}>Admin Panel</p>
          </div>
        </div>

        <div style={styles.divider} />

        {/* Nav */}
        <nav style={styles.nav}>
          {NAV_ITEMS.map((item, idx) => (
            item.type === "label" ? (
              <div key={`label-${idx}`} style={styles.navLabel}>{item.label}</div>
            ) : (
              <button
                key={item.id}
                className={`nav-item${view === item.id ? " active" : ""}`}
                onClick={() => setView(item.id)}
                style={{ ...styles.navItem, ...(view === item.id ? styles.navItemActive : {}) }}
              >
                <span style={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            )
          ))}
        </nav>

        {/* Bottom user info */}
        <div style={styles.sidebarBottom}>
          <div style={styles.adminBadge}>
            <div style={styles.adminAvatar}>A</div>
            <div>
              <p style={styles.adminName}>{adminUser?.name || "Admin"}</p>
              <p style={styles.adminRole}>System Administrator</p>
            </div>
          </div>
          <button className="logout-btn" onClick={() => setLogoutDialog(true)} style={styles.logoutBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={styles.main}>
        <header style={{ ...styles.topBar, backgroundColor: theme.headerBg, borderBottom: `1px solid ${theme.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div>
              <h1 style={{ ...styles.pageTitle, color: theme.text }}>{NAV_ITEMS.find(n => n.id === view)?.label || "Dashboard"}</h1>
              <p style={styles.pageTime}>{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
            <button 
              onClick={toggleTheme} 
              style={{ ...styles.themeToggle, background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', color: theme.text }}
            >
              {darkMode ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </header>
        <div style={styles.content}>{renderView()}</div>
      </main>

      <CustomModal
        isOpen={logoutDialog} title="Logout"
        message="Are you sure you want to log out of the admin panel?"
        type="alert" confirmText="Logout" isDestructive
        onConfirm={handleLogout} onCancel={() => setLogoutDialog(false)}
      />
    </div>
  );
};

// ─── SVG Icon Components (professional, monochrome) ───
function ChartIcon()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>; }
function UsersIcon()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>; }
function FeedIcon()     { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>; }
function TagIcon()      { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>; }
function BellIcon()     { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>; }
function SettingsIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>; }
function SunIcon()      { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>; }
function MoonIcon()     { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>; }

const SIDEBAR_W = 280;
const styles = {
  root: { display: "flex", height: "100vh", fontFamily: '"Inter", sans-serif', backgroundColor: "#F1F5F9" },
  sidebar: { width: SIDEBAR_W, minWidth: SIDEBAR_W, height: "100vh", background: "linear-gradient(180deg, #1f2a56 0%, #1a2347 100%)", display: "flex", flexDirection: "column", color: "white", flexShrink: 0, overflowY: "auto" },
  sidebarLogo: { display: "flex", alignItems: "center", gap: "12px", padding: "20px 16px 16px" },
  logoIcon: { width: "36px", height: "36px", borderRadius: "10px", background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  logoText: { fontSize: "14px", fontWeight: "800", margin: 0, color: "white" },
  logoSub: { fontSize: "10px", color: "rgba(255,255,255,0.4)", margin: 0, fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.08em" },
  divider: { height: "1px", background: "rgba(255,255,255,0.07)", margin: "0 16px 10px" },
  nav: { flex: 1, display: "flex", flexDirection: "column", gap: "1px", padding: "0 10px" },
  navItem: { display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "8px", fontSize: "14px", fontWeight: "600", color: "rgba(255,255,255,0.6)", cursor: "pointer", background: "none", border: "none", width: "100%", textAlign: "left", transition: "all 0.15s", fontFamily: "inherit" },
  navItemActive: { color: "white", fontWeight: "700" },
  navLabel: { fontSize: "11px", fontWeight: "700", color: "rgba(255,255,255,0.3)", padding: "18px 12px 6px", textTransform: "uppercase", letterSpacing: "0.1em" },
  navIcon: { width: "18px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  sidebarBottom: { borderTop: "1px solid rgba(255,255,255,0.07)", padding: "14px" },
  adminBadge: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" },
  adminAvatar: { width: "32px", height: "32px", borderRadius: "8px", background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "800", flexShrink: 0 },
  adminName: { fontSize: "13px", fontWeight: "700", margin: 0, color: "white" },
  adminRole: { fontSize: "10px", color: "rgba(255,255,255,0.4)", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" },
  logoutBtn: { display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "8px 10px", background: "transparent", border: "none", borderRadius: "8px", color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit" },
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  topBar: { padding: "20px 28px 14px", background: "white", borderBottom: "1px solid #E2E8F0", flexShrink: 0 },
  pageTitle: { fontSize: "16px", fontWeight: "800", color: "#0F172A", margin: "0 0 2px 0" },
  pageTime: { fontSize: "12px", color: "#94A3B8", margin: 0, fontWeight: "500" },
  content: { flex: 1, overflowY: "auto", padding: "24px 28px" },
  themeToggle: { background: "none", border: "none", cursor: "pointer", width: "36px", height: "36px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" },
};

export default AdminHub;
