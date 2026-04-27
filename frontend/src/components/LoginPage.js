import React, { useState } from "react";
import axios from "axios";
import { login } from "../services/api";
import CustomModal from "./CustomModal";
import { useTerminology } from "../context/TerminologyContext";

const LoginPage = ({ onLoginSuccess }) => {
  const { systemName, systemLogo } = useTerminology();
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

  // Responsive state for padding/width adjustments
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
      setDialog({
        isOpen: true,
        type: "alert",
        title: "Validation Error",
        message: "Passwords do not match. Please re-enter.",
        confirmText: "Close",
        isDestructive: true,
        onConfirm: () => setDialog({ isOpen: false }),
      });
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
        const newUser = { 
          name: username, 
          username: username,
          email, 
          password 
        };
        await axios.post(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/users/`, newUser);
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
        if (rememberMe) {
          localStorage.setItem("remembered_user", email);
        } else {
          localStorage.removeItem("remembered_user");
        }
        onLoginSuccess(user);
      }
    } catch (err) {
      setError(err.response?.data?.detail || (isSignUp ? "Account creation failed. Please try again." : "Invalid email or password. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  const Icons = {
    Eye: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
    EyeOff: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>,
  };

  const isMobile = windowWidth < 480;

  return (
    <div style={styles.container}>
      <div style={{ ...styles.formCard, padding: isMobile ? '32px 24px' : '48px' }}>
        {/* Card Header - Centered for branding */}
        <div style={styles.cardHeader}>
          <div style={systemLogo ? { marginBottom: '20px', display: 'flex', justifyContent: 'center', width: '100%' } : styles.logoBadge}>
            {systemLogo ? (
              <img src={systemLogo} alt="Logo" style={{ height: '52px', maxWidth: '100%', objectFit: 'contain', display: 'block' }} />
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            )}
          </div>
          <h2 style={styles.cardSubtitle}>{systemName}</h2>
          <h1 style={styles.cardTitle}>{isSignUp ? "Create an Account" : "Partner Portal Login"}</h1>
          <p style={styles.cardDescription}>
            {isSignUp ? "Join our secure feedback network." : "Please enter your credentials to access the system."}
          </p>
        </div>

        {/* Form Content - Left-aligned for professional readability */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {isSignUp && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Username</label>
              <input
                className="login-input"
                type="text"
                placeholder="e.g. john_doe"
                style={styles.input}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>{isSignUp ? "Email Address" : "Email or Username"}</label>
            <input
              className="login-input"
              type={isSignUp ? "email" : "text"}
              placeholder={isSignUp ? "e.g. name@organization.com" : "e.g. name@organization.com"}
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="login-input"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                style={{ ...styles.input, paddingRight: '44px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div 
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#94A3B8', display: 'flex' }}
              >
                {showPassword ? <Icons.Eye /> : <Icons.EyeOff />}
              </div>
            </div>
          </div>

          {isSignUp && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="login-input"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  style={{ ...styles.input, paddingRight: '44px' }}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <div 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#94A3B8', display: 'flex' }}
                >
                  {showConfirmPassword ? <Icons.Eye /> : <Icons.EyeOff />}
                </div>
              </div>
            </div>
          )}

          {!isSignUp && (
            <div style={styles.optionsRow}>
              <label style={styles.rememberMe}>
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)} 
                  style={styles.checkbox}
                />
                Remember me
              </label>
              <a href="/forgot-password" style={styles.forgotLink}>Forgot password?</a>
            </div>
          )}

          {error && (
            <div style={styles.errorBanner}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="login-btn"
            disabled={isLoading}
            style={{
              ...styles.loginBtn,
              opacity: isLoading ? 0.8 : 1,
              transform: isLoading ? 'none' : undefined,
            }}
          >
            {isLoading ? "Logging in..." : isSignUp ? "Create Account" : "Log In"}
          </button>
        </form>

        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <span style={styles.dividerLine} />
        </div>

        <p style={styles.footerText}>
          {isSignUp ? "Already have an account?" : "No account yet?"}{" "}
          <button
            className="toggle-link"
            onClick={() => setIsSignUp(!isSignUp)}
            style={styles.footerLink}
          >
            {isSignUp ? "Log in instead" : "Sign Up here"}
          </button>
        </p>

        {!isSignUp && (
          <div style={styles.adminFooter}>
            <a href="/admin" style={styles.adminLink}>
               🛡️ System Administration
            </a>
          </div>
        )}
      </div>

      <CustomModal
        isOpen={dialog.isOpen}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
        confirmText={dialog.confirmText}
        isDestructive={dialog.isDestructive}
        onConfirm={dialog.onConfirm}
        onCancel={() => setDialog({ isOpen: false })}
      />
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    width: "100vw",
    background: "linear-gradient(to bottom, #F8FAFC, #F1F5F9)",
    padding: "20px",
  },
  formCard: {
    width: "100%",
    maxWidth: "440px",
    background: "#FFFFFF",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.06), 0 4px 6px rgba(0,0,0,0.02)",
    border: "1px solid #E2E8F0",
    transition: "all 0.3s ease",
  },
  cardHeader: {
    marginBottom: "32px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  logoBadge: {
    width: "52px",
    height: "52px",
    background: "var(--primary-color)",
    borderRadius: "12px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "16px",
  },
  cardSubtitle: {
    margin: 0,
    fontSize: '13px',
    color: 'var(--primary-color)',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '8px',
  },
  cardTitle: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#0F172A",
    margin: "0 0 8px 0",
    letterSpacing: "-0.02em",
  },
  cardDescription: {
    fontSize: "14px",
    color: "#64748B",
    margin: 0,
    fontWeight: "500",
    lineHeight: "1.5",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    textAlign: "left",
  },
  label: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    paddingLeft: "2px",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    background: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: "10px",
    fontSize: "15px",
    color: "#0F172A",
    outline: "none",
    transition: "all 0.2s ease",
    boxSizing: "border-box",
  },
  optionsRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "-8px",
  },
  rememberMe: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "#64748B",
    fontWeight: "600",
    cursor: "pointer",
  },
  checkbox: {
    width: "16px",
    height: "16px",
    accentColor: "var(--primary-color)",
    cursor: "pointer",
  },
  forgotLink: {
    fontSize: "13px",
    color: "var(--primary-color)",
    textDecoration: "none",
    fontWeight: "700",
  },
  errorBanner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    color: "#B91C1C",
    fontSize: "13px",
    fontWeight: "700",
    animation: "shake 0.4s cubic-bezier(.36,.07,.19,.97) both",
  },
  loginBtn: {
    width: "100%",
    padding: "14px",
    background: "var(--primary-color)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "800",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(var(--primary-rgb), 0.15)",
    transition: "all 0.2s ease",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    margin: "24px 0",
    gap: "12px",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "#F1F5F9",
  },
  dividerText: {
    fontSize: "11px",
    color: "#94A3B8",
    fontWeight: "800",
    textTransform: "uppercase",
  },
  footerText: {
    textAlign: "center",
    fontSize: "14px",
    color: "#64748B",
    margin: 0,
    fontWeight: "500",
  },
  footerLink: {
    background: "none",
    border: "none",
    color: "var(--primary-color)",
    padding: 0,
    fontSize: "14px",
    fontWeight: "800",
    cursor: "pointer",
    textDecoration: "underline",
  },
  adminFooter: {
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: '1px solid #F1F5F9',
    textAlign: 'center',
  },
  adminLink: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    textDecoration: 'none',
  },
};

export default LoginPage;