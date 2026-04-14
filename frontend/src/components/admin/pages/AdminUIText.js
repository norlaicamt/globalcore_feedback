import React, { useState, useEffect } from "react";
import { adminGetProfile, getSystemLabels, updateSystemLabelsBulk, getAdminSettings, updateAdminSetting, getFormFields, saveFormFields } from "../../../services/adminApi";
import { useTerminology } from "../../../context/TerminologyContext";

// ─── SVG icon set (no emojis) ─────────────────────────────────────────────────
const Ico = {
  Text:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>,
  Dropdown: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  Number:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>,
  Date:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Rating:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  User:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Star:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Paperclip:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
  Mic:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  Package:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  Tag:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  Folder:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  MapPin:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Pencil:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Message:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Eye:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Check:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  Plus:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Trash:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Up:       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>,
  Down:     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  X:        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Save:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
};

const FIELD_TYPES = [
  { value: 'text',     label: 'Text Input',  icon: Ico.Text },
  { value: 'dropdown', label: 'Dropdown',    icon: Ico.Dropdown },
  { value: 'number',   label: 'Number',      icon: Ico.Number },
  { value: 'date',     label: 'Date Picker', icon: Ico.Date },
  { value: 'rating',   label: 'Star Rating', icon: Ico.Rating },
];

const FIELD_ICON_MAP = { text: Ico.Text, dropdown: Ico.Dropdown, number: Ico.Number, date: Ico.Date, rating: Ico.Rating };

const SectionCard = ({ title, subtitle, children, theme }) => (
  <div style={{ background: theme.surface, borderRadius: "16px", padding: "32px", border: `1px solid ${theme.border}`, boxShadow: "0 10px 40px rgba(0,0,0,0.03)" }}>
    <h2 style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: "800", color: theme.text, letterSpacing: "-0.01em" }}>{title}</h2>
    {subtitle && <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: theme.textMuted, lineHeight: "1.5" }}>{subtitle}</p>}
    <div style={{ height: "1px", background: theme.border, marginBottom: "24px" }} />
    {children}
  </div>
);

const TextRow = ({ title, value, onChange, theme, placeholder, rows = 3 }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [localVal, setLocalVal] = useState(value || "");

  useEffect(() => {
    setLocalVal(value || "");
  }, [value]);

  const handleBlur = () => {
    setIsFocused(false);
    if (localVal !== (value || "")) {
      onChange(localVal);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "16px 0", borderBottom: `1px solid ${theme.border}` }}>
      <label style={{ fontSize: "13px", fontWeight: "700", color: isFocused ? "#3B82F6" : theme.textMuted, transition: "color 0.2s" }}>{title}</label>
      <div style={{ position: "relative" }}>
        <textarea value={localVal} onChange={(e) => setLocalVal(e.target.value)}
          onFocus={() => setIsFocused(true)} onBlur={handleBlur}
          placeholder={placeholder} rows={rows}
          style={{ width: "100%", padding: "16px", borderRadius: "12px", border: `2px solid ${isFocused ? '#3B82F6' : theme.border}`, background: isFocused ? `${theme.bg}80` : theme.surface, color: theme.text, fontSize: "14px", fontFamily: "inherit", resize: "none", boxSizing: "border-box", lineHeight: "1.6", outline: "none", transition: "all 0.2s", boxShadow: isFocused ? "0 4px 20px rgba(59, 130, 246, 0.1)" : "none" }}
        />

        {isFocused && (
          <div style={{ position: "absolute", bottom: "12px", right: "16px", fontSize: "11px", fontWeight: "700", color: "#3B82F6", background: "rgba(59,130,246,0.1)", padding: "4px 8px", borderRadius: "10px" }}>Saving automatically...</div>
        )}
      </div>
    </div>
  );
};

