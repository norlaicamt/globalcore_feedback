import React, { useEffect, useRef, useState } from "react";
import { adminGetFeedbacks, adminDeleteFeedback, adminUpdateFeedbackStatus } from "../../../services/adminApi";
import { useTerminology } from "../../../context/TerminologyContext";
import CustomModal from "../../CustomModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// --- CONFIG: Workflow Definitions ---
const STATUSES = {
  OPEN: { 
    label: "New", color: "#3B82F6", bg: "rgba(59, 130, 246, 0.1)", 
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
  },
  IN_PROGRESS: { 
    label: "In Review", color: "#EAB308", bg: "rgba(234, 179, 8, 0.1)", 
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
  },
  RESOLVED: { 
    label: "Resolved", color: "#10B981", bg: "rgba(16, 185, 129, 0.1)", 
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
  },
  CLOSED: { 
    label: "Closed", color: "#64748B", bg: "rgba(100, 116, 139, 0.1)", 
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
  }
};

// --- COMPONENT: Side Detail Panel ---
const FeedbackSidePanel = ({ feedback, onClose, onUpdateStatus, theme, darkMode }) => {
  if (!feedback) return null;

  const currentStatus = STATUSES[feedback.status] || STATUSES.OPEN;

  return (
    <div style={{ position: "fixed", right: 0, top: 0, width: "420px", height: "100vh", background: theme.surface, borderLeft: `1px solid ${theme.border}`, boxShadow: "-10px 0 30px rgba(0,0,0,0.1)", zIndex: 1000, display: "flex", flexDirection: "column", animation: "slideIn 0.3s ease-out" }}>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
      
      {/* Header */}
      <div style={{ padding: "24px", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "16px", color: theme.text }}>Submission Details</h3>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: theme.textMuted }}>ID: #{feedback.id}</p>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: theme.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
        <div style={{ marginBottom: "24px" }}>
           <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", color: currentStatus.color, background: currentStatus.bg }}>
             {currentStatus.label.toUpperCase()}
           </span>
        </div>

        <h4 style={{ fontSize: "14px", color: theme.textMuted, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Message</h4>
        <p style={{ fontSize: "15px", lineHeight: "1.6", color: theme.text, background: theme.bg, padding: "16px", borderRadius: "12px", margin: "0 0 24px" }}>
          {feedback.description}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
          <div>
            <h4 style={{ fontSize: "11px", color: theme.textMuted, marginBottom: "4px", textTransform: "uppercase" }}>Rating</h4>
            <div style={{ fontSize: "14px", fontWeight: "700", color: theme.text, display: "flex", alignItems: "center", gap: "4px" }}>
              {feedback.rating ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#FBBF24" stroke="#FBBF24" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  {feedback.rating} / 5
                </>
              ) : "—"}
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: "11px", color: theme.textMuted, marginBottom: "4px", textTransform: "uppercase" }}>Date Submitted</h4>
            <div style={{ fontSize: "14px", fontWeight: "600", color: theme.text }}>{new Date(feedback.created_at).toLocaleDateString()}</div>
          </div>
          <div>
            <h4 style={{ fontSize: "11px", color: theme.textMuted, marginBottom: "4px", textTransform: "uppercase" }}>Submitted By</h4>
            <div style={{ fontSize: "14px", fontWeight: "600", color: theme.text }}>{feedback.user_name || "Anonymous"}</div>
          </div>
          <div>
            <h4 style={{ fontSize: "11px", color: theme.textMuted, marginBottom: "4px", textTransform: "uppercase" }}>Location</h4>
            <div style={{ fontSize: "14px", fontWeight: "600", color: theme.text }}>{feedback.dept_name || "General"}</div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: "24px", marginTop: "24px" }}>
          <h4 style={{ fontSize: "14px", color: theme.text, marginBottom: "12px" }}>Update Workflow</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {Object.entries(STATUSES).map(([key, cfg]) => (
              <button
                key={key}
                disabled={feedback.status === key}
                onClick={() => onUpdateStatus(feedback.id, key)}
                style={{
                  padding: "10px", borderRadius: "8px", border: `1px solid ${feedback.status === key ? cfg.color : theme.border}`,
                  background: feedback.status === key ? cfg.bg : "none", color: feedback.status === key ? cfg.color : theme.text,
                  fontSize: "12px", fontWeight: "600", cursor: feedback.status === key ? "default" : "pointer",
                  textAlign: "left", display: "flex", alignItems: "center", gap: "8px", transition: "0.2s"
                }}
                onMouseEnter={e => { if (feedback.status !== key) e.currentTarget.style.borderColor = cfg.color; }}
                onMouseLeave={e => { if (feedback.status !== key) e.currentTarget.style.borderColor = theme.border; }}
              >
                <span>{cfg.icon}</span> {cfg.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: "24px", marginTop: "24px" }}>
          <h4 style={{ fontSize: "14px", color: theme.text, marginBottom: "8px" }}>Internal Notes</h4>
          <textarea 
            placeholder="Add internal note for coordination... (Coming soon)"
            disabled
            style={{ width: "100%", height: "80px", padding: "12px", borderRadius: "10px", border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: "13px", resize: "none", opacity: 0.6 }}
          />
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT: 3-dot Menu ---
const DotsMenu = ({ onUpdateStatus, onDelete, theme, darkMode, currentStatus }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", borderRadius: "6px", cursor: "pointer", color: theme.textMuted }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "34px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 100, minWidth: "160px", padding: "6px" }}>
          <p style={{ margin: "4px 8px 8px", fontSize: "9px", fontWeight: "800", color: theme.textMuted, textTransform: "uppercase" }}>Change Status</p>
          {Object.entries(STATUSES).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => { onUpdateStatus(key); setOpen(false); }}
              style={{ display: "block", width: "100%", padding: "8px 12px", background: "none", border: "none", borderRadius: "7px", textAlign: "left", fontSize: "12px", fontWeight: currentStatus === key ? "700" : "500", color: currentStatus === key ? cfg.color : theme.text, cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.05)" : "#F1F5F9"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              {cfg.label}
            </button>
          ))}
          <div style={{ margin: "6px 0", borderTop: `1px solid ${theme.border}` }} />
          <button onClick={() => { onDelete(); setOpen(false); }} style={{ display: "block", width: "100%", padding: "8px 12px", background: "none", border: "none", borderRadius: "7px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#EF4444", cursor: "pointer" }}>Delete Permanent</button>
        </div>
      )}
    </div>
  );
};

