import React, { useState, useEffect } from "react";
import { adminBroadcast, adminGetBroadcastLogs } from "../../../services/adminApi";
import CustomModal from "../../CustomModal";

const BROADCAST_TEMPLATES = [
  { 
    id: 'maint', label: 'Maintenance', 
    subject: 'Scheduled System Maintenance', 
    message: 'We will be performing a routine system update on [Date] at [Time]. The platform will be unavailable for approximately 30 minutes to ensure peak performance. Thank you for your patience.' 
  },
  { 
    id: 'feature', label: 'New Feature', 
    subject: 'Exciting New Feature: [Feature Name]', 
    message: "We've just launched [Feature Name]! You can now [brief benefit] to improve your workflow. Check it out in your dashboard and let us know what you think." 
  },
  { 
    id: 'security', label: 'Security', 
    subject: 'Security Reminder: Update Your Password', 
    message: 'To keep your account secure, we recommend updating your password. You can do this in your Account Settings. If you notice any suspicious activity, please report it immediately.' 
  },
  { 
    id: 'policy', label: 'Policy Update', 
    subject: 'Important: Policy Update', 
    message: "We've updated our Terms of Service and Community Guidelines. These changes aim to improve user experience and transparency. Please review the updated policy in the Help section." 
  },
  { 
    id: 'milestone', label: 'Milestone', 
    subject: 'System Milestone Achievement!', 
    message: 'Congratulations to all users! We have reached a significant milestone in our community feedback goal. Your participation has been instrumental in this success. Thank you for your continued engagement!' 
  }
];

