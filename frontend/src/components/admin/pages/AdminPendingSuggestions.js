import React, { useEffect, useState } from "react";
import { adminGetPendingSuggestions, adminApproveSuggestion, adminDeleteFeedback } from "../../../services/adminApi";
import CustomModal from "../../CustomModal";

const AdminPendingSuggestions = ({ theme, darkMode, refreshCount }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState({ isOpen: false });

  // Modal for individual review
  const [reviewModal, setReviewModal] = useState({ isOpen: false, item: null, approvedName: "" });

  const load = () => {
    setLoading(true);
    adminGetPendingSuggestions()
      .then(setSuggestions)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openReview = (item) => {
    // Extract the suggested name from the title "Category: Name"
    const suggested = item.title.includes(": ") ? item.title.split(": ")[1] : item.title;
    setReviewModal({ isOpen: true, item, approvedName: suggested });
  };

  const handleApprove = async () => {
    const { item, approvedName } = reviewModal;
    if (!approvedName.trim()) return;

    try {
      await adminApproveSuggestion(item.id, approvedName.trim());
      setReviewModal({ isOpen: false, item: null, approvedName: "" });
      setDialog({
        isOpen: true,
        type: "alert",
        title: "Approved",
        message: `"${approvedName}" is now a permanent choice for ${item.category_name}. The report is now live.`,
        confirmText: "Great",
        onConfirm: () => setDialog({ isOpen: false })
      });
      load();
      if (refreshCount) refreshCount();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = () => {
    const { item } = reviewModal;
    setDialog({
      isOpen: true,
      type: "alert",
      title: "Confirm Rejection",
      message: `Are you sure you want to reject and delete this suggestion from ${item.user_name}?`,
      confirmText: "Delete",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await adminDeleteFeedback(item.id);
          setReviewModal({ isOpen: false, item: null, approvedName: "" });
          setDialog({ isOpen: false });
          load();
          if (refreshCount) refreshCount();
        } catch (err) { console.error(err); }
      },
      onCancel: () => setDialog({ isOpen: false })
    });
  };

  const thStyle = { padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${theme.border}` };
  const tdStyle = { padding: "14px 16px", fontSize: "13px", color: theme.text, borderBottom: `1px solid ${theme.border}`, verticalAlign: "middle" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", animation: "fadeIn 0.4s ease-out" }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Header Info */}
      <div style={{ background: theme.surface, padding: "24px", borderRadius: "16px", border: `1px solid ${theme.border}`, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
         <h2 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "800", color: theme.text }}>Pending Establishment Approvals</h2>
         <p style={{ margin: 0, fontSize: "13px", color: theme.textMuted, lineHeight: "1.5" }}>
           Users have suggested the following establishments. Review and verify the spelling before approving. 
           Approved names will be added to the category's selection list and the report will become public.
         </p>
      </div>

      {/* Table Container */}
      <div style={{ background: theme.surface, borderRadius: "16px", border: `1px solid ${theme.border}`, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: theme.textMuted }}>Loading suggestions...</div>
        ) : suggestions.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center" }}>
            <div style={{ marginBottom: "16px", opacity: 0.5 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={theme.textMuted} strokeWidth="1.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <p style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: theme.text }}>All caught up!</p>
            <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: theme.textMuted }}>No pending establishment approvals at the moment.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: darkMode ? "rgba(255,255,255,0.02)" : "#F8FAFC" }}>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>User</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Suggested Name</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map((item) => (
                <tr key={item.id} style={{ transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.02)" : "#FAFAFA"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={tdStyle}>{new Date(item.created_at).toLocaleDateString()}</td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: "600" }}>{item.user_name}</div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ padding: "3px 8px", borderRadius: "6px", background: darkMode ? "rgba(255,255,255,0.05)" : "#F1F5F9", fontSize: "11px", fontWeight: "700", color: theme.textMuted }}>
                      {item.category_name}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: "700", color: "#3B82F6" }}>
                      {item.title.includes(": ") ? item.title.split(": ")[1] : item.title}
                    </div>
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    <button 
                      onClick={() => openReview(item)}
                      style={{ padding: "6px 14px", borderRadius: "8px", border: "none", background: "#1f2a56", color: "white", fontSize: "12px", fontWeight: "700", cursor: "pointer", transition: "transform 0.1s" }}
                      onMouseEnter={e => e.currentTarget.style.transform = "scale(1.03)"}
                      onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Review Modal */}
      {reviewModal.isOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)", padding: "20px" }}>
          <div style={{ background: theme.surface, width: "100%", maxWidth: "440px", borderRadius: "24px", overflow: "hidden", animation: "modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
            <style>{`
              @keyframes modalIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
            `}</style>
            
            <div style={{ padding: "24px", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: theme.text }}>Verify Suggestion</h3>
              <button onClick={() => setReviewModal({ ...reviewModal, isOpen: false })} style={{ background: "none", border: "none", fontSize: "20px", color: theme.textMuted, cursor: "pointer" }}>×</button>
            </div>

            <div style={{ padding: "24px" }}>
              <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: theme.textMuted }}>
                Review and update the name if there are typos. This name will become a permanent option for <b>{reviewModal.item.category_name}</b>.
              </p>
              
              <label style={{ fontSize: "11px", fontWeight: "800", color: theme.textMuted, textTransform: "uppercase", display: "block", marginBottom: "8px" }}>Approved Name</label>
              <input 
                value={reviewModal.approvedName}
                onChange={(e) => setReviewModal({ ...reviewModal, approvedName: e.target.value })}
                style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `2px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: "14px", fontWeight: "600", outline: "none", boxSizing: "border-box" }}
              />

              <div style={{ marginTop: "20px", background: darkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC", padding: "12px", borderRadius: "12px", fontSize: "12px", color: theme.textMuted }}>
                <b>Original Submission:</b><br/>
                "{reviewModal.item.description.substring(0, 100)}{reviewModal.item.description.length > 100 ? '...' : ''}"
              </div>
            </div>

            <div style={{ padding: "16px 24px", background: darkMode ? "rgba(255,255,255,0.01)" : "#F8FAFC", borderTop: `1px solid ${theme.border}`, display: "flex", gap: "10px" }}>
              <button onClick={handleReject} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "1px solid #FECACA", background: "#FEF2F2", color: "#B91C1C", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>Reject</button>
              <button 
                onClick={handleApprove}
                style={{ flex: 2, padding: "12px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #1f2a56 0%, #1a2347 100%)", color: "white", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}
              >
                Approve & Publish
              </button>
            </div>
          </div>
        </div>
      )}

      <CustomModal 
        isOpen={dialog.isOpen} title={dialog.title} message={dialog.message} type={dialog.type}
        confirmText={dialog.confirmText} isDestructive={dialog.isDestructive}
        onConfirm={dialog.onConfirm} onCancel={dialog.onCancel} 
      />
    </div>
  );
};

export default AdminPendingSuggestions;
