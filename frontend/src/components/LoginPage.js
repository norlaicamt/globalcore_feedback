import React, { useState } from "react";
import axios from "axios";
import { login } from "../services/api";
import CustomModal from "./CustomModal";

const LoginPage = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [dialog, setDialog] = useState({ isOpen: false });

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
        const newUser = { name: email.split("@")[0], email, password };
        await axios.post(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/users/`, newUser);
        setDialog({
          isOpen: true,
          type: "alert",
          title: "Registration Successful",
          message: "Your account has been created. You can now sign in.",
          confirmText: "Sign In Now",
          onConfirm: () => {
            setDialog({ isOpen: false });
            setIsSignUp(false);
          },
        });
      } else {
        const user = await login(email, password);
        onLoginSuccess(user);
      }
    } catch (err) {
      setDialog({
        isOpen: true,
        type: "alert",
        title: "Authentication Failed",
        message: err.response?.data?.detail || "Invalid email or password. Please try again.",
        confirmText: "Try Again",
        isDestructive: true,
        onConfirm: () => setDialog({ isOpen: false }),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formCard}>
        <div style={styles.cardHeader}>
          <div style={styles.logoBadge}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h1 style={styles.cardTitle}>{isSignUp ? "Create Account" : "Welcome Back"}</h1>
          <p style={styles.cardSubtitle}>
            {isSignUp ? "Join the GlobalCore community today." : "Please enter your professional credentials."}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email or Username</label>
            <input
              className="login-input"
              type="text"
              placeholder="name@organization.com or username"
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              className="login-input"
              type="password"
              placeholder="Enter your password"
              style={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {isSignUp && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Confirm Password</label>
              <input
                className="login-input"
                type="password"
                placeholder="Re-enter your password"
                style={styles.input}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          {!isSignUp && (
            <div style={{ textAlign: "right", marginTop: "-12px", marginBottom: "8px" }}>
              <a href="/forgot-password" style={styles.forgotLink}>Forgot access key?</a>
            </div>
          )}

          <button
            type="submit"
            className="login-btn"
            disabled={isLoading}
            style={{
              ...styles.loginBtn,
              opacity: isLoading ? 0.75 : 1,
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
          >
            {isLoading ? "Please wait…" : isSignUp ? "Create Account" : "Sign In →"}
          </button>
        </form>

        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <span style={styles.dividerLine} />
        </div>

        <p style={styles.footerText}>
          {isSignUp ? "Already have an account?" : "New here?"}{" "}
          <button
            className="toggle-link"
            onClick={() => setIsSignUp(!isSignUp)}
            style={styles.footerLink}
          >
            {isSignUp ? "Sign in instead" : "Request access / Sign Up"}
          </button>
        </p>

        {!isSignUp && (
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #F1F5F9', textAlign: 'center' }}>
            <a href="/admin" style={{ fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', textDecoration: 'none' }}>
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
    background: "linear-gradient(135deg, #F8FAFC 0%, #EEF2F6 100%)",
    fontFamily: "'Inter', sans-serif",
    padding: "20px",
  },
  formCard: {
    width: "100%",
    maxWidth: "420px",
    background: "white",
    padding: "48px",
    borderRadius: "32px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.06)",
    border: "1px solid #E2E8F0",
  },
  cardHeader: {
    marginBottom: "40px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  logoBadge: {
    width: "56px",
    height: "56px",
    background: "var(--primary-color)",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "20px",
    boxShadow: "0 8px 16px rgba(var(--primary-rgb), 0.15)",
  },
  cardTitle: {
    fontSize: "28px",
    fontWeight: "900",
    color: "#1E293B",
    margin: "0 0 8px 0",
    letterSpacing: "-1px",
  },
  cardSubtitle: {
    fontSize: "14px",
    color: "#64748B",
    margin: 0,
    fontWeight: "500",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#1E293B",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    paddingLeft: "4px",
  },
  input: {
    width: "100%",
    padding: "16px 20px",
    background: "#F8FAFC",
    border: "1.5px solid #E2E8F0",
    borderRadius: "16px",
    fontSize: "15px",
    color: "#1E293B",
    outline: "none",
    transition: "all 0.2s ease",
    boxSizing: "border-box",
  },
  forgotLink: {
    fontSize: "13px",
    color: "var(--primary-color)",
    textDecoration: "none",
    fontWeight: "700",
  },
  loginBtn: {
    width: "100%",
    padding: "18px",
    background: "var(--primary-color)",
    color: "white",
    border: "none",
    borderRadius: "18px",
    fontSize: "16px",
    fontWeight: "800",
    cursor: "pointer",
    boxShadow: "0 10px 25px rgba(var(--primary-rgb), 0.15)",
    transition: "transform 0.2s",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    margin: "32px 0",
    gap: "16px",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "#E2E8F0",
  },
  dividerText: {
    fontSize: "12px",
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
};

export default LoginPage;