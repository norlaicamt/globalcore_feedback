import React, { useEffect, useRef, useState, useMemo } from "react"; 
import { 
  adminGetUsers, adminToggleUserStatus, 
  adminUpdateUserDetails, adminGetEntities, adminResetPassword,
  adminLogAction
} from "../../../services/adminApi";
import { useTerminology } from "../../../context/TerminologyContext";
import CustomModal from "../../CustomModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

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
// --- COMPONENT: User Actions Dropdown ---
const UserActions = ({ user, onToggle, onReset, onAssign, theme, darkMode, adminUser, hasGlobalAdminAccess }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button 
        onClick={() => setOpen(!open)}
        style={{ width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px", border: `1px solid ${theme.border}`, background: theme.surface, color: theme.textMuted, cursor: "pointer", transition: "0.2s" }}
        onMouseEnter={e => e.currentTarget.style.borderColor = "var(--primary-color)"}
        onMouseLeave={e => e.currentTarget.style.borderColor = theme.border}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "32px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "10px", boxShadow: "0 10px 30px rgba(0,0,0,0.15)", zIndex: 100, minWidth: "180px", padding: "6px" }}>
          {/* Administrative actions for Citizens only */}
          
          <div style={{ paddingBottom: "4px", borderBottom: `1px solid ${theme.border}`, marginBottom: "4px" }}>
             <p style={{ margin: "4px 8px", fontSize: "9px", fontWeight: "800", color: "#94A3B8", textTransform: "uppercase" }}>Account Status</p>
             {user.is_active ? (
               <button onClick={() => { onToggle(user); setOpen(false); }} style={actionItemStyle(theme, darkMode, theme.text)}>
                 Deactivate Account
               </button>
             ) : (
               <button onClick={() => { onToggle(user); setOpen(false); }} style={actionItemStyle(theme, darkMode, theme.text)}>
                 Reactivate Account
               </button>
             )}
          </div>

          <div>
             <p style={{ margin: "4px 8px", fontSize: "9px", fontWeight: "800", color: "#94A3B8", textTransform: "uppercase" }}>Governance</p>
             <button 
               onClick={() => { onAssign(user); setOpen(false); }} 
               style={{ ...actionItemStyle(theme, darkMode, "var(--primary-color)"), fontWeight: "800" }}
             >
               Assign Administrative Role
             </button>
             <button onClick={() => { onReset(user); setOpen(false); }} style={{ ...actionItemStyle(theme, darkMode, theme.textMuted), fontSize: "11px", fontWeight: "600" }}>Send Password Reset Link</button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- COMPONENT: Sort Dropdown ---
const SortDropdown = ({ sortKey, onSort, theme, darkMode }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const options = [
    { id: 'newest', label: 'Newest First' },
    { id: 'oldest', label: 'Oldest First' },
    { id: 'az', label: 'Name (A-Z)' },
    { id: 'za', label: 'Name (Z-A)' }
  ];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button 
        onClick={() => setOpen(!open)} 
        style={{ padding: "8px 16px", background: theme.surface, color: theme.text, border: `1.5px solid ${theme.border}`, borderRadius: "10px", fontSize: "12px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M6 12h12m-9 6h6"/></svg>
        Sort: {options.find(o => o.id === sortKey)?.label}
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "40px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.15)", zIndex: 100, minWidth: "160px", padding: "6px" }}>
          {options.map(o => (
            <button key={o.id} onClick={() => { onSort(o.id); setOpen(false); }} style={{ ...menuItemStyle(theme, darkMode), background: sortKey === o.id ? "var(--primary-color)10" : "none", color: sortKey === o.id ? "var(--primary-color)" : theme.text }}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// --- COMPONENT: Export Dropdown ---
const ExportDropdown = ({ onExport, theme, darkMode }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (format) => { onExport(format); setOpen(false); };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button 
        onClick={() => setOpen(!open)} 
        style={{ padding: "8px 16px", background: theme.surface, color: theme.text, border: `1.5px solid ${theme.border}`, borderRadius: "10px", fontSize: "12px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Export
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "40px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.15)", zIndex: 100, minWidth: "160px", padding: "6px" }}>
          {[
            { id: 'pdf', label: 'PDF Report', icon: '📄' },
            { id: 'xls', label: 'Excel (XLS)', icon: '📊' },
            { id: 'csv', label: 'CSV File', icon: '📑' },
            { id: 'doc', label: 'Word (DOC)', icon: '📝' }
          ].map(fmt => (
            <button key={fmt.id} onClick={() => handleSelect(fmt.id)} style={menuItemStyle(theme, darkMode)}>
              <span style={{ marginRight: "10px" }}>{fmt.icon}</span> {fmt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const menuItemStyle = (theme, darkMode) => ({
  display: "flex", alignItems: "center", width: "100%", padding: "10px 14px", background: "none", border: "none", borderRadius: "8px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: theme.text, cursor: "pointer", fontFamily: "inherit"
});

const actionItemStyle = (theme, darkMode, color) => ({
  display: "block", width: "100%", padding: "8px 12px", background: "none", border: "none", borderRadius: "6px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: color, cursor: "pointer", fontFamily: "inherit"
});

// --- MAIN COMPONENT ---
const AdminUsers = ({ theme, darkMode, adminUser }) => {
  const { getLabel } = useTerminology();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState("newest");
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const [dialog, setDialog] = useState({ isOpen: false });
  const [scopeOptions, setScopeOptions] = useState([]);
  const [entityFilter, setEntityFilter] = useState("all");

  // Reset bulk mode on filter/search change
  useEffect(() => {
    setIsBulkMode(false);
    setSelectedIds([]);
  }, [statusFilter, search, sortKey]);

  const hasGlobalAdminAccess = (adminUser?.role === "superadmin") || (adminUser?.role === "admin" && !adminUser?.entity_id);
  const activeScope = hasGlobalAdminAccess ? "All System" : (adminUser?.department || "Program Scope");

  const load = React.useCallback(() => {
    const targetEntity = entityFilter === "all" ? null : entityFilter;
    Promise.all([adminGetUsers(targetEntity), adminGetEntities()])
      .then(([userData, entityData]) => {
        setUsers(userData);
        setScopeOptions(entityData.map(e => ({ id: e.id, label: e.name })));
      })
      .catch(console.error);
  }, [entityFilter]);

  useEffect(() => { load(); }, [load]);

  const filteredAndSorted = useMemo(() => {
    let result = users.filter(u => {
      // Allow seeing all roles for comprehensive management
      // if (role === "admin" || role === "superadmin") return false;

      if (statusFilter === "active") { if (!u.is_active) return false; }
      else if (statusFilter === "inactive") { if (u.is_active) return false; }

      const s = search.toLowerCase();
      return (u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s));
    });

    // Apply Sorting
    result.sort((a, b) => {
      if (sortKey === "az") return a.name.localeCompare(b.name);
      if (sortKey === "za") return b.name.localeCompare(a.name);
      if (sortKey === "newest") return new Date(b.created_at) - new Date(a.created_at);
      if (sortKey === "oldest") return new Date(a.created_at) - new Date(b.created_at);
      return 0;
    });

    return result;
  }, [users, statusFilter, search, sortKey]);

  const handleToggle = (user) => {
    const isDeactivating = user.is_active;
    setDialog({
      isOpen: true, type: "alert",
      title: isDeactivating ? "Deactivate Account" : "Reactivate Account",
      message: isDeactivating 
        ? `Are you sure you want to deactivate ${user.name}? They will no longer be able to log in or submit feedback.`
        : `Reactivate ${user.name}'s access to the system?`,
      confirmText: isDeactivating ? "Deactivate" : "Reactivate",
      isDestructive: isDeactivating,
      onConfirm: async () => {
        await adminToggleUserStatus(user.id, !user.is_active);
        setDialog({ isOpen: false }); load();
      },
      onCancel: () => setDialog({ isOpen: false }),
    });
  };

  const handleAssignRole = (user) => {
    // Show a dialog with role options and program selection
    const programs = scopeOptions.filter(s => s.id !== "all");
    
    setDialog({
      isOpen: true,
      type: "custom",
      title: `Elevate Governance: ${user.name}`,
      message: "Select the administrative role and operational scope for this account.",
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: theme.textMuted, marginBottom: '6px', textTransform: 'uppercase' }}>Target Role</label>
            <select id="role-select" defaultValue={user.role || "user"} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1.5px solid ${theme.border}`, background: theme.bg, color: theme.text }}>
              <option value="user">Citizen (Standard User)</option>
              <option value="admin">Program Administrator</option>
              <option value="superadmin">System Superadmin (Global)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: theme.textMuted, marginBottom: '6px', textTransform: 'uppercase' }}>Operational Scope ({getLabel('category_label', 'Entity')})</label>
            <select id="scope-select" defaultValue={user.entity_id || ""} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1.5px solid ${theme.border}`, background: theme.bg, color: theme.text }}>
              <option value="">Global / Unassigned</option>
              {programs.length === 0 ? (
                <option disabled>No {getLabel('category_label_plural', 'Entities')} found</option>
              ) : (
                programs.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))
              )}
            </select>
            <p style={{ fontSize: '10px', color: theme.textMuted, marginTop: '4px' }}>Note: Superadmins usually have Global scope.</p>
          </div>
        </div>
      ),
      confirmText: "Update Role & Scope",
      onConfirm: async () => {
        const newRole = document.getElementById("role-select").value;
        const newEntityId = document.getElementById("scope-select").value || null;
        
        // Find program name for metadata
        const prog = programs.find(p => String(p.id) === String(newEntityId));
        
        try {
          await adminUpdateUserDetails(
            user.id, 
            newRole, 
            prog ? prog.label : null, // department/program name
            prog ? prog.label : null, // program name
            newEntityId,
            newRole === 'superadmin' ? 'System Administrator' : 'Program Coordinator'
          );
          setDialog({ isOpen: false });
          load();
        } catch (e) {
          console.error(e);
          alert("Failed to update user role.");
        }
      },
      onCancel: () => setDialog({ isOpen: false })
    });
  };

  const handleResetPassword = (user) => {
    setDialog({
      isOpen: true, type: "alert",
      title: "Reset User Password",
      message: `Send a password reset link to ${user.email}?`,
      confirmText: "Send Link",
      onConfirm: async () => {
        await adminResetPassword(user.id);
        setDialog({
          isOpen: true,
          title: "Reset Link Sent",
          message: `A password reset link has been successfully triggered and sent to ${user.email}.`,
          type: "alert",
          confirmText: "Close",
          onConfirm: () => setDialog({ isOpen: false })
        });
      },
      onCancel: () => setDialog({ isOpen: false }),
    });
  };

  const handleBulkStatus = async (activate) => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    
    setDialog({
      isOpen: true, type: "alert",
      title: activate ? "Bulk Activation" : "Bulk Deactivation",
      message: `You are about to ${activate ? "activate" : "deactivate"} ${count} users. This will ${activate ? "restore" : "restrict"} their access to the system immediately.`,
      confirmText: activate ? "Confirm Activation" : "Confirm Deactivation",
      isDestructive: !activate,
      onConfirm: async () => {
        try {
          await Promise.all(selectedIds.map(id => adminToggleUserStatus(id, activate)));
          setSelectedIds([]);
          setIsBulkMode(false);
          load();
          setDialog({
            isOpen: true,
            title: "Action Successful",
            message: `${count} users have been successfully ${activate ? "activated" : "deactivated"}.`,
            type: "alert",
            confirmText: "Close",
            onConfirm: () => setDialog({ isOpen: false }),
          });
        } catch (e) { 
          console.error(e); 
          setDialog({
            isOpen: true,
            title: "Action Failed",
            message: "There was an error processing the bulk request. Please try again.",
            type: "alert",
            confirmText: "Close",
            onConfirm: () => setDialog({ isOpen: false }),
          });
        }
      },
      onCancel: () => setDialog({ isOpen: false }),
    });
  };

  const handleExport = async (format) => {
    const headers = ["Name", "Email", "Role", "Last Active", "Feedback", "Points", "Status"];
    const data = filteredAndSorted.map(u => [u.name, u.email, u.role, formatRelativeTime(u.last_seen || u.last_login), u.total_posts, u.impact_points, u.is_active ? "Active" : "Inactive"]);
    
    const scopeSlug = activeScope.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `users_${scopeSlug}_${dateStr}_all`;

    // Log the Export Action for Traceability
    try {
      await adminLogAction("export_data", { format, scope: activeScope, count: data.length });
    } catch (e) { console.error("Audit log failed", e); }

    if (format === 'csv') {
      const csv = [headers, ...data].map(r => r.join(",")).join("\n");
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `${filename}.csv`; a.click();
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      doc.text(`User Management Report - ${activeScope}`, 14, 15);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);
      autoTable(doc, { head: [headers], body: data, startY: 28, styles: { fontSize: 8 } });
      doc.save(`${filename}.pdf`);
    } else if (format === 'xls') {
      const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Users");
      XLSX.writeFile(wb, `${filename}.xlsx`);
    } else if (format === 'doc') {
      let html = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>User Report</title></head>
        <body>
          <h2>User Management Report - ${activeScope}</h2>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <table border='1'>
            <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
            <tbody>${data.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
          </table>
        </body></html>
      `;
      const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `${filename}.doc`; a.click();
    }
  };

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      gap: "24px", 
      height: "calc(100vh - 140px)", 
      overflow: "hidden",
      fontSize: 'clamp(11px, 0.85vh + 0.5vw, 14px)'
    }}>
      
      {/* 🛠️ Filters Bar (Fixed) */}
      <div style={{ background: theme.surface, padding: "20px", borderRadius: "16px", border: `1px solid ${theme.border}`, display: "flex", flexDirection: "column", gap: "16px", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
             <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: theme.text }}>
               User Management 
               <span style={{ marginLeft: '12px', fontSize: '12px', color: 'var(--primary-color)', background: 'var(--primary-color)10', padding: '4px 10px', borderRadius: '12px' }}>
                 {users.length} TOTAL
               </span>
             </h2>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flex: 1, justifyContent: "flex-end" }}>
            {!hasGlobalAdminAccess && (
              <div style={{ marginRight: '12px', padding: '8px 16px', background: theme.bg, borderRadius: '10px', fontSize: '11px', fontWeight: '800', color: theme.textMuted, border: `1px solid ${theme.border}` }}>
                SCOPE LOCKED: <span style={{ color: 'var(--primary-color)' }}>{activeScope.toUpperCase()}</span>
              </div>
            )}
            <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
              <svg style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: theme.textMuted }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Search by name, email..." 
                style={{ 
                  padding: "10px 16px 10px 36px", 
                  borderRadius: "10px", 
                  border: `1.5px solid ${theme.border}`, 
                  background: theme.bg, 
                  color: theme.text, 
                  fontSize: "13px", 
                  width: "100%",
                  outline: "none",
                  transition: "0.2s"
                }} 
                onFocus={e => e.currentTarget.style.borderColor = "var(--primary-color)"}
                onBlur={e => e.currentTarget.style.borderColor = theme.border}
              />
            </div>
            <SortDropdown sortKey={sortKey} onSort={setSortKey} theme={theme} darkMode={darkMode} />
            <ExportDropdown onExport={handleExport} theme={theme} darkMode={darkMode} />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${theme.border}`, paddingTop: "16px" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            {["all", "active", "inactive"].map(f => (
              <button key={f} onClick={() => setStatusFilter(f)} style={filterBtnStyle(statusFilter === f, theme)}>
                {f.toUpperCase()}
              </button>
            ))}
          </div>
          
          {isBulkMode && (
            <div style={{ display: "flex", gap: "12px", alignItems: "center", animation: "fadeIn 0.2s ease-out" }}>
              <button 
                onClick={() => {
                  const allVisibleIds = filteredAndSorted.map(u => u.id);
                  if (selectedIds.length === allVisibleIds.length) setSelectedIds([]);
                  else setSelectedIds(allVisibleIds);
                }}
                style={{ ...bulkBtnStyle(theme), borderColor: "var(--primary-color)", color: "var(--primary-color)" }}
              >
                {selectedIds.length === filteredAndSorted.length ? "Deselect All" : "Select All"}
              </button>
              
              <span style={{ fontSize: "12px", fontWeight: "800", color: theme.textMuted }}>
                <span style={{ color: "var(--primary-color)" }}>{selectedIds.length}</span> SELECTED
              </span>

              {selectedIds.length > 0 && (
                <>
                  <button onClick={() => handleBulkStatus(true)} style={{ ...bulkBtnStyle(theme), background: "var(--primary-color)", color: "white", border: "none" }}>Activate</button>
                  <button onClick={() => handleBulkStatus(false)} style={{ ...bulkBtnStyle(theme), background: "#EF4444", color: "white", border: "none" }}>Deactivate</button>
                </>
              )}
              
              <div style={{ width: "1px", height: "16px", background: theme.border, margin: "0 4px" }} />
              
              <button onClick={() => setIsBulkMode(false)} style={{ ...bulkBtnStyle(theme), border: "none", color: "#EF4444" }}>Cancel</button>
            </div>
          )}
        </div>
      </div>

      {/* 📋 Table Container */}
      <div style={{ 
        background: theme.surface, 
        borderRadius: "16px", 
        border: `1px solid ${theme.border}`, 
        overflowY: "auto",
        flex: 1,
        boxShadow: darkMode ? "0 4px 20px rgba(0,0,0,0.2)" : "0 4px 20px rgba(0,0,0,0.03)"
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "#F8FAFC", borderBottom: `1px solid ${theme.border}` }}>
              <th style={{ padding: "14px 20px", width: "80px" }}>
                <div 
                  onClick={() => {
                    if (!isBulkMode) setIsBulkMode(true);
                    else {
                      const allVisibleIds = filteredAndSorted.map(u => u.id);
                      if (selectedIds.length === allVisibleIds.length) setSelectedIds([]);
                      else setSelectedIds(allVisibleIds);
                    }
                  }}
                  style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", color: isBulkMode ? "var(--primary-color)" : theme.textMuted, transition: "0.2s" }}
                >
                  <div style={{ 
                    width: "16px", height: "16px", borderRadius: "4px", border: `2px solid ${isBulkMode ? "var(--primary-color)" : theme.border}`,
                    background: selectedIds.length > 0 ? "var(--primary-color)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center", transition: "0.2s"
                  }}>
                    {selectedIds.length > 0 && (
                      <>
                        {selectedIds.length === filteredAndSorted.length ? (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>
                        ) : (
                          <div style={{ width: "8px", height: "2.5px", background: "white", borderRadius: "1px" }} />
                        )}
                      </>
                    )}
                  </div>
                  <span style={{ fontSize: "10px", fontWeight: "800", textTransform: "uppercase" }}>{isBulkMode ? "Mode" : "Select"}</span>
                </div>
              </th>
              {["User Account", "Last Active", "Governance", "Engagement", "Status", ""].map(h => (
                <th key={h} style={{ padding: "14px 20px", fontSize: "11px", fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.map(u => (
              <tr 
                key={u.id} 
                style={{ 
                  borderBottom: `1px solid #F1F5F9`, 
                  transition: "0.2s",
                  background: selectedIds.includes(u.id) 
                    ? (darkMode ? "rgba(59, 130, 246, 0.15)" : "#E0EFFF") 
                    : (isBulkMode ? (darkMode ? "rgba(255,255,255,0.02)" : "#F8FAFC") : "none")
                }} 
                onMouseEnter={e => { if (!selectedIds.includes(u.id) && !isBulkMode) e.currentTarget.style.background = "#F1F5F9"; }} 
                onMouseLeave={e => { if (!selectedIds.includes(u.id) && !isBulkMode) e.currentTarget.style.background = "none"; }}
              >
                <td style={{ padding: "12px 20px", width: "80px" }}>
                  <div style={{ 
                    opacity: isBulkMode ? 1 : 0, 
                    transform: isBulkMode ? "translateX(0)" : "translateX(-4px)",
                    transition: "all 0.15s ease-out",
                    pointerEvents: isBulkMode ? "auto" : "none",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(u.id)} 
                      onChange={e => setSelectedIds(prev => e.target.checked ? [...prev, u.id] : prev.filter(id => id !== u.id))} 
                      style={{ cursor: "pointer", width: "16px", height: "16px" }}
                    />
                  </div>
                </td>
                <td style={{ padding: "12px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => setProfileUser(u)}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--primary-color)20", color: "var(--primary-color)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "12px" }}>{u.avatar_url ? <img src={u.avatar_url} alt={u.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} /> : u.name?.charAt(0)}</div>
                    <div>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: "#1E293B" }}>{u.name}</p>
                      <p style={{ margin: 0, fontSize: "11px", color: "#64748B" }}>{u.email}</p>
                      <p style={{ margin: "2px 0 0 0", fontSize: "10px", color: theme.textMuted, fontWeight: "600" }}>Joined: {new Date(u.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "12px 20px", fontSize: "12px", color: "#64748B" }}>{formatRelativeTime(u.last_seen || u.last_login)}</td>
                <td style={{ padding: "12px 20px" }}>
                  <p style={{ margin: 0, fontSize: "11px", fontWeight: "800", color: u.role === 'superadmin' ? '#7C3AED' : (u.role === 'admin' ? 'var(--primary-color)' : '#64748B'), textTransform: 'uppercase' }}>
                    {u.role || 'USER'}
                  </p>
                  <p style={{ margin: "2px 0 0 0", fontSize: "12px", fontWeight: "600", color: theme.text }}>
                    {u.entity_name || u.program || (u.role === 'superadmin' ? 'Global System' : 'Standard Access')}
                  </p>
                </td>
                <td style={{ padding: "12px 20px" }}><p style={{ margin: 0, fontSize: "13px", fontWeight: "800", color: theme.text }}>{Math.floor(u.impact_points)}</p><p style={{ margin: 0, fontSize: "9px", color: "#94A3B8" }}>IMPACT SCORE</p></td>
                <td style={{ padding: "12px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: u.is_active ? "var(--primary-color)" : theme.textMuted }} />
                    <span style={{ fontSize: "12px", fontWeight: "700", color: u.is_active ? theme.text : theme.textMuted }}>{u.is_active ? "Active" : "Deactivated"}</span>
                  </div>
                </td>
                <td style={{ padding: "12px 20px", overflow: "visible" }}>
                  <UserActions 
                    user={u} 
                    onToggle={handleToggle} 
                    onReset={handleResetPassword} 
                    onAssign={handleAssignRole}
                    theme={theme} 
                    darkMode={darkMode} 
                    adminUser={adminUser}
                    hasGlobalAdminAccess={hasGlobalAdminAccess}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {profileUser && (
        <div style={modalOverlayStyle} onClick={() => setProfileUser(null)}>
          <div style={{ ...profileModalStyle(theme), width: "400px" }} onClick={e => e.stopPropagation()}>
             <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>User Profile</h3>
                <button onClick={() => setProfileUser(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px" }}>&times;</button>
             </div>
             <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "var(--primary-color)20", color: "var(--primary-color)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: "32px", fontWeight: "900" }}>{profileUser.avatar_url ? <img src={profileUser.avatar_url} alt={profileUser.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} /> : profileUser.name?.charAt(0)}</div>
                <h4 style={{ margin: "0 0 4px 0", fontSize: "18px" }}>{profileUser.name}</h4>
                <p style={{ margin: 0, fontSize: "14px", color: theme.textMuted }}>{profileUser.email}</p>
             </div>
             
             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                 <div style={profileStatStyle(theme)}><p style={statLabel}>Role</p><p style={statVal}>{profileUser.role?.toUpperCase()}</p></div>
                 <div style={profileStatStyle(theme)}><p style={statLabel}>Status</p><p style={{ ...statVal, color: profileUser.is_active ? theme.text : theme.textMuted }}>{profileUser.is_active ? "ACTIVE" : "DEACTIVATED"}</p></div>
                 <div style={profileStatStyle(theme)}><p style={statLabel}>Impact Score</p><p style={statVal}>{profileUser.impact_points}</p></div>
                 <div style={profileStatStyle(theme)}><p style={statLabel}>Assigned Program</p><p style={statVal}>{profileUser.program || "None"}</p></div>
                 <div style={profileStatStyle(theme)}><p style={statLabel}>Total Reports</p><p style={statVal}>{profileUser.total_posts}</p></div>
                 <div style={profileStatStyle(theme)}><p style={statLabel}>Joined Date</p><p style={statVal}>{new Date(profileUser.created_at).toLocaleDateString()}</p></div>
                 <div style={profileStatStyle(theme)}><p style={statLabel}>Last Active</p><p style={statVal}>{formatRelativeTime(profileUser.last_seen || profileUser.last_login)}</p></div>
             </div>
             
             <div style={{ textAlign: "center", padding: "16px", background: theme.bg, borderRadius: "12px", border: `1px dashed ${theme.border}` }}>
               <p style={{ margin: 0, fontSize: "11px", color: theme.textMuted, lineHeight: "1.5" }}>
                 To manage this account (activate, assign, or reset access),<br />
                 use the <strong>actions menu (⋮)</strong> in the user list.
               </p>
             </div>
          </div>
        </div>
      )}

      <CustomModal 
        isOpen={dialog.isOpen} 
        title={dialog.title} 
        message={dialog.message} 
        type={dialog.type} 
        confirmText={dialog.confirmText} 
        isDestructive={dialog.isDestructive} 
        onConfirm={dialog.onConfirm} 
        onCancel={dialog.onCancel} 
        content={dialog.content}
      />
    </div>
  );
};

// --- STYLES ---
const filterBtnStyle = (active, theme) => ({ padding: "6px 12px", borderRadius: "20px", border: `1px solid ${active ? "var(--primary-color)" : theme.border}`, fontSize: "10px", fontWeight: "800", cursor: "pointer", background: active ? "var(--primary-color)10" : "transparent", color: active ? "var(--primary-color)" : theme.textMuted });
const bulkBtnStyle = (theme) => ({ padding: "6px 14px", borderRadius: "10px", border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: "12px", fontWeight: "800", cursor: "pointer", transition: "0.2s" });
const modalOverlayStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const profileModalStyle = (theme) => ({ background: theme.surface, padding: "32px", borderRadius: "20px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)", color: theme.text });
const profileStatStyle = (theme) => ({ padding: "12px", borderRadius: "12px", background: theme.bg, border: `1px solid ${theme.border}` });
const statLabel = { margin: 0, fontSize: "10px", fontWeight: "800", color: "#94A3B8", textTransform: "uppercase" };
const statVal = { margin: 0, fontSize: "14px", fontWeight: "800" };

export default AdminUsers;
