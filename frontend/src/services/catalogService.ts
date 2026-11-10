import api from './api';


export const fetchDishes = async () => {
  const response = await api.get('/dishes');
  return response.data.dishes; 
};

export const getRecipe = async (dishId: number | string) => {
  const response = await api.get(`/dishes/${dishId}/recipe`);
  return response.data.dish; 
};

export const createDish = async (data: { name: string; category: string; description?: string; recipeServings: number }) => {
  const response = await api.post('/dishes', data);
  return response.data.dish;
};

export const updateDish = async (id: number | string, data: { name: string; category: string; description?: string; recipeServings: number }) => {
  const response = await api.put(`/dishes/${id}`, data);
  return response.data.dish;
};

export const deleteDish = async (id: number | string) => {
  const response = await api.delete(`/dishes/${id}`);
  return response.data;
};

export const setRecipe = async (dishId: number | string, ingredients: { ingredientId: number; quantity: number }[]) => {
  const response = await api.put(`/dishes/${dishId}/recipe`, { ingredients });
  return response.data;
};


export const fetchIngredients = async () => {
  const response = await api.get('/ingredients');
  return response.data.ingredients; 
};

export const createIngredient = async (data: { name: string, unit: string }) => {
  const response = await api.post('/ingredients', data);
  return response.data.ingredient;
};

export const updateIngredient = async (id: number | string, data: { name: string, unit: string }) => {
  const response = await api.put(`/ingredients/${id}`, data);
  return response.data.ingredient;
};

export const deleteIngredient = async (id: number | string) => {
  const response = await api.delete(`/ingredients/${id}`);
  return response.data;
};