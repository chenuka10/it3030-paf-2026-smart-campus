import axios from 'axios';

const API_BASE_URL = 'http://localhost:8081/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // Adjust based on your auth
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==================== TICKET ENDPOINTS ====================

/**
 * Create a new ticket with attachments
 */
export const createTicket = async (ticketData, attachments) => {
  const formData = new FormData();
  
  // Add ticket fields as individual form-data fields
  formData.append('resourceId', ticketData.resourceId);
  formData.append('category', ticketData.category);
  formData.append('description', ticketData.description);
  formData.append('priority', ticketData.priority);
  formData.append('contactEmail', ticketData.contactEmail);
  if (ticketData.contactPhone) {
    formData.append('contactPhone', ticketData.contactPhone);
  }
  
  // Add attachments (up to 3 files)
  if (attachments && attachments.length > 0) {
    attachments.forEach((file) => {
      formData.append('attachments', file);
    });
  }
  
  const response = await api.post('/tickets', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  
  return response.data;
};

/**
 * Get all tickets with optional filters
 */
export const getAllTickets = async (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.status) params.append('status', filters.status);
  if (filters.priority) params.append('priority', filters.priority);
  if (filters.assignedTechnicianId) params.append('assignedTechnicianId', filters.assignedTechnicianId);
  
  const response = await api.get(`/tickets?${params.toString()}`);
  return response.data;
};

/**
 * Get current user's tickets
 */
export const getMyTickets = async () => {
  const response = await api.get('/tickets/my');
  return response.data;
};

/**
 * Get ticket by ID
 */
export const getTicketById = async (ticketId) => {
  const response = await api.get(`/tickets/${ticketId}`);
  return response.data;
};

/**
 * Update ticket status (Admin/Technician only)
 */
export const updateTicketStatus = async (ticketId, statusData) => {
  const response = await api.patch(`/tickets/${ticketId}/status`, statusData);
  return response.data;
};

/**
 * Delete ticket (Admin only)
 */
export const deleteTicket = async (ticketId) => {
  await api.delete(`/tickets/${ticketId}`);
};

// ==================== COMMENT ENDPOINTS ====================

/**
 * Get all comments for a ticket
 */
export const getTicketComments = async (ticketId) => {
  const response = await api.get(`/tickets/${ticketId}/comments`);
  return response.data;
};

/**
 * Add a comment to a ticket
 */
export const addComment = async (ticketId, commentText) => {
  const response = await api.post(`/tickets/${ticketId}/comments`, {
    commentText
  });
  return response.data;
};

/**
 * Update a comment
 */
export const updateComment = async (ticketId, commentId, commentText) => {
  const response = await api.put(`/tickets/${ticketId}/comments/${commentId}`, {
    commentText
  });
  return response.data;
};

/**
 * Delete a comment
 */
export const deleteComment = async (ticketId, commentId) => {
  await api.delete(`/tickets/${ticketId}/comments/${commentId}`);
};

// ==================== HELPER ====================

/**
 * Get attachment URL
 */
export const getAttachmentUrl = (filePath) => {
  return `http://localhost:8081${filePath}`;
};