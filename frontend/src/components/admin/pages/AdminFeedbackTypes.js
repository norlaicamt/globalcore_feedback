import React, { useEffect, useState, useRef } from "react";
import { adminGetCategories, adminCreateCategory, adminUpdateCategory, adminDeleteCategory } from "../../../services/adminApi";
import CustomModal from "../../CustomModal";

const CATEGORY_PRESETS = [
  { name: "Car / Transport", choices: [] },
  { name: "Department / Agency", choices: [] },
  { name: "Food / Restaurant", choices: [] },
  { name: "Cosmetics Shop", choices: [] },
  { name: "Furniture Shop", choices: [] },
  { name: "Resort / Pool", choices: [] },
  { name: "Hotel / Lodging", choices: [] },
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

const AdminFeedbackTypes = ({ theme, darkMode }) => {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(true);
  
  // Create state
  const [newName, setNewName] = useState("");
  const [newChoices, setNewChoices] = useState([]);
  const [tmpChoice, setTmpChoice] = useState("");

  // Pre-populated templates
  const [catPresets, setCatPresets] = useState(CATEGORY_PRESETS);
  
  // Edit state
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editChoices, setEditChoices] = useState([]);
  const [tmpEditChoice, setTmpEditChoice] = useState("");
  
  const [dialog, setDialog] = useState({ isOpen: false });
  
  // Modal Edit state
  const [isChoiceModal, setIsChoiceModal] = useState(false);
  const [modalCat, setModalCat] = useState(null);
  const [mChoices, setMChoices] = useState([]);
  const [mTmp, setMTmp] = useState("");

  const load = () => adminGetCategories().then(setCats).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  // Auto-load choices if name matches existing
  useEffect(() => {
    if (!newName.trim()) return;
    const existing = cats.find(c => c.name.toLowerCase() === newName.trim().toLowerCase());
    if (existing && newChoices.length === 0) {
      try {
        const parsed = JSON.parse(existing.description || "[]");
        if (Array.isArray(parsed)) setNewChoices(parsed);
      } catch(e) { setNewChoices([]); }
    }
  }, [newName, cats]);

  const handleCreate = async (e) => {
    if (e) e.preventDefault();
    if (!newName.trim()) return;
    
    // Check if we are updating an existing one by name
    const existing = cats.find(c => c.name.toLowerCase() === newName.trim().toLowerCase());
    
    try {
      const descVal = JSON.stringify(newChoices);
      
      if (existing) {
        // Mode: Update
        await adminUpdateCategory(existing.id, existing.name, descVal, []);
        setDialog({
          isOpen: true, type: "alert", title: "Success",
          message: `Category "${existing.name}" has been updated with your new choices.`,
          confirmText: "Perfect", onConfirm: () => setDialog({ isOpen: false })
        });
      } else {
        // Mode: Create
        await adminCreateCategory(newName.trim(), descVal, []);
        setDialog({
          isOpen: true, type: "alert", title: "Success",
          message: `Category "${newName}" has been created and is now available for users.`,
          confirmText: "Great", onConfirm: () => setDialog({ isOpen: false })
        });
      }
      
      setNewName(""); 
      setNewChoices([]); 
      // isAdding remains true to keep builder open
      load();
    } catch (err) {
      console.error("Action failed", err);
      const msg = err.response?.data?.detail || "Failed to process category request.";
      setDialog({
        isOpen: true, type: "alert", title: "Action Failed",
        message: msg, confirmText: "Retry", onConfirm: () => setDialog({ isOpen: false })
      });
    }
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) return;
    const descVal = JSON.stringify(editChoices);
    await adminUpdateCategory(id, editName.trim(), descVal, []);
    setEditId(null); setEditName(""); setEditChoices([]); load();
  };

  const applyPreset = (p) => {
    setNewName(p.name);
    const existing = cats.find(c => c.name.toLowerCase() === p.name.toLowerCase());
    if (existing) {
      try {
        const parsed = JSON.parse(existing.description || "[]");
        setNewChoices(Array.isArray(parsed) ? parsed : []);
      } catch(e) { setNewChoices([]); }
    } else {
      setNewChoices(p.choices || []);
    }
  };

  const addCustomPreset = () => {
    const name = prompt("Enter New Industry / Category Name:");
    if (name && name.trim()) {
      setCatPresets([...catPresets, { name: name.trim(), desc: "" }]);
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

  const openChoiceModal = (c) => {
    setModalCat(c);
    try {
      const parsed = JSON.parse(c.description || "[]");
      setMChoices(Array.isArray(parsed) ? parsed : []);
    } catch(e) { setMChoices([]); }
    setIsChoiceModal(true);
  };

  const saveModalChoices = async () => {
    if (!modalCat) return;
    try {
      const descVal = JSON.stringify(mChoices);
      await adminUpdateCategory(modalCat.id, modalCat.name, descVal, []);
      setIsChoiceModal(false);
      load();
      setDialog({
        isOpen: true, type: "alert", title: "Changes Saved",
        message: `Updated choices for "${modalCat.name}" successfully.`,
        confirmText: "Close", onConfirm: () => setDialog({ isOpen: false })
      });
    } catch (err) {
      console.error("Save failed", err);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      
        <div style={{ background: theme.surface, borderRadius: "12px", padding: "28px", border: `1px solid ${theme.border}`, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <p style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: theme.text }}>Category Builder</p>
            <button onClick={() => { setNewName(""); setNewChoices([]); }} style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>CLEAR</button>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
               <label style={{ ...labelStyle, color: theme.textMuted }}>Industry / Category Templates</label>
               <button type="button" onClick={addCustomPreset} style={{ background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer', fontSize: '11px', fontWeight: '800' }}>+ ADD TEMPLATE</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {catPresets
                .map((p, idx) => (
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
                <label style={{ ...labelStyle, color: theme.textMuted }}>Establishment/Service Choices</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      value={tmpChoice} 
                      onChange={e => setTmpChoice(e.target.value)} 
                      placeholder="Add an option (e.g. HR, IT, Jollibee...)" 
                      style={{ ...inputStyle, background: theme.bg, color: theme.text, borderColor: theme.border }} 
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (tmpChoice.trim() && !newChoices.includes(tmpChoice.trim())) {
                            setNewChoices([...newChoices, tmpChoice.trim()]);
                            setTmpChoice("");
                          }
                        }
                      }}
                    />
                    <button 
                      type="button" 
                      onClick={() => { 
                        if (tmpChoice.trim() && !newChoices.includes(tmpChoice.trim())) {
                          setNewChoices([...newChoices, tmpChoice.trim()]);
                          setTmpChoice("");
                        }
                      }}
                      style={{ ...editBtn, padding: '0 16px' }}
                    >
                      ADD
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minHeight: '32px', padding: '8px', background: theme.bg, borderRadius: '8px', border: `1px solid ${theme.border}` }}>
                    {Array.isArray(newChoices) && newChoices.map((choice, cidx) => (
                      <div key={cidx} style={{ 
                        display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', 
                        background: '#3B82F6', color: 'white', borderRadius: '14px', fontSize: '11px', fontWeight: '700' 
                      }}>
                        {choice}
                        <span onClick={() => setNewChoices(newChoices.filter((_, i) => i !== cidx))} style={{ cursor: 'pointer', opacity: 0.8 }}>×</span>
                      </div>
                    ))}
                    {(!newChoices || newChoices.length === 0) && <span style={{ fontSize: '11px', color: theme.textMuted }}>Nothing added yet.</span>}
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={!newName.trim()} 
              style={{ 
                ...primaryBtn, 
                padding: '14px', 
                borderRadius: '10px', 
                opacity: !newName.trim() ? 0.6 : 1, 
                width: '100%',
                background: cats.some(c => c.name.toLowerCase() === newName.trim().toLowerCase()) 
                  ? 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' 
                  : primaryBtn.background
              }}
            >
              {cats.some(c => c.name.toLowerCase() === newName.trim().toLowerCase()) 
                ? 'Update Existing Category' 
                : 'Create Category'}
            </button>
          </form>
        </div>

      {/* Table */}
      <div style={{ background: theme.surface, borderRadius: "12px", border: `1px solid ${theme.border}`, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "32px", textAlign: "center", color: theme.textMuted, fontSize: "13px" }}>Loading...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: darkMode ? "rgba(255,255,255,0.02)" : "#F8FAFC", borderBottom: `1px solid ${theme.border}` }}>
                {["#", "Category Type", "Establishment/Service", "Submissions", ""].map(h => (
                  <th key={h} style={{ ...thStyle, color: theme.textMuted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cats.map((c, i) => (
                <React.Fragment key={c.id}>
                  <tr style={{ borderBottom: `1px solid ${theme.border}` }}
                    onMouseEnter={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.02)" : "#FAFAFA"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ ...tdStyle, color: theme.textMuted }}>{i + 1}</td>
                    <td style={tdStyle}>
                      {editId === c.id
                        ? <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus style={{ ...inputStyle, background: theme.bg, color: theme.text, borderColor: theme.border, width: "160px" }} />
                        : <span style={{ fontWeight: "600", color: theme.text }}>{c.name}</span>}
                    </td>
                    <td style={tdStyle}>
                      <span 
                        onClick={() => openChoiceModal(c)}
                        style={{ 
                          fontSize: '11.5px', fontWeight: '700', color: '#3B82F6', background: 'rgba(59,130,246,0.08)', 
                          padding: '4px 12px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
                          border: '1px solid rgba(59,130,246,0.1)'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.15)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.08)'; e.currentTarget.style.transform = 'scale(1)'; }}
                      >
                        {(() => {
                          try {
                            const parsed = JSON.parse(c.description || "[]");
                            return Array.isArray(parsed) ? `${parsed.length}` : '0';
                          } catch(e) { return '0'; }
                        })()}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: "12px", fontWeight: "600", color: theme.text }}>{c.count}</span>
                    </td>                    <td style={{ ...tdStyle, textAlign: "right" }}>
                        <DotsMenu 
                          onEdit={() => openChoiceModal(c)} 
                          onDelete={() => handleDelete(c)} 
                          theme={theme}
                          darkMode={darkMode}
                        />
                    </td>
                  </tr>
                </React.Fragment>
              ))}
              {cats.length === 0 && (
                <tr><td colSpan={5} style={{ padding: "32px", textAlign: "center", color: theme.textMuted, fontSize: "13px" }}>No feedback types found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Choice Editor Modal */}
      {isChoiceModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: '20px' }}>
          <div style={{ background: theme.surface, width: '100%', maxWidth: '480px', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden', animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ padding: '24px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: darkMode ? 'rgba(255,255,255,0.02)' : 'white' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: theme.text }}>Edit Choices</h3>
                <p style={{ margin: 0, fontSize: '12px', color: theme.textMuted }}>{modalCat?.name}</p>
              </div>
              <button onClick={() => setIsChoiceModal(false)} style={{ background: theme.bg, color: theme.text, border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
            </div>
            
            <div style={{ padding: '24px' }}>
               <label style={{ fontSize: '11px', fontWeight: '800', color: theme.textMuted, display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Add Establishment / Service</label>
               <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                  <input 
                    value={mTmp} 
                    onChange={e => setMTmp(e.target.value)} 
                    placeholder="Type name and press Enter..." 
                    style={{ ...inputStyle, flex: 1, background: theme.bg, color: theme.text, borderColor: theme.border }} 
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (mTmp.trim() && !mChoices.includes(mTmp.trim())) {
                          setMChoices([...mChoices, mTmp.trim()]);
                          setMTmp("");
                        }
                      }
                    }}
                  />
                  <button 
                    onClick={() => {
                      if (mTmp.trim() && !mChoices.includes(mTmp.trim())) {
                        setMChoices([...mChoices, mTmp.trim()]);
                        setMTmp("");
                      }
                    }}
                    style={{ ...editBtn, padding: '0 16px', borderRadius: '10px' }}
                  >ADD</button>
               </div>

               <label style={{ fontSize: '11px', fontWeight: '800', color: theme.textMuted, display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Current List ({mChoices.length})</label>
               <div style={{ maxHeight: '300px', overflowY: 'auto', background: theme.bg, borderRadius: '14px', border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', gap: '2px', padding: '4px' }}>
                  {mChoices.map((choice, idx) => (
                    <div key={idx} style={{ 
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                      padding: '10px 14px', borderRadius: '10px', transition: 'background 0.2s',
                      background: darkMode ? 'rgba(255,255,255,0.03)' : 'white'
                    }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: theme.text }}>{choice}</span>
                      <button 
                        onClick={() => setMChoices(mChoices.filter((_, i) => i !== idx))}
                        style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '18px', cursor: 'pointer', padding: '0 4px' }}
                      >×</button>
                    </div>
                  ))}
                  {mChoices.length === 0 && (
                    <div style={{ padding: '30px', textAlign: 'center', color: theme.textMuted, fontSize: '12px' }}>Nothing added yet.</div>
                  )}
               </div>
            </div>

            <div style={{ padding: '16px 24px', background: darkMode ? 'rgba(255,255,255,0.02)' : '#F8FAFC', borderTop: `1px solid ${theme.border}`, display: 'flex', gap: '12px' }}>
               <button onClick={() => setIsChoiceModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
               <button onClick={saveModalChoices} style={{ flex: 2, padding: '12px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #30CFD0 0%, #330867 100%)', color: 'white', fontWeight: '700', cursor: 'pointer' }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

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
