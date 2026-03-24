import React, { useState, useEffect } from "react";
// IMPORT YOUR AXIOS FUNCTIONS HERE:
import { getDepartments, createFeedback } from "../services/api"; // Adjust the path if needed

const Icons = {
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f2a56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
  ChevronDown: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
};

const DepartmentFeedback = ({ currentUser, onBack }) => { 
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form State
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");

  // 1. Fetch departments when the screen loads using YOUR API
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const data = await getDepartments();
        setDepartments(data);
      } catch (err) {
        console.error("Failed to load departments", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDepts();
  }, []);

  // 2. Submit the feedback using YOUR API
  const handleSubmit = async () => {
    if (!selectedDeptId || !subject || !details) {
      alert("Please fill out all fields!");
      return;
    }

    try {
      // Must match your FastAPI `FeedbackCreate` Schema
      const feedbackPayload = {
        title: subject,
        description: details,
        category_id: 1, // Assuming 1 is a valid category ID in your DB
        sender_id: currentUser.id || 1, // Fallback to 1 for testing
        recipient_dept_id: parseInt(selectedDeptId),
      };

      await createFeedback(feedbackPayload);
      
      alert("Report Submitted Successfully!");
      onBack(); // Return to dashboard
    } catch (error) {
      console.error(error);
      alert("Error submitting report. Is your FastAPI server running?");
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={onBack} style={styles.iconBtn}><Icons.Back /></button>
        <h1 style={styles.headerTitle}>Department Report</h1>
        <div style={{ width: 24 }}></div>
      </header>

      <main style={styles.mainScroll}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Target Department</label>
          <div style={{ position: 'relative' }}>
            <select 
              style={styles.selectBox}
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              disabled={isLoading}
            >
              <option value="" disabled>
                {isLoading ? "Loading..." : "Select a department..."}
              </option>
              
              {/* LOOP THROUGH REAL POSTGRESQL DATA */}
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
              
            </select>
            <div style={styles.selectArrow}><Icons.ChevronDown /></div>
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Subject</label>
          <input 
            type="text" 
            placeholder="Brief summary..." 
            style={styles.inputField} 
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Details</label>
          <textarea 
            placeholder="Provide detail..." 
            style={styles.textArea}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          ></textarea>
        </div>

        <button style={styles.submitBtn} onClick={handleSubmit}>Submit Report</button>
      </main>
    </div>
  );
};

const styles = {
  container: { height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', backgroundColor: '#F8FAFC' },
  headerTitle: { fontSize: '18px', fontWeight: 'bold', color: '#1f2a56', margin: 0 },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' },
  mainScroll: { flex: 1, overflowY: 'auto', padding: '0 20px 40px 20px' },
  description: { fontSize: '14px', color: '#64748B', lineHeight: '1.5', marginBottom: '24px' },
  formGroup: { marginBottom: '20px' },
  label: { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#64748B', marginBottom: '8px', paddingLeft: '4px' },
  selectBox: { width: '100%', padding: '16px', backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '14px', fontSize: '15px', color: '#0F172A', appearance: 'none', outline: 'none', boxSizing: 'border-box' },
  selectArrow: { position: 'absolute', right: '16px', top: '18px', pointerEvents: 'none' },
  inputField: { width: '100%', padding: '16px', backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '14px', fontSize: '15px', color: '#0F172A', boxSizing: 'border-box', outline: 'none' },
  textArea: { width: '100%', padding: '16px', backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '14px', fontSize: '15px', color: '#0F172A', minHeight: '120px', resize: 'vertical', boxSizing: 'border-box', outline: 'none' },
  tabRow: { display: 'flex', gap: '8px', backgroundColor: '#F1F5F9', padding: '6px', borderRadius: '14px' },
  tabActive: { flex: 1, padding: '10px 0', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold', backgroundColor: '#1f2a56', color: 'white', cursor: 'pointer' },
  tabInactive: { flex: 1, padding: '10px 0', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold', backgroundColor: 'transparent', color: '#64748B', cursor: 'pointer' },
  submitBtn: { width: '100%', padding: '16px', backgroundColor: '#1f2a56', color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(31, 42, 86, 0.2)', marginTop: '10px' }
};

export default DepartmentFeedback;