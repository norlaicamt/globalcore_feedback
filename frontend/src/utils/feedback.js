import React, { useState, useEffect } from 'react';
import { useLightbox } from '../context/LightboxContext';

/**
 * feedback.js — Schema-Driven Feed Rendering Engine
 * Every admin-configured module renders dynamically.
 * Privacy rule: only full_name, contact_number, email_address, mailing_address are hidden from public.
 */

export const IDENTITY_KEYS = ['full_name', 'contact_number', 'email_address', 'mailing_address'];

export const SUPPORTED_RENDER_TYPES = [
  'star_rating', 'emoji_rating', 'slider_scale', 'rating_matrix',
  'multiple_choice', 'dropdown', 'short_text', 'long_text', 'number_input',
  'full_name', 'email_address', 'contact_number', 'mailing_address',
  'photo_upload', 'voice_record', 'file_upload',
  'entity_picker', 'location_picker', 'staff_mention',
];

export const getEmotion = (rating) => {
  const map = {
    5: { emoji: '😊', label: 'Satisfied' },
    4: { emoji: '🙂', label: 'Good' },
    3: { emoji: '😐', label: 'Neutral' },
    2: { emoji: '😕', label: 'Dissatisfied' },
    1: { emoji: '😠', label: 'Frustrated' },
  };
  return map[rating] || null;
};

export const formatLocation = (post) => {
  const { branch_name, city, province, barangay } = post;
  if (branch_name) return city ? `${branch_name} - ${city}` : branch_name;
  if (city) return city;
  if (province) return province;
  if (barangay) return barangay;
  return 'Location not specified';
};

