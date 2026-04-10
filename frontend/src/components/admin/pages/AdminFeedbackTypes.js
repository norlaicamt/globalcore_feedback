import React, { useEffect, useState, useRef } from "react";
import { adminGetEntities, adminCreateEntity, adminUpdateEntity, adminDeleteEntity } from "../../../services/adminApi";
import { useTerminology } from "../../../context/TerminologyContext";
import CustomModal from "../../CustomModal";
import { IconRegistry } from "../../IconRegistry";

const CATEGORY_PRESETS = [];

const AVAILABLE_ICONS = [
  { key: 'default', label: 'General' },
  { key: 'building', label: 'Office' },
  { key: 'department', label: 'Public' },
  { key: 'food', label: 'Dining' },
  { key: 'car', label: 'Transport' },
  { key: 'hotel', label: 'Lodging' },
  { key: 'it', label: 'Tech' },
  { key: 'finance', label: 'Bank' },
  { key: 'health', label: 'Health' },
  { key: 'edu', label: 'Education' },
  { key: 'law', label: 'Legal' },
  { key: 'retail', label: 'Retail' },
  { key: 'sports', label: 'Sports' },
  { key: 'travel', label: 'Travel' },
  { key: 'gov', label: 'Gov' },
  { key: 'util', label: 'Utility' },
  { key: 'nature', label: 'Nature' },
  { key: 'security', label: 'Security' },
  { key: 'media', label: 'Media' },
  { key: 'tech', label: 'Tech' },
  { key: 'social', label: 'Social' },
  { key: 'delivery', label: 'Delivery' },
  { key: 'beauty', label: 'Beauty' },
  { key: 'entertainment', label: 'Fun' },
  { key: 'energy', label: 'Energy' },
  { key: 'bank', label: 'Finance' },
  { key: 'pet', label: 'Pets' },
  { key: 'art', label: 'Arts' },
  { key: 'clothing', label: 'Clothing' },
  { key: 'coffee', label: 'Cafe' },
  { key: 'train', label: 'Train' },
  { key: 'bus', label: 'Bus' },
  { key: 'gym', label: 'Gym' },
  { key: 'laundry', label: 'Laundry' },
  { key: 'gas', label: 'Gas' },
  { key: 'post', label: 'Post' },
  { key: 'repair', label: 'Repair' },
];

