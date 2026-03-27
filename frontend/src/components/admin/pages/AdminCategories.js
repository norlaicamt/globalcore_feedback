import React, { useEffect, useState } from "react";
import { adminGetCategories, adminCreateCategory, adminUpdateCategory, adminDeleteCategory } from "../../../services/adminApi";
import CustomModal from "../../CustomModal";

const AdminCategories = () => {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState(""); const [newDesc, setNewDesc] = useState("");
  const [editId, setEditId] = useState(null); const [editName, setEditName] = useState(""); const [editDesc, setEditDesc] = useState("");
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
    await adminUpdateCategory(id, editName.trim(), editDesc.trim());
    setEditId(null); load();
  };

  const handleDelete = (cat) => {
    setDialog({
      isOpen: true, type: "alert", title: "Delete Category",
      message: `Delete "${cat.name}"? ${cat.count} feedback post(s) use this category.`,
      confirmText: "Delete", isDestructive: true,
      onConfirm: async () => { await adminDeleteCategory(cat.id); setDialog({ isOpen: false }); load(); },
      onCancel: () => setDialog({ isOpen: false }),
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ background: "white", borderRadius: "16px", padding: "20px", border: "1px solid #E2E8F0" }}>
        <h3 style={{ margin: "0 0 14px 0", fontSize: "14px", fontWeight: "800", color: "#1E293B" }}>Add New Category</h3>
        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", gap: "10px" }}>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Category name…"
              style={{ flex: 1, padding: "10px 14px", border: "1.5px solid #E2E8F0", borderRadius: "10px", fontSize: "13px", outline: "none", fontFamily: "inherit" }} />
            <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description (optional)"
              style={{ flex: 2, padding: "10px 14px", border: "1.5px solid #E2E8F0", borderRadius: "10px", fontSize: "13px", outline: "none", fontFamily: "inherit" }} />
            <button type="submit" style={{ padding: "10px 20px", background: "linear-gradient(135deg,#1f2a56,#2563EB)", color: "white", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>+ Add</button>
          </div>
        </form>
      </div>

      <div style={{ background: "white", borderRadius: "16px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
        {loading ? <div style={{ padding: "30px", textAlign: "center", color: "#94A3B8", fontSize: "13px" }}>Loading…</div> : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                {["#", "Category", "Description", "Usage", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cats.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #F1F5F9" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#FAFAFA"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "12px 16px", color: "#94A3B8" }}>{i + 1}</td>
                  <td style={{ padding: "12px 16px" }}>
                    {editId === c.id
                      ? <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus style={{ padding: "6px 10px", border: "1.5px solid #3B82F6", borderRadius: "8px", fontSize: "13px", outline: "none", fontFamily: "inherit" }} />
                      : <span style={{ fontWeight: "700", color: "#1E293B" }}>{c.name}</span>}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#64748B" }}>
                    {editId === c.id
                      ? <input value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Description" style={{ padding: "6px 10px", border: "1.5px solid #E2E8F0", borderRadius: "8px", fontSize: "13px", outline: "none", width: "100%", fontFamily: "inherit" }} />
                      : c.description || <span style={{ fontStyle: "italic", color: "#CBD5E1" }}>No description</span>}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: "#EFF6FF", color: "#3B82F6", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" }}>{c.count} posts</span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {editId === c.id
                        ? <><button onClick={() => handleUpdate(c.id)} style={btn("#10B981")}>Save</button><button onClick={() => setEditId(null)} style={btn("#64748B")}>Cancel</button></>
                        : <><button onClick={() => { setEditId(c.id); setEditName(c.name); setEditDesc(c.description || ""); }} style={btn("#3B82F6")}>Edit</button><button onClick={() => handleDelete(c)} style={btn("#EF4444")}>Delete</button></>
                      }
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CustomModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type}
        confirmText={dialog.confirmText} isDestructive={dialog.isDestructive} onConfirm={dialog.onConfirm} onCancel={dialog.onCancel} />
    </div>
  );
};

const btn = (color) => ({ padding: "5px 10px", background: `${color}18`, color, border: `1px solid ${color}40`, borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" });

export default AdminCategories;
