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