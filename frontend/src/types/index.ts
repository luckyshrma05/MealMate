export interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

export interface EventDish {
  id: number;
  eventId: number;
  dishId: number;
  plannedServings: number;
  dish?: {
    name: string;
    category: string;
  };
}

export interface Event {
  id: number;
  name: string;
  eventType: string;
  eventDate: string; 
  guestCount: number;
  userId: number;
  bufferPercent: number;
  eventDishes: EventDish[];
  status?: string; 
}