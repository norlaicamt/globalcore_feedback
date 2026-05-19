// frontend/src/services/api.js
import axios from "axios";

// Base URL for your FastAPI backend
const API_BASE = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:8000`;
console.log("Connecting to backend at:", API_BASE);

// Global API Auditing
axios.interceptors.request.use(config => {
  config.metadata = { startTime: new Date() };
  if (window.DEBUG_MODE) {
    console.log(`[API:START] ${config.method.toUpperCase()} ${config.url}`);
  }
  return config;
}, error => Promise.reject(error));

axios.interceptors.response.use(response => {
  const duration = new Date() - response.config.metadata.startTime;
  if (window.DEBUG_MODE) {
    console.log(`[API:END] ${response.config.method.toUpperCase()} ${response.config.url} | STATUS: ${response.status} | TIME: ${duration}ms | SIZE: ${JSON.stringify(response.data).length}B`);
  }
  return response;
}, error => {
  if (window.DEBUG_MODE) {
    console.error(`[API:ERROR] ${error.config?.method.toUpperCase()} ${error.config?.url} | MSG: ${error.message}`);
  }
  return Promise.reject(error);
});

/* -------------------- CACHE -------------------- */
const apiCache = {
  entities: null,
  departments: null,
  lastFetch: {
    entities: 0,
    departments: 0
  }
};
const CACHE_TTL = 30000; // 30s cache TTL

/* -------------------- AUTH -------------------- */
export const login = async (email, password) => {
  const response = await axios.post(`${API_BASE}/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await axios.post(`${API_BASE}/users/auth/forgot-password`, { email });
  return response.data;
};

export const resetPassword = async (token, newPassword) => {
  const response = await axios.post(`${API_BASE}/users/auth/reset-password`, {
    token,
    new_password: newPassword
  });
  return response.data;
};

/* -------------------- USERS -------------------- */
export const getUsers = async () => {
  const response = await axios.get(`${API_BASE}/users/`);
  return response.data;
};

export const getUserById = async (id) => {
  const response = await axios.get(`${API_BASE}/users/${id}`);
  return response.data;
};

export const createUser = async (user) => {
  const response = await axios.post(`${API_BASE}/users/`, user);
  return response.data;
};

export const updateUser = async (id, user) => {
  const response = await axios.put(`${API_BASE}/users/${id}`, user);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await axios.delete(`${API_BASE}/users/${id}`);
  return response.data;
};

export const deactivateUser = async (id, days) => {
  const response = await axios.post(`${API_BASE}/users/${id}/deactivate?days=${days}`);
  return response.data;
};

export const reactivateUser = async (id) => {
  const response = await axios.post(`${API_BASE}/users/${id}/reactivate`);
  return response.data;
};

export const changePassword = async (id, oldPassword, newPassword) => {
  const response = await axios.post(`${API_BASE}/users/${id}/change-password`, {
    old_password: oldPassword,
    new_password: newPassword
  });
  return response.data;
};

export const getUserNotifications = async (id) => {
  const response = await axios.get(`${API_BASE}/users/${id}/notifications`);
  return response.data;
};

export const getUserActivity = async (id) => {
  const response = await axios.get(`${API_BASE}/users/${id}/activity`);
  return response.data;
};

export const markNotificationsAsRead = async (id) => {
  const response = await axios.post(`${API_BASE}/users/${id}/notifications/read`);
  return response.data;
};

export const markNotificationAsRead = async (id) => {
  const response = await axios.post(`${API_BASE}/users/notifications/${id}/read`);
  return response.data;
};

export const trackBroadcastView = async (userId, broadcastId) => {
  const response = await axios.post(`${API_BASE}/users/${userId}/notifications/broadcast/${broadcastId}/view`);
  return response.data;
};

export const acknowledgeBroadcast = async (userId, broadcastId) => {
  const response = await axios.post(`${API_BASE}/users/${userId}/notifications/broadcast/${broadcastId}/acknowledge`);
  return response.data;
};

export const getUserProfiles = async () => {
  const response = await axios.get(`${API_BASE}/users/profiles`);
  return response.data;
};