// ─── Inline field editor (used for both Add + Edit) ──────────────────────────
const FieldEditor = ({ initial, theme, onSave, onCancel, title = "New Field" }) => {
  const [field, setField] = useState(initial);
  const [optInput, setOptInput] = useState('');

  const addOption = () => {
    if (!optInput.trim()) return;
    setField(p => ({ ...p, options: [...(p.options || []), optInput.trim()] }));
    setOptInput('');
  };
  const removeOption = (o) => setField(p => ({ ...p, options: (p.options || []).filter(x => x !== o) }));

  const inp = {
    padding: "10px 14px", borderRadius: "10px", border: `1.5px solid ${theme.border}`,
    background: theme.surface, color: theme.text, fontSize: "13px", fontFamily: "inherit",
    outline: "none", width: "100%", boxSizing: "border-box"
  };

  return (
    <div style={{ padding: "24px", background: "rgba(59,130,246,0.04)", borderRadius: "16px", border: "2px solid #3B82F6", display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ color: "#2563EB" }}>{Ico.Pencil}</span>
        <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: "#2563EB" }}>{title}</h4>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: theme.textMuted, marginBottom: "6px" }}>Field Label *</label>
          <input value={field.label} onChange={e => setField(p => ({ ...p, label: e.target.value }))} placeholder="e.g. Branch Name" style={inp} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: theme.textMuted, marginBottom: "6px" }}>Field Type</label>
          <select value={field.field_type} onChange={e => setField(p => ({ ...p, field_type: e.target.value }))} style={{ ...inp, cursor: "pointer" }}>
            {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: theme.textMuted, marginBottom: "6px" }}>Placeholder Text (Optional)</label>
        <input value={field.placeholder || ''} onChange={e => setField(p => ({ ...p, placeholder: e.target.value }))} placeholder="e.g. Enter branch name..." style={inp} />
      </div>

      {field.field_type === 'dropdown' && (
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: theme.textMuted, marginBottom: "6px" }}>Dropdown Options</label>
          <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            <input value={optInput} onChange={e => setOptInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOption(); } }} placeholder="Type an option, press Enter..." style={{ ...inp, flex: 1 }} />
            <button type="button" onClick={addOption} style={{ padding: "10px 16px", background: "#3B82F6", color: "white", border: "none", borderRadius: "10px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>{Ico.Plus} Add</button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {(field.options || []).map((opt, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "5px 10px", background: "#DBEAFE", color: "#1E40AF", borderRadius: "20px", fontSize: "12px", fontWeight: "700" }}>
                {opt}
                <span onClick={() => removeOption(opt)} style={{ cursor: "pointer", display: "flex", alignItems: "center", opacity: 0.7 }}>{Ico.X}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <input type="checkbox" id={`req-${title}`} checked={!!field.is_required} onChange={e => setField(p => ({ ...p, is_required: e.target.checked }))} style={{ width: "16px", height: "16px", cursor: "pointer" }} />
        <label htmlFor={`req-${title}`} style={{ fontSize: "13px", fontWeight: "600", color: theme.text, cursor: "pointer" }}>Mark as Required</label>
      </div>

      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
        <button type="button" onClick={onCancel} style={{ padding: "10px 20px", background: theme.surface, color: theme.textMuted, border: `1px solid ${theme.border}`, borderRadius: "10px", fontWeight: "700", cursor: "pointer" }}>Cancel</button>
        <button type="button" onClick={() => onSave(field)} disabled={!field.label.trim()} style={{ padding: "10px 24px", background: field.label.trim() ? "#3B82F6" : theme.border, color: "white", border: "none", borderRadius: "10px", fontWeight: "700", cursor: field.label.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: "6px" }}>
          {Ico.Save} Save Field
        </button>
      </div>
    </div>
  );
};

// ─── Toggle row sub-component ─────────────────────────────────────────────────
const ToggleRow = ({ icon, label, sub, on, onToggle, theme, darkMode }) => (
  <div onClick={onToggle} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderRadius: "14px", background: on ? (darkMode ? "rgba(59,130,246,0.08)" : "#EFF6FF") : (darkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC"), border: `1.5px solid ${on ? "#BFDBFE" : theme.border}`, cursor: "pointer", transition: "all 0.2s", userSelect: "none" }}>
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <div style={{ color: on ? "#3B82F6" : theme.textMuted, display: "flex", alignItems: "center" }}>{icon}</div>
      <div>
        <p style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: on ? "#1D4ED8" : theme.text }}>{label}</p>
        <p style={{ margin: 0, fontSize: "12px", color: theme.textMuted }}>{sub}</p>
      </div>
    </div>
    <div style={{ width: "44px", height: "24px", borderRadius: "12px", background: on ? "#3B82F6" : "#CBD5E1", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: "3px", left: on ? "23px" : "3px", width: "18px", height: "18px", borderRadius: "50%", background: "white", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.25)" }} />
    </div>
  </div>
);

