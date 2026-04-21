import React, { useState, useEffect } from "react";
import { STORAGE_KEYS } from "../../utils/storage";
import { logoutAdmin } from "../../utils/auth";
import { useTerminology } from "../../context/TerminologyContext";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminFeedbacks from "./pages/AdminFeedbacks";
import AdminPendingSuggestions from "./pages/AdminPendingSuggestions";
import AdminBroadcast from "./pages/AdminBroadcast";
import AdminSettings from "./pages/AdminSettings";
import AdminAuditLogs from "./pages/AdminAuditLogs";
import AdminPrograms from "./pages/AdminPrograms";
import AdminFormDesigner from "./pages/AdminFormDesigner";
import CustomModal from "../CustomModal";
import { adminGetPendingSuggestions, adminUpdatePresence } from "../../services/adminApi";

const NAV_ITEMS = [
  { id: "dashboard", label: "Insights Hub", icon: <ChartIcon /> },
  { id: "users", label: "Account Management", icon: <UsersIcon /> },
  { id: "feedbacks", label: "Submissions", icon: <FeedIcon /> },
  { id: "broadcast", label: "Announcements", icon: <BellIcon /> },
  { id: "auditlogs", label: "System Audit Trail", icon: <ClockIcon />, superOnly: true },
  { type: "label", label: "ORGANIZATION" },
  { id: "programs", label: "Program Hub", icon: <OrgIcon /> },
  { id: "pendingsuggestions", label: "Approval Queue", icon: <ClockIcon />, isSub: true, superOnly: true },
  { id: "formdesigner", label: "Form Layout", icon: <OrgIcon /> },
  { type: "label", label: "PREFERENCES" },
  { id: "settings", label: "Global Settings", icon: <SettingsIcon />, superOnly: true },
];

