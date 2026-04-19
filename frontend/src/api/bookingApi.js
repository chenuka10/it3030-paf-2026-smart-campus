import api from './axios';

export const getMyBookings = async () => {
  const response = await api.get('/api/bookings/my');
  return response.data;
};

export const getBookingById = async (bookingId) => {
  const response = await api.get(`/api/bookings/${bookingId}`);
  return response.data;
};

export const createBooking = async (payload) => {
  const response = await api.post('/api/bookings', payload);
  return response.data;
};

export const updateBooking = async (bookingId, payload) => {
  const response = await api.put(`/api/bookings/${bookingId}`, payload);
  return response.data;
};

export const cancelBooking = async (bookingId) => {
  const response = await api.put(`/api/bookings/${bookingId}/cancel`);
  return response.data;
};

export const getAllResources = async () => {
  const response = await api.get('/api/resources');
  return response.data;
};

export const getResourceAvailability = async (resourceId, date) => {
  const response = await api.get(`/api/bookings/resource/${resourceId}/availability`, {
    params: { date },
  });
  return response.data;
};

export const getAllBookings = async () => {
  const response = await api.get('/api/bookings');
  return response.data;
};

export const approveBooking = async (bookingId) => {
  const response = await api.put(`/api/bookings/${bookingId}/approve`);
  return response.data;
};

export const rejectBooking = async (bookingId, reason) => {
  const response = await api.put(`/api/bookings/${bookingId}/reject`, {
    reason,
  });
  return response.data;
};

export const checkInBooking = async (qrToken) => {
  const response = await api.post('/api/bookings/check-in', {
    qrToken,
  });
  return response.data;
};