// 3-dot action menu
const DotsMenu = ({ onEdit, onDelete, theme, darkMode, adminUser }) => {
  const hasGlobalAdminAccess = ["admin", "superadmin"].includes(adminUser?.role);
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
        style={{ 
          width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", 
          background: open ? (darkMode ? "rgba(59,130,246,0.1)" : "#EFF6FF") : (darkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC"), 
          border: `1px solid ${open ? '#3B82F6' : theme.border}`, borderRadius: "8px", cursor: "pointer", 
          color: open ? '#3B82F6' : theme.text, transition: 'all 0.2s' 
        }}
        onMouseEnter={e => { if(!open) e.currentTarget.style.borderColor = '#3B82F6'; e.currentTarget.style.color = '#3B82F6'; }}
        onMouseLeave={e => { if(!open) e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = open ? '#3B82F6' : theme.text; }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
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
          {hasGlobalAdminAccess && (
            <>
              <div style={{ height: "1px", background: theme.border, margin: "4px 0" }} />
              <button
                onClick={() => { onDelete(); setOpen(false); }}
                style={{ ...menuItemStyle, color: "#EF4444" }}
                onMouseEnter={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.05)" : "#F1F5F9"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                Delete Type
              </button>
            </>
          )}
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

const AdminFeedbackTypes = ({ theme, darkMode, adminUser }) => {
  const { getLabel } = useTerminology();
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(true);
  const [showIcons, setShowIcons] = useState(false);
  
  // Create state
  const [newName, setNewName] = useState("");
  const [newIconKey, setNewIconKey] = useState("default");
  const [newChoices, setNewChoices] = useState([]); 
  const [tmpName, setTmpName] = useState("");

  // Pre-populated templates
  const [catPresets, setCatPresets] = useState(CATEGORY_PRESETS);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");

  const [showChoiceView, setShowChoiceView] = useState(false);
  const [viewChoices, setViewChoices] = useState([]);
  const [viewTitle, setViewTitle] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  
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

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminGetEntities();
      setCats(data || []);
      setCatPresets(data || []);
    } catch(err) { console.error(err); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // Auto-load hierarchy if name matches existing
  useEffect(() => {
    if (!newName.trim()) return;
    const existing = cats.find(c => c.name.toLowerCase() === newName.trim().toLowerCase());
    if (existing && newChoices.length === 0) {
      try {
        const parsed = JSON.parse(existing.description || "[]");
        if (typeof parsed === 'object' && !Array.isArray(parsed)) {
          // Flatten existing 3-tier structure into one list
          const flattened = [];
          Object.values(parsed).forEach(v => {
            const names = (typeof v === 'object' && !Array.isArray(v)) ? v.names : (v || []);
            flattened.push(...names);
          });
          setNewChoices([...new Set(flattened)]); // unique names
        } else if (Array.isArray(parsed)) {
          setNewChoices(parsed);
        }
        if (existing.icon) setNewIconKey(existing.icon);
      } catch(e) { setNewChoices([]); }
    }
  }, [newName, cats]);

  const handleCreate = async (e) => {
    if (e) e.preventDefault();
    if (!newName.trim()) return;

    try {
      if (editingCategoryId) {
        const target = cats.find(c => c.id === editingCategoryId);
        if (!target) {
          throw new Error("Category to update not found.");
        }
        // Rename-only behavior for Edit Type flow.
        await adminUpdateEntity(
          target.id,
          newName.trim(),
          target.description || "",
          target.fields || [],
          target.icon || "default"
        );
        setDialog({
          isOpen: true, type: "alert", title: "Success",
          message: `${getLabel("category_label", "Category")} name was updated successfully.`,
          confirmText: "Perfect", onConfirm: () => setDialog({ isOpen: false })
        });
      } else {
        const descVal = JSON.stringify(newChoices);
        await adminCreateEntity(newName.trim(), descVal, [], newIconKey);
        setDialog({
          isOpen: true, type: "alert", title: "Success",
          message: `${getLabel("category_label", "Category")} "${newName}" has been created.`,
          confirmText: "Great", onConfirm: () => setDialog({ isOpen: false })
        });
      }
      
      setNewName(""); 
      setNewChoices([]);
      setNewIconKey("default");
      setTmpName("");
      setEditingCategoryId(null);
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
    const existing = cats.find(c => c.id === id);
    await adminUpdateEntity(id, editName.trim(), descVal, [], existing?.icon || "default");
    setEditId(null); setEditName(""); setEditChoices([]); load();
  };

  const applyPreset = (p) => {
    setNewName(p.name);
    const existing = cats.find(c => c.name.toLowerCase() === p.name.toLowerCase());
    if (existing) {
      try {
        const parsed = JSON.parse(existing.description || "{}");
        if (typeof parsed === 'object' && !Array.isArray(parsed)) {
          const flattened = [];
          Object.values(parsed).forEach(v => {
            const names = (typeof v === 'object' && !Array.isArray(v)) ? v.names : (v || []);
            flattened.push(...names);
          });
          setNewChoices([...new Set(flattened)]);
        } else if (Array.isArray(parsed)) {
          setNewChoices(parsed);
        }
        if (existing.icon) setNewIconKey(existing.icon);
      } catch(e) { setNewChoices([]); }
    } else {
      setNewChoices(p.choices || []);
      if (p.icon) setNewIconKey(p.icon);
    }
  };

  const handleAddPreset = () => {
    if (newPresetName.trim()) {
      setCatPresets([...catPresets, { name: newPresetName.trim(), choices: [] }]);
      setNewPresetName("");
      setShowPresetModal(false);
    }
  };

  const handleDelete = (cat) => {
    setDialog({
      isOpen: true, type: "alert", title: `Delete ${getLabel("category_label", "Category")} Type`,
      message: `Delete "${cat.name}"? ${cat.count} submission(s) use this ${getLabel("category_label", "category")} type.`,
      confirmText: "Delete", isDestructive: true,
      onConfirm: async () => { 
        try {
          await adminDeleteEntity(cat.id); 
          setDialog({ isOpen: false }); 
          load(); 
        } catch (err) {
          const errMsg = err.response?.data?.detail || `This ${getLabel("category_label", "category")} cannot be deleted because it is currently in use by existing feedbacks.`;
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

  const addChoice = (name) => {
    if (!name.trim()) return;
    if (!newChoices.includes(name.trim())) {
      setNewChoices([...newChoices, name.trim()]);
    }
  };

  const removeChoice = (name) => {
    setNewChoices(newChoices.filter(n => n !== name));
  };

  const openCategoryForEdit = (c) => {
    setEditingCategoryId(c.id);
    setNewName(c.name);
    if (c.icon) setNewIconKey(c.icon);
    try {
      const parsed = JSON.parse(c.description || "[]");
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        const flattened = [];
        Object.values(parsed).forEach(v => {
          const names = (typeof v === 'object' && !Array.isArray(v)) ? v.names : (v || []);
          flattened.push(...names);
        });
        setNewChoices([...new Set(flattened)]);
      } else if (Array.isArray(parsed)) {
        setNewChoices(parsed);
      }
    } catch(e) { 
      setNewChoices([]);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      
        <div style={{ background: theme.surface, borderRadius: "12px", padding: "28px", border: `1px solid ${theme.border}`, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <p style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: theme.text }}>{getLabel("category_label", "Category")} Builder</p>
            <button
              onClick={() => {
                setNewName("");
                setNewChoices([]);
                setNewIconKey("default");
                setEditingCategoryId(null);
              }}
              style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}
            >
              CLEAR
            </button>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
               <label style={{ ...labelStyle, color: theme.textMuted }}>Re-use from Existing {getLabel("category_label_plural", "Categories")}</label>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {catPresets
                .map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setNewName(p.name);
                      setNewIconKey(p.icon || "default");
                      try {
                        const parsed = JSON.parse(p.description || "[]");
                        setNewChoices(Array.isArray(parsed) ? parsed : []);
                      } catch(e) { setNewChoices([]); }
                    }}
                    style={{
                      padding: '8px 14px', borderRadius: '12px', border: `1.5px solid ${theme.border}`,
                      background: theme.surface, color: theme.text, fontSize: '12px', fontWeight: '700',
                      cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#3B82F6'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    {(() => {
                      const Icon = IconRegistry[p.icon] || IconRegistry.default;
                      return <Icon width="14" height="14" color="#3B82F6" />;
                    })()}
                    {p.name}
                  </button>
              ))}
            </div>
          </div>
          
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: 'column', gap: "24px" }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px', background: theme.bg, borderRadius: '20px', border: `1px solid ${theme.border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  
                  {/* Category Name Row */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ ...labelStyle, color: theme.textMuted }}>{getLabel("category_label", "Category")} Name</label>
                      <input 
                        value={newName} 
                        onChange={e => setNewName(e.target.value)} 
                        placeholder="e.g. Food / Restaurant" 
                        style={{ ...inputStyle, fontSize: '16px', padding: '12px 16px', background: theme.surface, color: theme.text, borderColor: theme.border }} 
                      />
                    </div>

                    {/* Icon Selection Grid */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ ...labelStyle, color: theme.textMuted }}>{getLabel("category_label", "Category")} Icon</label>
                        <button 
                          type="button" 
                          onClick={() => setShowIcons(!showIcons)} 
                          style={{ background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                        >
                          {showIcons ? 'Hide Icons' : 'Change Icon'}
                        </button>
                      </div>
                      
                      {showIcons && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))', gap: '8px', padding: '12px', background: theme.surface, borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                        {AVAILABLE_ICONS.map(icon => {
                          const IconComp = IconRegistry[icon.key] || IconRegistry.default;
                          const isSelected = newIconKey === icon.key;
                          return (
                            <button
                              key={icon.key}
                              type="button"
                              onClick={() => setNewIconKey(icon.key)}
                              title={icon.label}
                              style={{
                                width: '40px', height: '40px', borderRadius: '8px', border: `2px solid ${isSelected ? '#3B82F6' : 'transparent'}`,
                                background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'none', color: isSelected ? '#3B82F6' : theme.textMuted,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
                              }}
                              onMouseEnter={e => !isSelected && (e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.05)' : '#F1F5F9')}
                              onMouseLeave={e => !isSelected && (e.currentTarget.style.background = 'none')}
                            >
                              <IconComp width="20" height="20" />
                            </button>
                          );
                        })}
                      </div>
                      )}
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
                background: editingCategoryId
                  ? 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' 
                  : primaryBtn.background
              }}
            >
              {editingCategoryId
                ? `Update Existing ${getLabel("category_label", "Category")}` 
                : `Create ${getLabel("category_label", "Category")}`}
            </button>
          </form>
        </div>

      {/* Table */}
      <div style={{ background: theme.surface, borderRadius: "12px", border: `1px solid ${theme.border}`, overflowX: "auto", boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        {loading ? (
          <div style={{ padding: "32px", textAlign: "center", color: theme.textMuted, fontSize: "13px" }}>Loading...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: "700px" }}>
            <thead>
              <tr style={{ background: darkMode ? "rgba(255,255,255,0.02)" : "#F8FAFC", borderBottom: `1px solid ${theme.border}` }}>
                <th key="#" style={{ ...thStyle, color: theme.textMuted }}>#</th>
                <th key="cat" style={{ ...thStyle, color: theme.textMuted }}>{getLabel("category_label", "Category")} Type</th>
                <th key="est" style={{ ...thStyle, color: theme.textMuted }}>{getLabel("entity_label", "Establishment/Service")}</th>
                <th key="sub" style={{ ...thStyle, color: theme.textMuted }}>Submissions</th>
                <th key="actions" style={{ ...thStyle, color: theme.textMuted }}></th>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ padding: '6px', background: darkMode ? 'rgba(59,130,246,0.1)' : '#EFF6FF', borderRadius: '8px', color: '#3B82F6', display: 'flex' }}>
                          {(() => {
                            const IconComp = IconRegistry[c.icon] || IconRegistry.default;
                            return <IconComp width="18" height="18" />;
                          })()}
                        </div>
                        <span style={{ fontWeight: "600", color: theme.text }}>{c.name}</span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div 
                        onClick={() => {
                          try {
                            const parsed = JSON.parse(c.description || "[]");
                            setViewTitle(c.name);
                            setViewChoices(Array.isArray(parsed) ? parsed : []);
                            setShowChoiceView(true);
                          } catch(e) { 
                            setViewTitle(c.name);
                            setViewChoices([]);
                            setShowChoiceView(true);
                          }
                        }}
                        style={{ 
                          fontSize: '13px', fontWeight: '800', color: '#3B82F6', background: 'rgba(59,130,246,0.08)', 
                          width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s',
                          border: '1px solid rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.15)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.08)'; e.currentTarget.style.transform = 'scale(1)'; }}
                      >
                        {(() => {
                          try {
                            const parsed = JSON.parse(c.description || "[]");
                            return Array.isArray(parsed) ? parsed.length : 0;
                          } catch(e) { return 0; }
                        })()}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: "12px", fontWeight: "600", color: theme.text }}>{c.count}</span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right", width: '50px' }}>
                        <DotsMenu 
                          onEdit={() => openCategoryForEdit(c)} 
                          onDelete={() => handleDelete(c)} 
                          theme={theme}
                          darkMode={darkMode}
                          adminUser={adminUser}
                        />
                    </td>
                  </tr>
                </React.Fragment>
              ))}
              {cats.length === 0 && (
                <tr><td colSpan={5} style={{ padding: "32px", textAlign: "center", color: theme.textMuted, fontSize: "13px" }}>No {getLabel("category_label", "feedback type")} found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>


      {/* New Preset Modal */}
      {showPresetModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: '20px' }}>
          <div style={{ background: theme.surface, width: '100%', maxWidth: '380px', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden', animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '800', color: theme.text }}>Add New Template</h3>
              <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: theme.textMuted }}>Enter a name for your new category preset.</p>
              
              <input 
                autoFocus
                value={newPresetName} 
                onChange={e => setNewPresetName(e.target.value)} 
                placeholder="e.g. Real Estate" 
                style={{ ...inputStyle, background: theme.bg, color: theme.text, borderColor: theme.border, textAlign: 'center', padding: '12px' }}
                onKeyDown={e => { if (e.key === 'Enter') handleAddPreset(); }}
              />
            </div>
            
            <div style={{ padding: '16px 24px', background: darkMode ? 'rgba(255,255,255,0.02)' : '#F8FAFC', borderTop: `1px solid ${theme.border}`, display: 'flex', gap: '12px' }}>
              <button onClick={() => { setShowPresetModal(false); setNewPresetName(""); }} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={handleAddPreset} disabled={!newPresetName.trim()} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #1f2a56 0%, #2563EB 100%)', color: 'white', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', opacity: !newPresetName.trim() ? 0.6 : 1 }}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Choice View Modal */}
      {showChoiceView && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: '20px' }}>
          <div style={{ background: theme.surface, width: '100%', maxWidth: '450px', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden', animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ padding: '24px', background: 'linear-gradient(135deg, #1f2a56 0%, #2563EB 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'white' }}>{viewTitle}</h3>
                <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>{viewChoices.length} Registered {getLabel("entity_label_plural", "Establishments/Services")}</p>
              </div>
              <button onClick={() => setShowChoiceView(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', width: '32px', height: '32px', borderRadius: '10px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div style={{ padding: '24px', maxHeight: '400px', overflowY: 'auto' }}>
              {viewChoices.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' }}>
                  {viewChoices.map((choice, idx) => (
                    <div key={idx} style={{ padding: '10px 14px', background: darkMode ? 'rgba(255,255,255,0.05)' : '#F1F5F9', borderRadius: '12px', border: `1px solid ${theme.border}`, fontSize: '13px', color: theme.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3B82F6' }} />
                      {choice}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px', color: theme.textMuted }}>No items registered for this {getLabel("category_label", "category")} yet.</div>
              )}
            </div>
            
            <div style={{ padding: '16px 24px', background: darkMode ? 'rgba(255,255,255,0.02)' : '#F8FAFC', borderTop: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowChoiceView(false)} style={{ padding: '10px 24px', borderRadius: '12px', border: 'none', background: '#2563EB', color: 'white', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>Got it</button>
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
