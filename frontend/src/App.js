import React, { useState, useEffect } from "react";
import LoginPage from "./components/LoginPage";
import FeedbackHub from "./components/FeedbackHub";
import AdminLogin from "./components/admin/AdminLogin";
import AdminHub from "./components/admin/AdminHub";

const isAdminPath = window.location.pathname.startsWith("/admin");

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("user");
    try { return saved ? JSON.parse(saved) : null; } catch { return null; }
  });
  const [adminUser, setAdminUser] = useState(() => {
    const saved = localStorage.getItem("adminUser");
    try { return saved ? JSON.parse(saved) : null; } catch { return null; }
  });

  // Keep a watch on the path and make it reactive
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const handleLocationChange = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handleLocationChange);
    // Also listen for custom navigation if needed (optional but good)
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  const isAdminPath = path.startsWith("/admin");

  const handleLogout = () => {
    localStorage.removeItem("user");
    setCurrentUser(null);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("adminUser");
    setAdminUser(null);
  };

  // ── ADMIN PATH ──
  if (isAdminPath) {
    return (
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
    );
  }

  // ── USER PATH ──
  return (
    <div className="App">
      {currentUser ? (
        <FeedbackHub currentUser={currentUser} onLogout={handleLogout} />
      ) : (
        <LoginPage onLoginSuccess={(user) => {
          localStorage.setItem("user", JSON.stringify(user));
          setCurrentUser(user);
        }} />
      )}
    </div>
  );
}

export default App;