import React, { useEffect, useRef, useState } from "react";
import { 
  adminGetUsers, adminToggleUserStatus, adminDeleteUser, adminUpdateUserRole, 
  adminUpdateUserDetails, adminGetScopeOptions
} from "../../../services/adminApi";
import { useTerminology } from "../../../context/TerminologyContext";
import CustomModal from "../../CustomModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// 3-dot dropdown menu component
const DotsMenu = ({ user, onToggle, onDelete, onRoleChange, theme, darkMode, adminUser }) => {
  const hasGlobalAdminAccess = adminUser?.role === "superadmin" || (adminUser?.role === "admin" && !adminUser?.entity_id);
  const isGlobalCoreAdmin = (adminUser?.email || "").toLowerCase() === "admin@globalcore.com";
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
          
          {user.role === "user" && hasGlobalAdminAccess && isGlobalCoreAdmin ? (
            <button
              onClick={() => { onRoleChange(user, "admin"); setOpen(false); }}
              style={{ ...menuItemStyle, color: "#3B82F6" }}
              onMouseEnter={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.05)" : "#F1F5F9"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              Promote to Admin
            </button>
          ) : user.role === "admin" && hasGlobalAdminAccess && isGlobalCoreAdmin && (
            <button
              onClick={() => { onRoleChange(user, "user"); setOpen(false); }}
              style={{ ...menuItemStyle, color: "#64748B" }}
              onMouseEnter={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.05)" : "#F1F5F9"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              Demote to User
            </button>
          )}

          {hasGlobalAdminAccess && isGlobalCoreAdmin && (
            <>
              <div style={{ height: "1px", background: theme.border, margin: "4px 0" }} />
              <button
                onClick={() => { onDelete(user); setOpen(false); }}
                style={{ ...menuItemStyle, color: "#EF4444" }}
                onMouseEnter={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.05)" : "#F1F5F9"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                Delete Account
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// --- EXPORT DROPDOWN COMPONENT ---
const ExportDropdown = ({ onExport, theme, darkMode }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (format) => {
    onExport(format);
    setOpen(false);
  };

  const btnStyle = { padding: "8px 16px", background: theme.surface, color: theme.text, border: `1.5px solid ${theme.border}`, borderRadius: "8px", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "8px" };

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button onClick={() => setOpen(!open)} style={btnStyle}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Export
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "40px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.15)", zIndex: 100, minWidth: "160px", padding: "6px" }}>
          {[
            { id: 'pdf', label: 'PDF Report', icon: '📄' },
            { id: 'xls', label: 'Excel (XLS)', icon: '📊' },
            { id: 'doc', label: 'Word (DOC)', icon: '📝' },
            { id: 'csv', label: 'CSV (Legacy)', icon: '📑' }
          ].map(fmt => (
            <button
              key={fmt.id}
              onClick={() => handleSelect(fmt.id)}
              style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px 14px", background: "none", border: "none", borderRadius: "8px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: theme.text, cursor: "pointer", fontFamily: "inherit" }}
              onMouseEnter={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.05)" : "#F1F5F9"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              <span>{fmt.icon}</span> {fmt.label}
            </button>
          ))}
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

