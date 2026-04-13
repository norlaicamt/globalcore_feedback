import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { TerminologyProvider } from "./context/TerminologyContext";
import LoginPage from "./components/LoginPage";
import FeedbackHub from "./components/FeedbackHub";
import UserOnboarding from "./components/UserOnboarding";
import AdminLogin from "./components/admin/AdminLogin";
import AdminHub from "./components/admin/AdminHub";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";

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

  useEffect(() => {
    const timer = setTimeout(() => setIsInitializing(false), 150);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setCurrentUser(null);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("adminUser");
    setAdminUser(null);
  };

  if (isInitializing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F8FAFC', fontFamily: '"Inter", sans-serif', color: '#64748B' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: '3.5px solid #E2E8F0', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary-color)', letterSpacing: '0.05em' }}>VERIFYING SESSION</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <TerminologyProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* ADMIN ROUTES */}
            <Route path="/admin/*" element={
              adminUser ? (
                <AdminHub adminUser={adminUser} onLogout={handleAdminLogout} />
              ) : (
                <AdminLogin onLoginSuccess={(admin) => {
                  localStorage.setItem("adminUser", JSON.stringify(admin));
                  setAdminUser(admin);
                }} />
              )
            } />

            {/* AUTH ROUTES */}
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* USER PORTAL */}
            <Route path="/" element={
              currentUser ? (
                currentUser.onboarding_completed ? (
                  <FeedbackHub currentUser={currentUser} onLogout={handleLogout} />
                ) : (
                  <UserOnboarding
                    currentUser={currentUser}
                    onBack={handleLogout}
                    onComplete={(updatedUser) => {
                      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
                      setCurrentUser(updatedUser);
                    }}
                  />
                )
              ) : (
                <LoginPage
                  onLoginSuccess={(user) => {
                    localStorage.setItem("currentUser", JSON.stringify(user));
                    setCurrentUser(user);
                  }}
                />
              )
            } />

            {/* CATCH-ALL REDIRECT */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </TerminologyProvider>
  );
}

export default App;