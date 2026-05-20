import React, { useState } from "react";
import { adminLogin } from "../../services/adminApi";

const AdminLogin = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [tickerIndex, setTickerIndex] = useState(0);

  const tickerItems = [
    "System Load: 12% • Monitoring Active",
    "Real-time Feedback Sync Operational",
    "Workflow Automation Engine: Standby",
    "Security Protocol: Level 4 Encryption Active"
  ];

  React.useEffect(() => {
    if (error) setError(null);
  }, [email, password]);

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % tickerItems.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const Icons = {
    Eye: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
    EyeOff: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>,
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const admin = await adminLogin(email.trim(), password.trim());
      onLoginSuccess(admin);
    } catch (err) {
      setError(err.response?.data?.detail || "Admin account verification failed.");
      setAttempt(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const isMobile = windowWidth <= 1024; // Increased threshold for branding visibility
  const styles = React.useMemo(() => getStyles(isMobile), [isMobile]);

  return (
    <div style={styles.container}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .adm-input:focus { outline: none; border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }
        .adm-btn:hover { transform: translateY(-1px); box-shadow: 0 12px 24px rgba(37,99,235,0.4) !important; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes floatSlow { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(8px, -18px); } }
        @keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.2); } }
        @keyframes tickerSlide { 0% { opacity: 0; transform: translateY(10px); } 10% { opacity: 1; transform: translateY(0); } 90% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-10px); } }
        @keyframes gridMove { 0% { background-position: 0 0; } 100% { background-position: 60px 60px; } }
        @keyframes dash { to { stroke-dashoffset: 0; } }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}</style>
      
      <div style={styles.mainWrapper}>
        {/* Left Section: Immersive Command Center */}
        {!isMobile && (
          <div style={styles.brandingSection}>
            {/* Background Grid & Map Visualization */}
            <div style={styles.gridOverlay} />
            
            {/* Animated World/Grid Map Background */}
            <div style={styles.mapContainer}>
              <svg width="100%" height="100%" viewBox="0 0 800 600" style={{ position: 'absolute' }}>
                {/* Connection Lines (Workflows) */}
                <path d="M100,100 L300,150 L500,100 L700,200" stroke="rgba(59,130,246,0.2)" strokeWidth="1" fill="none" />
                <path d="M50,400 L250,450 L450,380 L750,500" stroke="rgba(59,130,246,0.15)" strokeWidth="1" fill="none" />
                
                {/* Glowing Flow Nodes */}
                <circle cx="100" cy="100" r="2" fill="#3B82F6"><animate attributeName="opacity" values="0.2;1;0.2" dur="3s" repeatCount="indefinite" /></circle>
                <circle cx="300" cy="150" r="2" fill="#3B82F6"><animate attributeName="opacity" values="0.2;1;0.2" dur="4s" repeatCount="indefinite" /></circle>
                <circle cx="500" cy="100" r="2" fill="#3B82F6"><animate attributeName="opacity" values="0.2;1;0.2" dur="5s" repeatCount="indefinite" /></circle>
                
                {/* Animated Dash Lines */}
                <path d="M200,50 Q400,200 600,50" stroke="#3B82F6" strokeWidth="0.5" fill="none" strokeDasharray="5,15">
                  <animate attributeName="stroke-dashoffset" from="100" to="0" dur="15s" repeatCount="indefinite" />
                </path>
              </svg>
            </div>

            {/* Glowing Workflow Lines (Real-time Feel) */}
            <div style={styles.workflowLines}>
              <svg width="100%" height="100%">
                <defs>
                  <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="transparent" />
                    <stop offset="50%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                </defs>
                <rect x="0" y="20%" width="100%" height="1" fill="url(#glow)" opacity="0.3">
                  <animate attributeName="x" from="-100%" to="100%" dur="8s" repeatCount="indefinite" />
                </rect>
                <rect x="0" y="60%" width="100%" height="1" fill="url(#glow)" opacity="0.2">
                  <animate attributeName="x" from="-100%" to="100%" dur="12s" repeatCount="indefinite" />
                </rect>
              </svg>
            </div>

            {/* Floating Analytics Cards (Glassmorphism) */}
            <div style={{ ...styles.floatingCard, top: '15%', right: '12%', animation: 'float 7s ease-in-out infinite' }}>
              <div style={styles.cardGlass}>
                <div style={styles.glassHeader}>ANALYTICS ENGINE</div>
                <div style={styles.glassValue}>98.2%</div>
                <div style={styles.glassLabel}>Efficiency Rating</div>
              </div>
            </div>
            
            <div style={{ ...styles.floatingCard, bottom: '25%', right: '18%', animation: 'floatSlow 9s ease-in-out infinite' }}>
              <div style={styles.cardGlass}>
                <div style={styles.glassHeader}>NETWORK NODES</div>
                <div style={styles.glassValue}>Active</div>
                <div style={styles.glassLabel}>Operational Status</div>
              </div>
            </div>

            <div style={styles.brandingContent}>
              <div style={styles.logoBadgeBig}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                </svg>
              </div>

              <h1 style={styles.mainHeroTitle}>Command Center</h1>
              <p style={styles.mainHeroSub}>
                Centralized feedback intelligence for faster case handling, workflow coordination, and real-time operational monitoring.
              </p>
              
              <div style={styles.featureGrid}>
                {[
                  "Smart Case Tracking",
                  "Real-Time Feedback Sync",
                  "Workflow Automation",
                  "Secure Administrative Access"
                ].map((feature, i) => (
                  <div key={i} style={styles.featureItem}>
                    <div style={styles.featureDot} />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {/* Live Ticker */}
              <div style={styles.tickerContainer}>
                <div key={tickerIndex} style={styles.tickerItemText}>
                  <span style={styles.tickerPrefix}>LIVE ACTIVITY:</span> {tickerItems[tickerIndex]}
                </div>
              </div>

              <div style={styles.visionBadge}>
                <span>Powered by GlobalCore Intelligence</span>
              </div>
            </div>

            {/* Subtle Moving Particles */}
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                top: `${Math.random() * 80 + 10}%`,
                left: `${Math.random() * 80 + 10}%`,
                width: '3px',
                height: '3px',
                borderRadius: '50%',
                background: '#3B82F6',
                boxShadow: '0 0 10px #3B82F6',
                animation: `pulse ${Math.random() * 3 + 3}s infinite ${Math.random() * 2}s`
              }} />
            ))}
          </div>
        )}

        {/* Right Section: Login Form */}
        <div style={styles.loginSection}>
          <div style={styles.formWrapper}>
            {isMobile && (
              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <div style={{ ...styles.logoBadgeBig, margin: '0 auto', width: '56px', height: '56px', borderRadius: '18px' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: '800', marginTop: '16px', color: '#0F172A', letterSpacing: '-0.02em' }}>GlobalCore Admin</h2>
              </div>
            )}

            <div style={styles.card}>
              <h1 style={styles.cardHeader}>Admin Entrance</h1>
              <p style={styles.cardSub}>GlobalCore Integrated Feedback Ecosystem</p>

              <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Administrative Email</label>
                  <input className="adm-input" type="email" placeholder="admin@globalcore.com"
                    style={styles.input} value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Access Credentials</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      className="adm-input" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••••••"
                      style={{ ...styles.input, paddingRight: '46px' }} 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      required 
                    />
                    <div 
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        cursor: 'pointer',
                        color: '#94A3B8',
                        padding: '4px',
                        display: 'flex',
                        transition: 'color 0.2s'
                      }}
                    >
                      {showPassword ? <Icons.Eye /> : <Icons.EyeOff />}
                    </div>
                  </div>
                </div>

                <button type="submit" className="adm-btn" disabled={isLoading} style={{
                  ...styles.loginBtn, opacity: isLoading ? 0.75 : 1, cursor: isLoading ? "not-allowed" : "pointer"
                }}>
                  {isLoading ? "Validating Credentials…" : "Authenticate & Enter →"}
                </button>

                {error && (
                  <div key={attempt} style={styles.errorContainer}>
                    <div style={styles.errorBanner}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        <span style={{ fontWeight: '900', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Access Denied</span>
                      </div>
                      <span style={{ fontWeight: '600', fontSize: '12px', opacity: 0.9 }}>{error}</span>
                    </div>
                  </div>
                )}
              </form>
            </div>
            
            <div style={styles.footerBranding}>
              <span>SECURED BY GLOBALCORE INTELLIGENCE SYSTEMS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const getStyles = (isMobile) => ({
  container: { 
    minHeight: "100vh", 
    background: "#FFFFFF", 
    fontFamily: '"Inter", sans-serif',
    overflow: "hidden"
  },
  mainWrapper: {
    display: "flex",
    width: "100%",
    minHeight: "100vh",
  },
  brandingSection: {
    flex: 1.2,
    background: "#080C14",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px",
    position: "relative",
    overflow: "hidden",
  },
  gridOverlay: {
    position: "absolute",
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(59,130,246,0.05) 1px, transparent 1px)
    `,
    backgroundSize: "60px 60px",
    animation: "gridMove 30s linear infinite",
    opacity: 0.8,
  },
  mapContainer: {
    position: "absolute",
    inset: 0,
    zIndex: 1,
    pointerEvents: "none",
    opacity: 0.4,
  },
  workflowLines: {
    position: "absolute",
    inset: 0,
    zIndex: 2,
    pointerEvents: "none",
  },
  floatingCard: {
    position: "absolute",
    zIndex: 4,
    pointerEvents: "none",
  },
  cardGlass: {
    padding: "20px 24px",
    background: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(16px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "24px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    minWidth: "150px",
  },
  glassHeader: { fontSize: "9px", color: "rgba(59, 130, 246, 0.8)", fontWeight: "900", letterSpacing: "1px" },
  glassValue: { fontSize: "22px", color: "white", fontWeight: "900", letterSpacing: "-0.5px" },
  glassLabel: { fontSize: "11px", color: "rgba(148, 163, 184, 0.8)", fontWeight: "500" },
  
  brandingContent: {
    maxWidth: "540px",
    position: "relative",
    zIndex: 10,
    animation: "fadeIn 1.2s cubic-bezier(0.16, 1, 0.3, 1) both",
    textAlign: "left",
  },
  logoBadgeBig: {
    width: "80px",
    height: "80px",
    borderRadius: "24px",
    background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 20px 40px rgba(37,99,235,0.4), inset 0 0 20px rgba(255,255,255,0.2)",
    marginBottom: "40px",
  },
  mainHeroTitle: {
    color: "white",
    fontSize: "64px",
    fontWeight: "900",
    letterSpacing: "-0.04em",
    lineHeight: "0.95",
    marginBottom: "28px",
  },
  mainHeroSub: {
    color: "#94A3B8",
    fontSize: "20px",
    lineHeight: "1.5",
    marginBottom: "44px",
    fontWeight: "400",
    maxWidth: "500px",
  },
  featureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "20px",
    marginBottom: "56px",
  },
  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    color: "#E2E8F0",
    fontSize: "14px",
    fontWeight: "600",
    letterSpacing: "-0.2px",
  },
  featureDot: { width: "6px", height: "6px", borderRadius: "50%", background: "#3B82F6", boxShadow: "0 0 8px #3B82F6" },
  
  tickerContainer: {
    marginBottom: "48px",
    background: "rgba(30, 41, 59, 0.4)",
    backdropFilter: "blur(4px)",
    borderRadius: "12px",
    padding: "10px 18px",
    borderLeft: "4px solid #3B82F6",
    maxWidth: "420px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
  },
  tickerItemText: {
    color: "#60A5FA",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "0.5px",
    animation: "tickerSlide 4s infinite",
    display: "flex",
    gap: "8px",
  },
  tickerPrefix: { color: "rgba(255,255,255,0.4)", fontWeight: "900" },
  
  visionBadge: {
    display: "inline-flex",
    color: "#475569",
    fontSize: "11px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.25em",
    opacity: 0.6,
  },
  loginSection: {
    flex: "0 0 580px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: isMobile ? "24px" : "80px",
    backgroundColor: "#F8FAFC",
    position: "relative",
    zIndex: 100,
  },
  formWrapper: {
    width: "100%",
    maxWidth: "420px",
    animation: "fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both",
  },
  card: { 
    width: "100%", 
    backgroundColor: "white", 
    padding: isMobile ? "32px 24px" : "50px 45px", 
    borderRadius: "40px", 
    boxShadow: "0 20px 60px -10px rgba(0,0,0,0.08)",
    border: "1px solid rgba(226,232,240,0.8)"
  },
  cardHeader: { 
    fontSize: "28px", 
    fontWeight: "900", 
    color: "#0F172A", 
    marginBottom: "8px",
    textAlign: "center",
    letterSpacing: "-0.5px"
  },
  cardSub: { 
    color: "#64748B", 
    textAlign: "center", 
    marginBottom: "40px", 
    fontSize: "14px",
    fontWeight: "500"
  },
  form: { display: "flex", flexDirection: "column", gap: "24px" },
  inputGroup: { textAlign: "left" },
  label: { display: "block", fontSize: "11px", fontWeight: "800", color: "#1E293B", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "1px" },
  input: { width: "100%", padding: "16px 20px", fontSize: "16px", background: "#F1F5F9", border: "2px solid transparent", borderRadius: "18px", outline: "none", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", fontWeight: "500", color: "#1E293B" },
  loginBtn: { 
    width: "100%", 
    background: "#2563EB", 
    color: "white", 
    padding: "18px", 
    borderRadius: "18px", 
    fontWeight: "900", 
    border: "none", 
    fontSize: "16px",
    boxShadow: "0 15px 35px -5px rgba(37,99,235,0.4)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    marginTop: "12px",
    letterSpacing: "0.2px"
  },
  errorContainer: {
    animation: "shake 0.4s cubic-bezier(.36,.07,.19,.97) both",
    marginTop: "20px",
  },
  errorBanner: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    color: "#B91C1C",
    textAlign: "center",
  },
  footerBranding: {
    marginTop: "48px",
    textAlign: "center",
    fontSize: "10px",
    fontWeight: "900",
    color: "#CBD5E1",
    letterSpacing: "0.3em",
  }
});

export default AdminLogin;
