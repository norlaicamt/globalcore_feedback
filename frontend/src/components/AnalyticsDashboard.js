import React from "react";

// --- PROFESSIONAL SVGs (Navy/Grey Palette) ---
const Icons = {
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f2a56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
  Download: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1f2a56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>,
  Share: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1f2a56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>,
  TrendingUp: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>,
  TrendingDownGood: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>,
  Alert: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>,
  ChevronDown: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
};

const AnalyticsDashboard = ({ onBack }) => {
  return (
    <div style={styles.container}>
      {/* HEADER */}
      <header style={styles.header}>
        <button onClick={onBack} style={styles.iconBtn}>
          <Icons.Back />
        </button>
        <h1 style={styles.headerTitle}>Analytics</h1>
        <div style={styles.headerActions}>
          <button style={styles.iconBtn}><Icons.Download /></button>
          <button style={styles.iconBtn}><Icons.Share /></button>
        </div>
      </header>

      <main style={styles.mainScroll}>
        
        {/* FILTERS */}
        <div style={styles.filterContainer}>
          <button style={styles.filterPill}>Last 30 Days <Icons.ChevronDown /></button>
          <button style={styles.filterPill}>All Departments <Icons.ChevronDown /></button>
          <button style={styles.filterPill}>Global <Icons.ChevronDown /></button>
        </div>

        {/* METRICS GRID */}
        <div style={styles.metricGrid}>
          {/* Total Feedback - Full Width */}
          <div style={{ ...styles.card, gridColumn: 'span 2' }}>
            <span style={styles.cardLabel}>TOTAL FEEDBACK VOLUME</span>
            <div style={styles.metricRow}>
              <span style={styles.metricValueLarge}>1,284</span>
              <div style={styles.growthBadge}>
                <Icons.TrendingUp />
                <span>+12.5%</span>
              </div>
            </div>
          </div>
          
          {/* Sentiment */}
          <div style={styles.card}>
            <span style={styles.cardLabel}>SENTIMENT SCORE</span>
            <span style={styles.metricValue}>82%</span>
            <div style={styles.trendText}>
              <Icons.TrendingUp /> <span>5.2% vs Last Wk</span>
            </div>
          </div>

          {/* Resolution Time */}
          <div style={styles.card}>
            <span style={styles.cardLabel}>AVG. RES. TIME</span>
            <span style={styles.metricValue}>4.2h</span>
            <div style={styles.trendText}>
              <Icons.TrendingDownGood /> <span>0.8h vs Last Wk</span>
            </div>
          </div>
        </div>

        {/* VOLUME & RESOLUTION CHART PLACEHOLDER */}
        <div style={styles.card}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>VOLUME & RESOLUTION TRENDS</h3>
          </div>
          <div style={styles.chartPlaceholder}>
             {/* Abstract minimalist SVG line chart for professional look */}
             <svg width="100%" height="100" viewBox="0 0 100 40" preserveAspectRatio="none">
                <path d="M0 35 L 20 25 L 40 28 L 60 15 L 80 20 L 100 5" fill="none" stroke="#1f2a56" strokeWidth="2" strokeLinejoin="round" />
                <path d="M0 38 L 20 30 L 40 32 L 60 25 L 80 28 L 100 18" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeLinejoin="round" strokeDasharray="4 4" />
             </svg>
             <div style={styles.chartLegend}>
                <span style={styles.legendItem}><div style={{...styles.legendDot, backgroundColor: '#1f2a56'}}/> Volume</span>
                <span style={styles.legendItem}><div style={{...styles.legendDot, backgroundColor: '#CBD5E1'}}/> Resolution Time</span>
             </div>
          </div>
        </div>

        {/* CATEGORY SHARE TRENDS */}
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>CATEGORY SHARE</h3>
          
          <div style={styles.shareBlock}>
            <div style={styles.shareRow}>
              <span style={styles.shareLabel}>Customer Service</span>
              <span style={styles.shareValue}>38%</span>
            </div>
            <div style={styles.progressBase}><div style={{...styles.progressFill, width: '38%'}}></div></div>
          </div>

          <div style={styles.shareBlock}>
            <div style={styles.shareRow}>
              <span style={styles.shareLabel}>Pricing & Billing</span>
              <span style={styles.shareValue}>25%</span>
            </div>
            <div style={styles.progressBase}><div style={{...styles.progressFill, width: '25%'}}></div></div>
          </div>

          <div style={styles.shareBlock}>
            <div style={styles.shareRow}>
              <span style={styles.shareLabel}>Product Quality</span>
              <span style={styles.shareValue}>22%</span>
            </div>
            <div style={styles.progressBase}><div style={{...styles.progressFill, width: '22%'}}></div></div>
          </div>
        </div>

        {/* PRIORITY ACTIONS */}
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>PRIORITY ACTIONS</h3>
          
          <div style={styles.actionItem}>
            <div style={styles.actionIconBox}>
              <Icons.Alert />
            </div>
            <div style={styles.actionTextContent}>
              <p style={styles.actionTitle}>Delivery Speed</p>
              <p style={styles.actionSub}>14% negative sentiment increase detected.</p>
            </div>
            <span style={styles.criticalTag}>CRITICAL</span>
          </div>

          <div style={styles.actionItem}>
            <div style={{...styles.actionIconBox, backgroundColor: '#F1F5F9'}}>
              <div style={{width: 8, height: 8, backgroundColor: '#1f2a56', borderRadius: '50%'}} />
            </div>
            <div style={styles.actionTextContent}>
              <p style={styles.actionTitle}>App Performance</p>
              <p style={styles.actionSub}>Multiple reports of checkouts timing out.</p>
            </div>
            <span style={styles.reviewTag}>REVIEW</span>
          </div>
        </div>

        <div style={{height: 20}}></div> {/* Bottom spacing */}
      </main>
    </div>
  );
};