const AdminUsers = ({ theme, darkMode, adminUser }) => {
  const { getLabel } = useTerminology();
  const hasGlobalAdminAccess = adminUser?.role === "superadmin" || (adminUser?.role === "admin" && !adminUser?.entity_id);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleTab, setRoleTab] = useState("user");
  const [draftByUser, setDraftByUser] = useState({});
  const [savingByUser, setSavingByUser] = useState({});
  const [dialog, setDialog] = useState({ isOpen: false });
  const [deptModal, setDeptModal] = useState({ isOpen: false, user: null });
  const [scopeOptions, setScopeOptions] = useState([]);
  
  const load = () => {
    setLoading(true);
    Promise.all([adminGetUsers(), adminGetScopeOptions()])
      .then(([userData, scopeData]) => {
        setUsers(userData);
        setScopeOptions(scopeData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = users
    .filter(u => 
      u.onboarding_completed === true && 
      u.first_name && 
      u.last_name && 
      u.city
    )
    .filter(u => {
      const role = (u.role || "user").toLowerCase();
      if (roleTab === "admin") return role === "admin" || role === "superadmin";
      return role === "user" || role === "maker";
    })
    .filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.entity_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.position_title?.toLowerCase().includes(search.toLowerCase())
  );

  const getDraft = (user) => draftByUser[user.id] || { entity_id: user.entity_id || "" };
  const setDraftField = (userId, key, value) => {
    setDraftByUser((prev) => ({ ...prev, [userId]: { ...(prev[userId] || {}), [key]: value } }));
  };

  const saveEntity = async (user) => {
    const draft = getDraft(user);
    setSavingByUser((p) => ({ ...p, [user.id]: true }));
    try {
      await adminUpdateUserDetails(user.id, undefined, undefined, undefined, draft.entity_id || "");
      load();
    } finally {
      setSavingByUser((p) => ({ ...p, [user.id]: false }));
    }
  };

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

  const handleRoleChange = (user, newRole) => {
    if (newRole === "admin") {
      setDeptModal({ isOpen: true, user });
      return;
    }

    setDialog({
      isOpen: true, type: "alert",
      title: "Update User Role",
      message: `Change ${user.name}'s role to ${newRole.toUpperCase()}?`,
      confirmText: "Update Role",
      onConfirm: async () => {
        await adminUpdateUserRole(user.id, newRole);
        setDialog({ isOpen: false }); load();
      },
      onCancel: () => setDialog({ isOpen: false }),
    });
  };

  const handlePromoteWithEntity = async (user, entityObj) => {
    if (!entityObj) return;
    setDeptModal({ isOpen: false, user: null });
    setLoading(true);
    try {
      await adminUpdateUserDetails(user.id, "admin", undefined, undefined, entityObj.id);
      load();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
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

  const handleExport = (format) => {
    const headers = ["ID", "Name", "Email", "Role", "Position", getLabel("category_label", "Program"), "Created Date", "Status", "Posts", "Impact Points"];
    const data = filtered.map((u, idx) => {
      const createdDate = u.created_at ? new Date(u.created_at).toLocaleString() : "—";
      return [
        idx + 1,
        u.name || "—",
        u.email || "—",
        u.role_identity && u.role_identity !== "Others" ? u.role_identity : (u.role || "user"),
        u.position_title || "—",
        u.entity_name || "—",
        createdDate,
        u.is_active ? "Active" : "Inactive",
        u.total_posts || 0,
        u.impact_points || 0
      ];
    });

    if (format === 'csv') {
      const csvContent = [headers, ...data].map(r => r.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `users_${new Date().getTime()}.csv`);
      link.click();
    } else if (format === 'xls') {
      const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
      
      const colWidths = headers.map((h, i) => {
        const longest = data.reduce((acc, row) => Math.max(acc, String(row[i]).length), h.length);
        return { wch: longest + 5 };
      });
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Users");
      XLSX.writeFile(wb, `users_report_${new Date().getTime()}.xlsx`);
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      
      doc.setFillColor(31, 42, 86);
      doc.rect(0, 0, 210, 25, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text("USER OVERSIGHT AUDIT", 14, 17);
      
      doc.setFontSize(8);
      doc.setTextColor(200, 200, 200);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 160, 17);

      autoTable(doc, {
        head: [headers],
        body: data,
        startY: 30,
        margin: { horizontal: 14 },
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [31, 42, 86], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        didDrawPage: (data) => {
          const str = "Page " + doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
        }
      });
      doc.save(`users_audit_${new Date().getTime()}.pdf`);
    } else if (format === 'doc') {
      let html = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>User Oversight Report</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 20px; }
          h1 { color: var(--primary-color); border-bottom: 2px solid #3b82f6; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: var(--primary-color); color: white; text-align: left; padding: 12px; }
          td { border-bottom: 1px solid #e2e8f0; padding: 10px; font-size: 11px; }
        </style>
        </head>
        <body>
          <h1>USER OVERSIGHT REPORT</h1>
          <p>Exported: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${data.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;
      const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `users_report_${new Date().getTime()}.doc`;
      link.click();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: "10px", alignItems: "center", background: theme.surface, padding: "14px 16px", borderRadius: "12px", border: `1px solid ${theme.border}` }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder={`Search ${roleTab} accounts...`}
          style={{ ...inputStyle, background: theme.bg, color: theme.text, border: `1.5px solid ${theme.border}` }}
        />
        <div style={{ display: "flex", background: theme.bg, borderRadius: "8px", border: `1px solid ${theme.border}`, padding: "3px", gap: "4px" }}>
          {["user", "admin"].map(tab => (
            <button
              key={tab}
              onClick={() => setRoleTab(tab)}
              style={{
                padding: "6px 12px",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "700",
                fontFamily: "inherit",
                background: roleTab === tab ? "var(--primary-color)" : "transparent",
                color: roleTab === tab ? "#fff" : theme.textMuted
              }}
            >
              {tab === "user" ? "User" : "Admin"}
            </button>
          ))}
        </div>
        <ExportDropdown onExport={handleExport} theme={theme} darkMode={darkMode} />
      </div>

      {/* Table */}
      <div
        style={{
          background: theme.surface,
          borderRadius: "12px",
          border: `1px solid ${theme.border}`,
          overflow: "auto",
          minHeight: "560px",
        }}
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: theme.textMuted, fontSize: "13px" }}>Loading users...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: darkMode ? "rgba(255,255,255,0.02)" : "#F8FAFC", borderBottom: `1px solid ${theme.border}` }}>
                {["#", "Name", "Email", "Role", "Position", getLabel("category_label", "Program"), "Created Date", "Posts", "Points", "Status", ""].map(h => (
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
                        : <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "var(--primary-color)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "12px", flexShrink: 0 }}>{u.name?.charAt(0)}</div>}
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
                  <td style={tdStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "11px", fontWeight: "600", color: theme.textMuted }}>
                        {u.role_identity && u.role_identity !== "Others" ? u.role_identity : "Member"}
                      </span>
                      {u.is_global_user && (
                        <span style={{
                          padding: "2px 6px", borderRadius: "5px", fontSize: "9px", fontWeight: "900", textTransform: "uppercase",
                          background: '#F0FDF4', color: '#15803D', border: '1px solid #DCFCE7'
                        }}>
                          Beneficiary
                        </span>
                      )}
                      {(u.role === 'admin' || u.role === 'superadmin') && (
                        <span style={{
                          padding: "2px 6px", borderRadius: "5px", fontSize: "9px", fontWeight: "900", textTransform: "uppercase",
                          background: u.role === 'superadmin' ? '#FAF5FF' : '#EFF6FF',
                          color: u.role === 'superadmin' ? '#9333EA' : '#3B82F6',
                          border: `1px solid ${u.role === 'superadmin' ? '#F3E8FF' : '#DBEAFE'}`
                        }}>
                          {u.role}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ ...tdStyle, color: theme.textMuted }}>{u.position_title || "—"}</td>
                  <td style={{ ...tdStyle, color: theme.textMuted }}>
                    {u.entity_name || "—"}
                  </td>
                  <td style={{ ...tdStyle, color: theme.textMuted, whiteSpace: 'nowrap' }}>
                    {u.created_at ? (
                      <div>
                        <div>{new Date(u.created_at).toLocaleDateString()}</div>
                        <div style={{ fontSize: '10px', opacity: 0.6 }}>{new Date(u.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    ) : "—"}
                  </td>
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
                    <DotsMenu 
                      user={u} onToggle={handleToggle} onDelete={handleDelete} 
                      onRoleChange={handleRoleChange}
                      theme={theme} darkMode={darkMode} adminUser={adminUser} 
                    />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ padding: "32px", textAlign: "center", color: theme.textMuted, fontSize: "13px" }}>No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <CustomModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type}
        confirmText={dialog.confirmText} isDestructive={dialog.isDestructive}
        onConfirm={dialog.onConfirm} onCancel={dialog.onCancel} />

      {deptModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: theme.surface, padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '800', color: theme.text }}>Assign to {getLabel("category_label", "Program")}</h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: theme.textMuted }}>Select the {getLabel("category_label", "program")} or functional unit that <strong>{deptModal.user?.name}</strong> will manage as an administrator.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
              {scopeOptions.map(opt => (
                <button 
                  key={opt.id} 
                  onClick={() => handlePromoteWithEntity(deptModal.user, opt)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: darkMode ? 'rgba(255,255,255,0.03)' : '#F8FAFC', border: `1.5px solid ${theme.border}`, borderRadius: '12px', color: theme.text, fontSize: '14px', fontWeight: '600', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#3B82F6'; e.currentTarget.style.background = darkMode ? 'rgba(59, 130, 246, 0.05)' : '#EFF6FF'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.03)' : '#F8FAFC'; }}
                >
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 21h18M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7M4 7l2-4h12l2 4"/></svg>
                  </div>
                  {opt.name}
                </button>
              ))}
            </div>

            <button 
              onClick={() => setDeptModal({ isOpen: false, user: null })}
              style={{ width: '100%', marginTop: '20px', padding: '12px', background: 'none', border: 'none', color: theme.textMuted, fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const inputStyle = { flex: 1, padding: "8px 12px", border: "1.5px solid #E2E8F0", borderRadius: "8px", fontSize: "13px", outline: "none", fontFamily: "inherit", color: "#1E293B" };
const outlineBtn = { padding: "8px 16px", background: "white", color: "var(--primary-color)", border: "1.5px solid #CBD5E1", borderRadius: "8px", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" };
const thStyle = { padding: "11px 14px", textAlign: "left", fontSize: "10px", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" };
const tdStyle = { padding: "11px 14px", verticalAlign: "middle" };

export default AdminUsers;
