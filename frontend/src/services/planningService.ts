import api from './api';

export const getRules = async () => {
  const response = await api.get('/planning/rules');
  return response.data;
};

export const updateRule = async (name: string, value: number) => {
  const response = await api.put('/planning/rules', { name, value });
  return response.data.rule;
};