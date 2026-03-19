// frontend/src/services/api.js
import axios from "axios";

// Base URL for your FastAPI backend
const API_BASE = "http://127.0.0.1:8000";

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

/* -------------------- FEEDBACK -------------------- */
export const getFeedbacks = async () => {
  const response = await axios.get(`${API_BASE}/feedbacks/`); // must match FastAPI router
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

/* -------------------- CATEGORIES -------------------- */
export const getCategories = async () => {
  const response = await axios.get(`${API_BASE}/categories/`);
  return response.data;
};

export const createCategory = async (category) => {
  const response = await axios.post(`${API_BASE}/categories/`, category);
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