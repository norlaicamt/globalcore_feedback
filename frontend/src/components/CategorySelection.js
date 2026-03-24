import React from "react";

const CategorySelection = ({ onBack, onSelect }) => {
  const categories = [
    { id: 'department', title: 'Department', desc: 'Feedback regarding a specific team or division.', icon: '🏢' },
    { id: 'individual', title: 'Individual', desc: 'Recognize a coworker or suggest personal improvements.', icon: '👤' },
    { id: 'general', title: 'General', desc: 'General office culture, facility, or company-wide ideas.', icon: '💬' }
  ];

  return (
    <div style={styles.container}>
      <button onClick={onBack} style={styles.backBtn}>←</button>
      <h1 style={styles.title}>What would you like to provide feedback on?</h1>
      <p style={styles.subTitle}>Select a category to help us direct your thoughts to the right place.</p>
      <div style={styles.list}>
        {categories.map(cat => (
          <div key={cat.id} style={styles.card} onClick={() => onSelect(cat.id)}>
            <div style={styles.iconBox}>{cat.icon}</div>
            <div style={styles.cardContent}>
              <h3 style={styles.cardTitle}>{cat.title}</h3>
              <p style={styles.cardDesc}>{cat.desc}</p>
            </div>
            <span style={styles.arrow}>›</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '20px' },
  backBtn: { background: 'none', border: 'none', fontSize: '24px', color: '#1D6C8A', marginBottom: '20px', cursor: 'pointer' },
  title: { fontSize: '22px', fontWeight: 'bold', color: '#0f172a', marginBottom: '10px' },
  subTitle: { fontSize: '14px', color: '#64748b', marginBottom: '30px' },
  list: { display: 'flex', flexDirection: 'column', gap: '15px' },
  card: { display: 'flex', alignItems: 'center', padding: '20px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', cursor: 'pointer' },
  iconBox: { width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginRight: '15px' },
  cardContent: { flex: 1 },
  cardTitle: { margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#1e293b' },
  cardDesc: { margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' },
  arrow: { fontSize: '20px', color: '#e2e8f0' }
};

export default CategorySelection;