import React, { useState } from "react";
import axios from "axios";
import { login } from "../services/api";
import { API_BASE } from "../config";
import CustomModal from "./CustomModal";
import { useTerminology } from "../context/TerminologyContext";
import { resolveMediaUrl } from "../utils/feedback";

const LoginPage = ({ onLoginSuccess }) => {
  const { systemLogo } = useTerminology();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [dialog, setDialog] = useState({ isOpen: false });
  const [attempt, setAttempt] = useState(0);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    if (error) setError(null);
  }, [email, username, password, isSignUp]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSignUp && password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        if (!username.trim()) {
           setError("Username is required for registration.");
           setIsLoading(false);
           return;
        }
        const newUser = { name: username, username: username, email, password };
        await axios.post(`${API_BASE}/users/`, newUser);

        setDialog({
          isOpen: true,
          type: "alert",
          title: "Registration Successful",
          message: "Your account has been created. You can now log in.",
          confirmText: "Log In Now",
          onConfirm: () => {
            setDialog({ isOpen: false });
            setIsSignUp(false);
          },
        });
      } else {
        const user = await login(email, password);
        if (rememberMe) localStorage.setItem("remembered_user", email);
        else localStorage.removeItem("remembered_user");
        onLoginSuccess(user);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || (isSignUp ? "Account creation failed. Please try again." : "Invalid email or password. Please try again.");
      setError(msg);
      setAttempt(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const Icons = {
    Eye: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
    EyeOff: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>,
    Shield: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    Zap: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
    Lock: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>,
    Chart: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>,
    Security: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
  };

  const isMobile = windowWidth <= 1024;
  const styles = React.useMemo(() => getStyles(isMobile), [isMobile]);

  return (
    <div style={styles.container}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .login-input:focus { outline: none; border-color: rgba(37, 99, 235, 0.5); box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); }
        .login-btn:hover { transform: translateY(-1px); box-shadow: 0 12px 24px rgba(37,99,235,0.3) !important; }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes glow { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.1); } }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}</style>

      <div style={styles.mainWrapper}>
        {!isMobile && (
          <div style={styles.identitySection}>
            <div style={styles.gradientSphere1} />
            <div style={styles.gradientSphere2} />
            <div style={styles.gridOverlay} />
            
            <svg style={styles.networkLines} width="100%" height="100%" opacity="0.1">
              <path d="M0,100 Q200,50 400,100 T800,100" stroke="#3B82F6" strokeWidth="1" fill="none" />
              <path d="M0,400 Q200,450 400,400 T800,400" stroke="#3B82F6" strokeWidth="1" fill="none" />
            </svg>

            <div style={{ ...styles.floatingBadge, top: '20%', left: '15%', animation: 'float 6s ease-in-out infinite' }}>
              <div style={styles.glassBadge}>
                <div style={styles.badgeIcon}><Icons.Zap /></div>
                <div>Real-Time Response Tracking</div>
              </div>
            </div>
            
            <div style={{ ...styles.floatingBadge, top: '15%', right: '15%', animation: 'float 8s ease-in-out infinite' }}>
              <div style={styles.glassBadge}>
                <div style={styles.badgeIcon}><Icons.Lock /></div>
                <div>Secure Submission</div>
              </div>
            </div>

            <div style={{ ...styles.floatingBadge, bottom: '25%', left: '20%', animation: 'float 7s ease-in-out infinite' }}>
              <div style={styles.glassBadge}>
                <div style={styles.badgeIcon}><Icons.Chart /></div>
                <div>Case Monitoring</div>
              </div>
            </div>

            <div style={{ ...styles.floatingBadge, bottom: '20%', right: '10%', animation: 'float 9s ease-in-out infinite' }}>
              <div style={styles.glassBadge}>
                <div style={styles.badgeIcon}><Icons.Security /></div>
                <div>Anonymous Feedback Supported</div>
              </div>
            </div>

            <div style={styles.identityContent}>
              <div style={styles.logoBadgeBig}>
                {systemLogo ? (
                  <img src={resolveMediaUrl(systemLogo)} alt="Logo" style={{ height: '40px' }} />
                ) : (
                  <Icons.Shield />
                )}
              </div>
              <h1 style={styles.identityHeadline}>Your Voice Matters</h1>
              <p style={styles.identitySubtext}>
                Submit feedback, track responses, and stay connected through the GlobalCore Feedback System.
              </p>
            </div>
          </div>
        )}

        <div style={styles.authSection}>
          {isMobile && (
            <div style={styles.mobileHeader}>
              <div style={styles.logoBadgeSmall}>
                {systemLogo ? (
                  <img src={resolveMediaUrl(systemLogo)} alt="Logo" style={{ height: '32px' }} />
                ) : (
                  <Icons.Shield />
                )}
              </div>
              <h1 style={styles.mobileHeadline}>Your Voice Matters</h1>
              <p style={styles.mobileSubtext}>Submit feedback and track responses in real-time.</p>
            </div>
          )}

          <div style={styles.formCard}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>{isSignUp ? "Create an Account" : "Welcome Back"}</h2>
              <p style={styles.cardDesc}>
                {isSignUp ? "Join our secure platform today." : "Access your secure partner portal."}
              </p>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              {isSignUp && (
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Username</label>
                  <input className="login-input" type="text" placeholder="e.g. john_doe"
                    style={styles.input} value={username} onChange={e => setUsername(e.target.value)} required />
                </div>
              )}

              <div style={styles.inputGroup}>
                <label style={styles.label}>{isSignUp ? "Email Address" : "Email or Username"}</label>
                <input className="login-input" type={isSignUp ? "email" : "text"} placeholder="e.g. name@organization.com"
                  style={styles.input} value={email} onChange={e => setEmail(e.target.value)} required />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input className="login-input" type={showPassword ? "text" : "password"} placeholder="••••••••"
                    style={{ ...styles.input, paddingRight: '44px' }} value={password} onChange={e => setPassword(e.target.value)} required />
                  <div onClick={() => setShowPassword(!showPassword)} style={styles.passwordToggle}>
                    {showPassword ? <Icons.Eye /> : <Icons.EyeOff />}
                  </div>
                </div>
              </div>

              {isSignUp && (
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Confirm Password</label>
                  <div style={{ relative: 'relative' }}>
                    <input className="login-input" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••"
                      style={{ ...styles.input, paddingRight: '44px' }} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                    <div onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.passwordToggle}>
                      {showConfirmPassword ? <Icons.Eye /> : <Icons.EyeOff />}
                    </div>
                  </div>
                </div>
              )}

              {!isSignUp && (
                <div style={styles.optionsRow}>
                  <label style={styles.rememberMe}>
                    <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} style={styles.checkbox} />
                    Remember me
                  </label>
                  <a href="/forgot" style={styles.forgotLink}>Forgot password?</a>
                </div>
              )}

              {error && (
                <div key={attempt} style={styles.errorBanner}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" className="login-btn" disabled={isLoading} style={styles.submitBtn}>
                {isLoading ? "Authenticating..." : isSignUp ? "Create My Account →" : "Login to Portal →"}
              </button>
            </form>

            <div style={styles.footer}>
              <p style={styles.footerText}>
                {isSignUp ? "Already have an account?" : "New to GlobalCore?"}
                <button onClick={() => setIsSignUp(!isSignUp)} style={styles.footerToggle}>
                  {isSignUp ? "Log In" : "Sign Up"}
                </button>
              </p>
              {!isSignUp && (
                <a href="/admin" style={styles.adminAccess}>
                  🛡️ System Administration
                </a>
              )}
            </div>
          </div>
          
          <div style={styles.copyright}>
            © 2026 GlobalCore Intelligence • Secure Channel
          </div>
        </div>
      </div>

      <CustomModal
        isOpen={dialog.isOpen}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
        confirmText={dialog.confirmText}
        onConfirm={dialog.onConfirm}
        onCancel={() => setDialog({ isOpen: false })}
      />
    </div>
  );
};

