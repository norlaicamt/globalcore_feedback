import React, { useEffect, useState, useRef } from "react"; // Added useRef for menu ref
import { adminGetCategories, adminCreateCategory, adminUpdateCategory, adminDeleteCategory } from "../../../services/adminApi";
import CustomModal from "../../CustomModal";

// 3-dot action menu
const DotsMenu = ({ onEdit, onDelete }) => {
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
        style={{ width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", background: open ? "#F1F5F9" : "transparent", border: "1px solid transparent", borderRadius: "6px", cursor: "pointer", color: "#64748B", fontFamily: "inherit" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
        </svg>
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "34px", background: "white", border: "1px solid #E2E8F0", borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 100, minWidth: "120px", padding: "4px" }}>
          <button
            onClick={() => { onEdit(); setOpen(false); }}
            style={menuItemStyle}
          >
            Edit Type
          </button>
          <div style={{ height: "1px", background: "#F1F5F9", margin: "4px 0" }} />
          <button
            onClick={() => { onDelete(); setOpen(false); }}
            style={{ ...menuItemStyle, color: "#B91C1C" }}
          >
            Delete Type
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

// Shows all General Feedback types (categories) with usage counts and CRUD.
const AdminFeedbackTypes = () => {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [dialog, setDialog] = useState({ isOpen: false });

  const load = () => adminGetCategories().then(setCats).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await adminCreateCategory(newName.trim(), newDesc.trim());
    setNewName(""); setNewDesc(""); load();
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) return;
    await adminUpdateCategory(id, editName.trim(), editDesc.trim());
    setEditId(null); setEditName(""); setEditDesc(""); load();
  };

  const handleDelete = (cat) => {
    setDialog({
      isOpen: true, type: "alert", title: "Delete Category Type",
      message: `Delete "${cat.name}"? ${cat.count} submission(s) use this category type.`,
      confirmText: "Delete", isDestructive: true,
      onConfirm: async () => { 
        try {
          await adminDeleteCategory(cat.id); 
          setDialog({ isOpen: false }); 
          load(); 
        } catch (err) {
          const errMsg = err.response?.data?.detail || "This category cannot be deleted because it is currently in use by existing feedbacks.";
          setDialog({
            isOpen: true, type: "alert", title: "Delete Failed",
            message: errMsg, confirmText: "Understood", isDestructive: false,
            onConfirm: () => setDialog({ isOpen: false })
          });
        }
      },
      onCancel: () => setDialog({ isOpen: false }),
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Add form */}
      <div style={{ background: "white", borderRadius: "12px", padding: "20px", border: "1px solid #E2E8F0" }}>
        <p style={{ margin: "0 0 14px 0", fontSize: "13px", fontWeight: "700", color: "#374151" }}>Add Category Type</p>
        <form onSubmit={handleCreate} style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 180px", display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={labelStyle}>Category Name</label>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Service Quality" style={inputStyle} />
          </div>
          <div style={{ flex: "2 1 240px", display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={labelStyle}>Establishment/Service</label>
            <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="e.g. Food / Restaurant" style={inputStyle} />
          </div>
          <button type="submit" style={{ ...primaryBtn, alignSelf: "flex-end", height: "38px" }}>Add Category</button>
        </form>
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: "12px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "32px", textAlign: "center", color: "#94A3B8", fontSize: "13px" }}>Loading...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                {["#", "Category Type", "Establishment/Service", "Submissions", ""].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cats.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #F1F5F9" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#FAFAFA"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={tdStyle}>{i + 1}</td>
                  <td style={tdStyle}>
                    {editId === c.id
                      ? <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus style={{ ...inputStyle, width: "160px" }} />
                      : <span style={{ fontWeight: "600", color: "#1E293B" }}>{c.name}</span>}
                  </td>
                  <td style={{ ...tdStyle, color: "#64748B" }}>
                    {editId === c.id
                      ? <input value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Description" style={{ ...inputStyle, width: "220px" }} />
                      : c.description || <em style={{ color: "#CBD5E1" }}>—</em>}
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: "#374151" }}>{c.count}</span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    {editId === c.id ? (
                      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                        <button onClick={() => handleUpdate(c.id)} style={saveBtn}>Save</button>
                        <button onClick={() => setEditId(null)} style={cancelBtn}>X</button>
                      </div>
                    ) : (
                      <DotsMenu 
                        onEdit={() => { setEditId(c.id); setEditName(c.name); setEditDesc(c.description || ""); }} 
                        onDelete={() => handleDelete(c)} 
                      />
                    )}
                  </td>
                </tr>
              ))}
              {cats.length === 0 && (
                <tr><td colSpan={5} style={{ padding: "32px", textAlign: "center", color: "#94A3B8", fontSize: "13px" }}>No feedback types found.</td></tr>
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

const labelStyle = { fontSize: "11px", fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.02em" };
const inputStyle = { padding: "8px 12px", border: "1.5px solid #E2E8F0", borderRadius: "8px", fontSize: "13px", outline: "none", fontFamily: "inherit", color: "#1E293B", boxSizing: "border-box", width: "100%" };
const thStyle = { padding: "11px 14px", textAlign: "left", fontSize: "10px", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" };
const tdStyle = { padding: "11px 14px", color: "#374151", verticalAlign: "middle" };
const primaryBtn = { padding: "8px 18px", background: "#1f2a56", color: "white", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" };
const saveBtn = { padding: "5px 12px", background: "#F0FDF4", color: "#15803D", border: "1px solid #BBF7D0", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" };
const cancelBtn = { padding: "5px 12px", background: "#F8FAFC", color: "#64748B", border: "1px solid #E2E8F0", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" };
const editBtn = { padding: "5px 12px", background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" };
const deleteBtn = { padding: "5px 12px", background: "#FEF2F2", color: "#B91C1C", border: "1px solid #FECACA", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" };

export default AdminFeedbackTypes;
