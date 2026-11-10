import api from './api';

export const getAdminWasteReport = async () => {
  const response = await api.get('/reports/admin');
  return response.data.data;
};

export const getEventWasteReport = async (eventId: number | string) => {
  const response = await api.get(`/reports/event/${eventId}`);
  return response.data.data;
};