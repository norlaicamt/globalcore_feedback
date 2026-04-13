import React, { useEffect, useRef, useState } from "react"; // Fixed search state
import { adminGetFeedbacks, adminDeleteFeedback } from "../../../services/adminApi";
import { useTerminology } from "../../../context/TerminologyContext";
import CustomModal from "../../CustomModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// 3-dot menu for each feedback row
const DotsMenu = ({ onDelete, theme, darkMode }) => {
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
        style={{ width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", background: open ? (darkMode ? "rgba(255,255,255,0.1)" : "#F1F5F9") : "transparent", border: "1px solid transparent", borderRadius: "6px", cursor: "pointer", color: theme.textMuted, fontFamily: "inherit" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
        </svg>
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "34px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 100, minWidth: "130px", padding: "4px" }}>
          <button
            onClick={() => { onDelete(); setOpen(false); }}
            style={{ display: "block", width: "100%", padding: "8px 12px", background: "none", border: "none", borderRadius: "7px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#EF4444", cursor: "pointer", fontFamily: "inherit" }}
            onMouseEnter={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.05)" : "#F1F5F9"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          >
            Delete Post
          </button>
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

// --- TABLE HEADER FILTER COMPONENT ---
const HeaderFilter = ({ label, value, onChange, theme, darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <th style={{ ...thStyle, position: "relative" }}>
      <div 
        style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", userSelect: "none", color: value ? (darkMode ? "#60A5FA" : "var(--primary-color)") : "inherit" }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{label}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
          <path d="M7 10l5 5 5-5H7z" />
        </svg>
      </div>

      {isOpen && (
        <div ref={ref} style={{ position: "absolute", top: "100%", left: "10px", zIndex: 100, background: theme.surface, padding: "10px", borderRadius: "8px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", border: `1px solid ${theme.border}`, minWidth: "180px", marginTop: "4px" }}>
          <p style={{ margin: "0 0 8px 0", fontSize: "10px", fontWeight: "700", color: theme.textMuted, textTransform: "uppercase" }}>Filter {label}</p>
          <input
            autoFocus
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') setIsOpen(false); }}
            placeholder={`Search ${label}...`}
            style={{ ...miniFilter, background: theme.bg, border: `1.5px solid ${theme.border}`, color: theme.text, padding: "8px" }}
          />
          {value && (
            <button 
              onClick={(e) => { e.stopPropagation(); onChange(""); }}
              style={{ background: "none", border: "none", color: "#EF4444", fontSize: "10px", fontWeight: "700", marginTop: "8px", cursor: "pointer", padding: 0 }}
            >
              Clear Filter
            </button>
          )}
        </div>
      )}
    </th>
  );
};

const AdminFeedbacks = ({ theme, darkMode, adminUser }) => {
  const { getLabel } = useTerminology();
  const hasGlobalAdminAccess = (adminUser?.role === "superadmin") || (adminUser?.role === "admin" && !adminUser?.entity_id);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ entity: "", service: "", author: "" });
  const [dialog, setDialog] = useState({ isOpen: false });

  const load = () => {
    // For program-scoped admins, the backend handles scoping via session token.
    // We only pass dept_name for global admins using the dropdown filter.
    adminGetFeedbacks({}).then(setFeedbacks).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [adminUser]);

  const filtered = feedbacks.filter(f => {
    const entMatch = f.entity_name?.toLowerCase().includes(filters.entity.toLowerCase());
    const serviceMatch = (f.title?.split(": ")[1] || f.title)?.toLowerCase().includes(filters.service.toLowerCase());
    const authMatch = f.user_name?.toLowerCase().includes(filters.author.toLowerCase());
    const globalSearch = search === "" || 
      f.title?.toLowerCase().includes(search.toLowerCase()) || 
      f.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      f.entity_name?.toLowerCase().includes(search.toLowerCase());
    
    return entMatch && serviceMatch && authMatch && globalSearch;
  });

  const handleDelete = (fb) => {
    setDialog({
      isOpen: true, type: "alert", title: `Delete ${getLabel("feedback_label", "Feedback")}`,
      message: `Permanently delete "${fb.title}"? This cannot be undone.`,
      confirmText: "Delete", isDestructive: true,
      onConfirm: async () => { await adminDeleteFeedback(fb.id); setDialog({ isOpen: false }); load(); },
      onCancel: () => setDialog({ isOpen: false }),
    });
  };

  const handleExport = (format) => {
    const headers = ["ID", "Entity / Service \& Feedback", getLabel("dept_label", "Department"), "Author", "Rating", "Comments", "Date"];
    const data = filtered.map((f, idx) => [
      idx + 1,
      `${f.entity_name || "General"} | ${f.title?.split(": ")[1] || f.title || ""} - ${f.description || ""}`,
      f.dept_name || "—",
      f.user_name || "Anonymous",
      f.rating ? `${f.rating}/5` : "—",
      f.comments_count,
      f.created_at?.split("T")[0]
    ]);

    if (format === 'csv') {
      const csvContent = [headers, ...data].map(r => r.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `feedbacks_${new Date().getTime()}.csv`);
      link.click();
    } else if (format === 'xls') {
      const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
      
      // Auto-width columns for professional look
      const colWidths = headers.map((h, i) => {
        const longest = data.reduce((acc, row) => Math.max(acc, String(row[i]).length), h.length);
        return { wch: longest + 5 };
      });
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Feedbacks");
      XLSX.writeFile(wb, `feedbacks_report_${new Date().getTime()}.xlsx`);
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      
      // Header Branding
      doc.setFillColor(31, 42, 86); // Navy
      doc.rect(0, 0, 210, 25, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text(`${getLabel("feedback_label", "Feedback").toUpperCase()} AUDIT REPORT`, 14, 17);
      
      doc.setFontSize(8);
      doc.setTextColor(200, 200, 200);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 160, 17);

      autoTable(doc, {
        head: [headers],
        body: data,
        startY: 30,
        margin: { horizontal: 14 },
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [31, 42, 86], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        didDrawPage: (data) => {
          // Footer with page numbering
          const str = "Page " + doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
          doc.text("Confidential - Internal Use Only", 140, doc.internal.pageSize.height - 10);
        }
      });
      doc.save(`feedbacks_audit_${new Date().getTime()}.pdf`);
    } else if (format === 'doc') {
      let html = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Feedback Audit Report</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; color: #1e293b; padding: 20px; }
          h1 { color: var(--primary-color); border-bottom: 2px solid #3b82f6; padding-bottom: 5px; font-size: 24px; }
          .meta { color: #64748b; font-size: 11px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: var(--primary-color); color: white; text-align: left; padding: 12px; font-size: 13px; }
          td { border-bottom: 1px solid #e2e8f0; padding: 10px; font-size: 12px; }
          .stripe { background-color: #f8fafc; }
        </style>
        </head>
        <body>
          <h1>{getLabel("feedback_label", "Feedback").toUpperCase()} AUDIT REPORT</h1>
          <p class="meta">Exported from GlobalCore Admin on ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${data.map((row, i) => `<tr ${i % 2 === 0 ? '' : 'class="stripe"'}>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>
          <p style="margin-top: 40px; font-size: 10px; color: #94a3b8; text-align: center;">--- End of Report ---</p>
        </body>
        </html>
      `;
      const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `feedbacks_report_${new Date().getTime()}.doc`;
      link.click();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Search Header */}
      <div style={{ display: "flex", gap: "10px", alignItems: "center", background: theme.surface, padding: "14px 16px", borderRadius: "12px", border: `1px solid ${theme.border}` }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Global Search..."
          style={{ ...inputStyle, background: theme.bg, color: theme.text, borderColor: theme.border }}
        />
        <ExportDropdown onExport={handleExport} theme={theme} darkMode={darkMode} />
      </div>

      {/* Table */}
      <div style={{ background: theme.surface, borderRadius: "12px", border: `1px solid ${theme.border}`, overflow: "visible" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: theme.textMuted, fontSize: "13px" }}>Loading feedback...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: darkMode ? "rgba(255,255,255,0.02)" : "#F8FAFC", borderBottom: `1px solid ${theme.border}` }}>
                <th style={{ ...thStyle, color: theme.textMuted }}>#</th>
                <HeaderFilter theme={theme} darkMode={darkMode} label="Entity / Service" value={filters.entity} onChange={v => setFilters({...filters, entity: v})} />
                {hasGlobalAdminAccess && <HeaderFilter theme={theme} darkMode={darkMode} label={getLabel("dept_label", "Department")} value={filters.dept_name || ""} onChange={v => setFilters({...filters, dept_name: v})} />}
                <HeaderFilter theme={theme} darkMode={darkMode} label="Author" value={filters.author} onChange={v => setFilters({...filters, author: v})} />
                {["Rating", "Comments", "Date", ""].map(h => (
                  <th key={h} style={{ ...thStyle, color: theme.textMuted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((f, i) => (
                <tr key={f.id} style={{ borderBottom: `1px solid ${theme.border}` }}
                  onMouseEnter={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.02)" : "#FAFAFA"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ ...tdStyle, color: theme.text }}>{i + 1}</td>
                  <td style={{ ...tdStyle, maxWidth: "280px" }}>
                    <p style={{ margin: 0, fontWeight: "700", color: theme.text }}>
                      {f.entity_name || "General"}
                      {f.title && f.title !== f.entity_name && ` - ${f.title.split(": ")[1] || f.title}`}
                    </p>
                    {f.description && (
                      <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: theme.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {f.description.substring(0, 100)}{f.description.length > 100 ? "..." : ""}
                      </p>
                    )}
                    {f.custom_data && Object.keys(f.custom_data).length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                        {Object.entries(f.custom_data).map(([k, v]) => (
                          <div key={k} style={{ 
                            fontSize: '9px', fontWeight: '700', padding: '2px 6px', 
                            background: darkMode ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF', 
                            color: darkMode ? '#60A5FA' : '#1D4ED8', 
                            borderRadius: '4px', border: `1px solid ${darkMode ? 'rgba(59, 130, 246, 0.2)' : '#BFDBFE'}`
                          }}>
                            {k}: {v}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  {hasGlobalAdminAccess && (
                    <td style={{ ...tdStyle, color: theme.textMuted, fontSize: '11px', fontWeight: '500' }}>
                      {f.dept_name || "—"}
                    </td>
                  )}
                  <td style={{ ...tdStyle, color: f.is_anonymous ? theme.textMuted : theme.text, fontWeight: f.is_anonymous ? "400" : "600" }}>
                    {f.user_name || "—"}
                    {f.is_anonymous && <span style={{ fontSize: "10px", marginLeft: "4px", fontStyle: "italic" }}>(Anon)</span>}
                  </td>
                  <td style={{ ...tdStyle, color: theme.text }}>{f.rating ? `${f.rating} / 5` : "—"}</td>
                  <td style={{ ...tdStyle, color: theme.text }}>{f.comments_count}</td>
                  <td style={{ ...tdStyle, color: theme.textMuted, whiteSpace: "nowrap" }}>{f.created_at?.split("T")[0]}</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    <DotsMenu onDelete={() => handleDelete(f)} theme={theme} darkMode={darkMode} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: "32px", textAlign: "center", color: theme.textMuted, fontSize: "13px" }}>No {getLabel("feedback_label", "feedback")} found.</td>
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
const miniFilter = { width: '100%', padding: "4px 8px", border: "1px solid #F1F5F9", borderRadius: "6px", fontSize: "11px", outline: "none", fontFamily: "inherit", color: "#475569", background: '#F8FAFC' };
const outlineBtn = { padding: "8px 16px", background: "white", color: "var(--primary-color)", border: "1.5px solid #CBD5E1", borderRadius: "8px", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" };
const thStyle = { padding: "11px 14px", textAlign: "left", fontSize: "10px", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" };
const tdStyle = { padding: "11px 14px", color: "#374151", verticalAlign: "middle" };

export default AdminFeedbacks;
