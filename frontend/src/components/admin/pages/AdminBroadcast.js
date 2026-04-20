import React, { useState, useEffect, useRef } from "react";
import { 
  adminBroadcast, 
  adminGetBroadcastLogs,
  adminGetBroadcastTemplates,
  adminCreateBroadcastTemplate,
  adminUpdateBroadcastTemplate,
  adminDeleteBroadcastTemplate,
  adminArchiveBroadcast,
  adminResendBroadcast
} from "../../../services/adminApi";
import CustomModal from "../../CustomModal";

const SYSTEM_TEMPLATES = [
  { 
    id: 'sys_advisory', label: 'Program Advisory', 
    title: 'Important Program Advisory: [Program Name]', 
    message: 'Please be advised of the following updates regarding the [Program Name] operations. All beneficiaries are requested to review the revised guidelines attached to this notice.' 
  },
  { 
    id: 'sys_schedule', label: 'Schedule Update', 
    title: 'Update: Coordination Schedule for [Date]', 
    message: 'The coordination meeting scheduled for [Date] has been moved to [Time]. Please ensure your availability and confirm attendance through the portal.' 
  }
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
  
  // Tabs & Navigation
  const [rightPanelTab, setRightPanelTab] = useState("recent"); // "recent" or "templates"
  
  // Create Template Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTplName, setNewTplName] = useState("");
  const [newTplTitle, setNewTplTitle] = useState("");
  const [newTplMessage, setNewTplMessage] = useState("");
  const [isSavingTpl, setIsSavingTpl] = useState(false);
  
  // Manage Templates Modal State
  const [showManageModal, setShowManageModal] = useState(false);
  
  // History & Custom Templates
  const [customTemplates, setCustomTemplates] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [dialog, setDialog] = useState({ isOpen: false });
  const [activeMenu, setActiveMenu] = useState(null);
  const [editingTplId, setEditingTplId] = useState(null);
  
  const menuRef = useRef(null);

  const resetTplForm = () => {
    setNewTplName("");
    setNewTplTitle("");
    setNewTplMessage("");
    setEditingTplId(null);
  };

  const resetCompose = () => {
    setTitle("");
    setMessage("");
    setBroadcastType("announcement");
    setPriority("normal");
    setScheduledAt("");
    setRequireAck(false);
  };

  const fetchData = async () => {
    try {
      const [logs, templates] = await Promise.all([
        adminGetBroadcastLogs(),
        adminGetBroadcastTemplates()
      ]);
      setHistory(logs);
      setCustomTemplates(templates);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { 
    fetchData(); 
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        scheduledAt || null
      );
      setDialog({
        isOpen: true, type: "success", title: "Success",
        message: status === 'sent' ? `Delivered to ${res.sent_to} user(s).` : "Broadcast saved successfully.",
        confirmText: "Done",
        onConfirm: () => { setDialog({ isOpen: false }); resetCompose(); fetchData(); }
      });
    } catch (err) {
      setDialog({ isOpen: true, type: "alert", title: "Failed", message: "Error sending broadcast.", confirmText: "OK" });
    } finally { setSending(false); }
  };

  const handleCreateTemplate = async () => {
    if (!newTplName.trim() || !newTplTitle.trim() || !newTplMessage.trim()) return;
    setIsSavingTpl(true);
    try {
      if (editingTplId) {
        await adminUpdateBroadcastTemplate(editingTplId, newTplName.trim(), newTplTitle.trim(), newTplMessage.trim());
      } else {
        await adminCreateBroadcastTemplate(newTplName.trim(), newTplTitle.trim(), newTplMessage.trim());
      }
      setIsSavingTpl(false);
      setShowCreateModal(false);
      resetTplForm();
      fetchData();
      setRightPanelTab("templates");
    } catch (err) {
      setIsSavingTpl(false);
      alert("Failed to save template.");
    }
  };

  const handleEditTemplate = (tpl) => {
    setNewTplName(tpl.name);
    setNewTplTitle(tpl.title);
    setNewTplMessage(tpl.message);
    setEditingTplId(tpl.id);
    setShowCreateModal(true);
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm("Are you sure you want to delete this template?")) return;
    try {
      await adminDeleteBroadcastTemplate(id);
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleArchive = async (id) => {
    try {
      await adminArchiveBroadcast(id);
      fetchData();
      setActiveMenu(null);
    } catch (e) { console.error(e); }
  };

  const handleResend = async (id) => {
    try {
      await adminResendBroadcast(id);
      setDialog({
        isOpen: true, type: "success", title: "Resent Successfully",
        message: "The announcement has been re-dispatched to the target group.",
        confirmText: "OK", onConfirm: () => { setDialog({ isOpen: false }); fetchData(); }
      });
      setActiveMenu(null);
    } catch (e) { console.error(e); }
  };

  const applyTemplate = (t) => { setTitle(t.title); setMessage(t.message); };

  const getPriorityBadge = (p) => {
    switch(p) {
      case 'high': return { label: 'High', color: '#EF4444' };
      case 'low': return { label: 'Low', color: theme.textMuted };
      default: return { label: 'Normal', color: '#F59E0B' };
    }
  };

  const getStatusBadge = (s) => {
    switch(s) {
      case 'draft': return { label: 'Draft', color: theme.textMuted, bg: theme.bg };
      case 'archived': return { label: 'Archived', color: theme.textMuted, bg: theme.border };
      default: return { label: 'Sent', color: '#10B981', bg: '#F0FDF4' };
    }
  };

  const lastLog = history.find(h => h.status === 'sent');

  return (
    <div style={{ 
      width: "100%", 
      height: "calc(100vh - 140px)", // Locks height to viewport minus topbar/padding
      display: 'grid', 
      gridTemplateColumns: '1.5fr 1fr', 
      gap: '24px', 
      padding: '0', 
      overflow: 'hidden',
      fontSize: 'clamp(11px, 0.85vh + 0.5vw, 14px)', // Dynamic font scaling
    }}>
      
      {/* Left Column: Command Center (Compose) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', overflow: 'hidden' }}>
        
        {/* Header Context Bar */}
        <div style={{ background: theme.surface, borderRadius: "16px", padding: "16px 24px", border: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', background: 'var(--primary-color)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: theme.text }}>Communication Command Center</p>
              <p style={{ margin: 0, fontSize: '11px', color: theme.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Scope: Global Hub • Channel: Broadcast Alerts
              </p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--primary-color)', background: 'var(--primary-color)15', padding: '4px 10px', borderRadius: '20px' }}>ACTIVE OPERATOR: ADMIN</span>
          </div>
        </div>

        <div style={{ 
          background: theme.surface, 
          borderRadius: "20px", 
          padding: "24px 40px", 
          border: `1px solid ${theme.border}`, 
          boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
          flex: 1,
          overflowY: 'auto' // Internal scroll for the form if height is restricted
        }}>
          <form onSubmit={(e) => { e.preventDefault(); setShowPreview(true); }} style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            
            {/* ROW 1: Audience & Priority */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <label style={labelStyle(theme)}>Target Audience</label>
                <div style={readOnlyInputStyle(theme)}>Citizens / Beneficiaries</div>
              </div>
              <div>
                <label style={labelStyle(theme)}>Priority Level</label>
                <select value={priority} onChange={e => setPriority(e.target.value)} style={inputStyle(theme)}>
                  <option value="low">Low - Informational</option>
                  <option value="normal">Normal - Standard Update</option>
                  <option value="high">High - Urgent / Action Required</option>
                </select>
              </div>
            </div>

            {/* Quick Templates Selection */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                 <label style={labelStyle(theme)}>Select Template Library</label>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {SYSTEM_TEMPLATES.map(t => (
                  <button key={t.id} type="button" onClick={() => applyTemplate(t)} style={templateButtonStyle(theme)}>
                    {t.label}
                  </button>
                ))}
                {customTemplates.slice(0, 4).map(t => (
                  <button key={t.id} type="button" onClick={() => applyTemplate(t)} style={{ ...templateButtonStyle(theme), borderColor: 'var(--primary-color)40', background: 'var(--primary-color)05' }}>
                    {t.name}
                  </button>
                ))}
                {customTemplates.length > 4 && <button type="button" onClick={() => {setRightPanelTab("templates")}} style={{ ...templateButtonStyle(theme), borderStyle: 'dashed' }}>View More...</button>}
              </div>
            </div>

            {/* Announcement Title */}
            <div>
              <label style={labelStyle(theme)}>Announcement Title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Important Program Update regarding Tara, Basa!" style={{ ...inputStyle(theme), fontSize: '16px', fontWeight: '700' }} />
            </div>

            {/* Detailed Message with Character Counter */}
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={labelStyle(theme)}>Detailed Message</label>
                <span style={{ fontSize: '11px', fontWeight: '700', color: message.length > 900 ? '#EF4444' : theme.textMuted }}>
                  {message.length} / 1000 characters
                </span>
              </div>
              <textarea 
                value={message} 
                onChange={e => setMessage(e.target.value.substring(0, 1000))} 
                placeholder="Compose your coordination message here..." 
                rows={8} 
                style={{ ...textareaStyle(theme), height: '220px' }} 
              />
            </div>

            {/* ROW 2: Schedule & Acknowledgment */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
              <div>
                <label style={labelStyle(theme)}>Schedule Delivery (Optional)</label>
                <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} style={inputStyle(theme)} />
              </div>
              <div style={{ alignSelf: 'end' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: theme.bg, borderRadius: '12px', border: `1px solid ${theme.border}`, height: '48px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: theme.text }}>Require Acknowledgment</span>
                  <label className="switch"><input type="checkbox" checked={requireAck} onChange={e => setRequireAck(e.target.checked)} /><span className="slider round"></span></label>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '24px', borderTop: `1px solid ${theme.border}` }}>
               <button type="button" onClick={() => handleSend("draft")} disabled={sending || !message.trim() || !title.trim()} style={{ ...secondaryButtonStyle(theme), width: '160px' }}>Save as Draft</button>
               <div style={{ display: 'flex', gap: '12px' }}>
                 <button type="button" onClick={() => setShowPreview(true)} disabled={sending || !message.trim() || !title.trim()} style={{ ...secondaryButtonStyle(theme), border: `1px solid var(--primary-color)`, color: 'var(--primary-color)' }}>Preview Content</button>
                 <button type="submit" disabled={sending || !message.trim() || !title.trim()} style={{ ...primaryButtonStyle, width: '220px', background: 'linear-gradient(135deg, var(--primary-color) 0%, #2563EB 100%)', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.25)' }}>Dispatch Broadcast</button>
               </div>
            </div>
          </form>
        </div>
      </div>

      {/* Right Column: Active Intelligence (Activity & Templates) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', overflow: 'hidden' }}>
        
        {/* Last Broadcast Stats Widget */}
        <div style={{ background: theme.surface, borderRadius: "20px", padding: "24px", border: `1px solid ${theme.border}`, boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <p style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: theme.text, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Last Dispatch Analytics</p>
            {lastLog && <span style={{ fontSize: '10px', color: theme.textMuted }}>{new Date(lastLog.created_at).toLocaleDateString()}</span>}
          </div>
          
          {lastLog ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={statCardStyle(theme)}>
                    <p style={statLabelStyle(theme)}>Message Seen</p>
                    <p style={statValueStyle(theme)}>{Math.round((lastLog.read_count / lastLog.sent_to_count) * 100) || 0}%</p>
                    <div style={progressBarContainer(theme)}><div style={{ ...progressBar(theme), width: `${(lastLog.read_count / lastLog.sent_to_count) * 100}%` }}></div></div>
                    <p style={statDetailStyle(theme)}>{lastLog.read_count} / {lastLog.sent_to_count}</p>
                  </div>
                  <div style={statCardStyle(theme)}>
                    <p style={statLabelStyle(theme)}>Acknowledged</p>
                    <p style={{ ...statValueStyle(theme), color: '#10B981' }}>{Math.round((lastLog.ack_count / lastLog.sent_to_count) * 100) || 0}%</p>
                    <div style={progressBarContainer(theme)}><div style={{ ...progressBar(theme), background: '#10B981', width: `${(lastLog.ack_count / lastLog.sent_to_count) * 100}%` }}></div></div>
                    <p style={statDetailStyle(theme)}>{lastLog.ack_count} / {lastLog.sent_to_count}</p>
                  </div>
               </div>
               <p style={{ margin: 0, fontSize: '12px', color: theme.text, fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  "{lastLog.subject}"
               </p>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: '13px', color: theme.textMuted, textAlign: 'center', padding: '10px' }}>No dispatch data available.</p>
          )}
        </div>

        {/* Tabbed Activity / Template Panel */}
        <div style={{ flex: 1, background: theme.surface, borderRadius: "20px", padding: "0", border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', background: theme.bg, borderBottom: `1px solid ${theme.border}` }}>
            <button 
              onClick={() => setRightPanelTab("recent")} 
              style={{ ...tabStyle(theme), borderBottom: rightPanelTab === "recent" ? '2px solid var(--primary-color)' : 'none', color: rightPanelTab === "recent" ? 'var(--primary-color)' : theme.textMuted }}
            >
              Recent History
            </button>
            <button 
              onClick={() => setRightPanelTab("templates")} 
              style={{ ...tabStyle(theme), borderBottom: rightPanelTab === "templates" ? '2px solid var(--primary-color)' : 'none', color: rightPanelTab === "templates" ? 'var(--primary-color)' : theme.textMuted }}
            >
              Template Library
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            {loading ? (
              <p style={{ color: theme.textMuted, textAlign: 'center' }}>Loading intelligence...</p>
            ) : rightPanelTab === "recent" ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {history.map(log => (
                  <div key={log.id} style={historyCardStyle(theme, darkMode)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <p style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: theme.text }}>{log.subject}</p>
                       </div>
                       <div style={{ position: 'relative' }}>
                          <button onClick={() => setActiveMenu(activeMenu === log.id ? null : log.id)} style={menuButtonStyle(theme)}>⋮</button>
                          {activeMenu === log.id && (
                            <div ref={menuRef} style={dropdownMenuStyle(theme)}>
                               <div className="menu-item" style={menuItemStyle(theme)}>View Stats</div>
                               {log.status === 'sent' && <div className="menu-item" onClick={() => handleResend(log.id)} style={menuItemStyle(theme)}>Resend</div>}
                               <div className="menu-item" onClick={() => handleArchive(log.id)} style={{ ...menuItemStyle(theme), color: '#EF4444' }}>Archive</div>
                            </div>
                          )}
                       </div>
                    </div>
                    <p style={historyMessageStyle(theme)}>{log.message}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                       <div style={{ display: 'flex', gap: '6px' }}>
                          <span style={badgeStyle(getStatusBadge(log.status))}>{getStatusBadge(log.status).label}</span>
                          {log.require_ack && <span style={badgeStyle({ color: '#EF4444', bg: '#FEF2F2' })}>ACK</span>}
                       </div>
                       <span style={{ fontSize: '11px', color: theme.textMuted, fontWeight: '600' }}>{new Date(log.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                {history.length === 0 && <p style={{ textAlign: 'center', color: theme.textMuted }}>No recent dispatches.</p>}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {customTemplates.map(t => (
                  <div key={t.id} style={templateItemStyle(theme)}>
                    <div style={{ flex: 1 }}>
                       <p style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: theme.text }}>{t.name}</p>
                       <p style={{ margin: 0, fontSize: '11px', color: theme.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</p>
                    </div>
                     <div style={{ position: 'relative' }}>
                        <button onClick={() => setActiveMenu(activeMenu === `tpl_${t.id}` ? null : `tpl_${t.id}`)} style={menuButtonStyle(theme)}>⋮</button>
                        {activeMenu === `tpl_${t.id}` && (
                          <div ref={menuRef} style={{ ...dropdownMenuStyle(theme), right: 0, top: '100%', minWidth: '120px' }}>
                             <div className="menu-item" onClick={() => { applyTemplate(t); setActiveMenu(null); }} style={menuItemStyle(theme)}>Apply</div>
                             <div className="menu-item" onClick={() => { handleEditTemplate(t); setActiveMenu(null); }} style={menuItemStyle(theme)}>Edit</div>
                             <div className="menu-item" onClick={() => { handleDeleteTemplate(t.id); setActiveMenu(null); }} style={{ ...menuItemStyle(theme), color: '#EF4444' }}>Delete</div>
                          </div>
                        )}
                     </div>
                  </div>
                ))}
                {customTemplates.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <p style={{ color: theme.textMuted, margin: '0 0 16px 0' }}>Your library is empty.</p>
                    <button onClick={() => setShowCreateModal(true)} style={textLinkStyle}>Create First Template</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Template Modal - Professional Library Tool */}
      {showCreateModal && (
        <div style={{ ...overlayStyle, animation: 'fadeIn 0.2s ease-out' }}>
           <div style={{ ...modalStyle(theme), maxWidth: '650px', padding: '40px', transform: 'scale(1)', animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '32px' }}>
                 <div style={{ width: '48px', height: '48px', background: 'var(--primary-color)15', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                 </div>
                 <div>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: theme.text }}>
                       {editingTplId ? "Edit Library Template" : "Save Template to Library"}
                    </h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: theme.textMuted, fontWeight: '500' }}>
                       {editingTplId ? "Refine your saved coordination message" : "Create reusable announcements for faster coordination"}
                    </p>
                 </div>
                 <button onClick={() => { setShowCreateModal(false); resetTplForm(); }} style={{ ...closeBtnStyle(theme), marginLeft: 'auto' }}>✕</button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                 <div>
                    <label style={{ ...labelStyle(theme), marginBottom: '4px' }}>Template Name</label>
                    <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: theme.textMuted, fontWeight: '600' }}>Internal use only (e.g. "Maintenance Notice")</p>
                    <input type="text" value={newTplName} onChange={e => setNewTplName(e.target.value)} placeholder="e.g. Monthly Coordination Notice" style={inputStyle(theme)} />
                 </div>
                 <div>
                    <label style={{ ...labelStyle(theme), marginBottom: '4px' }}>Announcement Title</label>
                    <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: theme.textMuted, fontWeight: '600' }}>This will appear as the headline to users</p>
                    <input type="text" value={newTplTitle} onChange={e => setNewTplTitle(e.target.value)} placeholder="Headline for beneficiaries" style={inputStyle(theme)} />
                 </div>
                 <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                       <label style={labelStyle(theme)}>Message Content</label>
                       <span style={{ fontSize: '10px', fontWeight: '700', color: theme.textMuted }}>{newTplMessage.length} / 1000</span>
                    </div>
                    <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: theme.textMuted, fontWeight: '600' }}>Main message that will be sent to users</p>
                    <textarea value={newTplMessage} onChange={e => setNewTplMessage(e.target.value.substring(0, 1000))} placeholder="Announcement content..." rows={5} style={{ ...textareaStyle(theme), height: '160px' }} />
                 </div>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-start' }}>
                 <button 
                  type="button" 
                  onClick={() => { setTitle(newTplTitle); setMessage(newTplMessage); setShowPreview(true); }}
                  disabled={!newTplTitle.trim() || !newTplMessage.trim()}
                  style={{ ...textLinkStyle, display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                 >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    Preview Template
                 </button>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '36px', borderTop: `1px solid ${theme.border}`, paddingTop: '24px' }}>
                 <button onClick={() => { setShowCreateModal(false); resetTplForm(); }} style={{ ...secondaryButtonStyle(theme), flex: 1 }}>Cancel</button>
                 <button onClick={handleCreateTemplate} disabled={isSavingTpl || !newTplName.trim() || !newTplTitle.trim() || !newTplMessage.trim()} style={{ ...primaryButtonStyle, flex: 2, background: 'var(--primary-color)' }}>
                    {isSavingTpl ? "Saving..." : (editingTplId ? "Update Template" : "Save Template to Library")}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Dispatch Preview Modal - Decision Checkpoint */}
      {showPreview && (
        <div style={{ ...overlayStyle, animation: 'fadeIn 0.2s ease-out' }}>
           <div style={{ ...modalStyle(theme), maxWidth: '600px', padding: '40px', animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                 <div>
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: theme.text }}>Dispatch Preview</h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: theme.textMuted, fontWeight: '500' }}>Review details before broadcasting to users</p>
                 </div>
                 <div style={{ padding: '8px 16px', background: 'var(--primary-color)10', borderRadius: '12px', border: '1px solid var(--primary-color)20' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary-color)' }}>FINAL CHECK</span>
                 </div>
              </div>

              {/* Dispatch Summary Block */}
              <div style={{ background: theme.bg, borderRadius: '16px', padding: '20px', border: `1px solid ${theme.border}`, marginBottom: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: theme.textMuted, textTransform: 'uppercase' }}>Target Audience</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: theme.text }}>Citizens / Beneficiaries</span>
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: theme.textMuted, textTransform: 'uppercase' }}>Channel Scope</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: theme.text }}>Global Hub Coordination</span>
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: theme.textMuted, textTransform: 'uppercase' }}>Delivery Method</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: scheduledAt ? '#F59E0B' : '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                       {scheduledAt ? (
                         <>🕒 Scheduled: {new Date(scheduledAt).toLocaleString()}</>
                       ) : (
                         <>⚡ Immediate Dispatch</>
                       )}
                    </span>
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: theme.textMuted, textTransform: 'uppercase' }}>Compliance</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: requireAck ? '#EF4444' : theme.text }}>
                       {requireAck ? '⚠️ Acknowledgment Required' : 'Informational Only'}
                    </span>
                 </div>
              </div>

              {/* Actual Message Card Preview */}
              <div style={{ background: theme.surface, padding: '32px', borderRadius: '20px', border: `2px solid ${priority === 'high' ? '#EF4444' : theme.border}`, boxShadow: priority === 'high' ? '0 10px 40px rgba(239, 68, 68, 0.1)' : '0 4px 15px rgba(0,0,0,0.02)' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                       <div style={{ width: '32px', height: '32px', background: getPriorityBadge(priority).color + '15', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: getPriorityBadge(priority).color }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                       </div>
                       <span style={{ fontSize: '12px', fontWeight: '900', color: getPriorityBadge(priority).color }}>
                         {priority.toUpperCase()} PRIORITY
                       </span>
                    </div>
                    <span style={{ fontSize: '11px', color: theme.textMuted, fontWeight: '600' }}>Drafted by {adminUser?.name || 'Admin'}</span>
                 </div>
                 
                 <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '800', color: theme.text }}>{title}</h3>
                 <div style={{ height: '1px', background: theme.border, margin: '0 0 16px 0', opacity: 0.5 }}></div>
                 <p style={{ margin: 0, fontSize: '15px', lineHeight: '1.7', color: theme.text, whiteSpace: 'pre-wrap' }}>{message}</p>
              </div>

              {/* Accountability Warning */}
              <div style={{ marginTop: '24px', textAlign: 'center' }}>
                 <p style={{ margin: 0, fontSize: '13px', color: theme.textMuted, fontWeight: '600' }}>
                    {requireAck ? '🔴 Users will be required to explicitly acknowledge this message.' : '⚪ This announcement will be sent to the community feed.'}
                 </p>
                 <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: theme.textMuted }}>This action cannot be undone once dispatched.</p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                 <button onClick={() => setShowPreview(false)} style={{ ...secondaryButtonStyle(theme), flex: 1, border: `1px solid ${theme.border}` }}>Back to Edit</button>
                 <button onClick={() => handleSend("sent")} style={{ ...primaryButtonStyle, flex: 2, background: 'var(--primary-color)', boxShadow: '0 10px 20px rgba(37, 99, 235, 0.2)' }}>Send Announcement</button>
              </div>
           </div>
        </div>
      )}

      <CustomModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type} onConfirm={dialog.onConfirm} />

      <style>{`
        .switch { position: relative; display: inline-block; width: 44px; height: 22px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #E2E8F0; transition: .4s; border-radius: 22px; }
        .slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
        input:checked + .slider { background-color: var(--primary-color); }
        input:checked + .slider:before { transform: translateX(22px); }
        .menu-item:hover { background: rgba(0,0,0,0.05); }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

const labelStyle = (theme) => ({ display: "block", fontSize: "11px", fontWeight: "900", color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" });
const textLinkStyle = { fontSize: '12px', color: 'var(--primary-color)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '800', textDecoration: 'underline' };
const readOnlyInputStyle = (theme) => ({ padding: '12px 16px', background: theme.bg, borderRadius: '12px', border: `1px solid ${theme.border}`, fontSize: '14px', color: theme.text, fontWeight: '700', height: '48px', display: 'flex', alignItems: 'center' });
const inputStyle = (theme) => ({ width: "100%", padding: "12px 16px", border: `1px solid ${theme.border}`, borderRadius: "12px", fontSize: "14px", color: theme.text, backgroundColor: theme.bg, outline: 'none', height: '48px', transition: 'all 0.2s', '&:focus': { borderColor: 'var(--primary-color)', boxShadow: '0 0 0 3px var(--primary-color)15' } });
const textareaStyle = (theme) => ({ width: "100%", padding: "16px", border: `1px solid ${theme.border}`, borderRadius: "16px", fontSize: "15px", resize: "none", color: theme.text, backgroundColor: theme.bg, lineHeight: "1.6", outline: 'none', transition: 'all 0.2s' });
const primaryButtonStyle = { padding: "14px", color: "white", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: "900", cursor: "pointer", transition: 'all 0.2s' };
const secondaryButtonStyle = (theme) => ({ padding: "14px", background: theme.surface, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: "12px", fontSize: "15px", fontWeight: "800", cursor: "pointer", transition: 'all 0.2s' });
const templateButtonStyle = (theme) => ({ padding: '10px 20px', borderRadius: '30px', border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: '12px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' });
const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' };
const modalStyle = (theme) => ({ background: theme.surface, width: '90%', borderRadius: '32px', padding: '48px', border: `1px solid ${theme.border}`, boxShadow: '0 30px 60px rgba(0,0,0,0.15)' });
const miniButtonStyle = (theme) => ({ padding: '8px 16px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: '12px', fontWeight: '800', cursor: 'pointer' });
const badgeStyle = (status) => ({ fontSize: '10px', fontWeight: '900', color: status.color, backgroundColor: status.bg, padding: '4px 10px', borderRadius: '6px' });
const menuButtonStyle = (theme) => ({ background: 'none', border: 'none', color: theme.textMuted, fontSize: '20px', cursor: 'pointer', padding: '0 4px', fontWeight: 'bold' });
const dropdownMenuStyle = (theme) => ({ position: 'absolute', right: 0, top: '24px', background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '14px', zIndex: 10, minWidth: '180px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', overflow: 'hidden' });
const menuItemStyle = (theme) => ({ padding: '14px 20px', fontSize: '13px', color: theme.text, cursor: 'pointer', borderBottom: `1px solid ${theme.border}`, textAlign: 'left', fontWeight: '700' });
const closeBtnStyle = (theme) => ({ background: theme.bg, border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.text, fontSize: '16px' });
const tabStyle = (theme) => ({ flex: 1, padding: '16px', fontSize: '13px', fontWeight: '800', background: 'none', border: 'none', cursor: 'pointer', transition: 'all 0.2s' });
const statCardStyle = (theme) => ({ background: theme.bg, padding: '16px', borderRadius: '14px', border: `1px solid ${theme.border}` });
const statLabelStyle = (theme) => ({ margin: 0, fontSize: '10px', fontWeight: '800', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' });
const statValueStyle = (theme) => ({ margin: '4px 0', fontSize: '20px', fontWeight: '900', color: 'var(--primary-color)' });
const statDetailStyle = (theme) => ({ margin: '8px 0 0 0', fontSize: '10px', color: theme.textMuted, fontWeight: '700' });
const progressBarContainer = (theme) => ({ width: '100%', height: '4px', background: theme.border, borderRadius: '4px', overflow: 'hidden', marginTop: '8px' });
const progressBar = (theme) => ({ height: '100%', background: 'var(--primary-color)', transition: 'width 0.5s ease' });
const historyCardStyle = (theme, darkMode) => ({ padding: '20px', borderRadius: '16px', border: `1px solid ${theme.border}`, backgroundColor: darkMode ? theme.bg : '#FFFFFF', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' } });
const historyMessageStyle = (theme) => ({ margin: '0', fontSize: '13px', color: theme.textMuted, lineHeight: '1.6', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' });
const templateItemStyle = (theme) => ({ padding: '16px', borderRadius: '14px', border: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: theme.surface });

export default AdminBroadcast;
