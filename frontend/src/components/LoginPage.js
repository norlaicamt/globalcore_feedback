import React, { useState } from "react";
import axios from "axios";

const LoginPage = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [nameInput, setNameInput] = useState(""); 
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        // --- SIGN UP LOGIC ---
        await axios.post(`http://127.0.0.1:8000/users/`, {
          name: nameInput,
          email: emailInput,
          is_active: true
          // Note: Your current backend schema might not support 'password' yet
        });
        alert("Account created! You can now log in.");
        setIsSignUp(false);
      } else {
        // --- LOGIN LOGIC ---
        // Match the backend: Send email as a query parameter
        const res = await axios.post(`http://127.0.0.1:8000/login?email=${emailInput}`);
        
        localStorage.setItem("user", JSON.stringify(res.data));
        onLoginSuccess(res.data);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || "Action failed. Check your connection.";
      alert(typeof msg === 'object' ? JSON.stringify(msg) : msg);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.brandSection}>
        <div style={styles.logoSquare}>
          <svg style={{ width: '28px', height: '28px' }} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
          </svg>
        </div>
        <h2 style={styles.brandTitle}>Feedback Flow</h2>
      </div>

      <div style={styles.loginCard}>
        <h1 style={styles.cardHeader}>{isSignUp ? "Create Account" : "Welcome Back"}</h1>
        <p style={styles.cardSub}>
          {isSignUp ? "Join the Feedback Flow community" : "Log in to manage your customer insights"}
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {isSignUp && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Full Name</label>
              <input
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
            <label style={styles.label}>Email</label>
            <input
              type="email"
              placeholder="name@company.com"
              style={styles.input}
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={styles.label}>Password</label>
              {!isSignUp && <a href="#" style={styles.forgotLink}>Forgot?</a>}
            </div>
            <input
              type="password"
              placeholder="Enter password"
              style={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" style={styles.loginBtn}>
            {isSignUp ? "Create Account" : "Login →"}
          </button>
        </form>

        <p style={styles.footerText}>
          {isSignUp ? "Already have an account?" : "New here?"}{" "}
          <button 
            onClick={() => setIsSignUp(!isSignUp)} 
            style={{ ...styles.footerLink, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {isSignUp ? "Log in instead" : "Request access / Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f8fafc', padding: '20px', fontFamily: 'sans-serif', boxSizing: 'border-box' },
  brandSection: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' },
  logoSquare: { width: '56px', height: '56px', backgroundColor: '#1D6C8A', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  brandTitle: { color: '#1D6C8A', fontWeight: 'bold', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: '12px' },
  loginCard: { width: '100%', maxWidth: '380px', backgroundColor: 'white', padding: '30px', borderRadius: '32px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' },
  cardHeader: { fontSize: '22px', fontWeight: 'bold', color: '#0f172a', marginBottom: '4px', textAlign: 'center' },
  cardSub: { color: '#64748b', textAlign: 'center', marginBottom: '28px', fontSize: '13px' },
  form: { display: 'flex', flexDirection: 'column', gap: '18px' },
  inputGroup: { textAlign: 'left' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', outline: 'none', boxSizing: 'border-box' },
  forgotLink: { fontSize: '11px', fontWeight: 'bold', color: '#1D6C8A', textDecoration: 'none' },
  loginBtn: { width: '100%', backgroundColor: '#1D6C8A', color: 'white', padding: '14px', borderRadius: '10px', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '15px' },
  footerText: { marginTop: '28px', textAlign: 'center', fontSize: '13px', color: '#64748b' },
  footerLink: { color: '#1D6C8A', fontWeight: 'bold', textDecoration: 'none', fontSize: '13px' }
};

export default LoginPage;