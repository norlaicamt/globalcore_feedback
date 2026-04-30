import React, { useState, useEffect } from "react";
import { adminGetAccessRequests, adminReviewAccessRequest } from "../../../services/adminApi";

const AdminRequests = ({ theme, darkMode }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending"); // pending | approved | rejected
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await adminGetAccessRequests(filter === "all" ? null : filter);
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id, status) => {
    setProcessingId(id);
    try {
      await adminReviewAccessRequest(id, status);
      fetchRequests(); // Refresh
    } catch (err) {
      console.error(err);
      alert("Review failed. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div style={{ display: "flex", gap: "10px" }}>
          {["pending", "approved", "rejected", "all"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "8px 16px", borderRadius: "10px", border: `1.5px solid ${filter === f ? "var(--primary-color)" : theme.border}`,
                background: filter === f ? "rgba(var(--primary-rgb), 0.1)" : theme.surface,
                color: filter === f ? "var(--primary-color)" : theme.textMuted,
                fontSize: "12px", fontWeight: "700", cursor: "pointer", textTransform: "capitalize", transition: "0.2s"
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: theme.textMuted }}>Loading access queue...</div>
      ) : requests.length === 0 ? (
        <div style={{ 
          textAlign: "center", padding: "80px 40px", background: theme.surface, 
          borderRadius: "24px", border: `1px solid ${theme.border}` 
        }}>
          <div style={{ fontSize: "40px", marginBottom: "20px" }}>🛡️</div>
          <h3 style={{ margin: "0 0 10px", color: theme.text }}>Governance Queue Clear</h3>
          <p style={{ margin: 0, color: theme.textMuted, fontSize: "14px" }}>No {filter} admin access requests found.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {requests.map(req => (
            <div 
              key={req.id} 
              style={{ 
                padding: "24px", background: theme.surface, borderRadius: "20px", 
                border: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center",
                transition: "0.2s"
              }}
            >
              <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                <div style={{ 
                  width: "50px", height: "50px", borderRadius: "15px", background: "var(--primary-color)", 
                  color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: "900" 
                }}>
                  {req.user_name?.charAt(0) || "U"}
                </div>
                <div>
                  <h4 style={{ margin: "0 0 4px", color: theme.text, fontSize: "16px" }}>{req.user_name}</h4>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--primary-color)", background: "rgba(var(--primary-rgb), 0.1)", padding: "4px 10px", borderRadius: "6px" }}>
                      Requested: {req.requested_role.toUpperCase()}
                    </span>
                    <span style={{ fontSize: "12px", color: theme.textMuted }}>
                      Entity: <strong>{req.entity_name}</strong>
                    </span>
                  </div>
                  {req.reason && (
                    <p style={{ margin: "12px 0 0", fontSize: "13px", color: theme.text, fontStyle: "italic", opacity: 0.8 }}>
                      "{req.reason}"
                    </p>
                  )}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ marginBottom: "12px", fontSize: "11px", color: theme.textMuted }}>
                  Submitted {new Date(req.created_at).toLocaleDateString()}
                </div>
                {req.status === "pending" ? (
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button 
                      disabled={processingId === req.id}
                      onClick={() => handleReview(req.id, "rejected")}
                      style={{ 
                        padding: "10px 20px", borderRadius: "10px", border: "none", 
                        background: "#EF444415", color: "#EF4444", fontSize: "13px", fontWeight: "700", cursor: "pointer" 
                      }}
                    >
                      Reject
                    </button>
                    <button 
                      disabled={processingId === req.id}
                      onClick={() => handleReview(req.id, "approved")}
                      style={{ 
                        padding: "10px 20px", borderRadius: "10px", border: "none", 
                        background: "#10B981", color: "white", fontSize: "13px", fontWeight: "700", cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)"
                      }}
                    >
                      {processingId === req.id ? "Processing..." : "Approve & Promote"}
                    </button>
                  </div>
                ) : (
                  <div style={{ 
                    padding: "8px 16px", borderRadius: "10px", fontSize: "12px", fontWeight: "800",
                    background: req.status === "approved" ? "#10B98120" : "#EF444420",
                    color: req.status === "approved" ? "#10B981" : "#EF4444",
                    textTransform: "uppercase"
                  }}>
                    {req.status}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default AdminRequests;
