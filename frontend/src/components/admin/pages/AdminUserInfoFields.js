import React, { useState, useEffect } from "react";
import CustomModal from "../../CustomModal";
import { getAdminSettings, updateAdminSetting } from "../../../services/api";

const AdminUserInfoFields = ({ theme, darkMode }) => {
  const [activeRole, setActiveRole] = useState("Student");
  const [fields, setFields] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState({ isOpen: false, title: "", message: "", type: "info" });

  const QUICK_TEMPLATES = [
    { 
      id: 'basic', label: 'BASIC INFORMATION', 
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
      fields: [
        { id: Date.now()+1, label: 'First Name', type: 'Short Text', required: true },
        { id: Date.now()+2, label: 'Last Name', type: 'Short Text', required: true },
        { id: Date.now()+3, label: 'Middle Name', type: 'Short Text', required: false },
        { id: Date.now()+4, label: 'Suffix', type: 'Short Text', required: false },
        { id: Date.now()+5, label: 'Gender', type: 'Dropdown', required: true },
        { id: Date.now()+6, label: 'Birth Date', type: 'Date', required: true },
      ]
    },
    { 
      id: 'contact', label: 'CONTACT DETAILS', 
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
      fields: [
        { id: Date.now()+7, label: 'Email Address', type: 'Email', required: true },
        { id: Date.now()+8, label: 'Phone Number', type: 'Short Text', required: true },
      ]
    },
    { 
      id: 'address', label: 'GLOBAL SMART ADDRESS', 
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
      fields: [
        { id: Date.now()+9, label: 'Region', type: 'Dropdown', required: true },
        { id: Date.now()+10, label: 'City', type: 'Dropdown', required: true },
        { id: Date.now()+11, label: 'Barangay', type: 'Dropdown', required: true },
      ]
    },
    { 
      id: 'academic', label: 'ACADEMIC BACKGROUND', 
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
      fields: [
        { id: Date.now()+12, label: 'Institution', type: 'Short Text', required: true },
        { id: Date.now()+13, label: 'Specialization', type: 'Short Text', required: false },
      ]
    }
  ];

  useEffect(() => {
    const loadRoleConfig = async () => {
      setLoading(true);
      try {
        const settings = await getAdminSettings();
        const key = `user_fields_${activeRole.toLowerCase()}`;
        const found = settings.find(s => s.key === key);
        if (found && found.value) {
          setFields(JSON.parse(found.value));
        } else {
          setFields([]);
        }
      } catch (err) {
        console.error("Failed to load role config:", err);
      } finally {
        setLoading(false);
      }
    };
    loadRoleConfig();
  }, [activeRole]);

  const saveConfig = async () => {
    setLoading(true);
    try {
      const key = `user_fields_${activeRole.toLowerCase()}`;
      await updateAdminSetting(key, JSON.stringify(fields));
      setDialog({
        isOpen: true,
        title: "Configuration Saved",
        message: `Successfully saved the ${activeRole} form configuration.`,
        type: "info"
      });
    } catch (err) {
      setDialog({
        isOpen: true,
        title: "Save Failed",
        message: "Failed to save configuration to the server.",
        type: "alert"
      });
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = (tpl) => {
    // Add fields from template, avoid duplicates by label
    const newFieldList = [...fields];
    tpl.fields.forEach(tf => {
      if (!newFieldList.some(f => f.label === tf.label)) {
        newFieldList.push({ ...tf, id: Date.now() + Math.random() });
      }
    });
    setFields(newFieldList);
  };

  const removeField = (id) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const updateField = (id, key, val) => {
    setFields(fields.map(f => f.id === id ? { ...f, [key]: val } : f));
  };

  const fieldCardStyle = {
    padding: '16px', background: theme.bg, borderRadius: '12px', border: `1px solid ${theme.border}`,
    display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '12px', transition: 'all 0.2s'
  };

  const inputStyle = {
    padding: '8px 12px', borderRadius: '8px', border: `1.5px solid ${theme.border}`,
    background: theme.surface, color: theme.text, fontSize: '13px', outline: 'none'
  };

  return (
    <div style={{ padding: '0px', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* 1. Header Section */}
      <div style={{ 
        background: '#1f2a56', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderTopLeftRadius: '16px', borderTopRightRadius: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '8px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '15px', color: 'white', fontWeight: '800', letterSpacing: '0.02em' }}>FORM DESIGNER</h1>
            <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>CONFIGURE FIELDS FOR {activeRole.toUpperCase()}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select 
            value={activeRole} 
            onChange={(e) => setActiveRole(e.target.value)}
            style={{ 
              background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '10px',
              fontSize: '13px', fontWeight: '700', cursor: 'pointer'
            }}
          >
            <option value="Student">Student</option>
            <option value="Employee">Employee</option>
            <option value="Visitor">Visitor</option>
          </select>
          <button 
            onClick={() => setShowPreview(true)}
            style={{ padding: '10px 20px', background: '#3b3f6d', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '12px', cursor: 'pointer' }}
          >
            FULL PREVIEW
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', background: darkMode ? theme.surface : '#F1F5F9' }}>
        
        {/* 2. Main content area (Editor) */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          
          {/* QUICK TEMPLATES */}
          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '11px', fontWeight: '800', color: theme.textMuted, marginBottom: '12px', letterSpacing: '0.05em' }}>QUICK TEMPLATES</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              {QUICK_TEMPLATES.map(tpl => (
                <div 
                  key={tpl.id}
                  onClick={() => applyTemplate(tpl)}
                  style={{ 
                    padding: '24px 12px', background: theme.surface, borderRadius: '12px', border: `1.5px dashed ${theme.border}`,
                    cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#1f2a56';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = theme.border;
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ color: theme.textMuted }}>{tpl.icon}</div>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: theme.text }}>{tpl.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* FIELD LIST */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <p style={{ fontSize: '11px', fontWeight: '800', color: theme.textMuted, letterSpacing: '0.05em' }}>FIELD EDITOR</p>
              <span style={{ fontSize: '10px', fontWeight: '800', color: '#EF4444', cursor: 'pointer' }} onClick={() => setFields([])}>REMOVE ALL</span>
            </div>
            
            {loading ? (
              <div style={{ padding: '80px', textAlign: 'center', color: theme.textMuted }}>Loading configuration...</div>
            ) : fields.length === 0 ? (
              <div style={{ padding: '80px', textAlign: 'center', background: theme.surface, borderRadius: '16px', border: `1px solid ${theme.border}` }}>
                <p style={{ color: theme.textMuted, fontSize: '14px' }}>No fields configured yet. Select a template above or click 'Add Field'.</p>
                <button 
                  onClick={() => setFields([...fields, { id: Date.now(), label: 'New Field', type: 'Short Text', required: false }])}
                  style={{ marginTop: '16px', padding: '10px 20px', background: '#1f2a56', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700' }}
                >
                   + ADD NEW FIELD
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {fields.map(field => (
                  <div key={field.id} style={{ ...fieldCardStyle, background: theme.surface }}>
                    <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '9px', fontWeight: '800', color: theme.textMuted }}>FIELD LABEL</label>
                      <input 
                        value={field.label} 
                        onChange={(e) => updateField(field.id, 'label', e.target.value)}
                        style={{ ...inputStyle, width: '100%' }}
                      />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '9px', fontWeight: '800', color: theme.textMuted }}>TYPE</label>
                      <select 
                        value={field.type} 
                        onChange={(e) => updateField(field.id, 'type', e.target.value)}
                        style={{ ...inputStyle, width: '100%', cursor: 'pointer' }}
                      >
                        <option>Short Text</option>
                        <option>Long Text</option>
                        <option>Number</option>
                        <option>Dropdown</option>
                        <option>Date</option>
                        <option>Email</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                      <label style={{ fontSize: '9px', fontWeight: '800', color: theme.textMuted }}>REQUIRED</label>
                      <Toggle checked={field.required} onChange={() => updateField(field.id, 'required', !field.required)} />
                    </div>
                    <button 
                      onClick={() => removeField(field.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, padding: '8px' }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => setFields([...fields, { id: Date.now(), label: 'New Field', type: 'Short Text', required: false }])}
                  style={{ alignSelf: 'flex-start', padding: '8px 16px', background: 'none', border: `1.5px solid ${theme.border}`, color: theme.text, borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
                >
                  + ADD FIELD
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 3. Live Blueprint Sidebar */}
        <div style={{ width: '320px', background: theme.surface, borderLeft: `1px solid ${theme.border}`, padding: '24px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34D399' }} />
            <p style={{ fontSize: '11px', fontWeight: '800', color: '#1f2a56', margin: 0, letterSpacing: '0.05em' }}>LIVE BLUEPRINT</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '10px', fontWeight: '700', color: theme.textMuted, marginBottom: '-8px' }}>— PERSONAL INFORMATION</p>
            {fields.map(field => (
              <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: theme.text }}>
                  {field.label} {field.required && <span style={{ color: '#EF4444' }}>*</span>}
                </span>
                <div style={{ 
                  padding: '10px 12px', background: darkMode ? 'rgba(255,255,255,0.03)' : '#F9FAFB', 
                  borderRadius: '8px', border: `1px solid ${theme.border}`, color: theme.textMuted, fontSize: '11px'
                }}>
                  {field.type === 'Dropdown' ? 'Select Option...' : field.type === 'Date' ? 'mm/dd/yyyy' : `Enter ${field.label}...`}
                </div>
              </div>
            ))}
            {fields.length === 0 && !loading && <p style={{ textAlign: 'center', color: theme.textMuted, fontSize: '12px', padding: '20px' }}>Your real-time preview will appear here.</p>}
          </div>

          <button 
            onClick={saveConfig}
            disabled={loading}
            style={{ 
              width: '100%', marginTop: '32px', padding: '12px', background: loading ? '#64748B' : '#1f2a56', color: 'white', border: 'none', borderRadius: '10px',
              fontWeight: '800', fontSize: '12px', cursor: loading ? 'default' : 'pointer', boxShadow: '0 4px 12px rgba(31, 42, 86, 0.2)'
            }}
          >
            {loading ? 'SAVING...' : 'SAVE CONFIGURATION'}
          </button>
        </div>
      </div>

      <CustomModal 
        isOpen={showPreview} 
        title={`${activeRole} Form Preview`}
        message={`This is a full-scale preview of how the registration/profile form will appear for ${activeRole}s.`}
        type="info"
        onConfirm={() => setShowPreview(false)}
      />

      <CustomModal 
        isOpen={dialog.isOpen}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
        onConfirm={() => setDialog({ ...dialog, isOpen: false })}
      />
    </div>
  );
};

const Toggle = ({ checked, onChange }) => (
  <div onClick={onChange} style={{ 
    width: '32px', height: '16px', borderRadius: '8px', padding: '2px', cursor: 'pointer',
    background: checked ? '#34D399' : '#CBD5E1', transition: 'background 0.2s', display: 'flex', alignItems: 'center'
  }}>
    <div style={{ 
      width: '12px', height: '12px', borderRadius: '50%', background: 'white',
      transition: 'transform 0.2s', transform: checked ? 'translateX(14px)' : 'translateX(0)'
    }} />
  </div>
);

export default AdminUserInfoFields;