// ─── Preview pill ─────────────────────────────────────────────────────────────
const PreviewRow = ({ icon, label, badge, highlight, theme, darkMode }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: highlight ? "#EFF6FF" : (darkMode ? "rgba(255,255,255,0.05)" : "white"), borderRadius: "10px", border: `1px solid ${highlight ? "#BFDBFE" : theme.border}` }}>
    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: highlight ? "#1D4ED8" : theme.text }}>
      <span style={{ display: "flex" }}>{icon}</span>
      <span style={{ fontSize: "13px", fontWeight: highlight ? "800" : "500" }}>{label}</span>
    </div>
    {badge && <span style={{ fontSize: "10px", background: badge === "Required" ? "#FEE2E2" : "#F1F5F9", color: badge === "Required" ? "#EF4444" : "#64748B", padding: "2px 7px", borderRadius: "10px", fontWeight: "700" }}>{badge}</span>}
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────
const AdminUIText = ({ theme, darkMode }) => {
  const { systemName } = useTerminology();
  const [settings, setSettings] = useState({
    general_report_title: systemName,
    general_report_instruction: "Share your thoughts, concerns, or suggestions about any service, office, or establishment. Please select the appropriate category to proceed.",
    general_report_title_fil: "Ibahagi ang Iyong Feedback",
    general_report_instruction_fil: "Ang feedback ay para sa pagbabahagi ng inyong opinyon, reklamo, o mungkahi tungkol sa anumang serbisyo o opisina. Mangyaring piliin ang naaangkop na kategorya sa ibaba.",
    form_show_staff: 'true',
    form_show_rating: 'true',
    form_show_attachments: 'true',
    form_show_product: 'false',
    form_show_voice: 'true',
  });
  const [loading, setLoading] = useState(true);
  const [updatingKey, setUpdatingKey] = useState(null);
  const [activeTab, setActiveTab] = useState('en');
  const [showPreview, setShowPreview] = useState(false);

  const [formFields, setFormFields] = useState([]);
  const [isSavingFields, setIsSavingFields] = useState(false);
  const [fieldsSaved, setFieldsSaved] = useState(false);
  const [showAddField, setShowAddField] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null); // index of field being edited

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [data, fields] = await Promise.all([getAdminSettings(), getFormFields()]);
        if (data && data.length > 0) {
          const mapped = {};
          data.forEach(s => {
            if (s.key.includes('title') || s.key.includes('instruction') || s.key.startsWith('form_show'))
              mapped[s.key] = s.value;
          });
          setSettings(prev => ({ ...prev, ...mapped }));
        }
        if (fields) setFormFields(fields);
      } catch (e) {
        console.error("Failed to load settings", e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleUpdateText = async (key, value) => {
    setUpdatingKey(key);
    try {
      await updateAdminSetting(key, value);
      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (e) { console.error("Failed to update text setting", e); }
    finally { setUpdatingKey(null); }
  };

  const handleToggle = async (key) => {
    const newVal = settings[key] === 'true' ? 'false' : 'true';
    setSettings(prev => ({ ...prev, [key]: newVal }));
    try { await updateAdminSetting(key, newVal); }
    catch (e) { console.error("Failed to save toggle", e); }
  };

  const handleAddSave = (field) => {
    setFormFields(prev => [...prev, { ...field, id: null, order: prev.length }]);
    setShowAddField(false);
  };

  const handleEditSave = (field) => {
    setFormFields(prev => prev.map((f, i) => i === editingIndex ? { ...f, ...field } : f));
    setEditingIndex(null);
  };

  const handleRemoveField = (index) => {
    setFormFields(prev => prev.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  };

  const handleMoveField = (index, direction) => {
    setFormFields(prev => {
      const arr = [...prev];
      const swap = index + direction;
      if (swap < 0 || swap >= arr.length) return arr;
      [arr[index], arr[swap]] = [arr[swap], arr[index]];
      return arr;
    });
  };

  const handleSaveFields = async () => {
    setIsSavingFields(true);
    try {
      await saveFormFields(formFields.map((f, i) => ({ ...f, order: i })));
      setFieldsSaved(true);
      setTimeout(() => setFieldsSaved(false), 2500);
    } catch (e) { console.error("Failed to save fields", e); }
    finally { setIsSavingFields(false); }
  };

  if (loading) return <div style={{ color: theme.textMuted, fontSize: "13px" }}>Loading configuration...</div>;

  const TOGGLES = [
    { key: 'form_show_staff',       icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, label: 'Staff Involved',    sub: 'Employee name / mention field' },
    { key: 'form_show_rating',      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>, label: 'Star Rating',      sub: 'Satisfaction 1–5 stars' },
    { key: 'form_show_attachments', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>, label: 'Attach Photos',    sub: 'Image / PDF upload' },
    { key: 'form_show_voice',       icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>, label: 'Voice Recording', sub: 'Record and auto-transcribe' },
    { key: 'form_show_product',     icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>, label: 'Product / Package', sub: 'Product or service name' },
  ];

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "32px", padding: "16px 0" }}>

      {/* ── Section 1: User Guidance ── */}
      <SectionCard theme={theme} title="Feedback Setup" subtitle="Customize the instructions and titles shown to users when they start a new feedback report.">
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          <div style={{ padding: "28px", background: darkMode ? "rgba(59,130,246,0.03)" : "#F8FAFC", borderRadius: "20px", border: `1px solid ${theme.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#3B82F6", boxShadow: "0 0 10px rgba(59,130,246,0.5)" }} />
              <h3 style={{ margin: 0, fontSize: "13px", fontWeight: "800", color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.08em" }}>User Guidance</h3>
            </div>
            <TextRow theme={theme} title="Header Title" placeholder="e.g. Submit Your Feedback"
              value={settings.general_report_title} onChange={(v) => handleUpdateText('general_report_title', v)} rows={1} />
            <div style={{ display: "flex", gap: "8px", margin: "20px 0 10px" }}>
              <button onClick={() => setActiveTab('en')} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: activeTab === 'en' ? "#3B82F6" : theme.surface, color: activeTab === 'en' ? "white" : theme.textMuted, fontWeight: "700", cursor: "pointer", transition: "all 0.2s" }}>English</button>
              <button onClick={() => setActiveTab('fil')} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: activeTab === 'fil' ? "#3B82F6" : theme.surface, color: activeTab === 'fil' ? "white" : theme.textMuted, fontWeight: "700", cursor: "pointer", transition: "all 0.2s" }}>Filipino</button>
            </div>
            {activeTab === 'en' && (
              <TextRow theme={theme} title="Instruction Body (English)" placeholder="Provide details on what this report is for..."
                value={settings.general_report_instruction} onChange={(v) => handleUpdateText('general_report_instruction', v)} rows={4} />
            )}
            {activeTab === 'fil' && (
              <TextRow theme={theme} title="Instruction Body (Filipino)" placeholder="Provide details in Filipino..."
                value={settings.general_report_instruction_fil} onChange={(v) => handleUpdateText('general_report_instruction_fil', v)} rows={4} />
            )}
            <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setShowPreview(true)} style={{ padding: "10px 24px", background: "white", color: "#1E293B", border: `1px solid ${theme.border}`, borderRadius: "12px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                {Ico.Eye} Preview Experience
              </button>
            </div>
          </div>
          <div style={{ padding: "18px 24px", background: darkMode ? "rgba(16,185,129,0.05)" : "#ECFDF5", borderRadius: "16px", border: "1px solid #10B981", display: "flex", gap: "16px", alignItems: "center" }}>
            <div style={{ background: "#10B981", padding: "8px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{Ico.Check}</div>
            <p style={{ margin: 0, fontSize: "13px", color: "#047857", fontWeight: "600", lineHeight: "1.4" }}>
              System Live Sync is Active.<br/>
              <span style={{ fontWeight: "400", fontSize: "12px" }}>Changes are saved automatically and reflect instantly on the User Dashboard.</span>
            </p>
          </div>
        </div>
      </SectionCard>

      {/* ── Section 2: Form Layout ── */}
      <SectionCard theme={theme} title="Form Layout" subtitle="Toggle which sections appear in the user feedback form. Required fields (Category, Location, Message) are always shown.">
        <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 320px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {TOGGLES.map(({ key, icon, label, sub }) => (
              <ToggleRow key={key} icon={icon} label={label} sub={sub} on={settings[key] !== 'false'}
                onToggle={() => handleToggle(key)} theme={theme} darkMode={darkMode} />
            ))}
          </div>
          <div style={{ flex: "1 1 260px", background: darkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC", borderRadius: "16px", border: `1px solid ${theme.border}`, padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <p style={{ margin: "0 0 8px 0", fontSize: "11px", fontWeight: "800", color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Form Preview</p>
            <PreviewRow icon={Ico.Tag} label={settings.general_report_title || "Submit Your Feedback"} highlight theme={theme} darkMode={darkMode} />
            <PreviewRow icon={Ico.Folder} label="Category Selection" badge="Required" theme={theme} darkMode={darkMode} />
            <PreviewRow icon={Ico.MapPin} label="Location (Region › City › Barangay)" badge="Required" theme={theme} darkMode={darkMode} />
            {settings.form_show_staff !== 'false' && <PreviewRow icon={Ico.User} label="Staff Involved" badge="Optional" theme={theme} darkMode={darkMode} />}
            {formFields.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: darkMode ? "rgba(59,130,246,0.05)" : "#F0F7FF", borderRadius: "10px", border: "1px dashed #93C5FD" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#2563EB" }}>
                  <span style={{ display: "flex" }}>{FIELD_ICON_MAP[f.field_type]}</span>
                  <span style={{ fontSize: "13px", fontWeight: "600" }}>{f.label}</span>
                </div>
                {f.is_required && <span style={{ fontSize: "10px", background: "#FEE2E2", color: "#EF4444", padding: "2px 7px", borderRadius: "10px", fontWeight: "700" }}>Required</span>}
              </div>
            ))}
            <PreviewRow icon={Ico.Message} label="Your Message" badge="Required" theme={theme} darkMode={darkMode} />
            {settings.form_show_rating !== 'false' && <PreviewRow icon={Ico.Star} label="Star Rating" theme={theme} darkMode={darkMode} />}
            {settings.form_show_attachments !== 'false' && <PreviewRow icon={Ico.Paperclip} label="Attach Photos" theme={theme} darkMode={darkMode} />}
          </div>
        </div>
      </SectionCard>

      {/* ── Section 3: Custom Form Fields ── */}
      <SectionCard theme={theme} title="Custom Form Fields" subtitle="Add extra fields to the user feedback form. Great for collecting Branch, Order ID, or any org-specific data.">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {formFields.length === 0 && !showAddField ? (
            <div style={{ padding: "32px", textAlign: "center", background: darkMode ? "rgba(255,255,255,0.02)" : "#F8FAFC", borderRadius: "16px", border: `2px dashed ${theme.border}` }}>
              <p style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: "700", color: theme.textMuted }}>No custom fields yet</p>
              <p style={{ margin: 0, fontSize: "13px", color: theme.textMuted }}>Click "Add Field" below to create your first dynamic question.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {formFields.map((field, index) => (
                <div key={index}>
                  {editingIndex === index ? (
                    <FieldEditor
                      key={`edit-${index}`}
                      title="Edit Field"
                      initial={{ label: field.label, field_type: field.field_type, is_required: field.is_required, placeholder: field.placeholder || '', options: field.options || [] }}
                      theme={theme}
                      onSave={handleEditSave}
                      onCancel={() => setEditingIndex(null)}
                    />
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", background: darkMode ? "rgba(255,255,255,0.04)" : "white", borderRadius: "12px", border: `1.5px solid ${theme.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <button type="button" onClick={() => handleMoveField(index, -1)} disabled={index === 0} style={{ background: "none", border: "none", cursor: index === 0 ? "default" : "pointer", color: index === 0 ? theme.border : theme.textMuted, display: "flex", padding: "2px" }}>{Ico.Up}</button>
                        <button type="button" onClick={() => handleMoveField(index, 1)} disabled={index === formFields.length - 1} style={{ background: "none", border: "none", cursor: index === formFields.length - 1 ? "default" : "pointer", color: index === formFields.length - 1 ? theme.border : theme.textMuted, display: "flex", padding: "2px" }}>{Ico.Down}</button>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ display: "flex", color: theme.textMuted }}>{FIELD_ICON_MAP[field.field_type]}</span>
                          <span style={{ fontSize: "13px", fontWeight: "800", color: theme.text }}>{field.label}</span>
                          {field.is_required && <span style={{ fontSize: "10px", background: "#FEE2E2", color: "#EF4444", padding: "2px 8px", borderRadius: "10px", fontWeight: "700" }}>REQUIRED</span>}
                        </div>
                        <div style={{ fontSize: "12px", color: theme.textMuted, marginTop: "2px" }}>
                          {FIELD_TYPES.find(t => t.value === field.field_type)?.label}
                          {field.placeholder ? ` · "${field.placeholder}"` : ""}
                          {field.options?.length > 0 ? ` · ${field.options.length} options` : ""}
                        </div>
                      </div>
                      <button type="button" onClick={() => { setEditingIndex(index); setShowAddField(false); }} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", background: "none", border: `1px solid ${theme.border}`, borderRadius: "8px", color: theme.textMuted, fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
                        {Ico.Pencil} Edit
                      </button>
                      <button type="button" onClick={() => handleRemoveField(index)} style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", display: "flex", padding: "6px" }}>{Ico.Trash}</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {showAddField && (
            <FieldEditor
              title="New Field"
              initial={{ label: '', field_type: 'text', is_required: false, placeholder: '', options: [] }}
              theme={theme}
              onSave={handleAddSave}
              onCancel={() => setShowAddField(false)}
            />
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px" }}>
            <button type="button" onClick={() => { setShowAddField(!showAddField); setEditingIndex(null); }} style={{ padding: "10px 20px", background: showAddField ? theme.surface : "#3B82F6", color: showAddField ? theme.textMuted : "white", border: showAddField ? `1px solid ${theme.border}` : "none", borderRadius: "12px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s" }}>
              {showAddField ? <>{Ico.X} Cancel</> : <>{Ico.Plus} Add Field</>}
            </button>
            {formFields.length > 0 && (
              <button type="button" onClick={handleSaveFields} disabled={isSavingFields} style={{ padding: "10px 26px", background: fieldsSaved ? "#10B981" : "#1E293B", color: "white", border: "none", borderRadius: "12px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.3s" }}>
                {fieldsSaved ? <>{Ico.Check} Saved!</> : <>{Ico.Save} Save Fields</>}
              </button>
            )}
          </div>
        </div>
      </SectionCard>

      {/* ── Live Preview Modal ── */}
      {showPreview && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#F0F2F5", width: "100%", maxWidth: "420px", borderRadius: "16px", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.3)", animation: "slideUp 0.3s ease-out", maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px", background: "white", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#1E293B" }}>New Feedback Report</h3>
              <button onClick={() => setShowPreview(false)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", color: "#94A3B8" }}>{Ico.X}</button>
            </div>
            <div style={{ padding: "16px", overflowY: "auto", flex: 1 }}>
              <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #E4E6EB", marginBottom: "12px" }}>
                <h1 style={{ margin: "0 0 10px 0", fontSize: "20px", fontWeight: "800", color: "#1C1E21" }}>{settings.general_report_title || "Submit Your Feedback"}</h1>
                <p style={{ margin: 0, fontSize: "13px", color: "#65676B", lineHeight: "1.6" }}>
                  {activeTab === 'en' ? settings.general_report_instruction : settings.general_report_instruction_fil}
                </p>
              </div>
              {["Category", "Region", "City / Municipality", "Your Message"].map(label => (
                <div key={label} style={{ background: "white", padding: "12px 14px", borderRadius: "10px", border: "1px solid #E4E6EB", marginBottom: "8px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#94A3B8", marginBottom: "6px" }}>{label}</div>
                  <div style={{ height: "10px", background: "#F1F5F9", borderRadius: "4px", width: "80%" }} />
                </div>
              ))}
              {formFields.length > 0 && (
                <div style={{ marginTop: "4px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "800", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px", marginLeft: "4px" }}>Additional Info</div>
                  {formFields.map((f, i) => (
                    <div key={i} style={{ background: "white", padding: "12px 14px", borderRadius: "10px", border: "1px solid #E4E6EB", marginBottom: "8px" }}>
                      <div style={{ fontSize: "11px", fontWeight: "700", color: "#94A3B8", marginBottom: "6px" }}>
                        {f.label} {f.is_required && <span style={{ color: "#EF4444" }}>*</span>}
                      </div>
                      <div style={{ height: "10px", background: "#F1F5F9", borderRadius: "4px", width: "60%" }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ background: "white", padding: "16px", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setShowPreview(false)} style={{ padding: "10px 24px", background: "#3B82F6", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Close Preview</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </div>
  );
};

export default AdminUIText;
