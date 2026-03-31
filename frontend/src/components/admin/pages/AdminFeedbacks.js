import React, { useEffect, useRef, useState } from "react"; // Fixed search state
import { adminGetFeedbacks, adminDeleteFeedback } from "../../../services/adminApi";
import CustomModal from "../../CustomModal";

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
        style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", userSelect: "none", color: value ? (darkMode ? "#60A5FA" : "#1f2a56") : "inherit" }}
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

const AdminFeedbacks = ({ theme, darkMode }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ category: "", establishment: "", author: "" });
  const [dialog, setDialog] = useState({ isOpen: false });

  const load = () =>
    adminGetFeedbacks({}).then(setFeedbacks).catch(console.error).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const filtered = feedbacks.filter(f => {
    const catMatch = f.title?.split(": ")[0]?.toLowerCase().includes(filters.category.toLowerCase());
    const estMatch = (f.title?.split(": ")[1] || f.title)?.toLowerCase().includes(filters.establishment.toLowerCase());
    const authMatch = f.user_name?.toLowerCase().includes(filters.author.toLowerCase());
    const globalSearch = search === "" || 
      f.title?.toLowerCase().includes(search.toLowerCase()) || 
      f.user_name?.toLowerCase().includes(search.toLowerCase());
    
    return catMatch && estMatch && authMatch && globalSearch;
  });

  const handleDelete = (fb) => {
    setDialog({
      isOpen: true, type: "alert", title: "Delete Feedback",
      message: `Permanently delete "${fb.title}"? This cannot be undone.`,
      confirmText: "Delete", isDestructive: true,
      onConfirm: async () => { await adminDeleteFeedback(fb.id); setDialog({ isOpen: false }); load(); },
      onCancel: () => setDialog({ isOpen: false }),
    });
  };

  const exportCSV = () => {
    const rows = [["ID", "Title", "Author", "Category Type", "Rating", "Comments", "Date"]];
    filtered.forEach(f => rows.push([
      f.id, `"${f.title}"`,
      f.user_name || "—",
      f.title?.split(": ")[0] || "General",
      f.rating || "",
      f.comments_count,
      f.created_at?.split("T")[0]
    ]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv," + encodeURIComponent(csv);
    a.download = "feedbacks.csv"; a.click();
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
        <button onClick={exportCSV} style={{ ...outlineBtn, background: theme.surface, color: theme.text, borderColor: theme.border }}>Export CSV</button>
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
                <HeaderFilter theme={theme} darkMode={darkMode} label="Category Type" value={filters.category} onChange={v => setFilters({...filters, category: v})} />
                <HeaderFilter theme={theme} darkMode={darkMode} label="Establishment/Service" value={filters.establishment} onChange={v => setFilters({...filters, establishment: v})} />
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
                  <td style={tdStyle}>
                    <p style={{ margin: 0, fontWeight: "600", color: theme.textMuted }}>
                      {f.title?.split(": ")[0] || "General"}
                    </p>
                  </td>
                  <td style={{ ...tdStyle, maxWidth: "220px" }}>
                    <p style={{ margin: 0, fontWeight: "700", color: theme.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {f.title?.split(": ")[1] || f.title || "—"}
                    </p>
                    {f.description && (
                      <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: theme.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {f.description.substring(0, 70)}{f.description.length > 70 ? "..." : ""}
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
                  <td colSpan={8} style={{ padding: "32px", textAlign: "center", color: theme.textMuted, fontSize: "13px" }}>No feedback found.</td>
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
const outlineBtn = { padding: "8px 16px", background: "white", color: "#1f2a56", border: "1.5px solid #CBD5E1", borderRadius: "8px", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" };
const thStyle = { padding: "11px 14px", textAlign: "left", fontSize: "10px", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" };
const tdStyle = { padding: "11px 14px", color: "#374151", verticalAlign: "middle" };

export default AdminFeedbacks;
