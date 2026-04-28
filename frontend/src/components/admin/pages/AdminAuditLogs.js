import React, { useEffect, useState } from "react";
import { adminGetAuditLogs, adminGetStaffList } from "../../../services/adminApi";

// --- HELPER: Relative Time ---
const formatRelativeTime = (dateStr) => {
  if (!dateStr || dateStr === "None") return "Never";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Never";
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
  } catch (e) {
    return "Never";
  }
};

const getPresenceInfo = (user) => {
  if (!user.last_seen || user.last_seen === "None") return { isOnline: false, status: "Offline", label: "Offline", color: "#94A3B8" };
  const lastSeen = new Date(user.last_seen);
  const now = new Date();
  const diffMs = now - lastSeen;

  if (diffMs < 120000) { // 2 mins
    return { isOnline: true, isIdle: false, status: user.current_module || "Monitoring Portal", label: "Online", color: "#10B981", lastActive: "Just now" };
  } else if (diffMs < 600000) { // 10 mins
    return { isOnline: false, isIdle: true, status: "Away", label: `Idle (${Math.floor(diffMs / 60000)}m)`, color: "#F59E0B", lastActive: formatRelativeTime(user.last_seen) };
  }
  return { isOnline: false, isIdle: false, status: "Offline", label: `Last seen: ${formatRelativeTime(user.last_seen)}`, color: "#94A3B8", lastActive: formatRelativeTime(user.last_seen) };
};

