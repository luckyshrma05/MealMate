import api from './api';
import { Event } from '../types';

export const fetchUserEvents = async (): Promise<Event[]> => {
  const response = await api.get('/events');
  
  return response.data.events; 
};

export const createNewEvent = async (eventData: any) => {
  const response = await api.post('/events', eventData);
  return response.data.event;
};


export const saveEventMenu = async (eventId: string | number, dishes: { dishId: number, plannedServings: number }[]) => {
  const response = await api.put(`/events/${eventId}/dishes`, { dishes });
  return response.data;
};