/**
 * Reusable helper functions for feedback UI components.
 * Standardizes sentiment mapping, location hierarchy, and date formatting.
 */

export const getEmotion = (rating) => {
  const mapping = {
    5: { emoji: "😊", label: "satisfied" },
    4: { emoji: "🙂", label: "good" },
    3: { emoji: "😐", label: "neutral" },
    2: { emoji: "😕", label: "dissatisfied" },
    1: { emoji: "😠", label: "frustrated" }
  };
  return mapping[rating] || null;
};

export const formatLocation = (post) => {
  const { branch_name, city, province, barangay } = post;
  
  // Use clean hierarchy: branch_name -> city -> province
  if (branch_name) {
    if (city) return `${branch_name} - ${city}`;
    return branch_name;
  }
  if (city) return city;
  if (province) return province;
  if (barangay) return barangay;
  
  return "Location not specified";
};

export const formatFeedbackDate = (dateStr) => {
  if (!dateStr) return "Recently";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Recently";
  
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  // Relative time for posts less than 24 hours old
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  
  // Format: April 10 at 2:30 PM (for older posts)
  const datePart = date.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
  });
  const timePart = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  
  return `${datePart} at ${timePart}`;
};

export const getDisplayName = (post, currentUser) => {
  if (post.is_anonymous) return 'Anonymous';
  
  // User explicitly requested to NOT use "You", use actual name instead
  const name = post.user_name || post.sender_name;
  if (name) return name;

  // Fallback to currentUser name if it's their own post and name is missing from post object
  const postUserId = post.user_id || post.sender_id;
  if (currentUser && postUserId === currentUser.id && currentUser.name) {
    return currentUser.name;
  }
  
  return 'Anonymous';
};

/**
 * Helper to truncate text with ellipsis
 */
const truncate = (text, maxLength) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Generates the header string or components for a feedback card.
 * Usage: [Name] feeling [emoji] [sentiment] at [Entity Name]
 */
export const renderFeedbackAction = (post, currentUser) => {
  const name = getDisplayName(post, currentUser);
  const emotion = getEmotion(post.rating);
  const entityLabel = post.entity_name || "Program";

  const styles = {
    name: { fontWeight: '800', color: '#0F172A' },
    connector: { color: '#64748B', fontWeight: '400' },
    sentiment: { color: '#1E293B', fontWeight: '600', cursor: 'help' },
    entity: { fontWeight: '700', color: '#334155' }
  };

  if (emotion) {
    return (
      <span style={{ lineHeight: '1.4' }}>
        <span style={styles.name}>{name}</span>
        <span style={styles.connector}> feeling </span>
        <span title={`User rated ${post.rating} out of 5 stars`} style={styles.sentiment}>
          {emotion.emoji} {emotion.label.toLowerCase()}
        </span>
        <span style={styles.connector}> at </span>
        <span title={entityLabel} style={styles.entity}>
          {truncate(entityLabel, 35)}
        </span>
      </span>
    );
  }

  // Fallback if no rating
  return (
    <span style={{ lineHeight: '1.4' }}>
      <span style={styles.name}>{name}</span>
      <span style={styles.connector}> shared feedback at </span>
      <span title={entityLabel} style={styles.entity}>
        {truncate(entityLabel, 35)}
      </span>
    </span>
  );
};

export const formatMentions = (mentions) => {
  if (!mentions || mentions.length === 0) return "";
  const names = mentions.map(m => m.employee_name || m.name);
  if (names.length <= 2) return names.join(", ");
  return `${names.slice(0, 2).join(", ")} +${names.length - 2} more`;
};
