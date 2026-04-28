import React, { useEffect, useRef, useState } from "react";
import { 
  adminGetFeedbacks, adminDeleteFeedback, adminUpdateFeedbackStatus,
  adminGetResponseTemplates, adminUnifiedReply,
  adminRevealIdentity
} from "../../../services/adminApi";
import { useTerminology } from "../../../context/TerminologyContext";
import CustomModal from "../../CustomModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// --- CONFIG: Workflow Definitions ---
const STATUSES = {
  OPEN: { 
    label: "New", color: "#3B82F6", bg: "rgba(59, 130, 246, 0.1)", 
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
  },
  IN_PROGRESS: { 
    label: "In Review", color: "#EAB308", bg: "rgba(234, 179, 8, 0.1)", 
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
  },
  RESOLVED: { 
    label: "Resolved", color: "#10B981", bg: "rgba(16, 185, 129, 0.1)", 
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
  }
};

// --- COMPONENT: Side Detail Panel ---
const FeedbackSidePanel = ({ feedback, isClosing, onClose, onUpdateStatus, theme, darkMode, getModeLabel, systemMode }) => {
  const [replyMessage, setReplyMessage] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState(null); // Optional status update
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateCategory, setTemplateCategory] = useState("Acknowledgement");
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [closureNote, setClosureNote] = useState("");
  const [revealedIdentity, setRevealedIdentity] = useState(null);
  const [isRevealing, setIsRevealing] = useState(false);

  useEffect(() => {
    if (feedback) {
      adminGetResponseTemplates().then(setTemplates).catch(console.error);
      setSelectedStatus(null); // Reset on new feedback selection
      setReplyMessage("");
      setSaveAsTemplate(false);
      setRevealedIdentity(null);
    }
  }, [feedback]);

  const handleRevealIdentity = async () => {
    if (!feedback?.id) return;
    setIsRevealing(true);
    try {
      const data = await adminRevealIdentity(feedback.id);
      setRevealedIdentity(data);
    } catch (e) {
      console.error("Reveal Identity Failed:", e);
    } finally {
      setIsRevealing(false);
    }
  };

  if (!feedback && !isClosing) return null;

  const currentStatus = STATUSES[feedback?.status || "OPEN"] || STATUSES.OPEN;

  const handleSendReply = async () => {
    if (!replyMessage.trim()) return;
    
    if (saveAsTemplate && !templateName.trim()) {
        alert("Please provide a name for the new template.");
        return;
    }

    setIsSendingReply(true);
    try {
      const payload = {
        message: replyMessage.trim(),
        new_status: selectedStatus,
        closure_note: closureNote.trim(),
        notify: true,
        save_as_template: saveAsTemplate,
        template_name: templateName,
        template_category: templateCategory
      };

      await adminUnifiedReply(feedback.id, payload);
      alert("Official response dispatched and discussion thread updated!");
      
      setReplyMessage("");
      setSaveAsTemplate(false);
      setTemplateName("");
      setSelectedStatus(null);
      setClosureNote("");
      
      // Refresh parent
      onUpdateStatus(feedback.id, selectedStatus || feedback.status);
    } catch (e) {
      console.error(e);
      alert("Failed to dispatch response: " + (e.response?.data?.detail || e.message));
    } finally {
      setIsSendingReply(false);
    }
  };

  const applyTemplate = (tpl) => {
    setReplyMessage(tpl.message);
    setShowTemplateMenu(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{ 
          position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.3)", 
          zIndex: 1050, backdropFilter: "blur(4px)", 
          animation: isClosing ? "fadeOut 0.3s ease forwards" : "fadeIn 0.2s ease" 
        }} 
      />

      <div style={{ 
        position: "fixed", right: 0, top: 0, width: "480px", height: "100vh", 
        background: theme.surface, borderLeft: `6px solid ${currentStatus.color}`, 
        boxShadow: "-15px 0 50px rgba(0,0,0,0.15)", zIndex: 1100, 
        display: "flex", flexDirection: "column", 
        animation: isClosing ? "slideOutRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards" : "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)" 
      }}>
        
        {/* Header */}
        <div style={{ padding: "32px 40px", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: theme.bg }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "900", color: theme.text, letterSpacing: "-0.02em" }}>Submission Intelligence</h3>
            <p style={{ margin: "6px 0 0", fontSize: "13px", fontWeight: "600", color: theme.textMuted }}>Reference ID: #{feedback?.id}</p>
          </div>
          <button onClick={onClose} style={{ background: theme.surface, border: `1px solid ${theme.border}`, color: theme.text, width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "0.2s" }}
            onMouseOver={e => e.currentTarget.style.background = theme.bg}
            onMouseOut={e => e.currentTarget.style.background = theme.surface}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "40px", display: "flex", flexDirection: "column", gap: "32px" }}>
          
          {/* Status Badge & Main Meta */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
             <span style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "11px", fontWeight: "900", color: currentStatus.color, background: currentStatus.bg, border: `1px solid ${currentStatus.color}40`, textTransform: "uppercase", letterSpacing: "0.05em" }}>
               {currentStatus.label}
             </span>
             <span style={{ fontSize: "12px", fontWeight: "700", color: theme.textMuted }}>Received {feedback?.created_at ? new Date(feedback.created_at).toLocaleDateString() : "—"}</span>
          </div>

          {/* Feedback Body */}
          <section>
            <h4 style={{ fontSize: "11px", color: "var(--primary-color)", fontWeight: "900", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Voice of User</h4>
            <div style={{ fontSize: "15px", lineHeight: "1.7", color: theme.text, background: theme.bg, padding: "24px", borderRadius: "20px", border: `1px solid ${theme.border}`, boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)" }}>
              {feedback?.description || "No message provided."}
            </div>
          </section>

          {/* Quick Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <MetricBox 
              label="User Identity" 
              value={feedback?.is_anonymous ? (revealedIdentity ? revealedIdentity.name : "Anonymous (Hidden)") : (feedback?.user_name || "User")} 
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>} 
              theme={theme} 
              extra={feedback?.is_anonymous && !revealedIdentity && (
                <button 
                  onClick={handleRevealIdentity}
                  disabled={isRevealing}
                  style={{ 
                    marginTop: "6px", padding: "6px 10px", fontSize: "10px", fontWeight: "800", 
                    background: "var(--primary-color)", color: "white", border: "none", 
                    borderRadius: "6px", cursor: "pointer", opacity: isRevealing ? 0.6 : 1,
                    transition: "0.2s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "none"}
                >
                  {isRevealing ? "Revealing..." : "Reveal Identity"}
                </button>
              )}
              subValue={revealedIdentity && (
                <div style={{ fontSize: "11px", color: theme.textMuted, marginTop: "4px", lineHeight: "1.6", background: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)", padding: "8px", borderRadius: "8px", border: `1px solid ${theme.border}` }}>
                   <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>📧 <span style={{ fontWeight: "600", color: theme.text }}>{revealedIdentity.email}</span></div>
                   <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>📞 <span style={{ fontWeight: "600", color: theme.text }}>{revealedIdentity.phone}</span></div>
                </div>
              )}
            />
            <MetricBox 
              label="Engagement Rating" 
              value={feedback?.rating ? `${feedback.rating} / 5` : "N/A"} 
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>} 
              theme={theme} 
            />
            <MetricBox 
              label="Primary Location" 
              value={feedback?.dept_name || "General"} 
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>} 
              theme={theme} 
            />
            <MetricBox 
              label="Project/Program" 
              value={feedback?.entity_name || "System"} 
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>} 
              theme={theme} 
            />
          </div>

          {/* Reply Section */}
          <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: "32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h4 style={{ fontSize: "11px", color: "var(--primary-color)", fontWeight: "900", margin: 0, textTransform: "uppercase", letterSpacing: "0.1em" }}>Response to Submission</h4>
              
              {/* Template Selector */}
              <div style={{ position: "relative" }}>
                <button 
                  onClick={() => setShowTemplateMenu(!showTemplateMenu)}
                  style={{ 
                    padding: "6px 12px", borderRadius: "8px", border: `1.5px solid ${theme.border}`, 
                    background: theme.surface, color: theme.text, fontSize: "11px", fontWeight: "700", 
                    cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" 
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                  Use Template
                </button>
                {showTemplateMenu && (
                  <div style={{ position: "absolute", right: 0, top: "32px", width: "240px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.15)", zIndex: 10, padding: "8px", maxHeight: "300px", overflowY: "auto" }}>
                    {templates.length === 0 ? (
                      <div style={{ padding: "12px", fontSize: "12px", color: theme.textMuted, textAlign: "center" }}>No templates saved.</div>
                    ) : (
                      Object.entries(templates.reduce((acc, t) => {
                        acc[t.category] = [...(acc[t.category] || []), t];
                        return acc;
                      }, {})).map(([cat, tpls]) => (
                        <div key={cat} style={{ marginBottom: "8px" }}>
                          <p style={{ margin: "4px 8px", fontSize: "9px", fontWeight: "900", color: theme.textMuted, textTransform: "uppercase" }}>{cat}</p>
                          {tpls.map(t => (
                            <button 
                              key={t.id}
                              onClick={() => applyTemplate(t)}
                              style={{ width: "100%", padding: "8px 12px", border: "none", background: "none", textAlign: "left", fontSize: "12px", fontWeight: "600", color: theme.text, borderRadius: "6px", cursor: "pointer" }}
                              onMouseEnter={e => e.currentTarget.style.background = theme.bg}
                              onMouseLeave={e => e.currentTarget.style.background = "none"}
                            >
                              {t.name}
                            </button>
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div style={{ position: "relative" }}>
              <textarea 
                value={replyMessage}
                onChange={e => setReplyMessage(e.target.value)}
                placeholder="Type your official response here..."
                style={{ 
                  width: "100%", height: "140px", padding: "16px", borderRadius: "16px", 
                  background: theme.bg, border: `1.5px solid ${theme.border}`, color: theme.text, 
                  fontSize: "14px", resize: "none", outline: "none", transition: "0.2s",
                  marginBottom: "20px"
                }}
                onFocus={e => e.currentTarget.style.borderColor = "var(--primary-color)"}
                onBlur={e => e.currentTarget.style.borderColor = theme.border}
              />

              {/* Status Update & Save Template Controls */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "24px" }}>
                
                {/* Status Selector */}
                <div>
                   <p style={{ margin: "0 0 10px", fontSize: "10px", fontWeight: "800", color: theme.textMuted, textTransform: "uppercase" }}>Next Operational Step</p>
                   <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                     {[
                       { id: "IN_PROGRESS", label: "In Review", color: "#EAB308", bg: "rgba(234, 179, 8, 0.1)" },
                       { id: "RESOLVED", label: "Resolve Case", color: "#10B981", bg: "rgba(16, 185, 129, 0.1)" }
                     ].map(st => (
                       <button
                         key={st.id}
                         onClick={() => setSelectedStatus(selectedStatus === st.id ? null : st.id)}
                         style={{ 
                           padding: "8px 14px", borderRadius: "10px", border: `1.5px solid ${selectedStatus === st.id ? st.color : theme.border}`,
                           background: selectedStatus === st.id ? st.bg : theme.surface, color: selectedStatus === st.id ? st.color : theme.text,
                           fontSize: "12px", fontWeight: "700", cursor: "pointer", transition: "0.2s"
                         }}
                       >
                         {st.label}
                       </button>
                     ))}
                     {selectedStatus && (
                       <button onClick={() => setSelectedStatus(null)} style={{ padding: "8px", border: "none", background: "none", color: "#EF4444", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>Reset</button>
                     )}
                   </div>
                   
                   {selectedStatus === 'CLOSED' && (
                     <div style={{ marginTop: '16px', animation: 'fadeIn 0.2s ease' }}>
                       <textarea
                         placeholder={systemMode === 'GOVERNMENT' ? "Explain why this case is being closed (Optional)..." : "Resolution summary or internal note (Optional)..."}
                         style={{ 
                           width: "100%", padding: "12px", borderRadius: "12px", border: `1px solid ${theme.border}`, 
                           background: "white", fontSize: "13px", color: theme.text, minHeight: "80px", 
                           outline: "none", transition: "0.2s" 
                         }}
                         value={closureNote}
                         onChange={e => setClosureNote(e.target.value)}
                       />
                       <p style={{ margin: "6px 0 0", fontSize: "10px", color: theme.textMuted }}>
                         Suggestion: {systemMode === 'GOVERNMENT' ? "Issue resolved during implementation / Duplicate submission" : "Concern addressed during guest checkout / Fixed reported issue"}
                       </p>
                     </div>
                   )}
                </div>

                {/* Save as Template Toggle */}
                <div style={{ padding: "16px", background: theme.bg, borderRadius: "14px", border: `1px solid ${theme.border}` }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", marginBottom: saveAsTemplate ? "16px" : 0 }}>
                    <input type="checkbox" checked={saveAsTemplate} onChange={e => setSaveAsTemplate(e.target.checked)} style={{ width: "16px", height: "16px" }} />
                    <span style={{ fontSize: "13px", fontWeight: "700", color: theme.text }}>Save as reusable template</span>
                  </label>
                  
                  {saveAsTemplate && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", animation: "fadeIn 0.2s ease" }}>
                      <input 
                        placeholder="Template Name"
                        value={templateName}
                        onChange={e => setTemplateName(e.target.value)}
                        style={{ padding: "10px", borderRadius: "8px", border: `1.5px solid ${theme.border}`, background: theme.surface, color: theme.text, fontSize: "12px", outline: "none" }}
                      />
                      <select 
                        value={templateCategory}
                        onChange={e => setTemplateCategory(e.target.value)}
                        style={{ padding: "10px", borderRadius: "8px", border: `1.5px solid ${theme.border}`, background: theme.surface, color: theme.text, fontSize: "12px", outline: "none" }}
                      >
                        {["Acknowledgement", "Apology", "Resolution", "Follow-up"].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <button 
                onClick={handleSendReply}
                disabled={isSendingReply || !replyMessage.trim()}
                style={{ 
                  width: "100%", padding: "16px", borderRadius: "14px", border: "none",
                  background: replyMessage.trim() ? "var(--primary-color)" : theme.border, 
                  color: "white", fontSize: "14px", fontWeight: "900", cursor: replyMessage.trim() ? "pointer" : "not-allowed",
                  transition: "0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                  boxShadow: replyMessage.trim() ? "0 4px 15px rgba(31, 42, 86, 0.2)" : "none"
                }}
              >
                {isSendingReply ? "Dispatching Official Response..." : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    Dispatch Unified Response
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Workflow Transitions */}
          <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: "32px", marginBottom: "40px" }}>
            <h4 style={{ fontSize: "11px", color: "var(--primary-color)", fontWeight: "900", marginBottom: "20px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Governance Workflow</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {Object.entries(STATUSES).map(([key, cfg]) => (
                <button
                  key={key}
                  disabled={feedback?.status === key}
                  onClick={() => onUpdateStatus(feedback?.id, key)}
                  style={{
                    padding: "14px", borderRadius: "12px", border: `1.5px solid ${feedback?.status === key ? cfg.color : theme.border}`,
                    background: feedback?.status === key ? cfg.bg : theme.surface, color: feedback?.status === key ? cfg.color : theme.text,
                    fontSize: "13px", fontWeight: "700", cursor: feedback?.status === key ? "default" : "pointer",
                    textAlign: "left", display: "flex", alignItems: "center", gap: "10px", transition: "0.2s"
                  }}
                  onMouseEnter={e => { if (feedback?.status !== key) { e.currentTarget.style.borderColor = cfg.color; e.currentTarget.style.background = cfg.bg + "20"; } }}
                  onMouseLeave={e => { if (feedback?.status !== key) { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.background = theme.surface; } }}
                >
                  <span style={{ opacity: feedback?.status === key ? 1 : 0.5 }}>{cfg.icon}</span> {cfg.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <style>{`
          @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
          @keyframes slideOutRight { from { transform: translateX(0); } to { transform: translateX(100%); } }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        `}</style>
      </div>
    </>
  );
};

const MetricBox = ({ label, value, icon, theme, extra, subValue }) => (
  <div style={{ padding: "16px", background: theme.bg, borderRadius: "16px", border: `1px solid ${theme.border}`, display: "flex", flexDirection: "column", gap: "8px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <span style={{ fontSize: "14px", color: "var(--primary-color)" }}>{icon}</span>
      <span style={{ fontSize: "10px", fontWeight: "800", color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
    </div>
    <div style={{ fontSize: "14px", fontWeight: "700", color: theme.text }}>{value}</div>
    {subValue && subValue}
    {extra && extra}
  </div>
);

// --- COMPONENT: 3-dot Menu ---
const DotsMenu = ({ onUpdateStatus, onDelete, theme, darkMode, currentStatus }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", borderRadius: "6px", cursor: "pointer", color: theme.textMuted }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
      </button>
      {open && (
        <div 
          onClick={(e) => e.stopPropagation()}
          style={{ position: "absolute", right: 0, top: "34px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 100, minWidth: "160px", padding: "6px" }}
        >
          <p style={{ margin: "4px 8px 8px", fontSize: "9px", fontWeight: "800", color: theme.textMuted, textTransform: "uppercase" }}>Change Status</p>
          {Object.entries(STATUSES).filter(([key]) => key !== 'CLOSED').map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => { onUpdateStatus(key); setOpen(false); }}
              style={{ display: "block", width: "100%", padding: "8px 12px", background: "none", border: "none", borderRadius: "7px", textAlign: "left", fontSize: "12px", fontWeight: currentStatus === key ? "700" : "500", color: currentStatus === key ? cfg.color : theme.text, cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.05)" : "#F1F5F9"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              {cfg.label}
            </button>
          ))}
          <div style={{ margin: "6px 0", borderTop: `1px solid ${theme.border}` }} />
          <button onClick={() => { onDelete(); setOpen(false); }} style={{ display: "block", width: "100%", padding: "8px 12px", background: "none", border: "none", borderRadius: "7px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#EF4444", cursor: "pointer" }}>Delete Permanent</button>
        </div>
      )}
    </div>
  );
};


// --- COMPONENT: Export Dropdown ---
const ExportDropdown = ({ onExport, theme, darkMode }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button 
        onClick={() => setOpen(!open)}
        style={{ 
          display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", 
          background: theme.surface, color: theme.text, border: `1.5px solid ${theme.border}`, 
          borderRadius: "10px", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "0.2s" 
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = "var(--primary-color)"}
        onMouseLeave={e => e.currentTarget.style.borderColor = theme.border}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Export
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "42px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.15)", zIndex: 100, minWidth: "160px", padding: "6px" }}>
          {[
            { id: 'pdf', label: 'PDF Report', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg> },
            { id: 'xls', label: 'Excel (XLS)', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg> },
            { id: 'csv', label: 'CSV (Legacy)', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg> }
          ].map(fmt => (
            <button
              key={fmt.id}
              onClick={() => { onExport(fmt.id); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px 14px", background: "none", border: "none", borderRadius: "8px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: theme.text, cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.05)" : "#F1F5F9"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              <span>{fmt.icon}</span> {fmt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const AdminFeedbacks = ({ theme, darkMode, adminUser }) => {
  const { getLabel, getModeLabel, systemMode } = useTerminology();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("ALL"); // ALL, OPEN, IN_PROGRESS, RESOLVED, CLOSED
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState("ALL");
  const [selectedRating, setSelectedRating] = useState("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");
  const [showProgramFilter, setShowProgramFilter] = useState(false);
  const [showRatingFilter, setShowRatingFilter] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [dialog, setDialog] = useState({ isOpen: false });

  const closePanel = () => {
    setIsClosing(true);
    setTimeout(() => {
      setSelectedFeedback(null);
      setIsClosing(false);
    }, 300);
  };

  const programFilterRef = useRef(null);
  const ratingFilterRef = useRef(null);
  const statusFilterRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (programFilterRef.current && !programFilterRef.current.contains(e.target)) setShowProgramFilter(false);
      if (ratingFilterRef.current && !ratingFilterRef.current.contains(e.target)) setShowRatingFilter(false);
      if (statusFilterRef.current && !statusFilterRef.current.contains(e.target)) setShowStatusFilter(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const load = () => {
    setLoading(true);
    adminGetFeedbacks({ limit: 200 }).then(setFeedbacks).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [adminUser]);

  const handleUpdateStatus = async (id, status) => {
    try {
      await adminUpdateFeedbackStatus(id, status);
      load();
      if (selectedFeedback?.id === id) setSelectedFeedback(prev => ({ ...prev, status }));
    } catch (e) { console.error(e); }
  };

  const filtered = feedbacks.filter(f => {
    const tabMatch = activeTab === "ALL" || f.status === activeTab;
    const programMatch = selectedProgram === "ALL" || f.entity_name === selectedProgram;
    const ratingMatch = selectedRating === "ALL" || f.rating === parseInt(selectedRating);
    const statusMatch = selectedStatusFilter === "ALL" || f.status === selectedStatusFilter;
    const searchMatch = !search || 
      f.description?.toLowerCase().includes(search.toLowerCase()) ||
      f.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      f.entity_name?.toLowerCase().includes(search.toLowerCase());
    return tabMatch && searchMatch && programMatch && ratingMatch && statusMatch;
  });

  const stats = {
    TOTAL: feedbacks.length,
    OPEN: feedbacks.filter(f => f.status === "OPEN").length,
    IN_PROGRESS: feedbacks.filter(f => f.status === "IN_PROGRESS").length,
    RESOLVED: feedbacks.filter(f => f.status === "RESOLVED").length,
  };

  const handleDelete = (fb) => {
    setDialog({
      isOpen: true, type: "alert", title: `Delete ${getLabel("feedback_label", "Feedback")}`,
      message: `Permanently delete this submission? This cannot be undone.`,
      confirmText: "Delete Permanent", isDestructive: true,
      onConfirm: async () => { await adminDeleteFeedback(fb.id); setDialog({ isOpen: false }); load(); },
      onCancel: () => setDialog({ isOpen: false }),
    });
  };

  const handleExport = (format) => {
    const headers = ["ID", "Program", "Location", "Author", "Rating", "Status", "Date"];
    const data = filtered.map(f => [
      f.id,
      f.entity_name || "General",
      f.dept_name || "—",
      f.user_name || "Anonymous",
      f.rating ? `${f.rating}/5` : "—",
      STATUSES[f.status]?.label || f.status,
      f.created_at?.split("T")[0]
    ]);

    if (format === 'csv') {
      const csv = [headers, ...data].map(r => r.join(",")).join("\n");
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = `submissions_export.csv`; link.click();
    } else if (format === 'xls') {
      const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Submissions");
      XLSX.writeFile(wb, `submissions_report.xlsx`);
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      autoTable(doc, { head: [headers], body: data });
      doc.save("submissions_report.pdf");
    }
  };

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      gap: "24px",
      height: "calc(100vh - 140px)",
      overflow: "hidden",
      fontSize: 'clamp(11px, 0.85vh + 0.5vw, 14px)'
    }}>
      {/* Status Workflow Tabs (Fixed) */}
      <div style={{ display: "flex", gap: "8px", borderBottom: `1px solid ${theme.border}`, paddingBottom: "2px", marginBottom: "0", flexShrink: 0 }}>
        {[
          { key: "ALL", label: "All Submissions", count: stats.TOTAL },
          { key: "OPEN", label: "New", count: stats.OPEN, color: "#3B82F6" },
          { key: "IN_PROGRESS", label: "In Review", count: stats.IN_PROGRESS, color: "#EAB308" },
          { key: "RESOLVED", label: "Resolved", count: stats.RESOLVED, color: "#10B981" }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "10px 16px", background: "none", border: "none", cursor: "pointer",
              fontSize: "13px", fontWeight: activeTab === tab.key ? "700" : "500",
              color: activeTab === tab.key ? (tab.color || "var(--primary-color)") : theme.textMuted,
              position: "relative", transition: "0.2s", display: "flex", alignItems: "center", gap: "8px"
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{ 
                fontSize: "10px", padding: "2px 6px", borderRadius: "10px", 
                background: activeTab === tab.key ? (tab.color || "var(--primary-color)") : theme.bg,
                color: activeTab === tab.key ? "white" : theme.textMuted,
                fontWeight: "700"
              }}>
                {tab.count}
              </span>
            )}
            {activeTab === tab.key && (
              <div style={{ position: "absolute", bottom: "-2px", left: 0, right: 0, height: "2px", background: tab.color || "var(--primary-color)", borderRadius: "2px" }} />
            )}
          </button>
        ))}
      </div>

      {/* Actions & Filters (Fixed) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "0", flexShrink: 0 }}>
        <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
          <svg style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: theme.textMuted }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by user, program, or keyword..."
            style={{ width: "100%", padding: "10px 12px 10px 38px", background: theme.surface, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: "10px", fontSize: "13px", outline: "none" }}
          />
        </div>
        <ExportDropdown onExport={handleExport} theme={theme} darkMode={darkMode} />
      </div>

      {/* Table Section (Scrollable) */}
      <div style={{ 
        background: theme.surface, 
        borderRadius: "16px", 
        border: `1px solid ${theme.border}`, 
        overflowY: "auto", 
        flex: 1,
        boxShadow: "0 4px 12px rgba(0,0,0,0.03)" 
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ background: darkMode ? "rgba(255,255,255,0.02)" : "#F8FAFC", borderBottom: `1px solid ${theme.border}` }}>
              <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "11px", fontWeight: "800", color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Program / Service
                  <div style={{ position: 'relative' }} ref={programFilterRef}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowProgramFilter(!showProgramFilter); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: selectedProgram !== 'ALL' ? 'var(--primary-color)' : 'inherit' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                    {showProgramFilter && (
                      <div style={{ position: 'absolute', top: '24px', left: 0, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', zIndex: 100, minWidth: '150px', padding: '6px' }}>
                        {["ALL", ...new Set(feedbacks.map(f => f.entity_name).filter(Boolean))].map(prog => (
                          <button 
                            key={prog} 
                            onClick={(e) => { e.stopPropagation(); setSelectedProgram(prog); setShowProgramFilter(false); }}
                            style={{ 
                              display: 'block', width: '100%', padding: '8px 12px', border: 'none', background: selectedProgram === prog ? 'rgba(var(--primary-rgb), 0.1)' : 'none',
                              textAlign: 'left', fontSize: '12px', fontWeight: '600', color: selectedProgram === prog ? 'var(--primary-color)' : theme.text, borderRadius: '6px', cursor: 'pointer'
                            }}
                          >
                            {prog === "ALL" ? "All Programs" : prog}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </th>
              <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "11px", fontWeight: "800", color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Location</th>
              <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "11px", fontWeight: "800", color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>User</th>
              <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "11px", fontWeight: "800", color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Rating
                  <div style={{ position: 'relative' }} ref={ratingFilterRef}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowRatingFilter(!showRatingFilter); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: selectedRating !== 'ALL' ? 'var(--primary-color)' : 'inherit' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                    {showRatingFilter && (
                      <div style={{ position: 'absolute', top: '24px', left: 0, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', zIndex: 100, minWidth: '120px', padding: '6px' }}>
                        {["ALL", "5", "4", "3", "2", "1"].map(r => (
                          <button 
                            key={r} 
                            onClick={(e) => { e.stopPropagation(); setSelectedRating(r); setShowRatingFilter(false); }}
                            style={{ 
                              display: 'block', width: '100%', padding: '8px 12px', border: 'none', background: selectedRating === r ? 'rgba(var(--primary-rgb), 0.1)' : 'none',
                              textAlign: 'left', fontSize: '12px', fontWeight: '600', color: selectedRating === r ? 'var(--primary-color)' : theme.text, borderRadius: '6px', cursor: 'pointer'
                            }}
                          >
                            {r === "ALL" ? "All Ratings" : `${r} Stars`}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </th>
              <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "11px", fontWeight: "800", color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Status
                  <div style={{ position: 'relative' }} ref={statusFilterRef}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowStatusFilter(!showStatusFilter); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: selectedStatusFilter !== 'ALL' ? 'var(--primary-color)' : 'inherit' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                    {showStatusFilter && (
                      <div style={{ position: 'absolute', top: '24px', left: 0, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', zIndex: 100, minWidth: '150px', padding: '6px' }}>
                        {["ALL", "OPEN", "IN_PROGRESS", "RESOLVED"].map(s => (
                          <button 
                            key={s} 
                            onClick={(e) => { e.stopPropagation(); setSelectedStatusFilter(s); setShowStatusFilter(false); }}
                            style={{ 
                              display: 'block', width: '100%', padding: '8px 12px', border: 'none', background: selectedStatusFilter === s ? 'rgba(var(--primary-rgb), 0.1)' : 'none',
                              textAlign: 'left', fontSize: '12px', fontWeight: '600', color: selectedStatusFilter === s ? 'var(--primary-color)' : theme.text, borderRadius: '6px', cursor: 'pointer'
                            }}
                          >
                            {s === "ALL" ? "All Statuses" : (STATUSES[s]?.label || s)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </th>
              <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "11px", fontWeight: "800", color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Date</th>
              <th style={{ padding: "16px 20px", textAlign: "right", fontSize: "11px", fontWeight: "800", color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(f => (
              <tr 
                key={f.id} 
                onClick={() => setSelectedFeedback(f)}
                style={{ 
                  borderBottom: `1px solid ${theme.border}`, 
                  cursor: "pointer", 
                  transition: "0.15s",
                  opacity: f.status === 'CLOSED' ? 0.65 : 1,
                  backgroundColor: f.status === 'CLOSED' ? (darkMode ? 'rgba(0,0,0,0.1)' : '#F8FAFC') : 'transparent'
                }}
                onMouseEnter={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.03)" : "#FAFAFA"}
                onMouseLeave={e => e.currentTarget.style.background = f.status === 'CLOSED' ? (darkMode ? 'rgba(0,0,0,0.1)' : '#F8FAFC') : "none"}
              >
                <td style={{ padding: "16px 20px" }}>
                  <div style={{ fontWeight: "800", color: theme.text, fontSize: "14px", letterSpacing: "-0.01em" }}>{f.entity_name || "General"}</div>
                  <div style={{ fontSize: "11px", color: theme.textMuted, marginTop: "2px", fontWeight: "600" }}>{f.title?.split(": ")[1] || f.title || "No Subject"}</div>
                </td>
                <td style={{ padding: "16px 20px", color: theme.textMuted, fontWeight: "500", fontSize: "12px" }}>{f.dept_name || "—"}</td>
                <td style={{ padding: "16px 20px" }}>
                  <div style={{ fontWeight: "600", color: theme.text, fontSize: "14px" }}>
                    {f.is_anonymous ? `Anonymous #${f.id}` : (f.user_name || `User #${f.id}`)}
                  </div>
                  {f.is_anonymous && <span style={{ fontSize: "10px", color: "#94A3B8", fontStyle: "italic", fontWeight: "700" }}>Private Submission</span>}
                </td>
                <td style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ 
                      width: "10px", height: "10px", borderRadius: "50%", 
                      background: f.rating <= 2 ? "#EF4444" : f.rating === 3 ? "#F59E0B" : "#10B981",
                      boxShadow: `0 0 10px ${f.rating <= 2 ? "#EF444450" : f.rating === 3 ? "#F59E0B50" : "#10B98150"}`,
                      border: "2px solid white"
                    }} />
                    <span style={{ fontWeight: "600", color: theme.text, fontSize: "15px" }}>{f.rating || "—"}</span>
                  </div>
                </td>
                <td style={{ padding: "16px 20px" }}>
                  <span style={{ 
                    padding: "6px 12px", borderRadius: "10px", fontSize: "10px", fontWeight: "700", 
                    textTransform: "uppercase", background: STATUSES[f.status]?.bg, color: STATUSES[f.status]?.color,
                    border: `1px solid ${STATUSES[f.status]?.color}40`,
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    letterSpacing: "0.02em"
                  }}>
                    {f.status === 'CLOSED' && <span>🔒</span>}
                    {STATUSES[f.status]?.label || f.status}
                  </span>
                </td>
                <td style={{ padding: "16px 20px", color: theme.textMuted, fontWeight: "500", fontSize: "12px" }}>{f.created_at?.split("T")[0]}</td>
                <td style={{ padding: "16px 20px", textAlign: "right" }} onClick={e => e.stopPropagation()}>
                  <DotsMenu onUpdateStatus={(s) => handleUpdateStatus(f.id, s)} onDelete={() => handleDelete(f)} theme={theme} darkMode={darkMode} currentStatus={f.status} />
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: "48px 24px", textAlign: "center" }}>
                   <div style={{ fontSize: "18px", marginBottom: "8px" }}>📦</div>
                   <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: theme.text }}>No feedback submissions found.</p>
                   <p style={{ margin: "4px 0 0", fontSize: "12px", color: theme.textMuted }}>Once users submit feedback, they will appear here for review and action.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <FeedbackSidePanel 
        feedback={selectedFeedback} 
        isClosing={isClosing}
        onClose={closePanel} 
        onUpdateStatus={handleUpdateStatus}
        theme={theme} 
        darkMode={darkMode} 
        getModeLabel={getModeLabel}
        systemMode={systemMode}
      />

      <CustomModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type} confirmText={dialog.confirmText} isDestructive={dialog.isDestructive} onConfirm={dialog.onConfirm} onCancel={dialog.onCancel} />
    </div>
  );
};

export default AdminFeedbacks;