export const searchUsers = async (query, roles = "") => {
  const response = await axios.get(`${API_BASE}/users/search`, {
    params: { q: query, roles: roles }
  });
  return response.data;
};

/* -------------------- FEEDBACK -------------------- */
export const getFeedbacks = async (params = { skip: 0, limit: 10 }) => {
  const response = await axios.get(`${API_BASE}/feedbacks/`, { params }); // must match FastAPI router
  if (window.DEBUG_MODE) {
    const items = Array.isArray(response.data) ? response.data : (response.data.items || []);
    items.forEach(post => {
      // Find photo upload keys (they could be uuids depending on form config)
      const cData = post.custom_data || {};
      const photoData = {};
      for (const [k, v] of Object.entries(cData)) {
         if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'object' && 'url' in v[0]) {
             photoData[k] = v;
         }
      }
      
      console.log(`[AUDIT:PHOTO_FEED_RECEIVE] post_id=${post.id}`, {
        custom_data: cData,
        photo_upload: photoData
      });
      
      const pUpload = post.custom_data?.photo_upload || [];
      const arr = Array.isArray(pUpload) ? pUpload : [pUpload];
      const count = arr.length > 0 && arr[0] ? arr.length : 0;
      const urls = count > 0 ? arr.map(p => typeof p === 'string' ? p : p?.url || p?.preview) : [];
      console.log(`[AUDIT:FEED_MEDIA] post_id=${post.id} module_type=photo_upload media_count=${count} media_urls=${JSON.stringify(urls)}`);
    });
  }
  return response.data;
};

export const getFeedbackById = async (id) => {
  const response = await axios.get(`${API_BASE}/feedbacks/${id}`);
  return response.data;
};

export const getTrendingFeedbacks = async (limit = 10) => {
  const response = await axios.get(`${API_BASE}/feedbacks/trending`, { params: { limit } });
  return response.data;
};

export const createFeedback = async (feedback) => {
  const response = await axios.post(`${API_BASE}/feedbacks/`, feedback);
  return response.data;
};

export const updateFeedback = async (id, feedback) => {
  const response = await axios.put(`${API_BASE}/feedbacks/${id}`, feedback);
  return response.data;
};

export const deleteFeedback = async (id) => {
  const response = await axios.delete(`${API_BASE}/feedbacks/${id}`);
  return response.data;
};

export const getFeedbackReplies = async (feedbackId, userId = null) => {
  const params = userId ? { user_id: userId } : {};
  const response = await axios.get(`${API_BASE}/feedbacks/${feedbackId}/replies`, { params });
  return response.data;
};

export const createFeedbackReply = async (feedbackId, reply) => {
  const response = await axios.post(`${API_BASE}/feedbacks/${feedbackId}/replies`, reply);
  return response.data;
};

export const updateFeedbackReply = async (feedbackId, replyId, reply) => {
  const response = await axios.put(`${API_BASE}/feedbacks/${feedbackId}/replies/${replyId}`, reply);
  return response.data;
};

export const deleteFeedbackReply = async (feedbackId, replyId) => {
  const response = await axios.delete(`${API_BASE}/feedbacks/${feedbackId}/replies/${replyId}`);
  return response.data;
};

/* -------------------- REACTIONS -------------------- */
export const toggleReaction = async (feedbackId, userId, isLike) => {
  const response = await axios.post(`${API_BASE}/feedbacks/${feedbackId}/reactions`, {
    user_id: userId,
    is_like: isLike
  });
  return response.data;
};

export const toggleReplyReaction = async (feedbackId, replyId, userId, isLike) => {
  const response = await axios.post(`${API_BASE}/feedbacks/${feedbackId}/replies/${replyId}/reactions`, {
    user_id: userId,
    is_like: isLike
  });
  return response.data;
};

export const getReactionsSummary = async (feedbackId, userId) => {
  const params = userId ? { user_id: userId } : {};
  const response = await axios.get(`${API_BASE}/feedbacks/${feedbackId}/reactions`, { params });
  return response.data;
};

