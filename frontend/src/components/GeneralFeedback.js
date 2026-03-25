import React, { useState, useEffect } from "react";
import { createFeedback, getCategories } from "../services/api"; // Added getCategories

const Icons = {
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f2a56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
  ChevronDown: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>,
  Star: ({ filled }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={filled ? "#FFB800" : "none"} stroke={filled ? "#FFB800" : "#CBD5E1"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  )
};

const GeneralFeedback = ({ currentUser, onBack, onSuccess }) => {
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [idea, setIdea] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(0);

  // New States for fetching real categories from the database
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  // Fetch categories when the screen loads
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
        if (data.length > 0) {
          setSelectedCategoryId(data[0].id); // Auto-select the first one
        }
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async () => {
    if (!idea.trim()) {
      alert("Please enter your idea first!");
      return;
    }
    if (!selectedCategoryId) {
      alert("Please select a category first!");
      return;
    }

    setIsSubmitting(true);
    try {
      // Find the name of the category for the title
      const selectedCat = categories.find(c => c.id === parseInt(selectedCategoryId));
      const catName = selectedCat ? selectedCat.name : "General";

      await createFeedback({
        title: `General Suggestion: ${catName}`,
        description: idea,
        is_anonymous: isAnonymous,
        allow_comments: allowComments,
        sender_id: currentUser.id,
        category_id: parseInt(selectedCategoryId),
        recipient_dept_id: 1, // Global
        rating: rating > 0 ? rating : null
      });
      onSuccess();
    } catch (error) {
      console.error("Error submitting general feedback:", error);
      const backendError = error.response?.data?.detail;
      const errorMessage = backendError ? JSON.stringify(backendError) : "Unknown error occurred.";
      alert(`FastAPI says: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={onBack} style={styles.iconBtn}><Icons.Back /></button>
        <h1 style={styles.headerTitle}>General Suggestion</h1>
        <div style={{ width: 24 }}></div>
      </header>

      <main style={styles.mainScroll}>
        <p style={styles.description}>Share ideas to improve company culture, events, or general workspace environments.</p>

        <div style={styles.formGroup}>
          <label style={styles.label}>Category</label>
          <div style={{ position: 'relative' }}>
            <select 
              style={styles.selectBox} 
              value={selectedCategoryId} 
              onChange={(e) => setSelectedCategoryId(e.target.value)}
            >
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))
              ) : (
                <option value="">Loading categories...</option>
              )}
            </select>
            <div style={styles.selectArrow}><Icons.ChevronDown /></div>
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Your Idea</label>
          <textarea 
            placeholder="What's on your mind? How can we make the company better?" 
            style={styles.textArea}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
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
            <p style={styles.itemSubtitle}>Your identity will be hidden from management.</p>
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

        <button 
          style={{...styles.submitBtn, opacity: isSubmitting ? 0.7 : 1}} 
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Idea"}
        </button>
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
  textArea: { width: '100%', padding: '16px', backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '14px', fontSize: '15px', color: '#0F172A', minHeight: '120px', resize: 'vertical', boxSizing: 'border-box', outline: 'none' },
  
  toggleRowContainer: { display: 'flex', alignItems: 'center', backgroundColor: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #F1F5F9', justifyContent: 'space-between', marginBottom: '30px' },
  itemText: { flex: 1, paddingRight: '16px' },
  itemTitle: { fontSize: '15px', fontWeight: '600', margin: '0 0 4px 0', transition: 'color 0.3s ease' },
  itemSubtitle: { fontSize: '12px', color: '#94A3B8', margin: 0, lineHeight: '1.4' },
  toggleBg: { width: '46px', height: '26px', borderRadius: '13px', display: 'flex', alignItems: 'center', cursor: 'pointer', transition: 'background-color 0.3s ease' },
  toggleCircle: { width: '22px', height: '22px', backgroundColor: 'white', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' },

  submitBtn: { width: '100%', padding: '16px', backgroundColor: '#1f2a56', color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(31, 42, 86, 0.2)' },
  starRow: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' },
  starBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 0 },
  ratingText: { marginLeft: '8px', fontSize: '14px', color: '#64748B', fontWeight: '600' }
};

export default GeneralFeedback;