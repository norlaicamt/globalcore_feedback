import React, { useState, useEffect } from "react";
import axios from "axios";

// Components
import FeedbackList from "./components/FeedbackList";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import AddFeedbackForm from "./components/AddFeedbackForm";
import { getFeedbacks } from "./services/api"; 

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [emailInput, setEmailInput] = useState("");
  const [activeView, setActiveView] = useState("dashboard");
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadSystemData = async () => {
    setLoading(true);
    try {
      const data = await getFeedbacks();
      setFeedbacks(data || []);
    } catch (err) {
      console.error("Failed to load feedback:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && activeView === "feedback") {
      loadSystemData();
    }
  }, [activeView, currentUser]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`http://127.0.0.1:8000/login?email=${emailInput}`);
      setCurrentUser(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));
    } catch (err) {
      alert("User not found! Please check the email and try again.");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("user");
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
  }, []);

  // --- LOGIN PAGE UI ---
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 bg-opacity-95 p-4">
        <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-md border border-slate-100">
          {/* Header */}
          <div className="text-center mb-8">
             <div className="inline-block p-3 rounded-xl bg-blue-50 mb-3">
                <span className="text-2xl">🌐</span>
             </div>
             <h2 className="text-3xl font-black text-slate-900">
               Welcome Back
             </h2>
             <p className="text-slate-500 text-sm mt-1 font-medium">Global Core Feedback System</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Input */}
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1" htmlFor="email">
                Corporate Email
              </label>
              <input
                type="email"
                id="email"
                required
                placeholder="Enter your email"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50 focus:bg-white transition-all"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
              />
            </div>

            {/* Note: Password field added for UI consistency, though your backend currently uses Email-only lookup */}
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1" htmlFor="password">
                Password
              </label>
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50 focus:bg-white transition-all"
              />
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-blue-600 shadow-lg shadow-blue-900/20 transition-all active:scale-95"
            >
              Sign In to System
            </button>
          </form>

          {/* Extra Links */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center text-slate-500">
            <p className="text-sm font-medium">
              Don't have an account?{" "}
              <a href="#" className="text-blue-600 font-bold hover:underline">
                Contact Admin
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN DASHBOARD UI ---
  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800 text-xl font-black text-blue-400 uppercase tracking-tight">Global Core</div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveView("dashboard")} className={`w-full text-left p-3 rounded-xl transition-colors ${activeView === 'dashboard' ? 'bg-blue-600 shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800'}`}>📊 Overview</button>
          <button onClick={() => setActiveView("feedback")} className={`w-full text-left p-3 rounded-xl transition-colors ${activeView === 'feedback' ? 'bg-blue-600 shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800'}`}>💬 Feedback</button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header with Profile/Logout */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 capitalize">{activeView}</h2>
          
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900">{currentUser.name}</p>
              <button onClick={handleLogout} className="text-xs font-bold text-red-500 hover:text-red-700">Logout →</button>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
              {currentUser.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* Dynamic View Content */}
        <section className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto">
            {activeView === "dashboard" && <AnalyticsDashboard />}
            
            {activeView === "feedback" && (
              <div className="space-y-8">
                <AddFeedbackForm 
                  currentUser={currentUser} 
                  onFeedbackAdded={loadSystemData} 
                />
                <div className="pt-4">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Recent Reports</h3>
                  {loading ? (
                    <div className="animate-pulse space-y-4">
                      <div className="h-20 bg-slate-200 rounded-xl"></div>
                      <div className="h-20 bg-slate-200 rounded-xl"></div>
                    </div>
                  ) : (
                    <FeedbackList feedbacks={feedbacks} />
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;