import axios from "axios";

// Base URL for your FastAPI backend
const API_BASE = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:8000`;
const BASE = `${API_BASE}/admin`;

const adminApi = axios.create({ baseURL: BASE });


// Auth
export const adminLogin = (email, password) =>
  adminApi.post(`/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`).then(r => r.data);

// Analytics
export const getAnalyticsSummary = () => adminApi.get("/analytics/summary").then(r => r.data);
export const getAnalyticsVolume = (days = 30) => adminApi.get(`/analytics/volume?days=${days}`).then(r => r.data);
export const getAnalyticsByCategory = () => adminApi.get("/analytics/by-category").then(r => r.data);
export const getAnalyticsByDepartment = () => adminApi.get("/analytics/by-department").then(r => r.data);
export const getAnalyticsByStatus = () => adminApi.get("/analytics/by-status").then(r => r.data);
export const getAnalyticsRatings = () => adminApi.get("/analytics/ratings").then(r => r.data);
export const getTopUsers = (limit = 10) => adminApi.get(`/analytics/top-users?limit=${limit}`).then(r => r.data);
export const getAnalyticsEngagement = (days = 30) => adminApi.get(`/analytics/engagement?days=${days}`).then(r => r.data);
export const getAnalyticsByLocation = () => adminApi.get("/analytics/by-location").then(r => r.data);
export const getAnalyticsSentiment = () => adminApi.get("/analytics/sentiment").then(r => r.data);

// Users
export const adminGetUsers = () => adminApi.get("/users").then(r => r.data);
export const adminToggleUserStatus = (id, isActive) => adminApi.put(`/users/${id}/status?is_active=${isActive}`).then(r => r.data);
export const adminDeleteUser = (id) => adminApi.delete(`/users/${id}`);

// Feedbacks
export const adminGetFeedbacks = (params = {}) => {
  const q = new URLSearchParams();
  if (params.status) q.set("status", params.status);
  if (params.category_id) q.set("category_id", params.category_id);
  q.set("skip", params.skip || 0);
  q.set("limit", params.limit || 50);
  return adminApi.get(`/feedbacks?${q.toString()}`).then(r => r.data);
};
export const adminUpdateFeedbackStatus = (id, status) => adminApi.put(`/feedbacks/${id}/status?status=${status}`).then(r => r.data);
export const adminDeleteFeedback = (id) => adminApi.delete(`/feedbacks/${id}`);

// Departments
export const adminGetDepartments = () => adminApi.get("/departments").then(r => r.data);
export const adminCreateDepartment = (name) => adminApi.post(`/departments?name=${encodeURIComponent(name)}`).then(r => r.data);
export const adminUpdateDepartment = (id, name) => adminApi.put(`/departments/${id}?name=${encodeURIComponent(name)}`).then(r => r.data);
export const adminDeleteDepartment = (id) => adminApi.delete(`/departments/${id}`);

// Categories
export const adminGetCategories = () => adminApi.get("/categories").then(r => r.data);
export const adminCreateCategory = (name, description = "", fields = []) => 
  adminApi.post("/categories", { name, description, fields }).then(r => r.data);
export const adminUpdateCategory = (id, name, description = "", fields = []) => 
  adminApi.put(`/categories/${id}`, { name, description, fields }).then(r => r.data);
export const adminDeleteCategory = (id) => adminApi.delete(`/categories/${id}`);

// Broadcast
export const adminBroadcast = (subject, message) => 
  adminApi.post(`/broadcast?subject=${encodeURIComponent(subject)}&message=${encodeURIComponent(message)}`).then(r => r.data);
export const adminGetBroadcastLogs = () => adminApi.get("/broadcasts").then(r => r.data);

// Moderation
export const adminGetPendingSuggestions = () => adminApi.get("/pending-suggestions").then(r => r.data);
export const adminApproveSuggestion = (id, approvedName) => 
  adminApi.post(`/approve-suggestion?feedback_id=${id}&approved_name=${encodeURIComponent(approvedName)}`).then(r => r.data);
