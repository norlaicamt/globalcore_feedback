import React, { useState, useEffect } from 'react';
import { useLightbox } from '../context/LightboxContext';

/**
 * feedback.js — Schema-Driven Feed Rendering Engine
 * Every admin-configured module renders dynamically.
 * Privacy rule: only full_name, contact_number, email_address, mailing_address are hidden from public.
 */

export const IDENTITY_KEYS = ['full_name', 'contact_number', 'email_address', 'mailing_address'];

export const SUPPORTED_RENDER_TYPES = [
  'star_rating', 'rating_matrix',
  'multiple_choice', 'dropdown', 'short_text', 'long_text', 'number_input',
  'full_name', 'email_address', 'contact_number', 'mailing_address',
  'photo_upload', 'voice_record', 'file_upload',
  'entity_picker', 'location_picker',
];

export const EmotionSvg = {
  ecstatic: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EAB308" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>,
  happy: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>,
  neutral: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="8" y1="15" x2="16" y2="15" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>,
  disappointed: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M16 16s-1.5-2-4-2-4 2-4 2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>,
  frustrated: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M16 16s-1.5-2-4-2-4 2-4 2" /><path d="M7 8l2 2" /><path d="M17 8l-2 2" /></svg>
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
  console.log('LIVE_HEADER_RENDER', post.id);

  console.log('[HEADER_TRUTH]', {
    feedback_id: post.id,
    custom_data: post.custom_data,
    schema_steps: post?.entity?.fields?.steps,
    schema_item_ids: post?.entity?.fields?.steps?.flatMap(s => (s.items || []).map(i => ({
      id: i.id,
      key: i.key,
      type: i.type
    }))),
  });

  const name = getDisplayName(post, currentUser);
  const values = typeof post.custom_data === 'string' ? JSON.parse(post.custom_data || '{}') : (post.custom_data || {});
  const modules = post.entity?.fields?.steps || post.entity?.form_config?.steps || [];

  const s = {
    name: { fontWeight: '800', color: '#0F172A' },
    conn: { color: '#64748B', fontWeight: '500' },
    sent: { color: '#1E293B', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' },
    ent: { fontWeight: '700', color: '#334155' }
  };

  const entityLabel = post.entity?.name || 'General Feedback';
  const productName = post.product_name;

  const baseHeader = (
    <span style={{ lineHeight: '1.4', display: 'inline-flex', flexWrap: 'wrap', alignItems: 'center', gap: '3px' }}>
      {post.product_id && (post.product_image_url || post.custom_data?.product_metadata?.image_url) && (
        <img
          src={resolveMediaUrl(post.product_image_url || post.custom_data?.product_metadata?.image_url)}
          alt=""
          style={{ width: '20px', height: '20px', borderRadius: '4px', objectFit: 'cover', marginRight: '4px' }}
        />
      )}
      <span style={s.name}>{name}</span>
      <span style={s.conn}> {productName ? `reviewed ${productName} at` : 'shared feedback at'} </span>
      <span style={s.ent}>{truncate(entityLabel, 35)}</span>
    </span>
  );

  let emotion = null;
  let emotionLabel = null;
  let emotion_source = null;
  let raw_value = null;
  let modules_found = 0;

  for (const step of modules) {
    for (const item of step.items || []) {
      modules_found++;
      if (emotion) continue; // Priority already met

      let value = values[String(item.id)] !== undefined ? values[String(item.id)] : values[String(item.key)];
      const key = item.type || item.key;

      if ((value === undefined || value === null || value === '') && key === 'star_rating') {
        value = post.rating;
      }

      if (value === undefined || value === null || value === '') continue;

      if (key === 'emoji_rating') {
        emotion_source = 'emoji_rating';
        raw_value = value;
        const v = String(value).toLowerCase();
        if (v.includes('very satisf') || v.includes('ecstatic') || v.includes('love')) { emotion = EmotionSvg.ecstatic; emotionLabel = value; }
        else if (v.includes('satisf') || v.includes('happy') || v.includes('good')) { emotion = EmotionSvg.happy; emotionLabel = value; }
        else if (v.includes('neutral') || v.includes('ok')) { emotion = EmotionSvg.neutral; emotionLabel = value; }
        else if (v.includes('very diss') || v.includes('frustrat') || v.includes('angry')) { emotion = EmotionSvg.frustrated; emotionLabel = value; }
        else if (v.includes('diss') || v.includes('bad') || v.includes('poor')) { emotion = EmotionSvg.disappointed; emotionLabel = value; }
        else { emotion = EmotionSvg.neutral; emotionLabel = value; }
      } else if (key === 'star_rating') {
        emotion_source = 'star_rating';
        raw_value = value;
        const r = parseInt(value) || 0;
        if (r === 5) { emotion = EmotionSvg.ecstatic; emotionLabel = 'Ecstatic'; }
        else if (r === 4) { emotion = EmotionSvg.happy; emotionLabel = 'Happy'; }
        else if (r === 3) { emotion = EmotionSvg.neutral; emotionLabel = 'Neutral'; }
        else if (r === 2) { emotion = EmotionSvg.disappointed; emotionLabel = 'Disappointed'; }
        else if (r === 1) { emotion = EmotionSvg.frustrated; emotionLabel = 'Frustrated'; }
        else if (r === 0) { emotion = EmotionSvg.neutral; emotionLabel = 'Neutral'; }
      } else if (key === 'slider_scale') {
        emotion_source = 'slider_scale';
        raw_value = value;
        const r = parseFloat(value);
        if (!isNaN(r)) {
          if (r >= 9) { emotion = EmotionSvg.ecstatic; emotionLabel = 'Ecstatic'; }
          else if (r >= 7) { emotion = EmotionSvg.happy; emotionLabel = 'Happy'; }
          else if (r >= 5) { emotion = EmotionSvg.neutral; emotionLabel = 'Neutral'; }
          else if (r >= 3) { emotion = EmotionSvg.disappointed; emotionLabel = 'Disappointed'; }
          else { emotion = EmotionSvg.frustrated; emotionLabel = 'Frustrated'; }
        }
      }
    }
  }

  // Final fallback for older posts or forms without a schema
  if (!emotion && post.rating) {
    const r = parseInt(post.rating) || 0;
    if (r === 5) { emotion = EmotionSvg.ecstatic; emotionLabel = 'Ecstatic'; emotion_source = 'legacy_post_rating'; }
    else if (r === 4) { emotion = EmotionSvg.happy; emotionLabel = 'Happy'; emotion_source = 'legacy_post_rating'; }
    else if (r === 3) { emotion = EmotionSvg.neutral; emotionLabel = 'Neutral'; emotion_source = 'legacy_post_rating'; }
    else if (r === 2) { emotion = EmotionSvg.disappointed; emotionLabel = 'Disappointed'; emotion_source = 'legacy_post_rating'; }
    else if (r === 1) { emotion = EmotionSvg.frustrated; emotionLabel = 'Frustrated'; emotion_source = 'legacy_post_rating'; }
    else if (r === 0) { emotion = EmotionSvg.neutral; emotionLabel = 'Neutral'; emotion_source = 'legacy_post_rating'; }
  }

  console.log('[AUDIT:SOCIAL_HEADER]', {
    feedback_id: post.id,
    modules_found,
    emotion_source,
    raw_value,
    resolved_emotion: emotionLabel ? emotionLabel.toLowerCase() : null,
  });

  // When a product is linked, always use the product-review format — no emotion overlay
  if (productName) return baseHeader;

  if (emotion && emotionLabel) {
    return (
      <span style={{ lineHeight: '1.4', display: 'inline-flex', flexWrap: 'wrap', alignItems: 'center', gap: '3px' }}>
        {post.product_id && (post.product_image_url || post.custom_data?.product_metadata?.image_url) && (
          <img
            src={resolveMediaUrl(post.product_image_url || post.custom_data?.product_metadata?.image_url)}
            alt=""
            style={{ width: '20px', height: '20px', borderRadius: '4px', objectFit: 'cover', marginRight: '4px' }}
          />
        )}
        <span style={s.name}>{name}</span>
        <span style={s.conn}> is feeling </span>
        <span style={s.sent}>{emotion} {emotionLabel}</span>
        <span style={s.conn}> at </span>
        <span style={s.ent}>{truncate(entityLabel, 35)}</span>
      </span>
    );
  }

  const schema_items = modules.flatMap(s => s.items || []).map(i => i.id || i.key);
  const custom_keys = Object.keys(values);
  const missing_module_ids = schema_items.filter(id => !custom_keys.includes(id));

  console.log('[AUDIT:SOCIAL_HEADER_MISS]', {
    schema_items,
    custom_keys,
    missing_module_ids,
  });

  return baseHeader;
};

export const resolveMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;

  const API_BASE = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:8000`;

  // Fix 1: If it contains /uploads/, always normalize it to the current API_BASE
  // This handles both relative paths and absolute URLs with stale IPs/localhost
  if (url.includes('/uploads/')) {
    const parts = url.split('/uploads/');
    return `${API_BASE}/uploads/${parts[parts.length - 1]}`;
  }

  // Fix 2: If it starts with uploads/ (no leading slash)
  if (url.startsWith('uploads/')) {
    return `${API_BASE}/${url}`;
  }

  // Fix 3: Legacy absolute URL check (as fallback)
  if (url.includes('localhost:8000') || url.includes('127.0.0.1:8000')) {
    const path = url.split(':8000')[1];
    if (path) return `${API_BASE}${path}`;
  }

  return url;
};


// ─── Component: AuditImage ───────────────────────────────────────────────────

export const AuditImage = ({ src, alt, style, images = [], index = 0, feedback_id = 'unknown', viewer_mode = 'public', lightboxSrc = null }) => {
  const [imgStatus, setImgStatus] = useState('loading');
  const [resolvedSrc, setResolvedSrc] = useState(src);
  const { openLightbox } = useLightbox();

  useEffect(() => {
    setResolvedSrc(resolveMediaUrl(src));
    setImgStatus('loaded');
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
      loading="lazy"
      onError={() => setImgStatus('error')}
      onClick={(e) => {
        e.stopPropagation();
        if (imgStatus === 'loaded') {
          const lightboxImages = (images.length > 0 ? images : [lightboxSrc || resolvedSrc]).map(img => resolveMediaUrl(img));
          openLightbox(lightboxImages, index, { feedback_id, viewer_mode });
        }
      }}
    />
  );
};

// ─── Value resolvers ─────────────────────────────────────────────────────────

const resolveVal = (data, item) => {
  if (!item) return undefined;

  // Strict resolution hierarchy: prefer exact ID, fallback to general key (legacy)
  const val = (item.id && data[item.id] !== undefined) ? data[item.id] : data[item.key];

  if (item.key === 'rating_matrix') {
    console.log('[AUDIT:MATRIX_KEY_RESOLUTION]', {
      resolved_via: (item.id && data[item.id] !== undefined) ? 'id' : 'key',
      item_id: item.id,
      item_key: item.key,
      value_found: !!val
    });
  }

  if (val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
    if (item.key === 'product_picker') {
      // Fallback for product_picker from core fields
      return undefined; // We'll handle this in renderFeedbackResponses
    }
    return undefined;
  }
  return val;
};

// ─── Per-module compact renderer (for feed cards) ────────────────────────────

const renderCompactModule = (item, val, feedbackId, viewerMode = 'public') => {
  const key = item.key || '';
  if (key === 'star_rating') {
    const ratingVal = parseInt(val) || 0;
    if (ratingVal === 0) return null;
    const stars = '★'.repeat(Math.min(5, ratingVal)) + '☆'.repeat(5 - Math.min(5, ratingVal));
    return <span style={{ color: '#FFB800', fontSize: '13px', letterSpacing: '1px' }}>{stars}</span>;
  }
  if (['emoji_rating', 'slider_scale', 'staff_mention', 'voice_record'].includes(key)) return null;
  if (key === 'rating_matrix') {
    const obj = typeof val === 'object' && !Array.isArray(val) ? val : {};
    const count = Object.keys(obj).length;
    return <span style={{ fontSize: '12px', color: '#475569', fontWeight: '700' }}>📊 {count} area{count !== 1 ? 's' : ''} rated</span>;
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
  if (key === 'product_picker') return null;
  return null;
};

// ─── Per-module full detail renderer ─────────────────────────────────────────

const renderFullModule = (item, val, feedbackId, viewerMode = 'public') => {
  const key = item.type || item.key || '';

  // Handle detection for orphaned media data (prevents [object Object])
  if (key !== 'photo_upload' && (val?.url || val?.preview || (Array.isArray(val) && (val[0]?.url || val[0]?.preview)))) {
    return renderFullModule({ ...item, type: 'photo_upload' }, val, feedbackId, viewerMode);
  }

  if (key === 'star_rating') {
    const n = parseInt(val) || 0;
    if (n === 0) return null;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
        <span style={{ color: '#F59E0B', letterSpacing: '2px' }}>
          {'★'.repeat(n)}{'☆'.repeat(5 - n)}
        </span>
        <span style={{ fontWeight: '700', color: '#475569' }}>{n}/5</span>
      </div>
    );
  }

  if (key === 'emoji_rating') {
    const e = String(val).toLowerCase().includes('satisf') ? '😊' : '😐';
    return <span style={{ fontSize: '14px', fontWeight: '700', color: '#334155' }}>{e} {val}</span>;
  }

  if (key === 'slider_scale') {
    return <span style={{ fontSize: '14px', fontWeight: '700', color: '#334155' }}>{val}/10</span>;
  }

  if (key === 'staff_mention') {
    const mentions = Array.isArray(val) ? val : [val];
    return (
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {mentions.map((m, i) => {
          if (!m) return null;
          const name = typeof m === 'string' ? m : (m.employee_name || m.name);
          return (
            <div key={i} style={{ padding: '6px 12px', background: '#F1F5F9', borderRadius: '8px', fontSize: '12px', color: '#334155', fontWeight: '600' }}>
              👤 {name}
            </div>
          );
        })}
      </div>
    );
  }

  if (key === 'voice_record') {
    const duration = val.duration || '0:12';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', width: 'fit-content' }}>
        <span style={{ fontSize: '14px', color: 'var(--primary-color)' }}>▶</span>
        <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>Voice message</span>
        <span style={{ fontSize: '11px', color: '#94A3B8' }}>• {duration}</span>
      </div>
    );
  }

  if (key === 'rating_matrix') {
    const obj = typeof val === 'object' && !Array.isArray(val) ? val : {};
    const entries = Object.entries(obj);
    if (entries.length === 0) return null;

    return (
      <div style={{ marginTop: '8px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {entries.map(([criterion, score], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 12px', background: 'var(--portal-surface-card)', border: '1px solid rgba(128,128,128,0.15)', borderRadius: '8px', fontSize: 'var(--size-body, 13px)', gap: '8px' }}>
              <span style={{ fontWeight: '600', color: 'var(--portal-surface-muted)', wordBreak: 'break-word', lineHeight: '1.4' }}>{criterion}</span>
              <span style={{ fontWeight: '800', color: 'var(--primary-color)', whiteSpace: 'nowrap', flexShrink: 0, marginTop: '1px' }}>{score}/5</span>
            </div>
          ))}
        </div>
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
    const cols = photos.length === 1 ? '80px' : photos.length <= 4 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)';
    return (
      <div style={{ display: 'grid', gridTemplateColumns: cols, gap: '4px', borderRadius: '12px', overflow: 'hidden', maxWidth: photos.length === 1 ? '80px' : '180px' }}>
        {photos.slice(0, 5).map((p, i) => (
          <div key={i} style={{ position: 'relative', aspectRatio: photos.length === 1 ? '4/3' : '1/1' }}>
            <AuditImage
              src={p.thumb}
              lightboxSrc={p.original}
              alt={`Submission ${i + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: photos.length === 1 ? '12px' : '0' }}
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


  if (key === 'multiple_choice' || key === 'dropdown') {
    const choices = Array.isArray(val) ? val : [val];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {choices.map((c, i) => (
          <div key={i} style={{ fontSize: '14px', fontWeight: '600', color: '#0F172A', lineHeight: '1.4' }}>
            {c}
          </div>
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


  if (key === 'long_text' || key === 'short_text' || key === 'number_input') {
    return <p style={{ margin: 0, fontSize: '14px', color: '#334155', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{String(val)}</p>;
  }

  if (key === 'product_picker') return null;

  if (typeof val === 'object' && !Array.isArray(val)) {
    return (
      <div style={{ marginTop: '8px', padding: '12px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {Object.entries(val).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 12px', background: 'var(--portal-surface-card)', borderRadius: '8px', border: '1px solid rgba(128,128,128,0.15)', fontSize: 'var(--size-metadata, 11px)', gap: '8px' }}>
              <span style={{ color: 'var(--portal-surface-muted)', fontWeight: '600', wordBreak: 'break-word', lineHeight: '1.4' }}>{k}</span>
              <span style={{ fontWeight: '800', color: 'var(--portal-surface-text)', whiteSpace: 'nowrap', flexShrink: 0, marginTop: '2px' }}>{String(v)}</span>
            </div>
          ))}
        </div>
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



  // ── FULL DETAIL VIEW ───────────────────────────────────────────────────────
  const publicModules = [];
  const identityModules = [];

  if (schema.length === 0) {
    // No schema: render core fields only
    if (post.rating && !options.compact) {
      publicModules.push({ label: 'Rating', val: post.rating, key: 'star_rating', item: { key: 'star_rating', type: 'star_rating' } });
    }
    if (coreMessage) {
      publicModules.push({ label: 'Feedback', val: coreMessage, key: 'long_text', item: { key: 'long_text' } });
    }
  } else {
    const hasStarRatingInSchema = schema.some(i => i.key === 'star_rating' || i.type === 'star_rating');

    if (post.rating && !hasStarRatingInSchema && !options.compact) {
      publicModules.push({ label: 'Rating', val: post.rating, key: 'star_rating', item: { key: 'star_rating', type: 'star_rating' } });
    }

    schema.forEach(item => {
      const key = item.key || '';
      let val = resolveVal(data, item);

      if ((val === undefined || val === null || val === '') && (key === 'star_rating' || item.type === 'star_rating')) {
        val = post.rating;
      }

      if ((val === undefined || val === null || val === '') && key === 'product_picker') {
        if (post.product_name) {
          val = {
            id: post.product_id,
            name: post.product_name,
            sku: post.product_sku,
            ...(data.product_metadata || {})
          };
        }
      }

      if (val === undefined || val === null || val === '') return;

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

    if (!schema.some(i => ['long_text', 'short_text'].includes(i.key)) && coreMessage) {
      publicModules.unshift({ label: 'Comments', val: coreMessage, key: 'long_text', item: { key: 'long_text' } });
    }
  }

  const currentSchemaKeys = new Set(schema.map(i => i.id || i.key));
  currentSchemaKeys.add('field_labels');
  currentSchemaKeys.add('product_evaluations');
  currentSchemaKeys.add('product_metadata');
  currentSchemaKeys.add('routing_method');

  // Blend removed/legacy fields effortlessly into the main feed
  Object.entries(data).forEach(([dataKey, dataVal]) => {
    if (dataVal !== null && dataVal !== undefined && dataVal !== '' && !currentSchemaKeys.has(dataKey)) {
      if (['staff_id', 'department_id', 'location_id'].includes(dataKey)) return;
      let label = data.field_labels?.[dataKey] || dataKey;
      // Hide auto-generated form keys if no human label was captured
      if (label && label.startsWith('it_')) {
        label = null;
      }

      if (IDENTITY_KEYS.includes(dataKey)) {
        if (options.viewerMode === 'admin' || options.viewerMode === 'owner') {
          identityModules.push({ label, val: dataVal, key: dataKey, item: { key: dataKey, label } });
        }
      } else {
        // Strict Privacy Guard: Never expose orphaned custom fields (like 'it_123') to the public
        // because we don't know if they contain PII (like addresses or names). 
        if (options.viewerMode === 'admin' || options.viewerMode === 'owner') {
          publicModules.push({ label, val: dataVal, key: dataKey, item: { key: dataKey, label } });
        }
      }
    }
  });

  // Force strict display order: Rating -> Message -> Other -> Photos
  publicModules.sort((a, b) => {
    const getRank = (key) => {
      if (key === 'star_rating') return 1;
      if (key === 'long_text' || key === 'short_text') return 2;
      if (key === 'photo_upload') return 4;
      return 3; // Everything else in between
    };
    return getRank(a.key) - getRank(b.key);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {publicModules.map((mod, i) => {
        const content = renderFullModule(mod.item, mod.val, post.id, options.viewerMode);
        if (!content) return null;
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {mod.label && !['star_rating', 'photo_upload'].includes(mod.key) && (
              <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6 }}>
                {mod.label}
              </span>
            )}
            {content}
          </div>
        );
      })}
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

      {data.product_evaluations && Object.keys(data.product_evaluations).length > 0 && (
        <div style={{ marginTop: '8px', padding: '16px', background: 'rgba(var(--primary-rgb), 0.03)', borderRadius: '20px', border: '1.5px solid rgba(var(--primary-rgb), 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>★</div>
            <span style={{ fontSize: '11px', fontWeight: '900', color: '#1E293B', textTransform: 'uppercase' }}>Product Evaluation</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.values(data.product_evaluations).map((ev, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>{ev.label}</span>
                <div style={{ display: 'flex', gap: '2px', color: '#F59E0B' }}>
                  {'★'.repeat(ev.value)}{'☆'.repeat(5 - ev.value)}
                </div>
              </div>
            ))}
          </div>
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
