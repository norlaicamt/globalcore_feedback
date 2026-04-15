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
import GeneralFeedback from "./components/GeneralFeedback";

import { STORAGE_KEYS } from "./utils/storage";
import { logoutUser, logoutAdmin } from "./utils/auth";

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    // 1. Migration Logic
    const oldUser = localStorage.getItem("currentUser");
    if (oldUser && !localStorage.getItem(STORAGE_KEYS.USER_CURRENT)) {
      localStorage.setItem(STORAGE_KEYS.USER_CURRENT, oldUser);
      localStorage.removeItem("currentUser");
      const oldToken = localStorage.getItem("token");
      if (oldToken) {
        try {
          const userObj = JSON.parse(oldUser);
          userObj.token = oldToken;
          localStorage.setItem(STORAGE_KEYS.USER_CURRENT, JSON.stringify(userObj));
          localStorage.removeItem("token");
        } catch (e) {}
      }
    }
    const saved = localStorage.getItem(STORAGE_KEYS.USER_CURRENT);
    try { return saved ? JSON.parse(saved) : null; } catch { return null; }
  });
  
  const [adminUser, setAdminUser] = useState(() => {
    const oldAdmin = localStorage.getItem("adminUser");
    if (oldAdmin && !localStorage.getItem(STORAGE_KEYS.ADMIN_CURRENT)) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_CURRENT, oldAdmin);
      localStorage.removeItem("adminUser");
    }
    const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_CURRENT);
    try { return saved ? JSON.parse(saved) : null; } catch { return null; }
  });

  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitializing(false), 150);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
    logoutUser();
  };

  const handleAdminLogout = () => {
    setAdminUser(null);
    logoutAdmin();
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
                  localStorage.setItem(STORAGE_KEYS.ADMIN_CURRENT, JSON.stringify(admin));
                  setAdminUser(admin);
                }} />
              )
            } />

            {/* AUTH ROUTES */}
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* PREVIEW ROUTE — no auth required, used by Form Designer live preview */}
            <Route path="/preview" element={
              <div style={{ minHeight: '100vh', background: '#F1F5F9', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px' }}>
                <div style={{ width: '100%', maxWidth: '520px' }}>
                  <div style={{ background: '#FEF3C7', borderRadius: '12px', padding: '10px 16px', marginBottom: '16px', fontSize: '13px', fontWeight: '600', color: '#92400E', textAlign: 'center' }}>
                    🔍 Live Preview Mode — Changes from the Form Designer update automatically
                  </div>
                  <GeneralFeedback
                    currentUser={{ id: 0, name: 'Preview User', email: 'preview@admin.com', role: 'user', is_anonymous: false }}
                    onBack={() => window.close()}
                    onSuccess={() => {}}
                  />
                </div>
              </div>
            } />

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
                      localStorage.setItem(STORAGE_KEYS.USER_CURRENT, JSON.stringify(updatedUser));
                      setCurrentUser(updatedUser);
                    }}
                  />
                )
              ) : (
                <LoginPage
                  onLoginSuccess={(user) => {
                    localStorage.setItem(STORAGE_KEYS.USER_CURRENT, JSON.stringify(user));
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