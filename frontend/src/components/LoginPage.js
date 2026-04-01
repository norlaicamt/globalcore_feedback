import React, { useState } from "react";
import axios from "axios";
import CustomModal from "./CustomModal";

const LoginPage = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dialogState, setDialogState] = useState({ isOpen: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isSignUp) {
        await axios.post(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/users/`, {
          name: nameInput,
          email: emailInput,
          is_active: true,
        });
        setDialogState({
          isOpen: true,
          type: "alert",
          title: "Account Created! 🎉",
          message: "You can now log in with your credentials.",
          confirmText: "Awesome",
          onConfirm: () => { setDialogState({ isOpen: false }); setIsSignUp(false); },
        });
      } else {
        const res = await axios.post(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/login?email=${emailInput}`);
        localStorage.setItem("user", JSON.stringify(res.data));
        onLoginSuccess(res.data);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || "Action failed. Check your connection.";
      setDialogState({
        isOpen: true,
        type: "alert",
        title: "Authentication Error",
        message: typeof msg === "object" ? JSON.stringify(msg) : msg,
        confirmText: "Try Again",
        isDestructive: true,
        onConfirm: () => setDialogState({ isOpen: false }),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .login-input:focus { outline: none; border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }
        .login-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(37,99,235,0.35) !important; }
        .login-btn:active { transform: translateY(0); }
        .toggle-link:hover { color: #2563EB; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Background blobs */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />

      <div style={styles.wrapper}>
        {/* Brand logo */}
        <div style={styles.brandSection}>
          <div style={styles.logoSquare}>
            <svg style={{ width: "26px", height: "26px" }} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
            </svg>
          </div>
          <p style={styles.brandTitle}>GLOBALCORE FEEDBACK</p>
        </div>

        {/* Card */}
        <div style={styles.card}>
          <h1 style={styles.cardHeader}>{isSignUp ? "Create Account" : "Welcome Back"}</h1>
          <p style={styles.cardSub}>
            {isSignUp ? "Join the GlobalCore community" : "Sign in to manage your feedback insights"}
          </p>

          <form onSubmit={handleSubmit} style={styles.form}>
            {isSignUp && (
              <div style={styles.inputGroup}>
                <label style={styles.label}>Full Name</label>
                <input
                  className="login-input"
                  type="text"
                  placeholder="Juan Dela Cruz"
                  style={styles.input}
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  required
                />
              </div>
            )}

            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <input
                className="login-input"
                type="email"
                placeholder="name@company.com"
                style={styles.input}
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <label style={styles.label}>Password</label>
                {!isSignUp && (
                  <a href="#" style={styles.forgotLink}>Forgot password?</a>
                )}
              </div>
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
        </div>
      </div>

      <CustomModal
        isOpen={dialogState.isOpen}
        title={dialogState.title}
        message={dialogState.message}
        type={dialogState.type}
        confirmText={dialogState.confirmText}
        isDestructive={dialogState.isDestructive}
        onConfirm={dialogState.onConfirm}
        onCancel={dialogState.onCancel}
      />
    </div>
  );
};

const styles = {
  container: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #F8FAFC 0%, #EEF2F6 100%)",
    padding: "20px",
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    boxSizing: "border-box",
    overflow: "hidden",
  },
  blob1: {
    position: "absolute", top: "-120px", right: "-120px",
    width: "400px", height: "400px", borderRadius: "50%",
    background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  blob2: {
    position: "absolute", bottom: "-100px", left: "-100px",
    width: "350px", height: "350px", borderRadius: "50%",
    background: "radial-gradient(circle, rgba(31,42,86,0.08) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  wrapper: {
    display: "flex", flexDirection: "column", alignItems: "center",
    width: "100%", maxWidth: "400px",
    animation: "fadeUp 0.4s ease-out both",
  },
  brandSection: { display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "24px" },
  logoSquare: {
    width: "56px", height: "56px", borderRadius: "16px",
    background: "linear-gradient(135deg, #1f2a56 0%, #2563EB 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 8px 24px rgba(37,99,235,0.3)",
  },
  brandTitle: {
    marginTop: "12px", fontSize: "10px", fontWeight: "800",
    letterSpacing: "0.18em", textTransform: "uppercase",
    background: "linear-gradient(45deg, #1f2a56, #3B82F6)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  card: {
    width: "100%", backgroundColor: "white",
    padding: "32px 28px", borderRadius: "24px",
    border: "1px solid rgba(226,232,240,0.8)",
    boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
  },
  cardHeader: { fontSize: "20px", fontWeight: "800", color: "#0F172A", marginBottom: "6px", textAlign: "center" },
  cardSub: { color: "#64748B", textAlign: "center", marginBottom: "24px", fontSize: "13px", lineHeight: "1.5" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  inputGroup: { textAlign: "left" },
  label: { display: "block", fontSize: "12px", fontWeight: "700", color: "#1E293B", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" },
  input: {
    width: "100%", padding: "11px 14px", fontSize: "14px",
    border: "1.5px solid #E2E8F0", borderRadius: "10px",
    boxSizing: "border-box", color: "#1E293B",
    backgroundColor: "#FAFAFA",
    transition: "border-color 0.2s, box-shadow 0.2s",
    fontFamily: "inherit",
  },
  forgotLink: { fontSize: "12px", fontWeight: "600", color: "#3B82F6", textDecoration: "none" },
  loginBtn: {
    width: "100%", marginTop: "4px",
    background: "linear-gradient(135deg, #1f2a56 0%, #2563EB 100%)",
    color: "white", padding: "13px",
    borderRadius: "10px", fontWeight: "700",
    border: "none", fontSize: "14px",
    boxShadow: "0 4px 12px rgba(37,99,235,0.25)",
    transition: "transform 0.2s, box-shadow 0.2s",
    fontFamily: "inherit",
  },
  divider: { display: "flex", alignItems: "center", gap: "10px", margin: "20px 0 4px 0" },
  dividerLine: { flex: 1, height: "1px", backgroundColor: "#E2E8F0" },
  dividerText: { fontSize: "12px", color: "#94A3B8", fontWeight: "600" },
  footerText: { textAlign: "center", fontSize: "13px", color: "#64748B", margin: 0 },
  footerLink: {
    color: "#2563EB", fontWeight: "700", textDecoration: "none",
    fontSize: "13px", background: "none", border: "none",
    cursor: "pointer", padding: 0, fontFamily: "inherit",
    transition: "color 0.2s",
  },
};

export default LoginPage;