import React, { useEffect, useState } from "react";
import { adminGetDepartments, adminCreateDepartment, adminUpdateDepartment, adminDeleteDepartment, adminGetEntities } from "../../../services/adminApi";
import CustomModal from "../../CustomModal";

const AdminDepartments = ({ theme, darkMode }) => {
  const [depts, setDepts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newCatId, setNewCatId] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editCatId, setEditCatId] = useState("");
  const [dialog, setDialog] = useState({ isOpen: false });

  const load = () => {
    setLoading(true);
    Promise.all([adminGetDepartments(), adminGetEntities()])
      .then(([d, c]) => {
        setDepts(d);
        setCategories(c);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await adminCreateDepartment(newName.trim(), newCatId || null);
    setNewName(""); setNewCatId(""); load();
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) return;
    await adminUpdateDepartment(id, editName.trim(), editCatId || null);
    setEditId(null); setEditName(""); setEditCatId(""); load();
  };

  const handleDelete = (dept) => {
    setDialog({
      isOpen: true, type: "alert", title: "Delete Entity",
      message: `Delete "${dept.name}"? This may affect existing feedback reports assigned to this entity.`,
      confirmText: "Delete", isDestructive: true,
      onConfirm: async () => { await adminDeleteDepartment(dept.id); setDialog({ isOpen: false }); load(); },
      onCancel: () => setDialog({ isOpen: false }),
    });
  };

  const inputStyle = {
    padding: "10px 14px", 
    border: `1.5px solid ${theme.border}`, 
    borderRadius: "10px", 
    fontSize: "13px", 
    outline: "none", 
    fontFamily: "inherit",
    background: theme.bg,
    color: theme.text
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer'
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Create form */}
      <div style={{ background: theme.surface, borderRadius: "16px", padding: "24px", border: `1px solid ${theme.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: "800", color: theme.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Entity Management</h3>
        <p style={{ fontSize: '12px', color: theme.textMuted, marginBottom: '20px' }}>Register new entities (Departments, Programs, or Items) and map them to a Category type.</p>
        <form onSubmit={handleCreate} style={{ display: "flex", gap: "10px", flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: theme.textMuted, marginBottom: '6px', textTransform: 'uppercase' }}>Entity Name</label>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Walang Gutom, College of Engineering…"
              style={{ ...inputStyle, width: '100%' }} />
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: theme.textMuted, marginBottom: '6px', textTransform: 'uppercase' }}>Category / Type</label>
            <select value={newCatId} onChange={e => setNewCatId(e.target.value)} style={{ ...selectStyle, width: '100%' }}>
              <option value="">-- Assign Category --</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="submit" style={{ padding: "10px 24px", background: "var(--primary-color)", color: "white", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit", transition: 'all 0.2s', height: '42px' }}>
              + Create Entity
            </button>
          </div>
        </form>
      </div>

      {/* List */}
      <div style={{ background: theme.surface, borderRadius: "16px", border: `1px solid ${theme.border}`, overflow: "hidden", boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {loading ? <div style={{ padding: "40px", textAlign: "center", color: theme.textMuted, fontSize: "13px" }}>Loading entities...</div> : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: darkMode ? "rgba(255,255,255,0.02)" : "#F8FAFC", borderBottom: `1px solid ${theme.border}` }}>
                {["#", "Entity / Name", "Type / Category", "Stats", "Actions"].map(h => (
                  <th key={h} style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {depts.map((d, i) => {
                const cat = categories.find(c => c.id === (d.entity_id || d.category_id));
                return (
                  <tr key={d.id} style={{ borderBottom: `1px solid ${theme.border}` }}
                    onMouseEnter={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.02)" : "#FAFAFA"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "16px", color: theme.textMuted }}>{i + 1}</td>
                    <td style={{ padding: "16px" }}>
                      {editId === d.id ? (
                        <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus
                          style={{ ...inputStyle, padding: "6px 12px", width: '100%' }} />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3B82F6' }} />
                          <span style={{ fontWeight: "700", color: theme.text }}>{d.name}</span>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "16px" }}>
                      {editId === d.id ? (
                        <select value={editCatId} onChange={e => setEditCatId(e.target.value)} style={{ ...selectStyle, padding: '4px 8px', width: '100%' }}>
                          <option value="">-- No Category --</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      ) : (
                        <span style={{ color: theme.textMuted, fontWeight: '500' }}>
                          {cat ? `${cat.icon || '📁'} ${cat.name}` : "—"}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "16px" }}>
                      <span style={{ background: darkMode ? "rgba(59, 130, 246, 0.1)" : "#EFF6FF", color: "#3B82F6", padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" }}>
                        {d.count || 0} Reports
                      </span>
                    </td>
                    <td style={{ padding: "16px" }}>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {editId === d.id ? (
                          <>
                            <button onClick={() => handleUpdate(d.id)} style={actBtn("#10B981", theme)}>Save</button>
                            <button onClick={() => setEditId(null)} style={actBtn(theme.textMuted, theme)}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => { setEditId(d.id); setEditName(d.name); setEditCatId(d.entity_id || d.category_id || ""); }} style={actBtn("#3B82F6", theme)}>Edit</button>
                            <button onClick={() => handleDelete(d)} style={actBtn("#EF4444", theme)}>Delete</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {depts.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '60px', textAlign: 'center', color: theme.textMuted }}>
                    No entities registered yet. Use the form above to add your first program or office.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <CustomModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type}
        confirmText={dialog.confirmText} isDestructive={dialog.isDestructive} onConfirm={dialog.onConfirm} onCancel={dialog.onCancel} />
    </div>
  );
};

const actBtn = (color, theme) => ({
  padding: "6px 12px", 
  background: "none", 
  color: color, 
  border: `1.5px solid ${color}30`,
  borderRadius: "8px", 
  fontSize: "12px", 
  fontWeight: "700", 
  cursor: "pointer", 
  fontFamily: "inherit",
  transition: 'all 0.2s'
});

export default AdminDepartments;
