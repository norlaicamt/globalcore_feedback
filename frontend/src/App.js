import React, { useState, useEffect } from "react";
import LoginPage from "./components/LoginPage";
import FeedbackHub from "./components/FeedbackHub";

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setCurrentUser(null);
  };

  return (
    <div className="App">
      {currentUser ? (
        <FeedbackHub currentUser={currentUser} onLogout={handleLogout} />
      ) : (
        <LoginPage 
        onLoginSuccess={(user) => {localStorage.setItem("user", JSON.stringify(user)); // Save it here!
          setCurrentUser(user);
        }} 
       />
      )}
    </div>
  );
}

export default App;