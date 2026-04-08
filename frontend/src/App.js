import React, { useState, useEffect } from "react";
import LoginPage from "./components/LoginPage";
import FeedbackHub from "./components/FeedbackHub";
import UserOnboarding from "./components/UserOnboarding";
import AdminLogin from "./components/admin/AdminLogin";
import AdminHub from "./components/admin/AdminHub";
import { TerminologyProvider } from "./context/TerminologyContext";

const isAdminPath = window.location.pathname.startsWith("/admin");

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("currentUser");
    try { return saved ? JSON.parse(saved) : null; } catch { return null; }
  });
  const [adminUser, setAdminUser] = useState(() => {
    const saved = localStorage.getItem("adminUser");
    try { return saved ? JSON.parse(saved) : null; } catch { return null; }
  });
  const [isInitializing, setIsInitializing] = useState(true);
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const handleLocationChange = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handleLocationChange);
    
    // Restoration delay to avoid flickering/wrong redirects
    const timer = setTimeout(() => setIsInitializing(false), 150);
    
    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      clearTimeout(timer);
    };
  }, []);

  const isAdminPath = path.startsWith("/admin");

  if (isInitializing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F8FAFC', fontFamily: '"Inter", sans-serif', color: '#64748B' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: '3.5px solid #E2E8F0', borderTopColor: '#1f2a56', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontSize: '13px', fontWeight: '700', color: '#1f2a56', letterSpacing: '0.05em' }}>VERIFYING SESSION</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setCurrentUser(null);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("adminUser");
    setAdminUser(null);
  };

  // ── ADMIN PATH ──
  if (isAdminPath) {
    return (
      <TerminologyProvider>
        <div className="App">
          {adminUser ? (
            <AdminHub adminUser={adminUser} onLogout={handleAdminLogout} />
          ) : (
            <AdminLogin onLoginSuccess={(admin) => {
              localStorage.setItem("adminUser", JSON.stringify(admin));
              setAdminUser(admin);
            }} />
          )}
        </div>
      </TerminologyProvider>
    );
  }

  // ── USER PATH ──
  return (
    <TerminologyProvider>
      <div className="App">
        {currentUser ? (
          currentUser.onboarding_completed ? (
            <FeedbackHub currentUser={currentUser} onLogout={handleLogout} />
          ) : (
            <UserOnboarding
              currentUser={currentUser}
              onComplete={(updatedUser) => setCurrentUser(updatedUser)}
            />
          )
        ) : (
          <LoginPage
            onLoginSuccess={(user) => {
              localStorage.setItem("currentUser", JSON.stringify(user));
              setCurrentUser(user);
            }}
          />
        )}
      </div>
    </TerminologyProvider>
  );
}

export default App;