import React, { useState, useEffect } from "react";
import { adminGetBroadcastLogs } from "../../../services/adminApi";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const cleanSubject = (s) => (s || '').replace(/\[OFFICIAL\] .* - /, '');

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const formatTimeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  return formatDate(dateStr);
};

const getStatus = (log) => {
  if (!log) return { label: '—', color: '#94A3B8', bg: 'rgba(148,163,184,0.1)' };
  const diffMins = Math.floor((Date.now() - new Date(log.created_at).getTime()) / 60000);
  if (log.read_count === 0) {
    if (diffMins < 30) return { label: 'Awaiting activity', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' };
    return { label: 'No engagement', color: '#EF4444', bg: 'rgba(239,68,68,0.08)' };
  }
  const rate = (log.read_count / log.sent_to_count) * 100;
  if (rate < 30) return { label: 'Low engagement', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' };
  return { label: 'Active', color: '#10B981', bg: 'rgba(16,185,129,0.1)' };
};

const targetLabel = (tg) => {
  if (!tg || tg === 'all') return 'All Users & Admins';
  if (tg === 'staff') return 'Admins Only';
  return 'Users Only';
};

// ─── Mini icons ───────────────────────────────────────────────────────────────
const CheckIcon = () => (
  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const ChevronDownIcon = ({ open }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// ─── Mini Lifecycle Bar ───────────────────────────────────────────────────────
const MiniLifecycle = ({ step, theme }) => {
  const stages = [{ id: 1, label: 'Sent' }, { id: 2, label: 'Delivered' }, { id: 3, label: 'Viewed' }];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      {stages.map((s, idx) => (
        <React.Fragment key={s.id}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{
              width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0,
              background: step >= s.id ? '#10B981' : 'transparent',
              border: `2px solid ${step >= s.id ? '#10B981' : theme.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {step >= s.id && <CheckIcon />}
            </div>
            <span style={{ fontSize: '10px', fontWeight: step >= s.id ? '700' : '500', color: step >= s.id ? theme.text : theme.textMuted, whiteSpace: 'nowrap' }}>{s.label}</span>
          </div>
          {idx < stages.length - 1 && (
            <div style={{ width: '14px', height: '2px', background: step > s.id ? '#10B981' : theme.border, borderRadius: '2px', transition: '0.3s' }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// ─── Insight Card (KPI strip item) ───────────────────────────────────────────
const InsightCard = ({ label, value, color, hint, theme }) => (
  <div style={{
    background: theme.surface, borderRadius: '12px', border: `1px solid ${theme.border}`,
    padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '2px'
  }}>
    <p style={{ margin: 0, fontSize: '9px', fontWeight: '900', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
    <p style={{ margin: 0, fontSize: '20px', fontWeight: '900', color }}>{value}</p>
    {hint && <p style={{ margin: 0, fontSize: '9px', fontWeight: '600', color: theme.textMuted, lineHeight: 1.3 }}>{hint}</p>}
  </div>
);

// ─── Latest Dispatch compact card ────────────────────────────────────────────
const LatestDispatchCard = ({ log, theme }) => {
  const status = getStatus(log);
  const step = log ? (log.read_count > 0 ? 3 : 2) : 1;
  return (
    <div style={{
      background: theme.surface, borderRadius: '12px',
      border: `1px solid ${theme.border}`,
      borderLeft: `3px solid ${log ? status.color : 'var(--primary-color)'}`,
      padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px'
    }}>
      <p style={{ margin: 0, fontSize: '9px', fontWeight: '900', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Latest Dispatch</p>
      {log ? (
        <>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: theme.text, lineHeight: 1.3 }}>
            {cleanSubject(log.subject)}
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div>
              <p style={{ margin: 0, fontSize: '8px', fontWeight: '800', color: theme.textMuted, textTransform: 'uppercase' }}>Delivered</p>
              <p style={{ margin: '1px 0 0', fontSize: '16px', fontWeight: '900', color: theme.text }}>{log.sent_to_count}</p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '8px', fontWeight: '800', color: theme.textMuted, textTransform: 'uppercase' }}>Viewed</p>
              <p style={{ margin: '1px 0 0', fontSize: '16px', fontWeight: '900', color: theme.text }}>
                {log.read_count}
                <span style={{ fontSize: '9px', color: theme.textMuted, marginLeft: '3px' }}>({Math.round((log.read_count / log.sent_to_count) * 100) || 0}%)</span>
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: status.color, flexShrink: 0 }} />
            <span style={{ fontSize: '10px', fontWeight: '700', color: status.color }}>{status.label}</span>
          </div>
          <MiniLifecycle step={step} theme={theme} />
          <p style={{ margin: 0, fontSize: '9px', color: theme.textMuted, fontWeight: '600' }}>
            {formatDate(log.created_at)} · {formatTimeAgo(log.created_at)}
          </p>
        </>
      ) : (
        <p style={{ margin: 0, fontSize: '12px', color: theme.textMuted, fontWeight: '600' }}>No dispatches yet.</p>
      )}
    </div>
  );
};

// ─── Expandable Audit Row ─────────────────────────────────────────────────────
const AuditRow = ({ log, isLast, theme }) => {
  const [expanded, setExpanded] = useState(false);
  const rate = Math.round((log.read_count / log.sent_to_count) * 100) || 0;
  const status = getStatus(log);
  const step = log.read_count > 0 ? 3 : 2;

  return (
    <div style={{ borderBottom: !isLast ? `1px solid ${theme.border}` : 'none' }}>
      {/* ── ROW (clickable) ── */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'flex', alignItems: 'stretch', gap: '0',
          cursor: 'pointer', transition: 'background 0.15s',
          borderRadius: expanded ? '0' : '0',
        }}
        onMouseEnter={e => e.currentTarget.style.background = theme.bg}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        {/* Left status indicator */}
        <div style={{
          width: '3px', flexShrink: 0, borderRadius: '3px 0 0 3px',
          background: status.color, alignSelf: 'stretch', margin: '6px 0'
        }} />

        {/* Row content */}
        <div style={{ flex: 1, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Status dot */}
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: status.color, flexShrink: 0
          }} />

          {/* Title + meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: '0 0 3px 0', fontSize: '13px', fontWeight: '800', color: theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {cleanSubject(log.subject)}
            </p>
            <p style={{ margin: 0, fontSize: '10px', fontWeight: '600', color: theme.textMuted }}>
              {formatDate(log.created_at)}
              <span style={{ margin: '0 5px', opacity: 0.4 }}>·</span>
              Sent {formatTimeAgo(log.created_at)}
            </p>
          </div>

          {/* Inline metrics */}
          <div style={{ display: 'flex', gap: '16px', flexShrink: 0 }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '8px', fontWeight: '800', color: theme.textMuted, textTransform: 'uppercase' }}>Delivered</p>
              <p style={{ margin: '1px 0 0', fontSize: '14px', fontWeight: '900', color: theme.text }}>{log.sent_to_count}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '8px', fontWeight: '800', color: theme.textMuted, textTransform: 'uppercase' }}>Viewed</p>
              <p style={{ margin: '1px 0 0', fontSize: '14px', fontWeight: '900', color: rate > 0 ? '#10B981' : theme.text }}>
                {log.read_count}
                <span style={{ fontSize: '9px', color: theme.textMuted, marginLeft: '2px' }}>({rate}%)</span>
              </p>
            </div>
            {/* Status badge */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{
                fontSize: '9px', fontWeight: '800', color: status.color,
                background: status.bg, padding: '3px 9px', borderRadius: '20px',
                whiteSpace: 'nowrap'
              }}>
                {status.label}
              </span>
            </div>
          </div>

          {/* Expand toggle */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '10px', fontWeight: '800', color: 'var(--primary-color)',
            flexShrink: 0, paddingLeft: '8px'
          }}>
            View Full Details
            <ChevronDownIcon open={expanded} />
          </div>
        </div>
      </div>

      {/* ── EXPANDED PANEL ── */}
      {expanded && (
        <div style={{
          marginLeft: '3px',
          background: theme.bg,
          borderTop: `1px solid ${theme.border}`,
          padding: '16px 20px 20px',
          animation: 'expandIn 0.2s ease'
        }}>
          <style>{`@keyframes expandIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }`}</style>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>
            {/* Left: message */}
            <div>
              <p style={{ margin: '0 0 6px 0', fontSize: '9px', fontWeight: '900', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Message Content
              </p>
              <div style={{
                background: theme.surface, borderRadius: '10px',
                border: `1px solid ${theme.border}`, padding: '12px 14px',
                fontSize: '12px', lineHeight: '1.65', color: theme.text,
                fontWeight: '500', whiteSpace: 'pre-wrap',
                maxHeight: '140px', overflowY: 'auto'
              }}>
                {log.message || '—'}
              </div>
            </div>

            {/* Right: stats + lifecycle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Metrics grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { label: 'Delivered', value: log.sent_to_count, color: 'var(--primary-color)' },
                  { label: 'Viewed', value: `${log.read_count} (${rate}%)`, color: rate > 0 ? '#10B981' : theme.text },
                  { label: 'Audience', value: targetLabel(log.target_group), color: theme.text },
                  { label: 'Priority', value: (log.priority || 'normal').charAt(0).toUpperCase() + (log.priority || 'normal').slice(1), color: log.priority === 'high' ? '#EF4444' : theme.text },
                ].map(m => (
                  <div key={m.label} style={{ padding: '8px 10px', background: theme.surface, borderRadius: '8px', border: `1px solid ${theme.border}` }}>
                    <p style={{ margin: 0, fontSize: '8px', fontWeight: '900', color: theme.textMuted, textTransform: 'uppercase' }}>{m.label}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', fontWeight: '800', color: m.color }}>{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Lifecycle */}
              <div style={{ padding: '10px 12px', background: theme.surface, borderRadius: '8px', border: `1px solid ${theme.border}` }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '8px', fontWeight: '900', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Lifecycle</p>
                <MiniLifecycle step={step} theme={theme} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminBroadcastAnalytics = ({ theme, darkMode, adminUser }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    adminGetBroadcastLogs().then(data => {
      setHistory(data);
      setLoading(false);
    }).catch(console.error);
  }, []);

  const lastLog = history.length > 0 ? history[0] : null;

  const totalBroadcasts = history.length;
  const avgViewRate = totalBroadcasts > 0
    ? Math.round(history.reduce((sum, l) => sum + (Math.round((l.read_count / l.sent_to_count) * 100) || 0), 0) / totalBroadcasts)
    : 0;
  const pendingEngagement = history.filter(l => l.read_count === 0).length;

  const filtered = history.filter(l => {
    if (filter === 'viewed') return l.read_count > 0;
    if (filter === 'not_viewed') return l.read_count === 0;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const da = new Date(a.created_at).getTime();
    const db = new Date(b.created_at).getTime();
    return sort === 'newest' ? db - da : da - db;
  });

  return (
    <div style={{ animation: 'fadeIn 0.3s ease', fontFamily: 'inherit' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* ── PAGE HEADER ── */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 4px 0', fontSize: '17px', fontWeight: '900', color: theme.text, letterSpacing: '-0.02em' }}>
          Broadcast Intelligence
        </h2>
        <p style={{ margin: 0, fontSize: '12px', color: theme.textMuted, fontWeight: '500' }}>
          Monitor dispatch delivery and audience engagement.
        </p>
      </div>

      {/* ── KPI STRIP (4 cols: 3 stats + Latest Dispatch) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.4fr', gap: '12px', marginBottom: '20px' }}>
        <InsightCard
          label="Total Broadcasts"
          value={totalBroadcasts}
          color="var(--primary-color)"
          hint={totalBroadcasts === 0 ? 'No dispatches sent yet' : `${totalBroadcasts} dispatch${totalBroadcasts !== 1 ? 'es' : ''} on record`}
          theme={theme}
        />
        <InsightCard
          label="Avg View Rate"
          value={`${avgViewRate}%`}
          color={avgViewRate >= 50 ? '#10B981' : avgViewRate > 0 ? '#F59E0B' : '#EF4444'}
          hint={avgViewRate === 0 ? 'No recipients have viewed broadcasts yet' : avgViewRate < 30 ? 'Below average engagement' : 'Good audience engagement'}
          theme={theme}
        />
        <InsightCard
          label="Pending Engagement"
          value={pendingEngagement}
          color={pendingEngagement > 0 ? '#F59E0B' : '#10B981'}
          hint={pendingEngagement === 0 ? 'All broadcasts have been viewed' : `${pendingEngagement} broadcast${pendingEngagement !== 1 ? 's' : ''} with 0 views`}
          theme={theme}
        />
        {/* Latest Dispatch embedded in KPI row */}
        <LatestDispatchCard log={lastLog} theme={theme} />
      </div>

      {/* ── HISTORICAL AUDIT (MAIN) ── */}
      <div style={{ background: theme.surface, borderRadius: '16px', border: `1px solid ${theme.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>

        {/* Header + controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: `1px solid ${theme.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <p style={{ margin: 0, fontSize: '10px', fontWeight: '900', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Historical Audit
            </p>
            <span style={{
              fontSize: '9px', background: theme.bg, border: `1px solid ${theme.border}`,
              borderRadius: '6px', padding: '2px 8px', color: theme.textMuted, fontWeight: '700'
            }}>
              {sorted.length} record{sorted.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Filter pills */}
            <div style={{ display: 'flex', background: theme.bg, borderRadius: '8px', border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'viewed', label: 'Viewed' },
                { id: 'not_viewed', label: 'Not Viewed' },
              ].map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)} style={{
                  padding: '5px 11px', border: 'none', cursor: 'pointer',
                  fontSize: '10px', fontWeight: '800', fontFamily: 'inherit',
                  background: filter === f.id ? 'var(--primary-color)' : 'transparent',
                  color: filter === f.id ? 'white' : theme.textMuted,
                  transition: '0.15s'
                }}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Sort */}
            <select value={sort} onChange={e => setSort(e.target.value)} style={{
              padding: '5px 10px', border: `1px solid ${theme.border}`, borderRadius: '8px',
              background: theme.bg, color: theme.text, fontSize: '10px',
              fontWeight: '700', fontFamily: 'inherit', cursor: 'pointer', outline: 'none'
            }}>
              <option value="newest">Newest ↓</option>
              <option value="oldest">Oldest ↑</option>
            </select>
          </div>
        </div>

        {/* Rows */}
        <div>
          {loading ? (
            <p style={{ textAlign: 'center', padding: '40px 0', fontSize: '12px', color: theme.textMuted, fontWeight: '600' }}>
              Loading audit records...
            </p>
          ) : sorted.length > 0 ? (
            sorted.map((log, idx) => (
              <AuditRow key={log.id} log={log} isLast={idx === sorted.length - 1} theme={theme} darkMode={darkMode} />
            ))
          ) : (
            <div style={{ padding: '48px 20px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: '800', color: theme.text }}>No records found</p>
              <p style={{ margin: 0, fontSize: '11px', color: theme.textMuted, fontWeight: '600' }}>Try changing the filter above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBroadcastAnalytics;