// --- COMPONENT: Summary Card ---
const SummaryCard = ({ label, count, color, bg, icon, isActive, onClick, theme }) => (
  <div 
    onClick={onClick}
    style={{ flex: 1, padding: "16px 20px", background: theme.surface, borderRadius: "14px", border: `1px solid ${isActive ? color : theme.border}`, boxShadow: isActive ? `0 4px 20px ${bg}` : "none", cursor: "pointer", transition: "0.2s", display: "flex", justifyContent: "space-between", alignItems: "center" }}
  >
    <div>
      <p style={{ margin: 0, fontSize: "12px", fontWeight: "700", color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
      <p style={{ margin: "4px 0 0", fontSize: "24px", fontWeight: "800", color: theme.text }}>{count}</p>
    </div>
    <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
      {icon}
    </div>
  </div>
);

// --- COMPONENT: Export Dropdown ---
const ExportDropdown = ({ onExport, theme, darkMode }) => {
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
        style={{ 
          display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", 
          background: theme.surface, color: theme.text, border: `1.5px solid ${theme.border}`, 
          borderRadius: "10px", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "0.2s" 
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = "var(--primary-color)"}
        onMouseLeave={e => e.currentTarget.style.borderColor = theme.border}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Export
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "42px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.15)", zIndex: 100, minWidth: "160px", padding: "6px" }}>
          {[
            { id: 'pdf', label: 'PDF Report', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg> },
            { id: 'xls', label: 'Excel (XLS)', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg> },
            { id: 'csv', label: 'CSV (Legacy)', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg> }
          ].map(fmt => (
            <button
              key={fmt.id}
              onClick={() => { onExport(fmt.id); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px 14px", background: "none", border: "none", borderRadius: "8px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: theme.text, cursor: "pointer" }}
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

const AdminFeedbacks = ({ theme, darkMode, adminUser }) => {
  const { getLabel } = useTerminology();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("ALL"); // ALL, OPEN, IN_PROGRESS, RESOLVED, CLOSED
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [dialog, setDialog] = useState({ isOpen: false });

  const load = () => {
    setLoading(true);
    adminGetFeedbacks({ limit: 200 }).then(setFeedbacks).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [adminUser]);

  const handleUpdateStatus = async (id, status) => {
    try {
      await adminUpdateFeedbackStatus(id, status);
      load();
      if (selectedFeedback?.id === id) setSelectedFeedback(prev => ({ ...prev, status }));
    } catch (e) { console.error(e); }
  };

  const filtered = feedbacks.filter(f => {
    const tabMatch = activeTab === "ALL" || f.status === activeTab;
    const searchMatch = !search || 
      f.description?.toLowerCase().includes(search.toLowerCase()) ||
      f.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      f.entity_name?.toLowerCase().includes(search.toLowerCase());
    return tabMatch && searchMatch;
  });

  const stats = {
    TOTAL: feedbacks.length,
    OPEN: feedbacks.filter(f => f.status === "OPEN").length,
    IN_PROGRESS: feedbacks.filter(f => f.status === "IN_PROGRESS").length,
    RESOLVED: feedbacks.filter(f => f.status === "RESOLVED").length,
  };

  const handleDelete = (fb) => {
    setDialog({
      isOpen: true, type: "alert", title: `Delete ${getLabel("feedback_label", "Feedback")}`,
      message: `Permanently delete this submission? This cannot be undone.`,
      confirmText: "Delete Permanent", isDestructive: true,
      onConfirm: async () => { await adminDeleteFeedback(fb.id); setDialog({ isOpen: false }); load(); },
      onCancel: () => setDialog({ isOpen: false }),
    });
  };

  const handleExport = (format) => {
    const headers = ["ID", "Program", "Location", "Author", "Rating", "Status", "Date"];
    const data = filtered.map(f => [
      f.id,
      f.entity_name || "General",
      f.dept_name || "—",
      f.user_name || "Anonymous",
      f.rating ? `${f.rating}/5` : "—",
      STATUSES[f.status]?.label || f.status,
      f.created_at?.split("T")[0]
    ]);

    if (format === 'csv') {
      const csv = [headers, ...data].map(r => r.join(",")).join("\n");
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = `submissions_export.csv`; link.click();
    } else if (format === 'xls') {
      const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Submissions");
      XLSX.writeFile(wb, `submissions_report.xlsx`);
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      autoTable(doc, { head: [headers], body: data });
      doc.save("submissions_report.pdf");
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
      {/* Status Workflow Tabs (Fixed) */}
      <div style={{ display: "flex", gap: "8px", borderBottom: `1px solid ${theme.border}`, paddingBottom: "2px", marginBottom: "0", flexShrink: 0 }}>
        {[
          { key: "ALL", label: "All Submissions", count: stats.TOTAL },
          { key: "OPEN", label: "New", count: stats.OPEN, color: "#3B82F6" },
          { key: "IN_PROGRESS", label: "In Review", count: stats.IN_PROGRESS, color: "#EAB308" },
          { key: "RESOLVED", label: "Resolved", count: stats.RESOLVED, color: "#10B981" },
          { key: "CLOSED", label: "Closed", count: feedbacks.filter(f => f.status === "CLOSED").length, color: "#64748B" }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "10px 16px", background: "none", border: "none", cursor: "pointer",
              fontSize: "13px", fontWeight: activeTab === tab.key ? "700" : "500",
              color: activeTab === tab.key ? (tab.color || "var(--primary-color)") : theme.textMuted,
              position: "relative", transition: "0.2s", display: "flex", alignItems: "center", gap: "8px"
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{ 
                fontSize: "10px", padding: "2px 6px", borderRadius: "10px", 
                background: activeTab === tab.key ? (tab.color || "var(--primary-color)") : theme.bg,
                color: activeTab === tab.key ? "white" : theme.textMuted,
                fontWeight: "700"
              }}>
                {tab.count}
              </span>
            )}
            {activeTab === tab.key && (
              <div style={{ position: "absolute", bottom: "-2px", left: 0, right: 0, height: "2px", background: tab.color || "var(--primary-color)", borderRadius: "2px" }} />
            )}
          </button>
        ))}
      </div>

      {/* Actions & Filters (Fixed) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "0", flexShrink: 0 }}>
        <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
          <svg style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: theme.textMuted }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by user, program, or keyword..."
            style={{ width: "100%", padding: "10px 12px 10px 38px", background: theme.surface, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: "10px", fontSize: "13px", outline: "none" }}
          />
        </div>
        <ExportDropdown onExport={handleExport} theme={theme} darkMode={darkMode} />
      </div>

      {/* Table Section (Scrollable) */}
      <div style={{ 
        background: theme.surface, 
        borderRadius: "16px", 
        border: `1px solid ${theme.border}`, 
        overflowY: "auto", 
        flex: 1,
        boxShadow: "0 4px 12px rgba(0,0,0,0.03)" 
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ background: darkMode ? "rgba(255,255,255,0.02)" : "#F8FAFC", borderBottom: `1px solid ${theme.border}` }}>
              {["Program / Service", "Location", "User", "Rating", "Status", "Date", ""].map((h, idx) => (
                <th key={idx} style={{ padding: "16px 20px", textAlign: "left", fontSize: "11px", fontWeight: "800", color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(f => (
              <tr 
                key={f.id} 
                onClick={() => setSelectedFeedback(f)}
                style={{ borderBottom: `1px solid ${theme.border}`, cursor: "pointer", transition: "0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.03)" : "#FAFAFA"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                <td style={{ padding: "16px 20px" }}>
                  <div style={{ fontWeight: "700", color: theme.text }}>{f.entity_name || "General"}</div>
                  <div style={{ fontSize: "11px", color: theme.textMuted, marginTop: "2px" }}>{f.title?.split(": ")[1] || f.title || "No Subject"}</div>
                </td>
                <td style={{ padding: "16px 20px", color: theme.textMuted, fontWeight: "500" }}>{f.dept_name || "—"}</td>
                <td style={{ padding: "16px 20px" }}>
                  <div style={{ fontWeight: "600", color: theme.text }}>{f.user_name || "Anonymous"}</div>
                  {f.is_anonymous && <span style={{ fontSize: "10px", color: "#94A3B8", fontStyle: "italic" }}>Private Submission</span>}
                </td>
                <td style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: f.rating <= 2 ? "#EF4444" : f.rating === 3 ? "#EAB308" : "#3B82F6" }} />
                    <span style={{ fontWeight: "700", color: theme.text }}>{f.rating || "—"}</span>
                  </div>
                </td>
                <td style={{ padding: "16px 20px" }}>
                  <span style={{ padding: "4px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: "800", textTransform: "uppercase", background: STATUSES[f.status]?.bg, color: STATUSES[f.status]?.color }}>
                    {STATUSES[f.status]?.label}
                  </span>
                </td>
                <td style={{ padding: "16px 20px", color: theme.textMuted }}>{f.created_at?.split("T")[0]}</td>
                <td style={{ padding: "16px 20px", textAlign: "right" }} onClick={e => e.stopPropagation()}>
                  <DotsMenu onUpdateStatus={(s) => handleUpdateStatus(f.id, s)} onDelete={() => handleDelete(f)} theme={theme} darkMode={darkMode} currentStatus={f.status} />
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: "48px 24px", textAlign: "center" }}>
                   <div style={{ fontSize: "18px", marginBottom: "8px" }}>📦</div>
                   <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: theme.text }}>No feedback submissions found.</p>
                   <p style={{ margin: "4px 0 0", fontSize: "12px", color: theme.textMuted }}>Once users submit feedback, they will appear here for review and action.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <FeedbackSidePanel 
        feedback={selectedFeedback} 
        onClose={() => setSelectedFeedback(null)} 
        onUpdateStatus={handleUpdateStatus}
        theme={theme} 
        darkMode={darkMode} 
      />

      <CustomModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type} confirmText={dialog.confirmText} isDestructive={dialog.isDestructive} onConfirm={dialog.onConfirm} onCancel={dialog.onCancel} />
    </div>
  );
};

export default AdminFeedbacks;
