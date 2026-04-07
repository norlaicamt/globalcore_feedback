import React, { useEffect, useState } from "react";
import { adminGetAuditLogs } from "../../../services/adminApi";

const AdminAuditLogs = ({ theme, darkMode, adminUser }) => {
  const hasGlobalAdminAccess = ["admin", "superadmin"].includes(adminUser?.role);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterAction, setFilterAction] = useState("");
  const [searchAdmin, setSearchAdmin] = useState("");

  useEffect(() => {
    adminGetAuditLogs().then(setLogs).catch(console.error).finally(() => setLoading(false));
  }, []);

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
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ background: theme.surface, padding: "18px 20px", borderRadius: "12px", border: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: "700", margin: "0 0 4px" }}>Admin Activity Monitoring</h2>
          <p style={{ fontSize: "12px", color: theme.textMuted, margin: 0 }}>
            {hasGlobalAdminAccess 
              ? "Track and monitor all administrative actions across the entire platform."
              : `Track administrative actions within the ${adminUser?.department} department.`}
          </p>
        </div>
        
        {/* Filters */}
        <div style={{ display: "flex", gap: "12px" }}>
          <input 
            type="text" 
            placeholder="Search Admin Name..." 
            value={searchAdmin}
            onChange={(e) => setSearchAdmin(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "8px", border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: "12px", outline: "none", width: "180px" }}
          />
          <select 
            value={filterAction} 
            onChange={(e) => setFilterAction(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "8px", border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: "12px", outline: "none", cursor: "pointer" }}
          >
            <option value="">All Actions</option>
            {uniqueActions.map(action => (
              <option key={action} value={action}>{getActionData(action).text}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ background: theme.surface, borderRadius: "12px", border: `1px solid ${theme.border}`, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: theme.textMuted }}>Loading audit trail...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: darkMode ? "rgba(255,255,255,0.02)" : "#F8FAFC", borderBottom: `1px solid ${theme.border}` }}>
                {["Timestamp", "Admin", "Action", "Severity", "Target", "Details"].map(h => (
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

                return (
                  <tr key={log.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                    <td style={{ ...tdStyle, whiteSpace: "nowrap", color: theme.textMuted }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: "600", color: theme.text }}>{log.performed_by?.name || "System"}</div>
                      <div style={{ fontSize: "10px", color: theme.textMuted }}>{log.performed_by?.email}</div>
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
                    <td style={{ ...tdStyle, color: theme.textMuted }}>ID: {log.target_id || "—"}</td>
                    <td style={{ ...tdStyle, maxWidth: "300px" }}>
                      <code style={{ fontSize: "11px", color: theme.textMuted, background: darkMode ? "#1E293B" : "#F1F5F9", padding: "2px 4px", borderRadius: "4px" }}>
                        {JSON.stringify(log.details)}
                      </code>
                    </td>
                  </tr>
                );
              })}
              {logs.length === 0 && (
                <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: theme.textMuted }}>No audit logs recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const thStyle = { padding: "12px 16px", textAlign: "left", fontSize: "10px", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em" };
const tdStyle = { padding: "14px 16px", verticalAlign: "middle" };

export default AdminAuditLogs;
