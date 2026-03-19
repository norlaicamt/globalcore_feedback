import React, { useState, useEffect } from "react";
import { createFeedback, getCategories, getDepartments } from "../services/api";

function AddFeedbackForm({ onFeedbackAdded, currentUser }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [deptId, setDeptId] = useState("");
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Fetch options for the dropdowns
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [catData, deptData] = await Promise.all([getCategories(), getDepartments()]);
        setCategories(catData);
        setDepartments(deptData);
        if (catData.length > 0) setCategoryId(catData[0].id);
        if (deptData.length > 0) setDeptId(deptData[0].id);
      } catch (err) { console.error("Error loading form options", err); }
    };
    loadOptions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newFeedback = { 
      title, 
      description, 
      category_id: parseInt(categoryId),
      recipient_dept_id: parseInt(deptId),
      sender_id: currentUser.id, // <--- AUTOMATICALLY ATTACHED
      status: "OPEN" 
    };

    try {
      await createFeedback(newFeedback);
      setTitle("");
      setDescription("");
      alert("Feedback submitted successfully!");
      onFeedbackAdded(); 
    } catch (err) {
      alert("Failed to submit feedback. Check console.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 max-w-2xl mx-auto">
      <div className="mb-6">
        <h3 className="text-xl font-black text-slate-900">Submit System Report</h3>
        <p className="text-sm text-slate-500">Logged in as: <span className="font-bold text-blue-600">{currentUser.name}</span></p>
      </div>
      
      <div className="space-y-5">
        <div>
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Issue Title</label>
          <input 
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none transition-all"
            placeholder="e.g., Server Latency in Manila Hub"
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            required 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Category</label>
            <select 
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white outline-none"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Target Department</label>
            <select 
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white outline-none"
              value={deptId}
              onChange={(e) => setDeptId(e.target.value)}
            >
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Detailed Description</label>
          <textarea 
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none transition-all h-32"
            placeholder="Please provide steps to reproduce the issue..." 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            required 
          />
        </div>

        <button type="submit" className="w-full bg-slate-900 hover:bg-blue-700 text-white font-bold py-4 rounded-lg transition-all shadow-lg shadow-blue-900/20 uppercase tracking-widest text-sm">
          Send Feedback
        </button>
      </div>
    </form>
  );
}

export default AddFeedbackForm;