const AdminBroadcast = ({ theme, darkMode, adminUser }) => {
  const hasGlobalAdminAccess = ["admin", "superadmin"].includes(adminUser?.role);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [broadcastType, setBroadcastType] = useState("announcement"); // announcement, alert, reminder
  const [targetGroup, setTargetGroup] = useState("all"); // all, staff, global
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [dialog, setDialog] = useState({ isOpen: false });

  const fetchHistory = async () => {
    try {
      const data = await adminGetBroadcastLogs();
      setHistory(data);
    } catch (e) {
      console.error("Failed to load history", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || !subject.trim()) return;
    setSending(true);
    try {
      const res = await adminBroadcast(subject.trim(), message.trim(), broadcastType, targetGroup);
      setDialog({
        isOpen: true, type: "alert", title: "Broadcast Sent",
        message: `Your announcement was delivered to ${res.sent_to} user(s).`,
        confirmText: "Confirm",
        onConfirm: () => { 
          setDialog({ isOpen: false }); 
          setMessage(""); 
          setSubject(""); 
          fetchHistory();
        }
      });
    } catch (err) {
      setDialog({
        isOpen: true, type: "alert", title: "Broadcast Failed",
        message: err.response?.data?.detail || "An error occurred. Please try again.",
        confirmText: "OK", isDestructive: true,
        onConfirm: () => setDialog({ isOpen: false })
      });
    } finally { setSending(false); }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const applyTemplate = (t) => {
    setSubject(t.subject);
    setMessage(t.message);
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
      
      {/* Left Column: Form */}
      <div style={{ flex: '0 0 450px', background: theme.surface, borderRadius: "12px", padding: "28px", border: `1px solid ${theme.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <p style={{ margin: "0 0 6px 0", fontSize: "18px", fontWeight: "800", color: theme.text }}>Program Announcement</p>
        <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: theme.textMuted, lineHeight: '1.6' }}>
          {!!adminUser?.entity_id 
            ? "Reach your program staff and beneficiaries with targeted notifications."
            : "Send a system-wide announcement to all organizations and users."}
        </p>

        <form onSubmit={handleSend} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          <div>
            <label style={labelStyle(theme)}>Target Audience</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'staff', label: 'Staff' },
                { id: 'global', label: 'Beneficiaries' }
              ].map(g => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setTargetGroup(g.id)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '8px', border: `1.5px solid ${targetGroup === g.id ? 'var(--primary-color)' : theme.border}`,
                    background: targetGroup === g.id ? 'var(--primary-color)10' : theme.bg, 
                    color: targetGroup === g.id ? 'var(--primary-color)' : theme.textMuted,
                    fontSize: '11px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.15s'
                  }}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle(theme)}>Broadcast Type</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              {[
                { id: 'announcement', label: 'Announcement', color: '#3B82F6', icon: <BellIcon /> },
                { id: 'alert', label: 'Critical Alert', color: '#EF4444', icon: <AlertIcon /> },
                { id: 'reminder', label: 'Internal Reminder', color: '#10B981', icon: <ClockIcon /> }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setBroadcastType(t.id)}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '10px', border: `1.5px solid ${broadcastType === t.id ? t.color : theme.border}`,
                    background: broadcastType === t.id ? `${t.color}10` : theme.bg, color: broadcastType === t.id ? t.color : theme.textMuted, 
                    fontSize: '11px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
                  }}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {!hasGlobalAdminAccess && (
            <div style={{ background: theme.bg, padding: '12px', borderRadius: '10px', border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3B82F6' }} />
              <span style={{ fontSize: '12px', fontWeight: '600', color: theme.text }}>
                Source: <strong>[OFFICIAL] {adminUser?.department?.toUpperCase()}</strong>
              </span>
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: theme.textMuted, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Quick Templates
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' }}>
              {BROADCAST_TEMPLATES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  style={{
                    padding: '6px 14px', borderRadius: '20px', border: `1.5px solid ${theme.border}`,
                    background: theme.bg, color: theme.text, fontSize: '12px', fontWeight: '600',
                    cursor: 'pointer', transition: 'all 0.2s', outline: 'none',
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#3B82F6'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = theme.border}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: theme.textMuted, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="E.g. System Maintenance Update"
              style={{
                width: "100%", padding: "12px 14px", border: `1.5px solid ${theme.border}`,
                borderRadius: "10px", fontSize: "13px", outline: "none",
                fontFamily: "inherit", color: theme.text, boxSizing: "border-box",
                transition: 'border-color 0.2s', backgroundColor: theme.bg
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
              onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: theme.textMuted, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Detailed Message
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Write your announcement content here..."
              rows={6}
              style={{
                width: "100%", padding: "12px 14px", border: `1.5px solid ${theme.border}`,
                borderRadius: "10px", fontSize: "13px", resize: "none", outline: "none",
                fontFamily: "inherit", color: theme.text, boxSizing: "border-box", lineHeight: "1.6",
                backgroundColor: theme.bg
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
              onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
            />
            <p style={{ fontSize: "11px", color: "#94A3B8", margin: "6px 0 0 0", textAlign: 'right' }}>{message.length} characters</p>
          </div>

          <div style={{
            background: darkMode ? "rgba(254, 252, 232, 0.05)" : "#FEFCE8", borderRadius: "10px", padding: "12px 16px",
            border: `1px solid ${darkMode ? "rgba(254, 240, 138, 0.2)" : "#FEF08A"}`, fontSize: "12px", color: darkMode ? "#FDE047" : "#854D0E", display: 'flex', gap: '10px'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <span>This announcement will be pinned to every user's notification feed.</span>
          </div>

          <button
            type="submit"
            disabled={sending || !message.trim() || !subject.trim()}
            style={{
              padding: "14px", background: sending || !message.trim() || !subject.trim() ? "#F1F5F9" : "var(--primary-color)",
              color: sending || !message.trim() || !subject.trim() ? "#94A3B8" : "white",
              border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: "700",
              cursor: sending || !message.trim() || !subject.trim() ? "not-allowed" : "pointer",
              fontFamily: "inherit", transition: "all 0.2s", boxShadow: sending ? 'none' : '0 4px 12px rgba(var(--primary-rgb), 0.15)'
            }}
          >
            {sending ? "Sending announcement..." : "Post Announcement"}
          </button>
        </form>
      </div>

      {/* Right Column: History Section */}
      <div style={{ flex: 1, background: theme.surface, borderRadius: "12px", padding: "28px", border: `1px solid ${theme.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', minHeight: '500px' }}>
        <p style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: "800", color: theme.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Announcements</p>
        
        {loadingHistory ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1,2,3].map(i => <div key={i} style={{ height: '40px', background: theme.bg, borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />)}
          </div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: theme.textMuted }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px', opacity: 0.5 }}><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
            <p style={{ fontSize: '13px' }}>No announcements have been sent yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {history.map(log => (
              <div key={log.id} style={{ padding: '18px', borderRadius: '12px', border: `1px solid ${theme.border}`, backgroundColor: darkMode ? theme.bg : '#FFFFFF', transition: 'transform 0.2s', cursor: 'default' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                   <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: theme.text, flex: 1 }}>{log.subject}</p>
                   <span style={{ fontSize: '11px', fontWeight: '800', color: '#3B82F6', backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF', padding: '3px 10px', borderRadius: '6px' }}>
                     {log.read_count || 0} / {log.sent_to_count} Acknowledged
                   </span>
                </div>
                <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: theme.textMuted, lineHeight: '1.6', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {log.message}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: theme.textMuted }}>
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                   {formatDate(log.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CustomModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type}
        confirmText={dialog.confirmText} isDestructive={dialog.isDestructive}
        onConfirm={dialog.onConfirm} onCancel={dialog.onCancel} />
    </div>
  );
};

const labelStyle = (theme) => ({
  display: "block", fontSize: "11px", fontWeight: "700", color: theme.textMuted, 
  marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.05em"
});

function BellIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>; }
function AlertIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>; }
function ClockIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }

export default AdminBroadcast;
