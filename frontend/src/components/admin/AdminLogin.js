import React, { useState } from "react";
import { adminLogin } from "../../services/adminApi";
import CustomModal from "../CustomModal";

const AdminLogin = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dialog, setDialog] = useState({ isOpen: false });

  const Icons = {
    Eye: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
    EyeOff: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>,
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const admin = await adminLogin(email, password);
      onLoginSuccess(admin);
    } catch (err) {
      setDialog({
        isOpen: true, type: "alert",
        title: "Access Denied",
        message: err.response?.data?.detail || "Invalid admin credentials.",
        confirmText: "Try Again", isDestructive: true,
        onConfirm: () => setDialog({ isOpen: false }),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .adm-input:focus { outline: none; border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }
        .adm-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(37,99,235,0.35) !important; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div style={styles.blob1} /><div style={styles.blob2} />

      <div style={styles.wrapper}>
        <div style={styles.brandSection}>
          <div style={styles.logoSquare}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <p style={styles.brandTitle}>GLOBALCORE ADMIN</p>
          <p style={styles.brandSub}>Command & Control Center</p>
        </div>

        <div style={styles.card}>
          <h1 style={styles.cardHeader}>Admin Sign In</h1>
          <p style={styles.cardSub}>Restricted access — authorized administrators only</p>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Admin Email</label>
              <input className="adm-input" type="email" placeholder="admin@globalcore.com"
                style={styles.input} value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  className="adm-input" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Enter admin key"
                  style={{ ...styles.input, paddingRight: '44px' }} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                />
                <div 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    cursor: 'pointer',
                    color: '#94A3B8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#64748B'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}
                >
                  {showPassword ? <Icons.Eye /> : <Icons.EyeOff />}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right', marginTop: '-10px', marginBottom: '8px' }}>
              <a href="/forgot-password" style={{ fontSize: '12px', color: '#3B82F6', textDecoration: 'none', fontWeight: '700' }}>
                Forgot access key?
              </a>
            </div>

            <button type="submit" className="adm-btn" disabled={isLoading} style={{
              ...styles.loginBtn, opacity: isLoading ? 0.75 : 1, cursor: isLoading ? "not-allowed" : "pointer"
            }}>
              {isLoading ? "Authenticating…" : "Access Admin Panel →"}
            </button>
          </form>

          <div style={styles.securityBadge}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            <span>Secure admin connection</span>
          </div>
        </div>
      </div>

      <CustomModal isOpen={dialog.isOpen} title={dialog.title} message={dialog.message}
        type={dialog.type} confirmText={dialog.confirmText} isDestructive={dialog.isDestructive}
        onConfirm={dialog.onConfirm} onCancel={dialog.onCancel} />
    </div>
  );
};

const styles = {
  container: { position: "relative", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "linear-gradient(135deg, #F8FAFC 0%, #EEF2F6 100%)", padding: "20px", fontFamily: '"Inter", sans-serif', overflow: "hidden" },
  blob1: { position: "absolute", top: "-120px", right: "-120px", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)", pointerEvents: "none" },
  blob2: { position: "absolute", bottom: "-100px", left: "-100px", width: "350px", height: "350px", borderRadius: "50%", background: "radial-gradient(circle, rgba(var(--primary-rgb), 0.08) 0%, transparent 70%)", pointerEvents: "none" },
  wrapper: { display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: "400px", animation: "fadeUp 0.4s ease-out both" },
  brandSection: { display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "24px" },
  logoSquare: { width: "60px", height: "60px", borderRadius: "18px", background: "linear-gradient(135deg, var(--primary-color) 0%, #2563EB 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(37,99,235,0.3)" },
  brandTitle: { marginTop: "12px", fontSize: "11px", fontWeight: "800", letterSpacing: "0.18em", textTransform: "uppercase", background: "linear-gradient(45deg, var(--primary-color), #3B82F6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  brandSub: { fontSize: "12px", color: "#94A3B8", marginTop: "4px", fontWeight: "500" },
  card: { width: "100%", backgroundColor: "white", padding: "32px 28px", borderRadius: "24px", border: "1px solid rgba(226,232,240,0.8)", boxShadow: "0 8px 30px rgba(0,0,0,0.06)" },
  cardHeader: { fontSize: "20px", fontWeight: "800", color: "#0F172A", marginBottom: "6px", textAlign: "center" },
  cardSub: { color: "#94A3B8", textAlign: "center", marginBottom: "24px", fontSize: "12px", fontStyle: "italic" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  inputGroup: { textAlign: "left" },
  label: { display: "block", fontSize: "11px", fontWeight: "700", color: "#1E293B", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" },
  input: { width: "100%", padding: "11px 14px", fontSize: "13px", border: "1.5px solid #E2E8F0", borderRadius: "10px", boxSizing: "border-box", color: "#1E293B", backgroundColor: "#FAFAFA", transition: "border-color 0.2s", fontFamily: "inherit" },
  loginBtn: { width: "100%", marginTop: "4px", background: "linear-gradient(135deg, var(--primary-color) 0%, #2563EB 100%)", color: "white", padding: "13px", borderRadius: "10px", fontWeight: "700", border: "none", fontSize: "14px", boxShadow: "0 4px 12px rgba(37,99,235,0.25)", transition: "transform 0.2s, box-shadow 0.2s", fontFamily: "inherit" },
  securityBadge: { display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "20px", fontSize: "11px", color: "#94A3B8", fontWeight: "500" },
};

export default AdminLogin;