export const formatFeedbackDate = (dateStr) => {
  if (!dateStr) return 'Recently';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Recently';
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const datePart = date.toLocaleDateString('en-US', {
    month: 'long', day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
  return `${datePart} at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
};

export const getDisplayName = (post, currentUser) => {
  if (post.is_anonymous) return 'Anonymous';
  const name = post.user_name || post.sender_name;
  if (name) return name;
  const uid = post.user_id || post.sender_id;
  if (currentUser && uid === currentUser.id && currentUser.name) return currentUser.name;
  return 'Anonymous';
};

const truncate = (text, max) => (!text || text.length <= max ? text : text.substring(0, max) + '…');

export const renderFeedbackAction = (post, currentUser) => {
  const name = getDisplayName(post, currentUser);
  const emotion = getEmotion(post.rating);
  const entityLabel = post.entity_name || 'Program';
  const s = {
    name: { fontWeight: '800', color: '#0F172A' },
    conn: { color: '#64748B', fontWeight: '400' },
    sent: { color: '#1E293B', fontWeight: '600', cursor: 'help' },
    ent: { fontWeight: '700', color: '#334155' },
  };
  if (emotion) {
    return (
      <span style={{ lineHeight: '1.4' }}>
        <span style={s.name}>{name}</span>
        <span style={s.conn}> feeling </span>
        <span title={`Rated ${post.rating}/5`} style={s.sent}>{emotion.emoji} {emotion.label}</span>
        <span style={s.conn}> at </span>
        <span style={s.ent}>{truncate(entityLabel, 35)}</span>
      </span>
    );
  }
  return (
    <span style={{ lineHeight: '1.4' }}>
      <span style={s.name}>{name}</span>
      <span style={s.conn}> shared feedback at </span>
      <span style={s.ent}>{truncate(entityLabel, 35)}</span>
    </span>
  );
};

// ─── Component: AuditImage ───────────────────────────────────────────────────



export const AuditImage = ({ src, alt, style, images = [], index = 0, feedback_id = 'unknown', viewer_mode = 'public', lightboxSrc = null }) => {
  const [imgStatus, setImgStatus] = useState('loading');
  const [resolvedSrc, setResolvedSrc] = useState(src);
  const { openLightbox } = useLightbox();

  useEffect(() => {
    let url = src;
    if (typeof url === 'string' && url.startsWith('/uploads')) {
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      url = `${API_BASE}${url}`;
    }
    setResolvedSrc(url);

    const testImage = async () => {
      const isDev = process.env.NODE_ENV === 'development';
      try {
        if (isDev) console.log(`[AUDIT:MEDIA_URL] Frontend Renderer - raw_url: ${src}, resolved_url: ${url}`);
        const startTime = Date.now();
        const response = await fetch(url, { method: 'HEAD' });
        const endTime = Date.now();
        if (isDev) console.log(`[AUDIT:IMAGE_FETCH] URL: ${url}, status: ${response.status}, content-type: ${response.headers.get('content-type')}`);
        
        if (response.ok) {
          setImgStatus('loaded');
          if (isDev) {
            console.log(`[AUDIT:BATCH_RENDER] status=SUCCESS url=${url} feedback_id=${feedback_id} index=${index}`);
          } else {
            console.info(`[PROD:MEDIA_RENDER] status=SUCCESS duration=${endTime - startTime}ms feedback_id=${feedback_id} index=${index}`);
          }
        } else {
          setImgStatus('error');
          if (isDev) {
            console.log(`[AUDIT:BATCH_RENDER] status=FAILED url=${url} feedback_id=${feedback_id} index=${index} error_code=${response.status}`);
          } else {
            console.warn(`[PROD:MEDIA_FAILURE] feedback_id=${feedback_id} url=${url} status=${response.status} viewer_mode=${viewer_mode}`);
          }
        }
      } catch (error) {
        if (isDev) {
          console.error(`[AUDIT:IMAGE_FETCH] URL: ${url}, error:`, error);
          console.log(`[AUDIT:BATCH_RENDER] status=FAILED url=${url} feedback_id=${feedback_id} index=${index} error_msg=${error.message}`);
        } else {
          console.warn(`[PROD:MEDIA_FAILURE] feedback_id=${feedback_id} url=${url} status=NETWORK_ERROR viewer_mode=${viewer_mode}`);
        }
        setImgStatus('error');
      }
    };

    if (url && !url.startsWith('blob:')) {
      testImage();
    } else {
      setImgStatus('loaded');
    }
  }, [src]);

  if (imgStatus === 'error') {
    return (
      <div style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F1F5F9', color: '#94A3B8', fontSize: '12px', textAlign: 'center', padding: '8px' }}>
        Photo unavailable
      </div>
    );
  }

  return (
    <img 
      src={resolvedSrc} 
      alt={alt} 
      style={{ ...style, cursor: 'zoom-in' }} 
      onError={() => {
        setImgStatus('error');
        if (process.env.NODE_ENV !== 'development') {
           console.warn(`[PROD:MEDIA_FAILURE] feedback_id=${feedback_id} url=${resolvedSrc} status=RENDER_ERROR viewer_mode=${viewer_mode}`);
        }
      }} 
      loading="lazy"
      onClick={(e) => {
        e.stopPropagation();
        if (imgStatus === 'loaded') {
          // Use full resolution for lightbox if available
          const lightboxImages = images.length > 0 ? images : [lightboxSrc || resolvedSrc];
          openLightbox(lightboxImages, index, { feedback_id, viewer_mode });
        }
      }}
    />
  );
};

// ─── Value resolvers ─────────────────────────────────────────────────────────

const resolveVal = (data, item) => {
  if (!item) return undefined;
  const byId = item.id ? data[item.id] : undefined;
  const byKey = item.key ? data[item.key] : undefined;
  const val = byId !== undefined ? byId : byKey;
  if (val === null || val === '' || (Array.isArray(val) && val.length === 0)) return undefined;
  return val;
};

// ─── Per-module compact renderer (for feed cards) ────────────────────────────

const renderCompactModule = (item, val, feedbackId, viewerMode = 'public') => {
  const key = item.key || '';
  if (key === 'star_rating') {
    const stars = '★'.repeat(Math.min(5, parseInt(val) || 0)) + '☆'.repeat(5 - Math.min(5, parseInt(val) || 0));
    return <span style={{ color: '#FFB800', fontSize: '13px', letterSpacing: '1px' }}>{stars}</span>;
  }
  if (key === 'emoji_rating') {
    const emojis = ['😟', '😐', '🙂', '😃', '🤩'];
    const labels = ['Frustrated', 'Neutral', 'Good', 'Happy', 'Excellent'];
    const idx = parseInt(val) - 1;
    return <span style={{ fontSize: '13px' }}>{idx >= 0 ? `${emojis[idx]} ${labels[idx]}` : val}</span>;
  }
  if (key === 'slider_scale') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700' }}>
        📈 {val}%
      </span>
    );
  }
  if (key === 'rating_matrix') {
    const obj = typeof val === 'object' && !Array.isArray(val) ? val : {};
    const count = Object.keys(obj).length;
    return <span style={{ fontSize: '12px' }}>📊 {count} area{count !== 1 ? 's' : ''} rated</span>;
  }
  if (key === 'multiple_choice' || key === 'dropdown') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#F1F5F9', borderRadius: '6px', padding: '2px 8px', fontSize: '12px', fontWeight: '700' }}>
        🏷 {Array.isArray(val) ? val.join(', ') : val}
      </span>
    );
  }
  if (key === 'entity_picker') {
    return <span style={{ fontSize: '12px' }}>🏢 {val?.name || val}</span>;
  }
  if (key === 'location_picker') {
    return <span style={{ fontSize: '12px' }}>📍 {val?.name || val?.branch_name || val}</span>;
  }
  if (key === 'staff_mention') {
    const names = Array.isArray(val) ? val.map(s => s.name || s.employee_name || s).join(', ') : (val?.name || val?.employee_name || val);
    return <span style={{ fontSize: '12px' }}>👤 {names}</span>;
  }
  if (key === 'voice_record') {
    const arr = Array.isArray(val) ? val : [val];
    return (
      <span style={{ fontSize: '12px', color: 'var(--primary-color)', fontWeight: '700' }}>
        ▶ Voice Feedback • {arr.length} clip{arr.length > 1 ? 's' : ''}
      </span>
    );
  }
  if (key === 'long_text' || key === 'short_text') {
    return (
      <span style={{ fontSize: '13px', color: '#334155', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {typeof val === 'string' ? val : JSON.stringify(val)}
      </span>
    );
  }
  if (key === 'photo_upload') {
    const arr = Array.isArray(val) ? val : [val];
    const photos = [];
    arr.forEach(p => {
       const src = typeof p === 'string' ? p : p?.url || p?.preview;
       if (src && !src.startsWith('blob:')) photos.push(src);
    });
    if (photos.length === 0) return null;
    return (
      <div style={{ display: 'flex', gap: '4px', overflow: 'hidden', height: '40px', marginTop: '4px' }}>
        {photos.slice(0, 4).map((src, i) => (
           <AuditImage 
             key={i} 
             src={src} 
             alt="Preview" 
             style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} 
             images={photos}
             index={i}
             feedback_id={feedbackId}
             viewer_mode={viewerMode}
           />
        ))}
        {photos.length > 4 && (
          <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: '#F1F5F9', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
            +{photos.length - 4}
          </div>
        )}
      </div>
    );
  }
  return null;
};

// ─── Per-module full detail renderer ─────────────────────────────────────────

const renderFullModule = (item, val, feedbackId, viewerMode = 'public') => {
  const key = item.key || '';

  if (key === 'star_rating') {
    const n = parseInt(val) || 0;
    return (
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1,2,3,4,5].map(i => (
          <span key={i} style={{ fontSize: '22px', color: i <= n ? '#FFB800' : '#E2E8F0' }}>★</span>
        ))}
        <span style={{ fontSize: '13px', fontWeight: '700', marginLeft: '6px', alignSelf: 'center', color: '#64748B' }}>{n}/5</span>
      </div>
    );
  }

  if (key === 'emoji_rating') {
    const emojis = ['😟', '😐', '🙂', '😃', '🤩'];
    const labels = ['Frustrated', 'Neutral', 'Good', 'Happy', 'Excellent'];
    const idx = parseInt(val) - 1;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '32px' }}>{idx >= 0 ? emojis[idx] : '❓'}</span>
        <span style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B' }}>{idx >= 0 ? labels[idx] : val}</span>
      </div>
    );
  }

  if (key === 'slider_scale') {
    const pct = Math.min(100, Math.max(0, parseInt(val) || 0));
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ flex: 1, height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary-color)', borderRadius: '4px', transition: 'width 0.5s' }} />
        </div>
        <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--primary-color)', minWidth: '40px' }}>{pct}%</span>
      </div>
    );
  }

  if (key === 'rating_matrix') {
    const obj = typeof val === 'object' && !Array.isArray(val) ? val : {};
    const entries = Object.entries(obj);
    if (entries.length === 0) return <span style={{ color: '#94A3B8', fontSize: '13px' }}>No matrix data</span>;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: 'white', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
        {entries.map(([criterion, score]) => (
          <div key={criterion} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#475569', flex: 1 }}>{criterion}</span>
            <div style={{ display: 'flex', gap: '2px' }}>
              {[1,2,3,4,5].map(i => (
                <span key={i} style={{ fontSize: '14px', color: i <= parseInt(score) ? '#FFB800' : '#E2E8F0' }}>★</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (key === 'photo_upload') {
    const arr = Array.isArray(val) ? val : [val];
    const photos = [];
    arr.forEach(p => {
       const original = typeof p === 'string' ? p : p?.url || p?.preview;
       const thumb = typeof p === 'string' ? p : p?.thumb_url || p?.url || p?.preview;
       if (original && !original.startsWith('blob:')) photos.push({ original, thumb });
    });
    if (photos.length === 0) return null;
    const cols = photos.length === 1 ? '1fr' : photos.length <= 4 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)';
    return (
      <div style={{ display: 'grid', gridTemplateColumns: cols, gap: '4px', borderRadius: '16px', overflow: 'hidden' }}>
        {photos.slice(0, 5).map((p, i) => (
          <div key={i} style={{ position: 'relative', aspectRatio: photos.length === 1 ? '16/9' : '1/1' }}>
            <AuditImage 
              src={p.thumb} 
              lightboxSrc={p.original}
              alt={`Submission ${i+1}`} 
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
              images={photos.map(x => x.original)}
              index={i}
              feedback_id={feedbackId}
              viewer_mode={viewerMode}
            />
            {i === 4 && photos.length > 5 && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '22px', fontWeight: '900', pointerEvents: 'none' }}>
                +{photos.length - 4}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (key === 'voice_record') {
    const arr = Array.isArray(val) ? val : [val];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {arr.map((clip, i) => {
          const src = typeof clip === 'string' ? clip : clip?.url || clip?.preview;
          return src ? (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#F0F9FF', borderRadius: '12px', border: '1px solid #BAE6FD' }}>
              <span style={{ fontSize: '18px' }}>🎤</span>
              <audio controls src={src} style={{ flex: 1, height: '32px' }} />
            </div>
          ) : (
            <div key={i} style={{ padding: '10px 14px', background: '#F0F9FF', borderRadius: '12px', fontSize: '13px', color: '#0369A1', fontWeight: '700' }}>
              ▶ Voice Feedback • Clip {i + 1}
            </div>
          );
        })}
      </div>
    );
  }

  if (key === 'multiple_choice' || key === 'dropdown') {
    const choices = Array.isArray(val) ? val : [val];
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {choices.map((c, i) => (
          <span key={i} style={{ background: 'rgba(var(--primary-rgb), 0.08)', color: 'var(--primary-color)', borderRadius: '8px', padding: '4px 12px', fontSize: '13px', fontWeight: '700' }}>
            🏷 {c}
          </span>
        ))}
      </div>
    );
  }

  if (key === 'entity_picker') {
    const name = val?.name || val;
    return <span style={{ fontSize: '14px', fontWeight: '700' }}>🏢 {name}</span>;
  }

  if (key === 'location_picker') {
    const name = val?.name || val?.branch_name || val;
    return <span style={{ fontSize: '14px', fontWeight: '700' }}>📍 {name}</span>;
  }

  if (key === 'staff_mention') {
    const arr = Array.isArray(val) ? val : [val];
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {arr.map((s, i) => {
          const name = s?.name || s?.employee_name || s;
          return (
            <span key={i} style={{ background: '#F1F5F9', borderRadius: '8px', padding: '6px 12px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
              👤 {name}
            </span>
          );
        })}
      </div>
    );
  }

  if (key === 'long_text' || key === 'short_text' || key === 'number_input') {
    return <p style={{ margin: 0, fontSize: '14px', color: '#334155', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{String(val)}</p>;
  }

  if (typeof val === 'object' && !Array.isArray(val)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px', background: 'white', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
        {Object.entries(val).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: '#64748B' }}>{k}</span>
            <span style={{ fontWeight: '700', color: '#1E293B' }}>{String(v)}</span>
          </div>
        ))}
      </div>
    );
  }

  return <span style={{ fontSize: '14px', color: '#334155' }}>{Array.isArray(val) ? val.join(', ') : String(val)}</span>;
};

// ─── Main export ──────────────────────────────────────────────────────────────

export const renderFeedbackResponses = (post, options = { compact: true, viewerMode: 'public' }) => {
  const data = post.custom_data || {};
  const formSteps = post.entity?.fields?.steps || post.entity?.form_config?.steps || [];
  const schema = formSteps.flatMap(s => s.items || []);

  const coreMessage = post.description || post.comment || post.message || post.details || post.idea;

  // ── COMPACT VIEW (feed cards) ──────────────────────────────────────────────
  if (options.compact) {
    const photos = [];
    const compactModules = [];

    schema.forEach(item => {
      const key = item.key || '';
      if (IDENTITY_KEYS.includes(key)) return;

      const val = resolveVal(data, item);
      if (val === undefined) return;

      if (key === 'photo_upload') {
        const arr = Array.isArray(val) ? val : [val];
        arr.forEach(p => {
          const original = typeof p === 'string' ? p : p?.url || p?.preview;
          const thumb = typeof p === 'string' ? p : p?.thumb_url || p?.url || p?.preview;
          if (original && !original.startsWith('blob:')) {
             photos.push({ original, thumb });
          }
        });
      }

      const chip = renderCompactModule(item, val, post.id, options.viewerMode);
      if (chip && !['photo_upload', 'long_text', 'short_text'].includes(key)) {
        compactModules.push(chip);
      }
    });

    if (photos.length > 0) {
       console.log(`[AUDIT:BATCH_RENDER] feedback_id=${post.id} rendered_count=${photos.length} failed_count=0 visibility=compact`);
    }

    // Fallback: star rating from top-level field
    if (!schema.some(i => i.key === 'star_rating') && post.rating > 0) {
      const n = post.rating;
      compactModules.unshift(
        <span key="star-fb" style={{ color: '#FFB800', fontSize: '13px' }}>{'★'.repeat(n)}{'☆'.repeat(5-n)}</span>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {coreMessage && (
          <p style={{ margin: 0, fontSize: '14px', color: '#1E293B', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {coreMessage}
          </p>
        )}

        {photos.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: photos.length === 1 ? '1fr' : 'repeat(2, 1fr)',
            gap: '4px', borderRadius: '16px', overflow: 'hidden', marginTop: '4px',
            aspectRatio: photos.length === 1 ? '16/9' : '1/1',
            maxHeight: '260px',
          }}>
            {photos.slice(0, 4).map((p, i) => (
              <div key={i} style={{ position: 'relative', overflow: 'hidden' }}>
                <AuditImage 
                  src={p.thumb} 
                  lightboxSrc={p.original}
                  alt="Feedback" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
                  images={photos.map(x => x.original)}
                  index={i}
                  feedback_id={post.id}
                  viewer_mode={options.viewerMode}
                />
                {i === 3 && photos.length > 4 && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px', fontWeight: '900', pointerEvents: 'none' }}>
                    +{photos.length - 3}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {compactModules.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
            {compactModules.map((chip, i) => (
              <div key={i} style={{ fontSize: '11px', fontWeight: '700', background: '#F1F5F9', color: '#475569', padding: '3px 9px', borderRadius: '6px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {chip}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── FULL DETAIL VIEW ───────────────────────────────────────────────────────
  const publicModules = [];
  const identityModules = [];

  if (schema.length === 0) {
    // No schema: render core fields only
    if (coreMessage) {
      publicModules.push({ label: 'Feedback', val: coreMessage, key: 'long_text', item: { key: 'long_text' } });
    }
    if (post.rating > 0) {
      publicModules.unshift({ label: 'Rating', val: post.rating, key: 'star_rating', item: { key: 'star_rating' } });
    }
  } else {
    schema.forEach(item => {
      const key = item.key || '';
      const val = resolveVal(data, item);
      if (val === undefined) return;

      const label = item.label_override || item.label || key;

      console.log(`[AUDIT:FEED_RENDER] module_type=${key} submitted_value=${JSON.stringify(val)} rendered_component=full visibility_mode=${IDENTITY_KEYS.includes(key) ? 'private' : 'public'}`);

      if (IDENTITY_KEYS.includes(key)) {
        if (options.viewerMode === 'admin' || options.viewerMode === 'owner') {
          identityModules.push({ label, val, key, item });
        }
      } else {
        publicModules.push({ label, val, key, item });
      }
    });

    // Fallback: core message if no long_text in schema
    if (!schema.some(i => ['long_text', 'short_text'].includes(i.key)) && coreMessage) {
      publicModules.unshift({ label: 'Comments', val: coreMessage, key: 'long_text', item: { key: 'long_text' } });
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {publicModules.map((mod, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            {mod.label}
          </span>
          <div>{renderFullModule(mod.item, mod.val, post.id, options.viewerMode)}</div>
        </div>
      ))}
      {(() => {
         const allPhotos = publicModules.filter(m => m.key === 'photo_upload').flatMap(m => {
            const val = m.val;
            const arr = Array.isArray(val) ? val : [val];
            return arr.map(p => typeof p === 'string' ? p : p?.url || p?.preview).filter(s => s && !s.startsWith('blob:'));
         });
         if (allPhotos.length > 0) {
            console.log(`[AUDIT:BATCH_RENDER] feedback_id=${post.id} rendered_count=${allPhotos.length} failed_count=0 visibility=full`);
         }
         return null;
      })()}

      {identityModules.length > 0 && (
        <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '16px', border: '1px dashed #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px' }}>🔑</span>
            <span style={{ fontSize: '11px', fontWeight: '900', color: '#475569', textTransform: 'uppercase' }}>Identity Data (Admin/Owner Only)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
            {identityModules.map((mod, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '700' }}>{mod.label}</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B' }}>{String(mod.val)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {options.viewerMode === 'public' && schema.some(i => IDENTITY_KEYS.includes(i.key)) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '12px', color: '#0369A1' }}>
          <span style={{ fontSize: '16px' }}>🔒</span>
          <span style={{ fontSize: '13px', fontWeight: '700' }}>Private details protected for community privacy</span>
        </div>
      )}
    </div>
  );
};

export const formatMentions = (mentions) => {
  if (!mentions || mentions.length === 0) return '';
  const names = mentions.map(m => m.employee_name || m.name);
  if (names.length <= 2) return names.join(', ');
  return `${names.slice(0, 2).join(', ')} +${names.length - 2} more`;
};
