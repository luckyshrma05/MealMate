import api from './api';

export const getPrices = async () => {
  const response = await api.get('/prices');
  return response.data.data; 
};

export const getPriceByIngredient = async (ingredientId: number | string) => {
  const response = await api.get(`/prices/${ingredientId}`);
  return response.data.data;
};

export const createPrice = async (priceData: { ingredientId: number, pricePerUnit: number }) => {
  const response = await api.post('/prices', priceData);
  return response.data.data;
};

export const updatePrice = async (ingredientId: number | string, pricePerUnit: number) => {
  const response = await api.put(`/prices/${ingredientId}`, { pricePerUnit });
  return response.data.data;
};

export const deletePrice = async (ingredientId: number | string) => {
  const response = await api.delete(`/prices/${ingredientId}`);
  return response.data;
};