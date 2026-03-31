import React, { useEffect, useState, useRef } from "react";
import { adminGetCategories, adminCreateCategory, adminUpdateCategory, adminDeleteCategory } from "../../../services/adminApi";
import CustomModal from "../../CustomModal";

const CATEGORY_PRESETS = [
  { name: "Department / Agency", desc: "", fields: [{ label: "Service Type", type: "text", required: true }] },
  { name: "Food / Restaurant", desc: "", fields: [{ label: "Table Number", type: "number", required: false }] },
  { name: "Cosmetics Shop", desc: "", fields: [{ label: "Product Name", type: "text", required: false }] },
  { name: "Furniture Shop", desc: "", fields: [{ label: "Showroom Section", type: "text", required: false }] },
  { name: "Car / Transport", desc: "", fields: [{ label: "Vehicle Model", type: "text", required: true }] },
  { name: "Resort / Pool", desc: "", fields: [{ label: "Facility Area", type: "text", required: false }] },
  { name: "Hotel / Lodging", desc: "", fields: [{ label: "Room / Floor", type: "text", required: true }] },
];

// 3-dot action menu
const DotsMenu = ({ onEdit, onDelete, theme, darkMode }) => {
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
        <div style={{ position: "absolute", right: 0, top: "34px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 100, minWidth: "120px", padding: "4px" }}>
          <button
            onClick={() => { onEdit(); setOpen(false); }}
            style={{ ...menuItemStyle, color: theme.text }}
            onMouseEnter={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.05)" : "#F1F5F9"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          >
            Edit Type
          </button>
          <div style={{ height: "1px", background: theme.border, margin: "4px 0" }} />
          <button
            onClick={() => { onDelete(); setOpen(false); }}
            style={{ ...menuItemStyle, color: "#EF4444" }}
            onMouseEnter={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.05)" : "#F1F5F9"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
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
const AdminFeedbackTypes = ({ theme, darkMode }) => {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // Create state
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [isCustomDesc, setIsCustomDesc] = useState(false);
  const [newFields, setNewFields] = useState([]); // List of {label, type, required}

  // Pre-populated templates (can be added to manually)
  const [catPresets, setCatPresets] = useState(CATEGORY_PRESETS);

  // List of establishment types (can be expanded)
  const [estTypes, setEstTypes] = useState([]);
  
  // Edit state
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editFields, setEditFields] = useState([]);
  
  const [dialog, setDialog] = useState({ isOpen: false });

  const load = () => adminGetCategories().then(setCats).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await adminCreateCategory(newName.trim(), newDesc.trim(), newFields);
      setNewName(""); setNewDesc(""); setNewFields([]); setIsAdding(false);
      load();
    } catch (err) {
      console.error("Create failed", err);
    }
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) return;
    await adminUpdateCategory(id, editName.trim(), editDesc.trim(), editFields);
    setEditId(null); setEditName(""); setEditDesc(""); setEditFields([]); load();
  };

  const addField = (isEdit = false) => {
    const fresh = { label: "", type: "text", required: false };
    if (isEdit) setEditFields([...editFields, fresh]);
    else setNewFields([...newFields, fresh]);
  };

  const removeField = (index, isEdit = false) => {
    if (isEdit) setEditFields(editFields.filter((_, i) => i !== index));
    else setNewFields(newFields.filter((_, i) => i !== index));
  };

  const updateField = (index, key, val, isEdit = false) => {
    const list = isEdit ? [...editFields] : [...newFields];
    list[index][key] = val;
    if (isEdit) setEditFields(list);
    else setNewFields(list);
  };

  const applyPreset = (p) => {
    setNewName(p.name);
    setNewDesc(p.desc);
    setIsCustomDesc(false);
    setNewFields(p.fields || []);
  };

  const handleDescChange = (val) => {
    if (val === "__CUSTOM__") {
      setIsCustomDesc(true);
      setNewDesc("");
    } else {
      setIsCustomDesc(false);
      setNewDesc(val);
    }
  };

  const addCustomPreset = () => {
    const name = prompt("Enter New Industry / Category Name:");
    if (name && name.trim()) {
      setCatPresets([...catPresets, { name: name.trim(), desc: "", fields: [] }]);
    }
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
      
      {!isAdding ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
           <button 
             onClick={() => setIsAdding(true)}
             style={{ ...primaryBtn, padding: '12px 32px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
           >
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
             Add New Feedback Category
           </button>
        </div>
      ) : (
        <div style={{ background: theme.surface, borderRadius: "12px", padding: "28px", border: `1px solid ${theme.border}`, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <p style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: theme.text }}>Category Builder</p>
            <button onClick={() => setIsAdding(false)} style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>CANCEL</button>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
               <label style={{ ...labelStyle, color: theme.textMuted }}>Industry / Category Templates</label>
               <button type="button" onClick={addCustomPreset} style={{ background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer', fontSize: '11px', fontWeight: '800' }}>+ ADD TEMPLATE</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {catPresets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyPreset(p)}
                  style={{
                    padding: '6px 12px', borderRadius: '18px', border: `1.5px solid ${theme.border}`,
                    background: theme.bg, color: theme.text, fontSize: '11px', fontWeight: '700',
                    cursor: 'pointer', transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#3B82F6'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = theme.border}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
          
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: 'column', gap: "24px" }}>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ flex: "1 1 200px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ ...labelStyle, color: theme.textMuted }}>Category Name</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Facilities Management" style={{ ...inputStyle, background: theme.bg, color: theme.text, borderColor: theme.border }} />
              </div>
              <div style={{ flex: "2 1 300px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ ...labelStyle, color: theme.textMuted }}>Establishment/Service</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {!isCustomDesc ? (
                    <select 
                      value={newDesc} 
                      onChange={e => handleDescChange(e.target.value)}
                      style={{ ...inputStyle, background: theme.bg, color: theme.text, borderColor: theme.border, cursor: 'pointer' }}
                    >
                      <option value="">-- Select or Add Choice --</option>
                      {estTypes.map(t => <option key={t} value={t}>{t}</option>)}
                      <option value="__CUSTOM__" style={{ fontWeight: 'bold', color: '#3B82F6' }}>+ Add Custom Choice...</option>
                    </select>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                      <input 
                        value={newDesc} 
                        onChange={e => setNewDesc(e.target.value)} 
                        autoFocus
                        placeholder="Type new establishment name..." 
                        style={{ ...inputStyle, background: theme.bg, color: theme.text, borderColor: '#3B82F6' }} 
                      />
                      <button 
                        type="button" 
                        onClick={() => { 
                          if (newDesc.trim() && !estTypes.includes(newDesc.trim())) {
                            setEstTypes([...estTypes, newDesc.trim()]);
                          }
                          setIsCustomDesc(false);
                        }}
                        style={{ ...editBtn, background: '#3B82F6', color: 'white' }}
                      >
                        Keep
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: '20px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <label style={{ ...labelStyle, color: theme.textMuted }}>Custom Form Fields</label>
                  <button type="button" onClick={() => addField(false)} style={{ ...editBtn, padding: '4px 12px', fontSize: '11px' }}>+ Add Field</button>
               </div>
               
               <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {newFields.map((f, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center', background: darkMode ? 'rgba(255,255,255,0.02)' : '#F8FAFC', padding: '12px', borderRadius: '10px', border: `1px solid ${theme.border}` }}>
                       <input 
                         placeholder="Field Label (e.g. Room Number)" 
                         value={f.label} 
                         onChange={e => updateField(idx, 'label', e.target.value, false)}
                         style={{ ...inputStyle, flex: 2, background: theme.surface }} 
                       />
                       <select 
                         value={f.type} 
                         onChange={e => updateField(idx, 'type', e.target.value, false)}
                         style={{ ...inputStyle, flex: 1, background: theme.surface, cursor: 'pointer' }}
                       >
                         <option value="text">Text Input</option>
                         <option value="number">Number Input</option>
                       </select>
                       <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: theme.text, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                         <input 
                           type="checkbox" 
                           checked={f.required} 
                           onChange={e => updateField(idx, 'required', e.target.checked, false)}
                         />
                         Required
                       </label>
                       <button type="button" onClick={() => removeField(idx, false)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}>
                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
                       </button>
                    </div>
                  ))}
                  {newFields.length === 0 && (
                    <p style={{ margin: 0, fontSize: '12px', color: theme.textMuted, textAlign: 'center', padding: '10px' }}>No custom fields added yet.</p>
                  )}
               </div>
            </div>

            <button type="submit" disabled={!newName.trim()} style={{ ...primaryBtn, marginTop: '10px', padding: '14px', borderRadius: '10px', opacity: !newName.trim() ? 0.6 : 1 }}>Create Category</button>
          </form>
        </div>
      )}

      {/* Table */}
      <div style={{ background: theme.surface, borderRadius: "12px", border: `1px solid ${theme.border}`, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "32px", textAlign: "center", color: theme.textMuted, fontSize: "13px" }}>Loading...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: darkMode ? "rgba(255,255,255,0.02)" : "#F8FAFC", borderBottom: `1px solid ${theme.border}` }}>
                {["#", "Category Type", "Establishment/Service", "Fields", "Submissions", ""].map(h => (
                  <th key={h} style={{ ...thStyle, color: theme.textMuted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cats.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: `1px solid ${theme.border}` }}
                  onMouseEnter={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.02)" : "#FAFAFA"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ ...tdStyle, color: theme.textMuted }}>{i + 1}</td>
                  <td style={tdStyle}>
                    {editId === c.id
                      ? <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus style={{ ...inputStyle, background: theme.bg, color: theme.text, borderColor: theme.border, width: "160px" }} />
                      : <span style={{ fontWeight: "600", color: theme.text }}>{c.name}</span>}
                  </td>
                  <td style={{ ...tdStyle, color: theme.textMuted }}>
                    {editId === c.id
                      ? <input value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Description" style={{ ...inputStyle, background: theme.bg, color: theme.text, borderColor: theme.border, width: "220px" }} />
                      : c.description || <em style={{ color: theme.textMuted }}>—</em>}
                  </td>
                  <td style={tdStyle}>
                    {editId === c.id ? (
                      <button onClick={() => addField(true)} style={{ ...editBtn, padding: '4px 8px', fontSize: '11px' }}>
                        {editFields.length} Fields (Edit)
                      </button>
                    ) : (
                      <span style={{ fontSize: "12px", color: theme.textMuted }}>{c.fields?.length || 0} fields</span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: theme.text }}>{c.count}</span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    {editId === c.id ? (
                      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                        <button onClick={() => handleUpdate(c.id)} style={{ ...saveBtn, background: darkMode ? "rgba(16, 185, 129, 0.1)" : "#F0FDF4", color: darkMode ? "#10B981" : "#15803D", borderColor: darkMode ? "rgba(16, 185, 129, 0.2)" : "#BBF7D0" }}>Save</button>
                        <button onClick={() => setEditId(null)} style={{ ...cancelBtn, background: theme.bg, color: theme.textMuted, borderColor: theme.border }}>X</button>
                      </div>
                    ) : (
                      <DotsMenu 
                        onEdit={() => { 
                          setEditId(c.id); 
                          setEditName(c.name); 
                          setEditDesc(c.description || ""); 
                          setEditFields(c.fields || []);
                        }} 
                        onDelete={() => handleDelete(c)} 
                        theme={theme}
                        darkMode={darkMode}
                      />
                    )}
                  </td>
                </tr>
              ))}
              {cats.length === 0 && (
                <tr><td colSpan={6} style={{ padding: "32px", textAlign: "center", color: theme.textMuted, fontSize: "13px" }}>No feedback types found.</td></tr>
              )}

              {/* Special Edit Row for Custom Fields (Expanded when editing) */}
              {editId && (
                <tr>
                  <td colSpan={6} style={{ padding: '0 14px 20px 14px', background: darkMode ? 'rgba(255,255,255,0.01)' : '#F9FBFF' }}>
                    <div style={{ padding: '20px', borderRadius: '12px', border: `1.5px dashed ${theme.border}`, marginTop: '10px' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <label style={{ ...labelStyle, color: theme.textMuted }}>Edit Custom Fields for "{editName}"</label>
                          <button type="button" onClick={() => addField(true)} style={{ ...editBtn, padding: '4px 12px', fontSize: '11px' }}>+ Add Field</button>
                       </div>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {editFields.map((f, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                               <input 
                                 placeholder="Label" 
                                 value={f.label} 
                                 onChange={e => updateField(idx, 'label', e.target.value, true)}
                                 style={{ ...inputStyle, flex: 2, background: theme.surface }} 
                               />
                               <select 
                                 value={f.type} 
                                 onChange={e => updateField(idx, 'type', e.target.value, true)}
                                 style={{ ...inputStyle, flex: 1, background: theme.surface }}
                               >
                                 <option value="text">Text</option>
                                 <option value="number">Number</option>
                               </select>
                               <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: theme.text, whiteSpace: 'nowrap' }}>
                                 <input type="checkbox" checked={f.required} onChange={e => updateField(idx, 'required', e.target.checked, true)} />
                                 Req
                               </label>
                               <button type="button" onClick={() => removeField(idx, true)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}>
                                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
                               </button>
                            </div>
                          ))}
                          {editFields.length === 0 && <p style={{ margin: 0, fontSize: '12px', color: theme.textMuted }}>No custom fields.</p>}
                       </div>
                    </div>
                  </td>
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
