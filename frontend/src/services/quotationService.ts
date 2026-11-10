import api from './api';

export const createQuotation = async (eventId: number | string) => {
  
  const response = await api.post('/quotations', { eventId });
  return response.data.data;
};

export const getQuotationsByEvent = async (eventId: number | string) => {
  const response = await api.get(`/quotations/event/${eventId}`);
  return response.data.data;
};

export const getQuotationById = async (quotationId: number | string) => {
  const response = await api.get(`/quotations/${quotationId}`);
  return response.data.data;
};

export const getAllQuotations = async () => {
  const response = await api.get('/quotations/all');
  return response.data.data;
};