import React, { useEffect, useRef, useState } from "react";
import { adminGetUsers, adminToggleUserStatus, adminDeleteUser } from "../../../services/adminApi";
import CustomModal from "../../CustomModal";

// 3-dot dropdown menu component
const DotsMenu = ({ user, onToggle, onDelete, theme, darkMode }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", background: open ? (darkMode ? "rgba(255,255,255,0.1)" : "#F1F5F9") : "transparent", border: "1px solid transparent", borderRadius: "6px", cursor: "pointer", color: theme.textMuted, fontFamily: "inherit", transition: "all 0.15s" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
        </svg>
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "34px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 100, minWidth: "150px", padding: "4px" }}>
          <button
            onClick={() => { onToggle(user); setOpen(false); }}
            style={{ ...menuItemStyle, color: theme.text }}
            onMouseEnter={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.05)" : "#F1F5F9"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          >
            {user.is_active ? "Deactivate" : "Activate"}
          </button>
          <div style={{ height: "1px", background: theme.border, margin: "4px 0" }} />
          <button
            onClick={() => { onDelete(user); setOpen(false); }}
            style={{ ...menuItemStyle, color: "#EF4444" }}
            onMouseEnter={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.05)" : "#F1F5F9"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          >
            Delete Account
          </button>
        </div>
      )}
    </div>
  );
};

const menuItemStyle = {
  display: "block", width: "100%", padding: "8px 12px", background: "none", border: "none",
  borderRadius: "7px", textAlign: "left", fontSize: "12px", fontWeight: "600",
  color: "#374151", cursor: "pointer", fontFamily: "inherit", transition: "background 0.1s",
};

const AdminUsers = ({ theme, darkMode }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState({ isOpen: false });

  const load = () => adminGetUsers().then(setUsers).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.department?.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = (user) => {
    setDialog({
      isOpen: true, type: "alert",
      title: user.is_active ? "Deactivate Account" : "Reactivate Account",
      message: `Are you sure you want to ${user.is_active ? "deactivate" : "reactivate"} ${user.name}'s account?`,
      confirmText: user.is_active ? "Deactivate" : "Reactivate",
      isDestructive: user.is_active,
      onConfirm: async () => {
        await adminToggleUserStatus(user.id, !user.is_active);
        setDialog({ isOpen: false }); load();
      },
      onCancel: () => setDialog({ isOpen: false }),
    });
  };

  const handleDelete = (user) => {
    setDialog({
      isOpen: true, type: "alert", title: "Delete Account",
      message: `Permanently delete ${user.name}'s account? All their data will be removed.`,
      confirmText: "Delete", isDestructive: true,
      onConfirm: async () => {
        await adminDeleteUser(user.id);
        setDialog({ isOpen: false }); load();
      },
      onCancel: () => setDialog({ isOpen: false }),
    });
  };

  const exportCSV = () => {
    const rows = [["ID", "Name", "Email", "Department", "Status", "Posts", "Impact Points"]];
    filtered.forEach(u => rows.push([
      u.id, u.name, u.email, u.department || "", u.is_active ? "Active" : "Inactive",
      u.total_posts, u.impact_points
    ]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv," + encodeURIComponent(csv);
    a.download = "users.csv"; a.click();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: "10px", alignItems: "center", background: theme.surface, padding: "14px 16px", borderRadius: "12px", border: `1px solid ${theme.border}` }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, or department..."
          style={{ ...inputStyle, background: theme.bg, color: theme.text, border: `1.5px solid ${theme.border}` }}
        />
        <button onClick={exportCSV} style={{ ...outlineBtn, background: theme.surface, color: theme.text, borderColor: theme.border }}>Export CSV</button>
      </div>

      {/* Table */}
      <div style={{ background: theme.surface, borderRadius: "12px", border: `1px solid ${theme.border}`, overflow: "auto" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: theme.textMuted, fontSize: "13px" }}>Loading users...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: darkMode ? "rgba(255,255,255,0.02)" : "#F8FAFC", borderBottom: `1px solid ${theme.border}` }}>
                {["#", "Name", "Email", "Department", "Posts", "Impact Points", "Status", ""].map(h => (
                  <th key={h} style={{ ...thStyle, color: theme.textMuted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${theme.border}` }}
                  onMouseEnter={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.02)" : "#FAFAFA"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={tdStyle}>{i + 1}</td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {u.avatar_url
                        ? <img src={u.avatar_url} alt={u.name} style={{ width: "30px", height: "30px", borderRadius: "50%", objectFit: "cover", border: `1px solid ${theme.border}` }} />
                        : <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#1f2a56", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "12px", flexShrink: 0 }}>{u.name?.charAt(0)}</div>}
                      <span style={{ fontWeight: "600", color: theme.text, display: "flex", alignItems: "center", gap: "4px" }}>
                        {u.name}
                        {u.impact_points >= 200 && (
                          <span title="Certified User (200+ pts)" style={{ color: "#3B82F6", display: "flex", alignItems: "center" }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          </span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, color: theme.textMuted }}>{u.email}</td>
                  <td style={{ ...tdStyle, color: theme.textMuted }}>{u.department || "—"}</td>
                  <td style={{ ...tdStyle, fontWeight: "600", color: theme.text }}>{u.total_posts}</td>
                  <td style={{ ...tdStyle, fontWeight: "800", color: "#10B981" }}>+{u.impact_points ?? 0}</td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600",
                      background: u.is_active ? (darkMode ? "rgba(16, 185, 129, 0.1)" : "#F0FDF4") : (darkMode ? "rgba(239, 68, 68, 0.1)" : "#FEF2F2"),
                      color: u.is_active ? (darkMode ? "#10B981" : "#15803D") : (darkMode ? "#F87171" : "#B91C1C")
                    }}>
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    <DotsMenu user={u} onToggle={handleToggle} onDelete={handleDelete} theme={theme} darkMode={darkMode} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: "32px", textAlign: "center", color: theme.textMuted, fontSize: "13px" }}>No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <CustomModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type}
        confirmText={dialog.confirmText} isDestructive={dialog.isDestructive}
        onConfirm={dialog.onConfirm} onCancel={dialog.onCancel} />
    </div>
  );
};

const inputStyle = { flex: 1, padding: "8px 12px", border: "1.5px solid #E2E8F0", borderRadius: "8px", fontSize: "13px", outline: "none", fontFamily: "inherit", color: "#1E293B" };
const outlineBtn = { padding: "8px 16px", background: "white", color: "#1f2a56", border: "1.5px solid #CBD5E1", borderRadius: "8px", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" };
const thStyle = { padding: "11px 14px", textAlign: "left", fontSize: "10px", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" };
const tdStyle = { padding: "11px 14px", verticalAlign: "middle" };

export default AdminUsers;