const AdminHub = ({ adminUser, onLogout }) => {
  const { systemName, systemLogo, getLabel } = useTerminology();
  const programsLabel = `${getLabel('category_label', 'Program')} Hub`;
  const [localAdminUser, setLocalAdminUser] = useState(adminUser);
  const hasGlobalAdminAccess = ["admin", "superadmin"].includes(localAdminUser?.role) && !localAdminUser?.department;
  const getViewFromUrl = () => {
    const p = window.location.pathname;
    const match = p.match(/^\/admin\/([^/]+)/);
    return match ? match[1] : (localStorage.getItem(STORAGE_KEYS.ADMIN_VIEW) || "dashboard");
  };

  const [view, setView] = useState(getViewFromUrl);
  const [darkMode, setDarkMode] = useState(localStorage.getItem(STORAGE_KEYS.ADMIN_DARK_MODE) === "true");
  const [logoutDialog, setLogoutDialog] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time Clock synchronization
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchPendingCount = () => {
    if (!hasGlobalAdminAccess) return;
    adminGetPendingSuggestions().then(data => {
      setPendingCount(data.length);
    }).catch(console.error);
  };

  useEffect(() => {
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 60000); // refresh every minute

    // Support browser back/forward buttons
    const handlePopState = () => {
      const v = getViewFromUrl();
      if (v !== view) setView(v);
    };
    window.addEventListener("popstate", handlePopState);

    // Ensure the URL matches the current view on load if it's just /admin
    if (window.location.pathname === "/admin" || window.location.pathname === "/admin/") {
      window.history.replaceState(null, "", `/admin/${view}`);
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [hasGlobalAdminAccess, view]);

  // --- BRANDING: Primary Color Synchronization ---
  useEffect(() => {
    const applyColor = (hex) => {
      if (!hex) return;
      const root = document.documentElement;
      root.style.setProperty('--primary-color', hex);

      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (result) {
        const rgb = `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
        root.style.setProperty('--primary-rgb', rgb);
      }
    };

    const savedColor = localStorage.getItem('admin_primary_color');
    if (savedColor) applyColor(savedColor);

    const handleStorage = (e) => {
      if (e.key === 'admin_primary_color' && e.newValue) {
        applyColor(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADMIN_DARK_MODE, darkMode);
  }, [darkMode]);

  // Real-time Presence Heartbeat
  useEffect(() => {
    const updatePresence = () => {
      const ACTION_MAP = {
        dashboard: "Monitoring Insights",
        users: "Managing Accounts",
        feedbacks: "Reviewing Submissions",
        broadcast: "Drafting Announcements",
        auditlogs: "Reviewing Audit Logs",
        programs: "Configuring Programs",
        pendingsuggestions: "Reviewing Approvals",
        formdesigner: "Designing Forms",
        settings: "Adjusting Global Settings"
      };
      const moduleName = ACTION_MAP[view] || "Active in Portal";
      adminUpdatePresence(moduleName).catch(err => console.debug("Presence sync failed", err));
    };

    updatePresence(); // Initial update
    const presenceInterval = setInterval(updatePresence, 30000); // Every 30 seconds

    return () => clearInterval(presenceInterval);
  }, [view]);

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

  const handleSetView = (newView) => {
    setView(newView);
    localStorage.setItem(STORAGE_KEYS.ADMIN_VIEW, newView);
    // Push new state to browser history
    if (window.location.pathname !== `/admin/${newView}`) {
      window.history.pushState(null, "", `/admin/${newView}`);
    }
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
    else logoutAdmin();
  };

  const handleAdminUpdate = (updated) => {
    setLocalAdminUser(updated);
    localStorage.setItem(STORAGE_KEYS.ADMIN_CURRENT, JSON.stringify(updated));
  };

  const renderView = () => {
    const props = {
      onNavigate: handleSetView,
      theme,
      darkMode,
      adminUser: localAdminUser,
      onAdminUpdate: handleAdminUpdate,
      onToggleTheme: toggleTheme
    };
    switch (view) {
      case "dashboard": return <AdminDashboard {...props} />;
      case "users": return <AdminUsers {...props} />;
      case "feedbacks": return <AdminFeedbacks {...props} />;
      case "programs": return <AdminPrograms {...props} />;
      case "pendingsuggestions": return <AdminPendingSuggestions {...props} refreshCount={fetchPendingCount} />;
      case "formdesigner": return <AdminFormDesigner {...props} />;
      case "broadcast": return <AdminBroadcast {...props} />;
      case "settings": return <AdminSettings {...props} />;
      case "auditlogs": return <AdminAuditLogs {...props} />;
      case "feedbacktypes": // Redirect legacy
      case "branches":      // Redirect legacy
        console.warn(`Legacy Route Detected: /admin/${view}. Redirecting to Program Hub.`);
        window.history.replaceState(null, "", "/admin/programs");
        setView("programs");
        return <AdminPrograms {...props} />;
      default: return <AdminDashboard {...props} />;
    }
  };

  return (
    <div style={{ ...styles.root, backgroundColor: theme.bg, color: theme.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .nav-item { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden; }
        .nav-item:hover { background: rgba(255,255,255,0.06) !important; color: #fff !important; transform: translateX(4px); }
        .nav-item.active { background: rgba(255,255,255,0.08) !important; color: #fff !important; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1); }
        .nav-item.active::before { content: ''; position: absolute; left: 0; top: 15%; bottom: 15%; width: 4px; background: var(--primary-color); border-radius: 0 4px 4px 0; box-shadow: 2px 0 10px rgba(var(--primary-rgb), 0.5); }
        .logout-btn:hover { background: rgba(239, 68, 68, 0.1) !important; color: #ef4444 !important; }
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        @keyframes sidebarPulse {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.5); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
      `}</style>

      {/* SIDEBAR (always open) */}
      <aside style={styles.sidebar}>
        {/* Logo & Status */}
        <div style={styles.sidebarHeader}>
          <div style={styles.sidebarLogo}>
            {systemLogo ? (
              <img src={systemLogo} alt="Logo" style={{ height: '36px', maxWidth: '100px', objectFit: 'contain' }} />
            ) : (
              <div style={styles.logoIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                </svg>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
              <p style={styles.logoText}>{systemName}</p>
              <p style={styles.logoSub}>FEEDBACK PORTAL</p>
            </div>
          </div>

          <div style={styles.statusIndicator}>
            <div style={styles.pulseContainer}>
              <div style={styles.pulseDot} />
              <div style={styles.pulseRing} />
            </div>
            <span style={styles.statusText}>Live Oversight</span>
          </div>
        </div>

        <div className="sidebar-scroll" style={styles.navContainer}>
          {NAV_ITEMS
            .filter(item => {
              // Standard Role Check
              if (item.superOnly && !hasGlobalAdminAccess) return false;

              // Program Admin Restictions (Admins with entity_id)
              const isScopedAdmin = !!localAdminUser?.entity_id;
              if (isScopedAdmin) {
                // Hide global configuration tools from program admins
                const globalTools = ["feedbacktypes", "settings", "auditlogs", "pendingsuggestions"];
                if (globalTools.includes(item.id)) return false;

                // Hide "ORGANIZATION" and "PREFERENCES" labels if all their sub-items are hidden
                if (item.type === "label") {
                  if (item.label === "ORGANIZATION") return false;
                  if (item.label === "PREFERENCES") return false;
                }
              }

              return true;
            })
            .map((item, idx) => (
              item.type === "label" ? (
                <div key={`label-${idx}`} style={styles.navLabel}>{item.label}</div>
              ) : (
                <button
                  key={item.id}
                  className={`nav-item${view === item.id ? " active" : ""}`}
                  onClick={() => handleSetView(item.id)}
                  style={{
                    ...styles.navItem,
                    ...(view === item.id ? styles.navItemActive : {}),
                    marginLeft: item.isSub ? "20px" : "0",
                    width: item.isSub ? "calc(100% - 20px)" : "100%",
                    fontSize: item.isSub ? "13px" : "14px"
                  }}
                >
                  <span style={styles.navIcon}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.id === 'programs' ? programsLabel : item.label}</span>
                  {item.id === "pendingsuggestions" && pendingCount > 0 && (
                    <div style={styles.badge}>{pendingCount}</div>
                  )}
                </button>
              )
            ))}
        </div>

        {/* Bottom user info */}
        <div style={styles.sidebarFooter}>
          <div style={styles.profileCard}>
            <div style={styles.profileMain}>
              <div style={{ ...styles.adminAvatar, background: hasGlobalAdminAccess ? 'linear-gradient(135deg, #9333ea, #7c3aed)' : 'var(--primary-color)' }}>
                {localAdminUser?.name?.charAt(0) || "A"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={styles.adminName} title={localAdminUser?.name}>
                  {localAdminUser?.name || "Admin"}
                </p>
                <p style={styles.adminRole}>
                  {localAdminUser?.position_title || (hasGlobalAdminAccess ? "Global Overseer" : localAdminUser?.department)}
                </p>
              </div>
            </div>
            <button className="logout-btn" onClick={() => setLogoutDialog(true)} style={styles.logoutIconButton}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={styles.main}>
        {!localAdminUser?.profile_completed && localAdminUser?.email !== "admin@globalcore.com" && (
          <div style={{ padding: '10px 28px', background: '#FEF3C7', borderBottom: '1px solid #FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>👋</span>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#92400E' }}>
                Welcome! Complete your profile identity to unlock full reporting features.
              </p>
            </div>
            <button
              onClick={() => handleSetView("settings")}
              style={{ padding: '6px 14px', background: '#92400E', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
            >
              Complete Now
            </button>
          </div>
        )}
        <header style={{ ...styles.topBar, backgroundColor: theme.headerBg, borderBottom: `1px solid ${theme.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div>
              <h1 style={{ ...styles.pageTitle, color: theme.text }}>
                {view === 'programs' ? programsLabel : (NAV_ITEMS.find(n => n.id === view)?.label || "Dashboard")}
              </h1>
              <p style={{ ...styles.pageTime, opacity: 0.8 }}>
                {currentTime.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
              <div style={styles.liveIndicatorContainer}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <div style={styles.liveDot} />
                  <div style={{ position: 'absolute', inset: -2, borderRadius: '50%', border: '1.5px solid #10B981', animation: 'sidebarPulse 2s infinite' }} />
                </div>
                <span style={styles.liveLabel}>LIVE</span>
                <span style={{ color: '#E2E8F0', margin: '0 4px' }}>•</span>
                <span style={{ ...styles.systemTime, color: theme.text }}>
                  {currentTime.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                </span>
                <span style={styles.timezoneLabel}>Manila (GMT+8)</span>
              </div>
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
function ChartIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>; }
function UsersIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>; }
function FeedIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>; }
function TagIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>; }
function BellIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>; }
function SettingsIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" /></svg>; }
function SunIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>; }
function MoonIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>; }
function ClockIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>; }
function MapPinIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>; }
function TypeIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>; }
function OrgIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>; }


const SIDEBAR_W = 280;
const styles = {
  root: { display: "flex", height: "100vh", fontFamily: '"Inter", sans-serif', backgroundColor: "#F1F5F9" },
  sidebar: {
    width: SIDEBAR_W, minWidth: SIDEBAR_W, height: "100vh",
    background: "#0F172A",
    display: "flex", flexDirection: "column", color: "white", flexShrink: 0,
    borderRight: '1px solid rgba(255,255,255,0.05)',
    zIndex: 100
  },
  sidebarHeader: { padding: "24px 20px 20px", display: 'flex', flexDirection: 'column', gap: '16px' },
  sidebarLogo: { display: "flex", alignItems: "center", gap: "12px" },
  logoIcon: { width: "38px", height: "38px", borderRadius: "12px", background: "var(--primary-color)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.3)', border: '1px solid rgba(255,255,255,0.1)' },
  logoText: { 
    fontSize: "17px", 
    fontWeight: "900", 
    margin: 0, 
    color: "white", 
    lineHeight: 1.2, 
    letterSpacing: '-0.04em', 
    fontFamily: "'Outfit', sans-serif",
    textShadow: '0 2px 4px rgba(0,0,0,0.3)'
  },
  logoSub: { 
    fontSize: "9px", 
    color: "var(--primary-color)", 
    margin: "2px 0 0 0", 
    fontWeight: "900", 
    textTransform: 'uppercase', 
    letterSpacing: '0.15em', 
    fontFamily: "'Outfit', sans-serif",
    opacity: 0.8
  },

  statusIndicator: { display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', width: 'fit-content' },
  pulseContainer: { position: 'relative', width: '6px', height: '6px' },
  pulseDot: { width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' },
  pulseRing: { position: 'absolute', inset: -2, borderRadius: '50%', border: '1.5px solid #10B981', animation: 'sidebarPulse 2s infinite' },
  statusText: { fontSize: '10px', fontWeight: '800', color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.05em' },

  navContainer: { flex: 1, display: "flex", flexDirection: "column", gap: "1px", padding: "0 12px", overflowY: "auto" },
  navItem: {
    display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "12px",
    fontSize: "13.5px", fontWeight: "600", color: "rgba(255,255,255,0.5)", cursor: "pointer",
    background: "none", border: "none", width: "100%", textAlign: "left", fontFamily: "inherit"
  },
  navItemActive: { 
    color: "white", 
    fontWeight: "700", 
    background: 'rgba(var(--primary-rgb), 0.1)', 
    boxShadow: 'inset 4px 0 0 0 var(--primary-color)'
  },
  navLabel: { fontSize: "10px", fontWeight: "800", color: "rgba(255,255,255,0.25)", padding: "24px 16px 8px", textTransform: "uppercase", letterSpacing: "0.12em" },
  navIcon: { width: "18px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: 0.8 },

  sidebarFooter: { padding: "20px 12px", borderTop: "1px solid rgba(255,255,255,0.05)" },
  profileCard: {
    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
    background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)'
  },
  profileMain: { flex: 1, display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 },
  adminAvatar: { width: "36px", height: "36px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "900", flexShrink: 0, color: 'white' },
  adminName: { fontSize: "13px", fontWeight: "700", margin: 0, color: "white", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  adminRole: { fontSize: "10px", color: "rgba(255,255,255,0.4)", margin: '1px 0 0 0', fontWeight: '600' },
  logoutIconButton: {
    width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)',
    border: 'none', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'all 0.2s'
  },

  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  topBar: { padding: "20px 28px 14px", background: "white", borderBottom: "1px solid #E2E8F0", flexShrink: 0 },
  pageTitle: { fontSize: "17px", fontWeight: "900", color: "#0F172A", margin: "0 0 4px 0", letterSpacing: '-0.01em' },
  pageTime: { fontSize: "12px", color: "#94A3B8", margin: 0, fontWeight: "600" },
  liveIndicatorContainer: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' },
  liveDot: { width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' },
  liveLabel: { fontSize: '10px', fontWeight: '900', color: '#10B981', letterSpacing: '0.05em' },
  systemTime: { fontSize: '13px', fontWeight: "800", color: "inherit", fontFamily: "'Outfit', sans-serif" },
  timezoneLabel: { fontSize: '10px', fontWeight: '700', color: '#94A3B8', marginLeft: '4px' },
  content: { flex: 1, overflowY: "auto", padding: "24px 28px" },
  themeToggle: { background: "none", border: "none", cursor: "pointer", width: "36px", height: "36px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" },
  badge: {
    backgroundColor: "#EF4444",
    color: "white",
    fontSize: "9px",
    fontWeight: "900",
    borderRadius: "6px",
    padding: "2px 5px",
    minWidth: "16px",
    textAlign: "center",
    marginLeft: 'auto'
  }
};

export default AdminHub;
