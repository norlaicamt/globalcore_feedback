// frontend/src/services/api.js
import axios from "axios";

// Base URL for your FastAPI backend
const API_BASE = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:8000`;

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

export const getUserProfiles = async () => {
  const response = await axios.get(`${API_BASE}/users/profiles`);
  return response.data;
};

/* -------------------- FEEDBACK -------------------- */
export const getFeedbacks = async (params = { skip: 0, limit: 10 }) => {
  const response = await axios.get(`${API_BASE}/feedbacks/`, { params }); // must match FastAPI router
  return response.data;
};

export const getFeedbackById = async (id) => {
  const response = await axios.get(`${API_BASE}/feedbacks/${id}`);
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
  const response = await axios.get(`${API_BASE}/entities/`);
  return response.data;
};

export const getSystemInfo = async () => {
  const response = await axios.get(`${API_BASE}/system/info`);
  return response.data;
};

export const createEntity = async (entity) => {
  const response = await axios.post(`${API_BASE}/entities/`, entity);
  return response.data;
};

/* -------------------- DEPARTMENTS -------------------- */
export const getDepartments = async () => {
  const response = await axios.get(`${API_BASE}/departments/`); // fixed typo: "departmens" → "departments"
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

// (Update functions migrated to adminApi.js for authentication)
