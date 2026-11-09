import api from './api';

export const fetchDishes = async () => {
  const response = await api.get('/dish');
  
  return response.data.dishes;
};