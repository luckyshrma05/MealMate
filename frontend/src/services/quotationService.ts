import api from './api';


export const getQuotationsByEvent = async (eventId: string | number) => {
  const response = await api.get(`/quotations/event/${eventId}`);
  
  return response.data.data || response.data;
};


export const createQuotation = async (eventId: string | number) => {
  
  const payload = { eventId: Number(eventId) };
  
  const response = await api.post('/quotations', payload);
  return response.data;
};


export const getAllQuotations = async () => {
  const response = await api.get('/quotations/all');
  return response.data.data || response.data;
};