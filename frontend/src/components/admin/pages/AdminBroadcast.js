import React, { useState, useEffect } from "react";
import { adminBroadcast, adminGetBroadcastLogs } from "../../../services/adminApi";
import CustomModal from "../../CustomModal";

const AdminBroadcast = () => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
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
      const res = await adminBroadcast(subject.trim(), message.trim());
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

  return (
    <div style={{ maxWidth: "1280px", display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
      
      {/* Left Column: Form */}
      <div style={{ flex: '0 0 450px', background: "white", borderRadius: "12px", padding: "28px", border: "1px solid #E2E8F0", boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <p style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "800", color: "#0F172A" }}>System Announcement</p>
        <p style={{ margin: "0 0 24px 0", fontSize: "13px", color: "#64748B", lineHeight: '1.5' }}>
          Send a notification to all registered users. Use this for important system-wide alerts.
        </p>

        <form onSubmit={handleSend} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="E.g. System Maintenance Update"
              style={{
                width: "100%", padding: "12px 14px", border: "1.5px solid #E2E8F0",
                borderRadius: "10px", fontSize: "13px", outline: "none",
                fontFamily: "inherit", color: "#1E293B", boxSizing: "border-box",
                transition: 'border-color 0.2s', backgroundColor: '#F8FAFC'
              }}
              onFocus={(e) => e.target.style.borderColor = '#1f2a56'}
              onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Detailed Message
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Write your announcement content here..."
              rows={6}
              style={{
                width: "100%", padding: "12px 14px", border: "1.5px solid #E2E8F0",
                borderRadius: "10px", fontSize: "13px", resize: "none", outline: "none",
                fontFamily: "inherit", color: "#1E293B", boxSizing: "border-box", lineHeight: "1.6",
                backgroundColor: '#F8FAFC'
              }}
              onFocus={(e) => e.target.style.borderColor = '#1f2a56'}
              onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
            />
            <p style={{ fontSize: "11px", color: "#94A3B8", margin: "6px 0 0 0", textAlign: 'right' }}>{message.length} characters</p>
          </div>

          <div style={{
            background: "#FEFCE8", borderRadius: "10px", padding: "12px 16px",
            border: "1px solid #FEF08A", fontSize: "12px", color: "#854D0E", display: 'flex', gap: '10px'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <span>This announcement will be pinned to every user's notification feed.</span>
          </div>

          <button
            type="submit"
            disabled={sending || !message.trim() || !subject.trim()}
            style={{
              padding: "14px", background: sending || !message.trim() || !subject.trim() ? "#F1F5F9" : "#1f2a56",
              color: sending || !message.trim() || !subject.trim() ? "#94A3B8" : "white",
              border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: "700",
              cursor: sending || !message.trim() || !subject.trim() ? "not-allowed" : "pointer",
              fontFamily: "inherit", transition: "all 0.2s", boxShadow: sending ? 'none' : '0 4px 12px rgba(31, 42, 86, 0.15)'
            }}
          >
            {sending ? "Sending announcement..." : "Post Announcement"}
          </button>
        </form>
      </div>

      {/* Right Column: History Section */}
      <div style={{ flex: 1, background: "white", borderRadius: "12px", padding: "28px", border: "1px solid #E2E8F0", boxShadow: '0 1px 3px rgba(0,0,0,0.05)', minHeight: '500px' }}>
        <p style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: "800", color: "#0F172A", textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Announcements</p>
        
        {loadingHistory ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1,2,3].map(i => <div key={i} style={{ height: '40px', background: '#F8FAFC', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />)}
          </div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94A3B8' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px', opacity: 0.5 }}><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
            <p style={{ fontSize: '13px' }}>No announcements have been sent yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {history.map(log => (
              <div key={log.id} style={{ padding: '16px', borderRadius: '12px', border: '1px solid #F1F5F9', backgroundColor: '#FFFFFF', transition: 'transform 0.2s', cursor: 'default' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                   <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#1E293B', flex: 1 }}>{log.subject}</p>
                   <span style={{ fontSize: '11px', fontWeight: '700', color: '#3B82F6', backgroundColor: '#EFF6FF', padding: '2px 8px', borderRadius: '6px' }}>
                     {log.read_count || 0} / {log.sent_to_count} Seen
                   </span>
                </div>
                <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#64748B', lineHeight: '1.5', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {log.message}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94A3B8' }}>
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

export default AdminBroadcast;