/* -------------------- ENTITIES -------------------- */
export const getEntities = async () => {
  const now = Date.now();
  if (apiCache.entities && (now - apiCache.lastFetch.entities < CACHE_TTL)) {
    return apiCache.entities;
  }
  const response = await axios.get(`${API_BASE}/entities/`);
  apiCache.entities = response.data;
  apiCache.lastFetch.entities = now;
  return response.data;
};

export const getEntityFormConfig = async (id) => {
  const response = await axios.get(`${API_BASE}/entities/${id}/form-config`);
  return response.data;
};

export const getBranches = async (entity_id = null) => {
  const params = entity_id ? { entity_id } : {};
  const response = await axios.get(`${API_BASE}/branches/`, { params });
  return response.data;
};

export const getSystemInfo = async () => {
  const response = await axios.get(`${API_BASE}/api/system/info`);
  return response.data;
};

/* -------------------- PRODUCTS -------------------- */
export const getProducts = async (entity_id = null, branch_id = null, only_active = true) => {
  const params = { only_active };
  if (entity_id) params.entity_id = entity_id;
  if (branch_id) params.branch_id = branch_id;
  const response = await axios.get(`${API_BASE}/products/`, { params });
  return response.data;
};

export const createEntity = async (entity) => {
  const response = await axios.post(`${API_BASE}/entities/`, entity);
  return response.data;
};

/* -------------------- DEPARTMENTS -------------------- */
export const getDepartments = async () => {
  const now = Date.now();
  if (apiCache.departments && (now - apiCache.lastFetch.departments < CACHE_TTL)) {
    return apiCache.departments;
  }
  const response = await axios.get(`${API_BASE}/departments/`);
  apiCache.departments = response.data;
  apiCache.lastFetch.departments = now;
  return response.data;
};

export const createDepartment = async (department) => {
  const response = await axios.post(`${API_BASE}/departments/`, department); // match router path
  return response.data;
};

/* -------------------- ANALYTICS -------------------- */
export const getAnalyticsSummary = async () => {
  const response = await axios.get(`${API_BASE}/analytics/dashboard`);
  return response.data;
};

/* -------------------- THEME & SYSTEM -------------------- */
export const getAdminSettings = async () => {
  const response = await axios.get(`${API_BASE}/admin/settings`);
  return response.data;
};

export const getFormFields = async () => {
  const response = await axios.get(`${API_BASE}/admin/form-fields`);
  return response.data;
};

export const updateUserPresence = async (userId, currentModule) => {
  const response = await axios.post(`${API_BASE}/users/${userId}/presence`, {
    current_module: currentModule
  });
  return response.data;
};

/* -------------------- DRAFTS -------------------- */
export const getDrafts = async (userId) => {
  const response = await axios.get(`${API_BASE}/drafts/${userId}`);
  return response.data;
};

export const createDraft = async (userId, draft) => {
  const response = await axios.post(`${API_BASE}/drafts/${userId}`, draft);
  return response.data;
};

export const updateDraft = async (draftId, updates) => {
  const response = await axios.put(`${API_BASE}/drafts/${draftId}`, updates);
  return response.data;
};

export const deleteDraft = async (draftId) => {
  const response = await axios.delete(`${API_BASE}/drafts/${draftId}`);
  return response.data;
};

// (Update functions migrated to adminApi.js for authentication)

export const requestEmailChange = async (userId, newEmail, password) => {
  const response = await axios.post(`${API_BASE}/users/${userId}/request-email-change`, {
    new_email: newEmail,
    password: password
  });
  return response.data;
};

export const confirmEmailChange = async (token) => {
  const response = await axios.post(`${API_BASE}/users/confirm-email-change`, {
    token: token
  });
  return response.data;
};

export const requestPhoneChange = async (userId, newPhone, password) => {
  const response = await axios.post(`${API_BASE}/users/${userId}/request-phone-change`, {
    new_phone: newPhone,
    password: password
  });
  return response.data;
};

export const confirmPhoneChange = async (userId, code) => {
  const response = await axios.post(`${API_BASE}/users/${userId}/confirm-phone-change`, {
    code: code
  });
  return response.data;
};