const AdminAuditLogs = ({ theme, darkMode, adminUser }) => {
  const hasGlobalAdminAccess = (adminUser?.role === "superadmin") || (adminUser?.role === "admin" && !adminUser?.entity_id);
  const [logs, setLogs] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRegistry, setShowRegistry] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  // Registry Search & Filters
  const [regSearch, setRegSearch] = useState("");
  const [regFilter, setRegFilter] = useState("all"); // all, online, idle, offline

  // Audit Trail Filters
  const [filterAction, setFilterAction] = useState("");
  const [searchAdmin, setSearchAdmin] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [logData, staffData] = await Promise.all([
          adminGetAuditLogs(),
          hasGlobalAdminAccess ? adminGetStaffList() : Promise.resolve([])
        ]);
        setLogs(logData);
        setStaff(staffData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [hasGlobalAdminAccess]);

  const getActionData = (type) => {
    const data = {
      deactivate_user: { text: "User Deactivated", bg: "#FEF2F2", color: "#EF4444", severity: "Critical" },
      reactivate_user: { text: "User Reactivated", bg: "#F0FDF4", color: "#10B981", severity: "Normal" },
      update_user_role: { text: "Role Updated", bg: "#EFF6FF", color: "#3B82F6", severity: "Critical" },
      delete_user: { text: "User Deleted", bg: "#FEF2F2", color: "#B91C1C", severity: "Critical" },
      broadcast_created: { text: "Broadcast Sent", bg: "#F5F3FF", color: "#8B5CF6", severity: "Normal" },
      update_feedback_status: { text: "Status Support", bg: "#FFFBEB", color: "#F59E0B", severity: "Normal" },
      delete_feedback: { text: "Feedback Deleted", bg: "#F8FAFC", color: "#64748B", severity: "Critical" },
      login: { text: "Admin Login", bg: "#F8FAFC", color: "#64748B", severity: "Low" }
    };
    return data[type] || { text: type.replace(/_/g, ' '), bg: darkMode ? "#1E293B" : "#F1F5F9", color: theme.text, severity: "Low" };
  };

  const filteredLogs = logs.filter(log => {
    if (filterAction && log.action_type !== filterAction) return false;
    if (searchAdmin && !log.performed_by?.name?.toLowerCase().includes(searchAdmin.toLowerCase())) return false;
    return true;
  });

  const uniqueActions = [...new Set(logs.map(l => l.action_type))];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", position: "relative" }}>

      {/* 🧭 Header & Staff Registry Toggle */}
      <div style={{ background: theme.surface, padding: "18px 20px", borderRadius: "12px", border: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: "700", margin: "0 0 4px" }}>Governance & Audit Trail</h2>
          <p style={{ fontSize: "12px", color: theme.textMuted, margin: 0 }}>
            {hasGlobalAdminAccess
              ? "Comprehensive oversight of all administrative actions and system modifications."
              : `Tracking actions within the ${adminUser?.department} scope.`}
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {hasGlobalAdminAccess && (
            <button
              onClick={() => setShowRegistry(true)}
              style={{
                padding: "8px 16px", borderRadius: "10px", background: "var(--primary-color)10",
                color: "var(--primary-color)", border: "none", fontSize: "12px", fontWeight: "800", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "8px"
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              View Staff Registry
            </button>
          )}
          <div style={{ height: "24px", width: "1px", background: theme.border, margin: "0 4px" }} />
          <input
            type="text"
            placeholder="Search Admin..."
            value={searchAdmin}
            onChange={(e) => setSearchAdmin(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "8px", border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: "12px", outline: "none", width: "180px" }}
          />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "8px", border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: "12px", outline: "none", cursor: "pointer" }}
          >
            <option value="">All Event Types</option>
            {uniqueActions.map(action => (
              <option key={action} value={action}>{getActionData(action).text}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 📋 Log Table */}
      <div style={{ background: theme.surface, borderRadius: "12px", border: `1px solid ${theme.border}`, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: theme.textMuted }}>Loading secure logs...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: darkMode ? "rgba(255,255,255,0.02)" : "#F8FAFC", borderBottom: `1px solid ${theme.border}` }}>
                {["Timestamp", "Administrator", "Event", "Impact", "Target", "Log Details"].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => {
                const action = getActionData(log.action_type);

                let severityColor = theme.textMuted;
                if (action.severity === "Critical") severityColor = "#EF4444";
                if (action.severity === "Normal") severityColor = "#3B82F6";

                const isSuper = log.performed_by?.role === "superadmin";

                return (
                  <tr key={log.id} style={{ borderBottom: `1px solid ${theme.border}`, transition: "0.1s" }} onMouseEnter={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.02)" : "#FBFCFD"}>
                    <td style={{ ...tdStyle, whiteSpace: "nowrap", color: theme.textMuted }}>
                      {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: isSuper ? '#9333ea20' : 'var(--primary-color)20', color: isSuper ? '#9333ea' : 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800' }}>
                          {log.performed_by?.name?.charAt(0) || "S"}
                        </div>
                        <div>
                          <div style={{ fontWeight: "700", color: theme.text, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {log.performed_by?.name || "System"}
                            {isSuper && <span style={{ fontSize: '9px', background: '#9333ea', color: 'white', padding: '1px 4px', borderRadius: '3px', fontWeight: '900' }}>ROOT</span>}
                          </div>
                          <div style={{ fontSize: "10px", color: theme.textMuted }}>{log.performed_by?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: "4px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: "800", textTransform: "uppercase",
                        background: action.bg, color: action.color
                      }}>
                        {action.text}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: "11px", fontWeight: "700", color: severityColor }}>
                        {action.severity}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color: theme.textMuted, fontSize: '11px' }}>ID: {log.target_id || "—"}</td>
                    <td style={{ ...tdStyle, maxWidth: "300px" }}>
                      <div style={{
                        fontSize: "11px", color: theme.textMuted, background: darkMode ? "#1E293B" : "#F1F5F9",
                        padding: "6px 10px", borderRadius: "8px", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis"
                      }}>
                        {JSON.stringify(log.details)}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {logs.length === 0 && (
                <tr><td colSpan={6} style={{ padding: "60px", textAlign: "center", color: theme.textMuted }}>No security events recorded for this period.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* 👥 Staff Registry Modal (Drawer) */}
      {showRegistry && (
        <div
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", zIndex: 2000, display: "flex", justifyContent: "flex-end" }}
          onClick={() => setShowRegistry(false)}
        >
          <div
            style={{ width: "450px", height: "100%", background: theme.surface, boxShadow: "-10px 0 40px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column" }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: "24px", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>System Staff Registry</h3>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: theme.textMuted }}>Active administrators with platform access</p>
              </div>
              <button onClick={() => setShowRegistry(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "24px", color: theme.textMuted }}>&times;</button>
            </div>
            {/* 🔍 Registry Filters */}
            <div style={{ padding: "16px", borderBottom: `1px solid ${theme.border}`, display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={regSearch}
                  onChange={(e) => setRegSearch(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px 8px 32px", borderRadius: "8px", border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: "12px", outline: "none" }}
                />
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.textMuted} strokeWidth="2.5" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                {["all", "online", "idle", "offline"].map(f => (
                  <button
                    key={f}
                    onClick={() => setRegFilter(f)}
                    style={{
                      padding: "4px 10px", borderRadius: "6px", fontSize: "10px", fontWeight: "700", textTransform: "uppercase",
                      background: regFilter === f ? "var(--primary-color)" : (darkMode ? "rgba(255,255,255,0.05)" : "#F1F5F9"),
                      color: regFilter === f ? "white" : theme.textMuted,
                      border: "none", cursor: "pointer"
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {staff
                  .filter(s => {
                    if (regSearch && !s.name.toLowerCase().includes(regSearch.toLowerCase()) && !s.email.toLowerCase().includes(regSearch.toLowerCase())) return false;
                    const presence = getPresenceInfo(s);
                    if (regFilter === "online" && !presence.isOnline) return false;
                    if (regFilter === "idle" && !presence.isIdle) return false;
                    if (regFilter === "offline" && (presence.isOnline || presence.isIdle)) return false;
                    return true;
                  })
                  .sort((a, b) => {
                    // Online first, then idle, then name
                    const pA = getPresenceInfo(a);
                    const pB = getPresenceInfo(b);
                    if (pA.isOnline && !pB.isOnline) return -1;
                    if (!pA.isOnline && pB.isOnline) return 1;
                    return a.name.localeCompare(b.name);
                  })
                  .map(s => {
                    const isSuper = s.role === "superadmin";
                    const presence = getPresenceInfo(s);
                    const isExpanded = expandedId === s.id;

                    return (
                      <div
                        key={s.id}
                        style={{
                          borderRadius: "10px", border: `1px solid ${isExpanded ? theme.border : "transparent"}`,
                          background: isExpanded ? theme.bg : "transparent", transition: "0.2s", overflow: "hidden"
                        }}
                      >
                        {/* Compact Header */}
                        <div
                          onClick={() => setExpandedId(isExpanded ? null : s.id)}
                          style={{
                            padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between",
                            cursor: "pointer", borderRadius: "8px"
                          }}
                          onMouseEnter={e => !isExpanded && (e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC")}
                          onMouseLeave={e => !isExpanded && (e.currentTarget.style.background = "transparent")}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ position: 'relative' }}>
                              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: isSuper ? "#7C3AED20" : "var(--primary-color)20", color: isSuper ? "#7C3AED" : "var(--primary-color)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontSize: "12px" }}>
                                {s.name.charAt(0)}
                              </div>
                              <div style={{ position: 'absolute', bottom: '-1px', right: '-1px', width: '9px', height: '9px', borderRadius: '50%', background: presence.color, border: `2px solid ${isExpanded ? theme.bg : theme.surface}` }} />
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <p style={{ margin: 0, fontWeight: "700", fontSize: "13px", color: theme.text }}>{s.name}</p>
                                <span style={{ fontSize: "8px", fontWeight: "900", textTransform: "uppercase", padding: "1px 4px", borderRadius: "3px", background: isSuper ? "#7C3AED" : "#64748B", color: "white" }}>
                                  {isSuper ? "Global" : "Program"}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: theme.textMuted }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: presence.color }} />
                                <span>{presence.label} • {presence.lastActive}</span>
                              </div>
                            </div>
                          </div>
                          <div style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "0.2s", color: theme.textMuted }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6" /></svg>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div style={{ padding: "0 12px 12px 54px", borderTop: `1px solid ${theme.border}10` }}>
                            <p style={{ margin: "4px 0 8px", fontSize: "11px", color: theme.textMuted }}>{s.email}</p>

                            {presence.isOnline && (
                              <div style={{ marginBottom: "12px" }}>
                                <p style={{ margin: 0, fontSize: "9px", fontWeight: "800", color: "#94A3B8", textTransform: 'uppercase' }}>Current Activity</p>
                                <p style={{ margin: "2px 0 0", fontSize: "12px", fontWeight: "600", color: "var(--primary-color)" }}>{presence.status}</p>
                              </div>
                            )}

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                              <div>
                                <p style={{ margin: 0, fontSize: "9px", fontWeight: "800", color: "#94A3B8", textTransform: 'uppercase' }}>Scope</p>
                                <p style={{ margin: "2px 0 0", fontSize: "11px", fontWeight: "600" }}>{s.department || "Global"}</p>
                              </div>
                              <div>
                                <p style={{ margin: 0, fontSize: "9px", fontWeight: "800", color: "#94A3B8", textTransform: 'uppercase' }}>Position</p>
                                <p style={{ margin: "2px 0 0", fontSize: "11px", fontWeight: "600" }}>{s.position_title || "Staff"}</p>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                setSearchAdmin(s.name);
                                setShowRegistry(false);
                              }}
                              style={{
                                width: "100%", padding: "6px", borderRadius: "6px", border: `1px solid ${theme.border}`,
                                background: darkMode ? "rgba(255,255,255,0.05)" : "#F8FAFC", color: theme.text, fontSize: "10px", fontWeight: "700",
                                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
                              }}
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                              Trace Activity
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                {staff.length === 0 && <p style={{ textAlign: 'center', padding: '40px', color: theme.textMuted, fontSize: '12px' }}>No staff members found.</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const thStyle = { padding: "12px 16px", textAlign: "left", fontSize: "10px", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em" };
const tdStyle = { padding: "14px 16px", verticalAlign: "middle" };

export default AdminAuditLogs;
