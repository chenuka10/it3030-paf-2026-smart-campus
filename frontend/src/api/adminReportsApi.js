import api from './axios';

export const getResourceIssueAnalytics = async () => {
  const { data } = await api.get('/api/tickets/analytics/resources');
  return data;
};

export const getResourceUtilizationAnalytics = async (days = 30) => {
  const { data } = await api.get('/api/bookings/analytics/resources', {
    params: { days },
  });
  return data;
};