// --- STYLES ---
const styles = {
  container: { height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', backgroundColor: '#F8FAFC' },
  headerTitle: { fontSize: '18px', fontWeight: 'bold', color: '#1f2a56', margin: 0 },
  headerActions: { display: 'flex', gap: '16px' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' },
  
  mainScroll: { flex: 1, overflowY: 'auto', padding: '0 20px 20px 20px' },

  // Filters
  filterContainer: { display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '16px', msOverflowStyle: 'none', scrollbarWidth: 'none' },
  filterPill: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '20px', border: '1px solid #E2E8F0', backgroundColor: 'white', fontSize: '13px', fontWeight: '600', color: '#1f2a56', whiteSpace: 'nowrap', cursor: 'pointer' },

  // Grid & Cards
  metricGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' },
  card: { backgroundColor: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0', marginBottom: '16px', display: 'flex', flexDirection: 'column' },
  cardLabel: { fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' },
  
  // Metric Typography
  metricRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' },
  metricValueLarge: { fontSize: '36px', fontWeight: '800', color: '#0F172A', lineHeight: '1' },
  metricValue: { fontSize: '28px', fontWeight: '800', color: '#0F172A', lineHeight: '1', marginTop: '4px', marginBottom: '8px' },
  
  growthBadge: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 'bold', color: '#10B981', backgroundColor: '#ECFDF5', padding: '6px 12px', borderRadius: '20px' },
  trendText: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#10B981', fontWeight: '600' },

  // Section Headers
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  sectionTitle: { fontSize: '12px', fontWeight: 'bold', color: '#64748B', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' },

  // Charts
  chartPlaceholder: { height: '140px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' },
  chartLegend: { display: 'flex', gap: '16px', fontSize: '12px', color: '#64748B', marginTop: '16px', fontWeight: '600' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '6px' },
  legendDot: { width: '8px', height: '8px', borderRadius: '50%' },

  // Progress Bars
  shareBlock: { marginBottom: '16px' },
  shareRow: { display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '600', color: '#1E293B', marginBottom: '8px' },
  shareLabel: { color: '#475569' },
  shareValue: { color: '#1f2a56', fontWeight: 'bold' },
  progressBase: { height: '8px', backgroundColor: '#F1F5F9', borderRadius: '10px' },
  progressFill: { height: '100%', backgroundColor: '#1f2a56', borderRadius: '10px' },

  // Action Items
  actionItem: { display: 'flex', alignItems: 'center', backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '14px', marginBottom: '10px', border: '1px solid #F1F5F9' },
  actionIconBox: { width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' },
  actionTextContent: { flex: 1, paddingRight: '12px' },
  actionTitle: { margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold', color: '#0F172A' },
  actionSub: { margin: 0, fontSize: '12px', color: '#64748B', lineHeight: '1.4' },
  criticalTag: { backgroundColor: '#FEF2F2', color: '#EF4444', padding: '6px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px' },
  reviewTag: { backgroundColor: '#E2E8F0', color: '#475569', padding: '6px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px' }
};

export default AnalyticsDashboard;