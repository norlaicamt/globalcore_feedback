import React, { useState, useEffect } from "react";
// IMPORT YOUR AXIOS FUNCTIONS HERE:
import { getDepartments, createFeedback } from "../services/api"; // Adjust the path if needed

const Icons = {
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f2a56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
  ChevronDown: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>,
  Star: ({ filled }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={filled ? "#FFB800" : "none"} stroke={filled ? "#FFB800" : "#CBD5E1"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  )
};

const DepartmentFeedback = ({ currentUser, onBack, onSuccess }) => { 
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form State
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [rating, setRating] = useState(0);

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
  const handleSubmit = async (e) => {
  e.preventDefault();
  
  const feedbackPayload = {
    title: subject,
    description: details,
    category_id: 1, // 1 = Departmental
    recipient_dept_id: parseInt(selectedDeptId),
    sender_id: currentUser.id || 1, // CRITICAL: This must be a number
    is_anonymous: isAnonymous,
    allow_comments: allowComments,
    rating: rating > 0 ? rating : null
  };

  try {
    await createFeedback(feedbackPayload);
    // Success! Show popup
    onSuccess(); 
  } catch (err) {
    console.error("Submission failed", err);
    alert("Submission failed: " + (err.response?.data?.detail || err.message));
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

        <div style={styles.formGroup}>
          <label style={styles.label}>Rating</label>
          <div style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button 
                key={star} 
                style={styles.starBtn} 
                onClick={() => setRating(star)}
              >
                <Icons.Star filled={star <= rating} />
              </button>
            ))}
            {rating > 0 && <span style={styles.ratingText}>{rating}/5 Stars</span>}
          </div>
        </div>

        <div style={styles.toggleRowContainer}>
          <div style={styles.itemText}>
            <p style={{...styles.itemTitle, color: isAnonymous ? '#10B981' : '#1E293B'}}>Submit Anonymously</p>
            <p style={styles.itemSubtitle}>Hide your name from the recipient and their manager.</p>
          </div>
          <div style={{...styles.toggleBg, backgroundColor: isAnonymous ? '#10B981' : '#E2E8F0'}} onClick={() => setIsAnonymous(!isAnonymous)}>
            <div style={{...styles.toggleCircle, transform: isAnonymous ? 'translateX(20px)' : 'translateX(2px)'}} />
          </div>
        </div>

        <div style={styles.toggleRowContainer}>
          <div style={styles.itemText}>
            <p style={{...styles.itemTitle, color: allowComments ? '#10B981' : '#1E293B'}}>Allow Comments</p>
            <p style={styles.itemSubtitle}>Let others discuss and reply to your feedback.</p>
          </div>
          <div style={{...styles.toggleBg, backgroundColor: allowComments ? '#10B981' : '#E2E8F0'}} onClick={() => setAllowComments(!allowComments)}>
            <div style={{...styles.toggleCircle, transform: allowComments ? 'translateX(20px)' : 'translateX(2px)'}} />
          </div>
        </div>

        <button style={styles.submitBtn} onClick={handleSubmit}>Submit Report</button>
      </main>
    </div>
  );
};

const styles = {
  container: { height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
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
  toggleRowContainer: { display: 'flex', alignItems: 'center', backgroundColor: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #F1F5F9', justifyContent: 'space-between', marginBottom: '30px' },
  itemText: { flex: 1, paddingRight: '16px' },
  itemTitle: { fontSize: '15px', fontWeight: '600', margin: '0 0 4px 0', transition: 'color 0.3s ease' },
  itemSubtitle: { fontSize: '12px', color: '#94A3B8', margin: 0, lineHeight: '1.4' },
  toggleBg: { width: '46px', height: '26px', borderRadius: '13px', display: 'flex', alignItems: 'center', cursor: 'pointer', transition: 'background-color 0.3s ease' },
  toggleCircle: { width: '22px', height: '22px', backgroundColor: 'white', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' },
  submitBtn: { width: '100%', padding: '16px', backgroundColor: '#1f2a56', color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(31, 42, 86, 0.2)', marginTop: '10px' },
  starRow: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' },
  starBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 0 },
  ratingText: { marginLeft: '8px', fontSize: '14px', color: '#64748B', fontWeight: '600' }
};

export default DepartmentFeedback;