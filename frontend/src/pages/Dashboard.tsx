import { useEffect, useState } from 'react';
import { fetchUserEvents } from '../services/eventService';
import { useNavigate } from 'react-router-dom';
import { Event } from '../types';

export default function Dashboard() {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data: any = await fetchUserEvents();
        setEvents(data);
      } catch (error) {
        console.error("Failed to fetch events", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, []);

  if (isLoading) return <div>Loading your events...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>My Events</h1>
        <button 
          onClick={() => navigate('/events/new')}
          style={{ padding: '10px 20px', cursor: 'pointer', background: '#0056b3', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          + Create New Event
        </button>
      </div>

      {events.length === 0 ? (
        <p>You have no upcoming events. Create one to get started!</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {events.map((event) => (
            <li 
              key={event.id} 
              style={{ border: '1px solid #ccc', margin: '10px 0', padding: '15px', borderRadius: '8px' }}
            >
              <h3>{event.name}</h3>
              <p><strong>Type:</strong> {event.eventType} | <strong>Date:</strong> {new Date(event.eventDate).toLocaleDateString()}</p>
              <p><strong>Guests:</strong> {event.guestCount} | <strong>Buffer:</strong> {event.bufferPercent}%</p>
              
              <div style={{ marginTop: '15px' }}>
                <button style={{ padding: '8px 12px', cursor: 'pointer' }}>
                  Edit Event
                </button>
                <button 
                  onClick={() => navigate(`/events/${event.id}/dishes`)}
                  style={{ marginLeft: '10px', padding: '8px 12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Select Dishes
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}