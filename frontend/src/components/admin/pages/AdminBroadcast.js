import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  adminBroadcast, 
  adminGetBroadcastDrafts,
  adminDeleteBroadcast,
  adminGetBroadcastTemplates,
  adminCreateBroadcastTemplate,
  adminUpdateBroadcastTemplate,
  adminDeleteBroadcastTemplate,
  adminGetBroadcastRecipientCount
} from "../../../services/adminApi";
import CustomModal from "../../CustomModal";
// ── STYLES ──────────────────────────────────────────────────────────────────
const labelStyle = { display: "block", fontSize: "10px", fontWeight: "900", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" };

const inputStyle = (theme) => ({ width: "100%", padding: "11px 14px", border: `1.5px solid ${theme.border}`, borderRadius: "14px", fontSize: "13px", fontWeight: "600", fontFamily: "inherit", color: theme.text, backgroundColor: theme.bg, outline: 'none', transition: '0.2s' });
const textareaStyle = (theme) => ({ width: "100%", padding: "14px", border: `1.5px solid ${theme.border}`, borderRadius: "16px", fontSize: "13px", fontWeight: "500", fontFamily: "inherit", resize: "none", color: theme.text, backgroundColor: theme.bg, lineHeight: "1.6", outline: 'none', transition: '0.2s' });
const primaryButtonStyle = { padding: "9px 18px", color: "white", border: "none", borderRadius: "12px", fontSize: "12px", fontWeight: "900", cursor: "pointer", transition: '0.2s' };
const secondaryButtonStyle = (theme) => ({ padding: "9px 18px", background: theme.surface, color: theme.text, border: `1.5px solid ${theme.border}`, borderRadius: "12px", fontSize: "12px", fontWeight: "800", cursor: "pointer" });
const textLinkStyle = { fontSize: '12px', color: 'var(--primary-color)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '800' };
const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' };
const modalStyle = (theme) => ({ background: theme.surface, width: '90%', borderRadius: '32px', border: `1px solid ${theme.border}`, boxShadow: '0 30px 60px rgba(0,0,0,0.2)' });

const historyCardStyle = (theme, darkMode) => ({ padding: '16px', background: darkMode ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderRadius: '16px', border: `1px solid ${theme.border}` });
const badgeStyle = ({ color, bg }) => ({ fontSize: '9px', fontWeight: '900', color, backgroundColor: bg, padding: '4px 8px', borderRadius: '6px', letterSpacing: '0.05em' });
const templateItemStyle = (theme) => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: theme.bg, borderRadius: '14px', border: `1px solid ${theme.border}` });
const miniButtonStyle = (theme) => ({ padding: '8px 14px', borderRadius: '8px', border: `1px solid ${theme.border}`, background: theme.surface, color: theme.text, fontSize: '11px', fontWeight: '800', cursor: 'pointer' });
const menuButtonStyle = (theme) => ({ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', fontSize: '18px', padding: '0 4px' });
const dropdownMenuStyle = (theme) => ({ position: 'absolute', right: 0, top: '100%', background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 10, minWidth: '120px', overflow: 'hidden' });
const menuItemStyle = (theme) => ({ width: '100%', padding: '10px 16px', textAlign: 'left', background: 'none', border: 'none', borderBottom: `1px solid ${theme.border}`, color: theme.text, fontSize: '12px', fontWeight: '700', cursor: 'pointer' });




const LocalIcons = {
  Users: ({ size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Shield: ({ size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Globe: ({ size = 16, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
};

const SYSTEM_TEMPLATES = [
  { id: 'maint', label: 'Maintenance', title: 'Scheduled System Maintenance', message: 'We will be performing scheduled system maintenance on [Date] from [Time] to [Time]. The system may be briefly unavailable during this window. We apologize for any inconvenience.' },
  { id: 'update', label: 'New Feature', title: 'Exciting New Feature Update!', message: 'We have just released a new update to the feedback platform! You can now [Feature Description]. Check it out in your dashboard and let us know what you think.' },
  { id: 'alert', label: 'Security Alert', title: 'Important Security Update', message: 'Please be advised that we have implemented new security measures to protect your data. You may be prompted to re-authenticate or update your security settings.' },
  { id: 'policy', label: 'Policy Update', title: 'Update to Privacy Policy', message: 'We have updated our privacy policy to better serve our community. Please take a moment to review the changes in the settings section.' }
];

const AdminBroadcast = ({ theme, darkMode, adminUser }) => {
  // Form State (Compose)
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [broadcastType, setBroadcastType] = useState("announcement");
  const [targetGroup, setTargetGroup] = useState("global"); 
  const [priority, setPriority] = useState("normal");
  const [requireAck, setRequireAck] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [appliedTemplateId, setAppliedTemplateId] = useState(null);
  
  // History & Custom Templates
  const [customTemplates, setCustomTemplates] = useState([]);

  const [drafts, setDrafts] = useState([]);
  const [activeTab, setActiveTab] = useState("preview");
  const [currentDraftId, setCurrentDraftId] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [dialog, setDialog] = useState({ isOpen: false });
  const [editingTplId, setEditingTplId] = useState(null);
  const [recipientCount, setRecipientCount] = useState(0);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTplName, setNewTplName] = useState("");
  const [newTplTitle, setNewTplTitle] = useState("");
  const [newTplMessage, setNewTplMessage] = useState("");
  const [newTplCategory, setNewTplCategory] = useState("normal");
  const [applyAfterSave, setApplyAfterSave] = useState(true);
  const [tplErrors, setTplErrors] = useState({});
  const [isSavingTpl, setIsSavingTpl] = useState(false);

  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  const resetTplForm = () => {
    setNewTplName("");
    setNewTplTitle("");
    setNewTplMessage("");
    setNewTplCategory("normal");
    setTplErrors({});
    setEditingTplId(null);
  };

  const resetCompose = () => {
    setTitle("");
    setMessage("");
    setBroadcastType("announcement");
    setPriority("normal");
    setScheduledAt("");
    setRequireAck(false);
    setAppliedTemplateId(null);
    setCurrentDraftId(null);
    setLastSaved(null);
  };

  const fetchData = useCallback(async () => {
    try {
      const [draftLogs, templates] = await Promise.all([
        adminGetBroadcastDrafts(),
        adminGetBroadcastTemplates()
      ]);
      setDrafts(draftLogs);
      setCustomTemplates(templates);
    } catch (e) { console.error(e); }
  }, []);

  const handleDeleteTemplate = async (id) => {
    if (adminUser.role !== 'superadmin') {
      setDialog({
        isOpen: true,
        title: "Permission Required",
        message: "Governance Lock: Announcement templates can only be deleted by a Superadmin. Please contact system administration for template removal.",
        type: "error",
        onConfirm: () => setDialog({ isOpen: false })
      });
      return;
    }

    setDialog({
      isOpen: true,
      title: "Delete Template?",
      message: "This will permanently remove this template for all administrators. This action cannot be undone.",
      type: "warning",
      onConfirm: async () => {
        try {
          await adminDeleteBroadcastTemplate(id);
          setCustomTemplates(prev => prev.filter(t => t.id !== id));
          setDialog({ isOpen: false });
        } catch (e) {
          console.error(e);
          setDialog({
            isOpen: true,
            title: "Deletion Failed",
            message: "An error occurred while trying to delete the template.",
            type: "error",
            onConfirm: () => setDialog({ isOpen: false })
          });
        }
      }
    });
  };

  const fetchRecipientCount = useCallback(async () => {
    try {
      const res = await adminGetBroadcastRecipientCount(targetGroup);
      setRecipientCount(res.count);
    } catch (e) { console.error(e); }
  }, [targetGroup]);

  useEffect(() => { 
    fetchData(); 
    fetchRecipientCount();
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [fetchData, fetchRecipientCount]);

  const handleSend = async (status = "sent") => {
    if (!message.trim() || !title.trim()) return;
    setSending(true);
    setShowPreview(false);
    try {
      const res = await adminBroadcast(
        title.trim(), 
        message.trim(), 
        broadcastType, 
        targetGroup, 
        priority, 
        status, 
        requireAck,
        scheduledAt || null,
        currentDraftId
      );
      if (status === 'draft') {
        setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setCurrentDraftId(res.id);
        fetchData();
        return;
      }
      setDialog({
        isOpen: true, type: "success", title: "Success",
        message: status === 'sent' ? `Delivered to ${res.sent_to || 0} user(s).` : "Announcement saved successfully.",
        confirmText: "Done",
        onConfirm: () => { setDialog({ isOpen: false }); resetCompose(); fetchData(); }
      });
    } catch (err) {
      setDialog({ isOpen: true, type: "alert", title: "Failed", message: "Error sending announcement.", confirmText: "OK" });
    } finally { setSending(false); }
  };

  const handleCreateTemplate = async () => {
    const errors = {};
    if (!newTplName.trim()) errors.name = "Template Name is required (internal)";
    if (!newTplTitle.trim()) errors.title = "Headline is required (public)";
    if (!newTplMessage.trim()) errors.message = "Message body is required";
    
    if (Object.keys(errors).length > 0) {
      setTplErrors(errors);
      return;
    }

    setIsSavingTpl(true);
    try {
      const payload = {
        name: newTplName,
        title: newTplTitle,
        message: newTplMessage,
        category: newTplCategory
      };

      if (editingTplId) {
        await adminUpdateBroadcastTemplate(editingTplId, payload);
      } else {
        await adminCreateBroadcastTemplate(payload);
      }
      
      await fetchData();
      
      if (applyAfterSave) {
        setTitle(newTplTitle);
        setMessage(newTplMessage);
        setAppliedTemplateId(null);
      }

      setShowCreateModal(false);
      resetTplForm();
    } catch (err) {
      setIsSavingTpl(false);
      setDialog({
        isOpen: true,
        title: "Action Failed",
        message: "Could not save the template. Please check your connection and try again.",
        type: "error",
        onConfirm: () => setDialog({ isOpen: false })
      });
    }
  };

  const applyTemplate = (t) => { 
    setTitle(t.title); 
    setMessage(t.message); 
    setAppliedTemplateId(t.id || t.label);
    setTimeout(() => setAppliedTemplateId(null), 3000);
  };

  const isFormValid = title.trim().length > 0 && message.trim().length > 0;
  const missingFields = [];
  if (!title.trim()) missingFields.push("Title");
  if (!message.trim()) missingFields.push("Message Content");



  return (
    <div style={{ 
      width: "100%", height: "calc(100vh - 140px)", display: 'grid', 
      gridTemplateColumns: '1.6fr 1fr', gap: '32px', overflow: 'hidden'
    }}>
      
      {/* 🚀 LEFT COLUMN: ANNOUNCEMENT CONTROL PANEL */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflow: 'hidden' }}>
        
        {/* COMMAND HEADER */}
        <div style={{ background: theme.surface, borderRadius: "24px", padding: "20px 32px", border: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: theme.text, letterSpacing: '-0.02em' }}>Announcement Control Panel</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
              <FlowStep label="1. Audience" active={!!priority} completed={true} theme={theme} />
              <div style={{ width: '12px', height: '1px', background: theme.border }} />
              <FlowStep label="2. Message" active={isFormValid} completed={isFormValid} theme={theme} />
              <div style={{ width: '12px', height: '1px', background: theme.border }} />
              <FlowStep label="3. Schedule" active={true} completed={!!scheduledAt} theme={theme} />
              <div style={{ width: '12px', height: '1px', background: theme.border }} />
              <FlowStep label="4. Dispatch" active={isFormValid} completed={false} theme={theme} />
            </div>
          </div>
        </div>

        <div style={{ 
          background: theme.surface, borderRadius: "24px", border: `1px solid ${theme.border}`, 
          display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' 
        }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
            
            {/* SECTION 1: TARGET & PRIORITY */}
            <Section title="Audience & Priority" theme={theme}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <label style={labelStyle}>Target Audience</label>
                  <div style={{ display: 'flex', background: theme.bg, borderRadius: '16px', padding: '6px', border: `1.5px solid ${theme.border}` }}>
                    {[
                      { id: 'global', label: 'Users', Icon: LocalIcons.Users },
                      { id: 'staff', label: 'Admins', Icon: LocalIcons.Shield },
                      { id: 'all', label: 'All', Icon: LocalIcons.Globe }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setTargetGroup(opt.id)}
                        style={{
                          flex: 1, padding: '10px', borderRadius: '12px', border: 'none',
                          background: targetGroup === opt.id ? 'var(--primary-color)' : 'transparent',
                          color: targetGroup === opt.id ? 'white' : theme.textMuted,
                          fontSize: '11px', fontWeight: '900', cursor: 'pointer', transition: '0.2s',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}
                      >
                        <opt.Icon size={14} color={targetGroup === opt.id ? 'white' : theme.textMuted} />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Priority Level</label>
                  <select value={priority} onChange={e => setPriority(e.target.value)} style={inputStyle(theme)}>
                    <option value="low">Low – Informational</option>
                    <option value="normal">Normal – Standard Update</option>
                    <option value="high">High – Urgent / Action Required</option>
                  </select>
                  <p style={{ marginTop: '12px', fontSize: '11px', color: theme.textMuted }}>Priority affects notification prominence in the user feed.</p>
                </div>
              </div>
            </Section>

            {/* SECTION 2: MESSAGE CONTENT */}
            <Section title="Announcement Message" theme={theme} highlighted={true}>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={labelStyle}>Quick Templates</label>
                  <button type="button" onClick={() => setShowCreateModal(true)} style={textLinkStyle}>+ Create New</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {SYSTEM_TEMPLATES.map(t => (
                    <TemplateButton key={t.id} label={t.label} active={appliedTemplateId === t.id} onClick={() => applyTemplate(t)} theme={theme} />
                  ))}
                  {customTemplates.slice(0, 3).map(t => (
                    <TemplateButton key={t.id} label={t.name} active={appliedTemplateId === t.id} onClick={() => applyTemplate(t)} theme={theme} isCustom={true} />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <label style={labelStyle}>Headline / Title</label>
                  <input 
                    type="text" value={title} onChange={e => setTitle(e.target.value)} 
                    placeholder="Briefly describe the purpose..." 
                    style={{ ...inputStyle(theme), fontSize: '16px', fontWeight: '800', height: '56px' }} 
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={labelStyle}>Detailed Body</label>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: message.length > 950 ? '#EF4444' : theme.textMuted }}>
                      {message.length} / 1000
                    </span>
                  </div>
                  <textarea 
                    value={message} onChange={e => setMessage(e.target.value.substring(0, 1000))} 
                    placeholder="Enter the full details of your announcement..." 
                    style={{ ...textareaStyle(theme), height: '200px', padding: '20px' }} 
                  />
                </div>
              </div>
            </Section>

            {/* SECTION 3: DELIVERY SETTINGS */}
            <Section title="Delivery Settings" theme={theme}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
                <div>
                  <label style={labelStyle}>Schedule Release (Optional)</label>
                  <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} style={inputStyle(theme)} />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: theme.bg, borderRadius: '16px', border: `1px solid ${theme.border}` }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: theme.text }}>Require Acknowledgment</p>
                      <p style={{ margin: 0, fontSize: '10px', color: theme.textMuted }}>Force users to confirm receipt.</p>
                    </div>
                    <label className="switch">
                      <input type="checkbox" checked={requireAck} onChange={e => setRequireAck(e.target.checked)} />
                      <span className="slider round"></span>
                    </label>
                  </div>
                </div>
              </div>
            </Section>
          </div>

          {/* ACTION FOOTER */}
          <div style={{ padding: '16px 40px', borderTop: `1px solid ${theme.border}`, background: theme.bg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: isFormValid ? '#10B981' : '#F59E0B' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '13px', fontWeight: '800', color: theme.text }}>
                  {isFormValid ? "✓ Ready to Dispatch" : `Missing: ${missingFields.join(", ")}`}
                </span>
                {lastSaved && <span style={{ fontSize: '11px', color: '#10B981', fontWeight: '800', marginTop: '2px' }}>✓ Draft saved • {lastSaved}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button" 
                onClick={resetCompose} 
                style={{ 
                  ...secondaryButtonStyle(theme), 
                  color: darkMode ? '#F87171' : '#EF4444', 
                  borderColor: darkMode ? 'rgba(248, 113, 113, 0.3)' : 'rgba(239, 68, 68, 0.2)',
                  background: darkMode ? 'rgba(248, 113, 113, 0.05)' : 'rgba(239, 68, 68, 0.03)'
                }}
              >
                Clear
              </button>
              <button type="button" onClick={() => handleSend("draft")} disabled={sending || !isFormValid} style={{ ...secondaryButtonStyle(theme) }}>
                {sending ? "..." : "Save Draft"}
              </button>
              <button 
                type="button" onClick={() => setShowPreview(true)} 
                disabled={sending || !isFormValid} 
                style={{ 
                  ...primaryButtonStyle, background: isFormValid ? 'var(--primary-color)' : theme.border, 
                  color: isFormValid ? 'white' : theme.textMuted, cursor: isFormValid ? 'pointer' : 'not-allowed'
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', overflow: 'hidden' }}>
        
        {/* DRAFTS NOTIFICATION */}
        {drafts.length > 0 && activeTab !== 'drafts' && (
          <div style={{ background: 'rgba(245, 158, 11, 0.05)', borderRadius: '20px', padding: '16px 20px', border: '1px solid rgba(245, 158, 11, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: 'fadeIn 0.3s ease' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '16px' }}>📝</span>
                </div>
                <div>
                   <p style={{ margin: 0, fontSize: '12px', fontWeight: '900', color: '#D97706' }}>UNFINISHED DRAFTS</p>
                   <p style={{ margin: 0, fontSize: '11px', color: '#B45309' }}>You have {drafts.length} draft{drafts.length > 1 ? 's' : ''} pending.</p>
                </div>
             </div>
             <button onClick={() => setActiveTab("drafts")} style={{ background: '#D97706', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '11px', fontWeight: '900', cursor: 'pointer' }}>REVIEW</button>
          </div>
        )}

        {/* INTELLIGENCE CENTER (TABBED) */}
        <div style={{ background: theme.surface, borderRadius: "24px", border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ display: 'flex', background: theme.bg, borderBottom: `1px solid ${theme.border}`, padding: '4px' }}>
            {['preview', 'drafts', 'templates'].map(t => (
              <button 
                key={t} onClick={() => setActiveTab(t)}
                style={{ 
                  flex: 1, padding: '12px 4px', border: 'none', background: activeTab === t ? theme.surface : 'transparent',
                  color: activeTab === t ? 'var(--primary-color)' : theme.textMuted, fontSize: '10px', fontWeight: '900', 
                  borderRadius: '10px', cursor: 'pointer', transition: '0.2s', textTransform: 'uppercase', letterSpacing: '0.05em'
                }}
              >
                {t}
              </button>
            ))}
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            {activeTab === 'preview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {title || message ? (
                  <div style={{ background: theme.bg, borderRadius: '20px', padding: '24px', border: `2px solid ${priority === 'high' ? '#EF4444' : theme.border}`, position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '900', color: priority === 'high' ? '#EF4444' : 'var(--primary-color)', background: priority === 'high' ? '#FEF2F2' : 'rgba(var(--primary-rgb), 0.1)', padding: '4px 10px', borderRadius: '6px' }}>
                        {priority.toUpperCase()} PRIORITY
                      </span>
                      <span style={{ fontSize: '10px', color: theme.textMuted }}>Live View</span>
                    </div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '900', color: theme.text }}>{title || "Announcement Title"}</h3>
                    <p style={{ margin: 0, fontSize: '14px', color: theme.text, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{message || "Enter content to see preview..."}</p>
                  </div>
                ) : (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: theme.textMuted }}>
                    <p style={{ fontSize: '13px', fontWeight: '700' }}>No content drafted</p>
                    <p style={{ fontSize: '11px', marginTop: '4px' }}>Your live preview will appear here.</p>
                  </div>
                )}

                <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: '20px' }}>
                  <p style={{ margin: '0 0 12px 0', fontSize: '11px', fontWeight: '900', color: theme.textMuted, textTransform: 'uppercase' }}>Targeting Summary</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <SummaryItem label="Recipients" value={recipientCount} theme={theme} color={recipientCount === 0 ? '#EF4444' : 'var(--primary-color)'} />
                    <SummaryItem 
                      label="Delivery" 
                      value={scheduledAt ? new Date(scheduledAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "⚡ Instant"} 
                      theme={theme} 
                      color={scheduledAt ? '#10B981' : '#64748B'}
                    />
                  </div>
                </div>
              </div>
            )}


            {activeTab === 'drafts' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {drafts.length > 0 ? drafts.map(draft => (
                  <div key={draft.id} style={{ ...historyCardStyle(theme, darkMode), padding: '20px' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={badgeStyle({ color: '#D97706', bg: '#FFFBEB' })}>DRAFT</span>
                        <span style={{ fontSize: '10px', color: theme.textMuted }}>{new Date(draft.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                     </div>
                     <h5 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '900', color: theme.text }}>{draft.subject.replace(/\[OFFICIAL\] .* - /, '')}</h5>
                     <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => {
                            setTitle(draft.subject.replace(/\[OFFICIAL\] .* - /, ''));
                            setMessage(draft.message);
                            setPriority(draft.priority);
                            setRequireAck(draft.require_ack);
                            setScheduledAt(draft.scheduled_at || "");
                            setCurrentDraftId(draft.id);
                            setActiveTab("preview");
                          }} 
                          style={{ ...miniButtonStyle(theme), flex: 1, background: 'var(--primary-color)', color: 'white', border: 'none' }}
                        >
                          Resume
                        </button>
                        <button 
                          onClick={async () => {
                            if (window.confirm("Delete this draft?")) {
                              await adminDeleteBroadcast(draft.id);
                              fetchData();
                            }
                          }}
                          style={{ ...miniButtonStyle(theme), color: '#EF4444' }}
                        >
                          Delete
                        </button>
                     </div>
                  </div>
                )) : <p style={{ textAlign: 'center', color: theme.textMuted, fontSize: '12px', padding: '20px' }}>No saved drafts.</p>}
              </div>
            )}

            {activeTab === 'templates' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {customTemplates.length > 0 ? customTemplates.map(tpl => {
                  return (
                    <div key={tpl.id} style={{ ...templateItemStyle(theme), padding: '16px', position: 'relative' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: theme.text }}>{tpl.label || tpl.name}</p>
                        <p style={{ margin: 0, fontSize: '10px', color: theme.textMuted }}>{tpl.category?.toUpperCase() || 'OFFICIAL'}</p>
                      </div>
                      <div style={{ position: 'relative' }} ref={openMenuId === tpl.id ? menuRef : null}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === tpl.id ? null : tpl.id); }} 
                          style={menuButtonStyle(theme)}
                        >
                          •••
                        </button>
                        {openMenuId === tpl.id && (
                          <div style={dropdownMenuStyle(theme)}>
                            <button 
                              style={menuItemStyle(theme)} 
                              onClick={() => { setTitle(tpl.title); setMessage(tpl.message); setActiveTab("preview"); setOpenMenuId(null); }}
                            >
                              Apply Template
                            </button>
                            <button 
                              style={{ ...menuItemStyle(theme), color: '#EF4444' }} 
                              onClick={() => { handleDeleteTemplate(tpl.id); setOpenMenuId(null); }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }) : <p style={{ textAlign: 'center', color: theme.textMuted, fontSize: '12px', padding: '20px' }}>No templates found.</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODALS & ALERTS */}
      {showCreateModal && (
        <CreateTemplateModal 
          theme={theme} 
          isSaving={isSavingTpl} 
          editingId={editingTplId} 
          values={{ name: newTplName, title: newTplTitle, message: newTplMessage, category: newTplCategory, applyAfterSave }} 
          errors={tplErrors}
          onCancel={() => { setShowCreateModal(false); resetTplForm(); }} 
          onSave={handleCreateTemplate} 
          setValues={{ 
            setName: setNewTplName, 
            setTitle: setNewTplTitle, 
            setMessage: setNewTplMessage, 
            setCategory: setNewTplCategory,
            setApplyAfterSave: setApplyAfterSave
          }} 
        />
      )}
      {showPreview && <PreviewModal theme={theme} title={title} message={message} priority={priority} targetGroup={targetGroup} recipientCount={recipientCount} scheduledAt={scheduledAt} requireAck={requireAck} onCancel={() => setShowPreview(false)} onConfirm={() => handleSend("sent")} adminUser={adminUser} />}
      <CustomModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type} onConfirm={dialog.onConfirm} />

      <style>{`
        .switch { position: relative; display: inline-block; width: 44px; height: 22px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #E2E8F0; transition: .4s; border-radius: 22px; }
        .slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
        input:checked + .slider { background-color: var(--primary-color); }
        input:checked + .slider:before { transform: translateX(22px); }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

// ── SUB-COMPONENTS ──────────────────────────────────────────────────────────

const FlowStep = ({ label, active, completed, theme }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: active ? 1 : 0.4 }}>
    <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: completed ? '#10B981' : (active ? 'var(--primary-color)' : theme.border), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {completed ? <span style={{ color: 'white', fontSize: '10px' }}>✓</span> : <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white' }} />}
    </div>
    <span style={{ fontSize: '11px', fontWeight: '800', color: active ? theme.text : theme.textMuted }}>{label}</span>
  </div>
);

const Section = ({ title, theme, children, highlighted }) => (
  <div style={{ marginBottom: '40px', padding: highlighted ? '24px' : '0', background: highlighted ? 'rgba(var(--primary-rgb), 0.02)' : 'none', borderRadius: '24px', border: highlighted ? `1px dashed rgba(var(--primary-rgb), 0.2)` : 'none' }}>
    <p style={{ margin: '0 0 20px 0', fontSize: '12px', fontWeight: '900', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</p>
    {children}
  </div>
);

const TemplateButton = ({ label, active, onClick, theme, isCustom }) => (
  <button 
    type="button" onClick={onClick} 
    style={{ 
      padding: '10px 18px', borderRadius: '12px', border: `1px solid ${active ? 'var(--primary-color)' : theme.border}`, 
      background: active ? 'var(--primary-color)' : theme.bg, color: active ? 'white' : theme.text, 
      fontSize: '12px', fontWeight: '800', cursor: 'pointer', transition: '0.2s',
      display: 'flex', alignItems: 'center', gap: '8px', boxShadow: active ? '0 4px 12px rgba(37, 99, 235, 0.2)' : 'none'
    }}
  >
    {isCustom && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: active ? 'white' : 'var(--primary-color)' }} />}
    {label}
    {active && <span style={{ fontSize: '10px' }}>Applied</span>}
  </button>
);

const SummaryItem = ({ label, value, theme, color }) => (
  <div style={{ padding: '12px', background: theme.bg, borderRadius: '12px', border: `1px solid ${theme.border}` }}>
    <p style={{ margin: 0, fontSize: '9px', fontWeight: '800', color: theme.textMuted, textTransform: 'uppercase' }}>{label}</p>
    <p style={{ margin: '2px 0 0 0', fontSize: '13px', fontWeight: '900', color: color || theme.text }}>{value}</p>
  </div>
);



const CreateTemplateModal = ({ theme, isSaving, editingId, values, errors, onCancel, onSave, setValues }) => (
  <div style={overlayStyle}>
    <div style={{ ...modalStyle(theme), maxWidth: '1000px', width: '90%', padding: '48px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: '48px' }}>
      <div style={{ maxHeight: '80vh', overflowY: 'auto', paddingRight: '12px' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '900', color: theme.text }}>{editingId ? "Edit Template" : "New Quick Template"}</h2>
        <p style={{ margin: '0 0 32px 0', fontSize: '15px', color: theme.textMuted }}>Draft a reusable announcement structure for your program.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Template Name (Internal)</label>
              <input type="text" value={values.name} onChange={e => setValues.setName(e.target.value)} style={{ ...inputStyle(theme), borderColor: errors.name ? '#EF4444' : theme.border }} placeholder="e.g., Weekly Schedule Update" />
              <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: errors.name ? '#EF4444' : theme.textMuted }}>Admin only reference name.</p>
            </div>
            <div>
              <label style={labelStyle}>Priority Level</label>
              <select value={values.category} onChange={e => setValues.setCategory(e.target.value)} style={{ ...inputStyle(theme), cursor: 'pointer' }}>
                <option value="normal">Normal Priority</option>
                <option value="low">Low Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent / Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Headline (Public Title)</label>
            <input type="text" value={values.title} onChange={e => setValues.setTitle(e.target.value)} style={{ ...inputStyle(theme), borderColor: errors.title ? '#EF4444' : theme.border }} placeholder="The headline users will see..." />
            {errors.title && <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#EF4444' }}>{errors.title}</p>}
          </div>

          <div>
            <label style={labelStyle}>Message Body</label>
            <textarea 
              value={values.message} 
              onChange={e => setValues.setMessage(e.target.value)} 
              style={{ ...textareaStyle(theme), height: '180px', borderColor: errors.message ? '#EF4444' : theme.border }} 
              placeholder="Structure Hint:&#10;• What is the update?&#10;• Who is affected?&#10;• What action is needed?&#10;• When is this effective?" 
            />
            {errors.message && <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#EF4444' }}>{errors.message}</p>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(var(--primary-rgb), 0.05)', borderRadius: '12px' }}>
            <label className="switch">
              <input type="checkbox" checked={values.applyAfterSave} onChange={e => setValues.setApplyAfterSave(e.target.checked)} />
              <span className="slider"></span>
            </label>
            <span style={{ fontSize: '13px', fontWeight: '800', color: theme.text }}>Apply this template to the editor after saving</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginTop: '48px' }}>
          <button onClick={onCancel} style={{ ...secondaryButtonStyle(theme), flex: 1, padding: '16px' }}>Discard Changes</button>
          <button onClick={onSave} disabled={isSaving} style={{ ...primaryButtonStyle, flex: 1.5, background: 'var(--primary-color)', padding: '16px' }}>{isSaving ? "Saving..." : (editingId ? "Update Template" : "Save to Template Library")}</button>
        </div>
      </div>

      {/* MODAL PREVIEW PANEL */}
      <div style={{ borderLeft: `1px solid ${theme.border}`, paddingLeft: '32px', display: 'flex', flexDirection: 'column' }}>
        <p style={{ margin: '0 0 20px 0', fontSize: '12px', fontWeight: '900', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Preview Snapshot</p>
        
        <div style={{ background: theme.bg, borderRadius: '24px', border: `1px solid ${theme.border}`, padding: '24px', flex: 1, position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ 
              fontSize: '9px', fontWeight: '900', 
              color: ['high', 'urgent'].includes(values.category) ? '#EF4444' : (values.category === 'low' ? '#64748B' : 'var(--primary-color)'), 
              backgroundColor: ['high', 'urgent'].includes(values.category) ? '#FEF2F2' : (values.category === 'low' ? '#F1F5F9' : 'rgba(var(--primary-rgb), 0.1)'), 
              padding: '4px 8px', borderRadius: '4px' 
            }}>
              {values.category.toUpperCase()} PRIORITY
            </span>
          </div>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '900', color: theme.text }}>{values.title || "Headline Placeholder"}</h4>
          <p style={{ margin: 0, fontSize: '13px', color: theme.text, lineHeight: '1.6', whiteSpace: 'pre-wrap', opacity: values.message ? 1 : 0.3 }}>
            {values.message || "Start typing your message to see how it will appear to recipients in the program feeds."}
          </p>
          
          <div style={{ position: 'absolute', bottom: '24px', left: '24px', right: '24px', height: '40px', background: 'var(--primary-color)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
            <span style={{ color: 'white', fontSize: '12px', fontWeight: '900' }}>ACKNOWLEDGE RECEIPT</span>
          </div>
        </div>

        <p style={{ margin: '20px 0 0 0', fontSize: '11px', color: theme.textMuted, textAlign: 'center', fontStyle: 'italic' }}> recipients see this layout in their app feed</p>
      </div>
    </div>
  </div>
);

const PreviewModal = ({ theme, title, message, priority, targetGroup, recipientCount, scheduledAt, requireAck, onCancel, onConfirm, adminUser }) => (
  <div style={overlayStyle}>
    <div style={{ ...modalStyle(theme), maxWidth: '580px', padding: '40px' }}>
      <h2 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: '900', color: theme.text }}>Final Review</h2>
      <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: theme.textMuted }}>Verify the announcement details before sending.</p>

      <div style={{ background: theme.bg, borderRadius: '20px', padding: '24px', border: `2px solid ${priority === 'high' ? '#EF4444' : theme.border}`, marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span style={{ fontSize: '10px', fontWeight: '900', color: priority === 'high' ? '#EF4444' : 'var(--primary-color)' }}>{priority.toUpperCase()} PRIORITY</span>
          <span style={{ fontSize: '10px', color: theme.textMuted }}>Target: {recipientCount} Users</span>
        </div>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '900', color: theme.text }}>{title}</h3>
        <p style={{ margin: 0, fontSize: '15px', color: theme.text, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{message}</p>
      </div>

      <div style={{ padding: '16px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '16px', border: '1px solid rgba(245, 158, 11, 0.2)', marginBottom: '32px' }}>
        <p style={{ margin: 0, fontSize: '12px', color: '#D97706', fontWeight: '700' }}>
          {scheduledAt ? `🕒 Scheduled for ${new Date(scheduledAt).toLocaleString()}` : "⚡ Instant Dispatch"}
          {requireAck && " • ⚠️ Acknowledgment Required"}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button onClick={onCancel} style={{ ...secondaryButtonStyle(theme), flex: 1 }}>Back to Editor</button>
        <button onClick={onConfirm} style={{ ...primaryButtonStyle, flex: 2, background: 'var(--primary-color)' }}>Send</button>
      </div>
    </div>
  </div>
);

export default AdminBroadcast;
