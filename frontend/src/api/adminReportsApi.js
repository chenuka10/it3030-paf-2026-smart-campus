import api from './axios';

export const getResourceIssueAnalytics = async () => {
  const { data } = await api.get('/api/tickets/analytics/resources');
  return data;
};
