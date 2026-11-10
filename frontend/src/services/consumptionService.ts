import api from './api';

export const createConsumptionRecord = async (recordData: {
  eventId: number;
  dishId: number;
  unit: string;
  prepared: number;
  consumed: number;
  enteredLeftover?: number;
}) => {
  const response = await api.post('/consumption', recordData);
  return response.data.data;
};

export const getConsumptionByEvent = async (eventId: number | string) => {
  const response = await api.get(`/consumption/event/${eventId}`);
  return response.data.data;
};

export const getAllConsumptionRecords = async () => {
  const response = await api.get('/consumption/all');
  return response.data.data;
};