import React, { useState, useEffect } from "react";
import { getUsers, createFeedback } from "../services/api"; // Import both

const Icons = {
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f2a56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
};

const IndividualFeedback = ({ currentUser, onBack }) => { // Add currentUser
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [type, setType] = useState("praise");
  
  // New States for API
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // User Search States
  const [allUsers, setAllUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecipientId, setSelectedRecipientId] = useState(null);

  // Fetch all users when screen loads
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await getUsers();
        setAllUsers(users);
      } catch (err) {
        console.error("Failed to load users for search", err);
      }
    };
    fetchUsers();
  }, []);

  // Filter users based on search (exclude the person currently logged in)
  const filteredUsers = allUsers.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
    u.id !== currentUser.id
  );

  const handleSubmit = async () => {
    if (!selectedRecipientId) return alert("Please select a colleague!");
    if (!message.trim()) return alert("Please enter a message!");

    setIsSubmitting(true);
    try {
      await createFeedback({
        title: `Individual Feedback: ${type.toUpperCase()}`,
        description: message,
        is_anonymous: isAnonymous,
        sender_id: currentUser.id,
        recipient_user_id: selectedRecipientId,
        category_id: 1 // ADD THIS LINE! (Assuming 1 is a valid category ID)
      });
      alert("Feedback Submitted Successfully!");
      onBack();
    } catch (error) {
      console.error("Error submitting individual feedback:", error);
      alert("Error submitting. Check console.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={onBack} style={styles.iconBtn}><Icons.Back /></button>
        <h1 style={styles.headerTitle}>Individual Feedback</h1>
        <div style={{ width: 24 }}></div>
      </header>

      <main style={styles.mainScroll}>
        <p style={styles.description}>Recognize a colleague's hard work or provide constructive, private feedback.</p>

        <div style={styles.formGroup}>
          <label style={styles.label}>Who is this for?</label>
          <div style={{position: 'relative'}}>
            <div style={styles.searchBox}>
              <Icons.Search />
              <input 
                type="text" 
                placeholder="Search employee name..." 
                style={styles.searchInput}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedRecipientId(null); // Reset selection if they type again
                }} 
              />
            </div>
            
            {/* Auto-complete Dropdown */}
            {searchQuery && !selectedRecipientId && (
              <div style={styles.dropdown}>
                {filteredUsers.length > 0 ? filteredUsers.map(user => (
                  <div 
                    key={user.id} 
                    style={styles.dropdownItem}
                    onClick={() => {
                      setSearchQuery(user.name);
                      setSelectedRecipientId(user.id);
                    }}
                  >
                    {user.name} ({user.email})
                  </div>
                )) : (
                  <div style={styles.dropdownItem}>No users found.</div>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Feedback Type</label>
          <div style={styles.tabRow}>
            <button style={type === "praise" ? styles.tabActive : styles.tabInactive} onClick={() => setType("praise")}>Praise / Recognition</button>
            <button style={type === "constructive" ? styles.tabActive : styles.tabInactive} onClick={() => setType("constructive")}>Constructive</button>
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Your Message</label>
          <textarea 
            placeholder="Describe what they did well, or how they can improve..." 
            style={styles.textArea}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          ></textarea>
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

        <button 
          style={{...styles.submitBtn, opacity: isSubmitting ? 0.7 : 1}} 
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Feedback"}
        </button>
      </main>
    </div>
  );
};

// --- STYLES FOR ALL FORMS ---
const styles = {
  // ... keep your existing styles ...
  
  // ADD THESE TWO NEW STYLES for the dropdown:
  dropdown: { position: 'absolute', top: '56px', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', zIndex: 10, maxHeight: '150px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
  dropdownItem: { padding: '12px 16px', fontSize: '14px', color: '#1E293B', cursor: 'pointer', borderBottom: '1px solid #F1F5F9' },
  
  // I included your other existing styles here for reference:
  container: { height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', backgroundColor: '#F8FAFC' },
  headerTitle: { fontSize: '18px', fontWeight: 'bold', color: '#1f2a56', margin: 0 },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' },
  mainScroll: { flex: 1, overflowY: 'auto', padding: '0 20px 40px 20px' },
  description: { fontSize: '14px', color: '#64748B', lineHeight: '1.5', marginBottom: '24px' },
  formGroup: { marginBottom: '20px' },
  label: { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#64748B', marginBottom: '8px', paddingLeft: '4px' },
  searchBox: { display: 'flex', alignItems: 'center', backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '0 16px', height: '52px' },
  searchInput: { flex: 1, border: 'none', outline: 'none', fontSize: '15px', marginLeft: '12px', color: '#0F172A', backgroundColor: 'transparent' },
  selectBox: { width: '100%', padding: '16px', backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '14px', fontSize: '15px', color: '#0F172A', appearance: 'none', outline: 'none' },
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
  submitBtn: { width: '100%', padding: '16px', backgroundColor: '#1f2a56', color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(31, 42, 86, 0.2)' }
};

export default IndividualFeedback;