const getStyles = (isMobile) => ({
  container: {
    minHeight: "100vh",
    width: "100vw",
    background: isMobile ? "linear-gradient(135deg, #F8FAFC 0%, #EEF2F6 100%)" : "#FFFFFF",
    fontFamily: '"Inter", sans-serif',
    overflow: "hidden",
  },
  mainWrapper: {
    display: "flex",
    width: "100%",
    minHeight: "100vh",
  },
  identitySection: {
    flex: 1.1,
    background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px",
    overflow: "hidden",
  },
  gradientSphere1: { position: "absolute", top: "10%", left: "10%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)", animation: "glow 10s infinite", pointerEvents: "none" },
  gradientSphere2: { position: "absolute", bottom: "10%", right: "10%", width: "450px", height: "450px", background: "radial-gradient(circle, rgba(30,58,138,0.2) 0%, transparent 70%)", animation: "glow 12s infinite alternate", pointerEvents: "none" },
  gridOverlay: { position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "40px 40px", opacity: 0.5 },
  networkLines: { position: "absolute", inset: 0, zIndex: 1 },
  floatingBadge: { position: "absolute", zIndex: 5, pointerEvents: "none" },
  glassBadge: { padding: "12px 20px", background: "rgba(255,255,255,0.03)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "100px", color: "white", fontSize: "12px", fontWeight: "600", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" },
  badgeIcon: { display: "flex", alignItems: "center", justifyContent: "center" },
  identityContent: { maxWidth: "500px", position: "relative", zIndex: 10, textAlign: "left", animation: "fadeIn 1s ease-out both" },
  logoBadgeBig: { width: "72px", height: "72px", borderRadius: "20px", background: "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 15px 35px rgba(37,99,235,0.3)", marginBottom: "32px", animation: "glow 4s infinite" },
  identityHeadline: { color: "white", fontSize: "56px", fontWeight: "900", letterSpacing: "-0.04em", lineHeight: "1", marginBottom: "20px" },
  identitySubtext: { color: "#94A3B8", fontSize: "18px", lineHeight: "1.6", fontWeight: "400", maxWidth: "440px" },
  
  authSection: {
    flex: isMobile ? 1 : "0 0 560px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: isMobile ? "24px" : "60px",
    background: isMobile ? "transparent" : "#F8FAFC",
    position: "relative",
    zIndex: 20,
  },
  mobileHeader: { textAlign: "center", marginBottom: "32px", animation: "fadeIn 0.8s ease-out both" },
  logoBadgeSmall: { width: "52px", height: "52px", borderRadius: "14px", background: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 8px 20px rgba(37,99,235,0.2)" },
  mobileHeadline: { fontSize: "24px", fontWeight: "900", color: "#0F172A", marginBottom: "8px", letterSpacing: "-0.02em" },
  mobileSubtext: { fontSize: "14px", color: "#64748B", maxWidth: "260px", margin: "0 auto" },
  
  formCard: { width: "100%", maxWidth: "420px", background: "white", padding: isMobile ? "28px 24px" : "48px 44px", borderRadius: "32px", boxShadow: isMobile ? "0 10px 40px rgba(0,0,0,0.05)" : "0 20px 60px -12px rgba(0,0,0,0.08)", border: "1px solid #E2E8F0", animation: "fadeUp 0.6s ease-out both" },
  cardHeader: { textAlign: "center", marginBottom: "32px" },
  cardTitle: { fontSize: "26px", fontWeight: "900", color: "#0F172A", marginBottom: "8px", letterSpacing: "-0.02em" },
  cardDesc: { color: "#64748B", fontSize: "14px", fontWeight: "500" },
  form: { display: "flex", flexDirection: "column", gap: "22px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontSize: "12px", fontWeight: "800", color: "#1E293B", textTransform: "uppercase", letterSpacing: "0.05em", paddingLeft: "4px" },
  input: { width: "100%", padding: "14px 18px", borderRadius: "14px", border: "2px solid #F1F5F9", background: "#F8FAFC", fontSize: "15px", fontWeight: "500", transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)", outline: "none" },
  passwordToggle: { position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#94A3B8", display: "flex", padding: "4px" },
  optionsRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "-4px" },
  rememberMe: { display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#64748B", fontWeight: "600", cursor: "pointer" },
  checkbox: { width: "16px", height: "16px", accentColor: "#2563EB" },
  forgotLink: { fontSize: "13px", color: "#2563EB", fontWeight: "800", textDecoration: "none" },
  submitBtn: { width: "100%", padding: "16px", background: "#2563EB", color: "white", borderRadius: "14px", border: "none", fontSize: "16px", fontWeight: "900", cursor: "pointer", boxShadow: "0 10px 25px -5px rgba(37,99,235,0.4)", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", marginTop: "8px" },
  errorBanner: { display: "flex", alignItems: "center", gap: "10px", color: "#B91C1C", fontSize: "13px", fontWeight: "700", animation: "shake 0.4s both", background: "rgba(185,28,28,0.05)", padding: "12px", borderRadius: "10px", border: "1px solid rgba(185,28,28,0.1)" },
  footer: { marginTop: "32px", textAlign: "center", borderTop: "1px solid #F1F5F9", paddingTop: "24px" },
  footerText: { fontSize: "14px", color: "#64748B", fontWeight: "600" },
  footerToggle: { background: "none", border: "none", color: "#2563EB", fontWeight: "900", marginLeft: "8px", cursor: "pointer", textDecoration: "underline" },
  adminAccess: { display: "block", marginTop: "20px", fontSize: "11px", fontWeight: "800", color: "#CBD5E1", textTransform: "uppercase", letterSpacing: "0.1em", textDecoration: "none", transition: "color 0.2s" },
  copyright: { position: "absolute", bottom: "30px", fontSize: "10px", fontWeight: "800", color: isMobile ? "#94A3B8" : "#CBD5E1", letterSpacing: "0.1em", textTransform: "uppercase" }
});

export default LoginPage;