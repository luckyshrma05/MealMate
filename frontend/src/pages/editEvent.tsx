import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// Ensure these functions exist in your eventService!
import { getEventById, updateEvent } from '../services/eventService';

export default function EditEvent() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    eventType: '',
    eventDate: '',
    guestCount: '',
    bufferPercent: ''
  });

 
  useEffect(() => {
    const loadEvent = async () => {
      if (!eventId) return;
      try {
        const response: any = await getEventById(eventId);
        const event = response.event || response; 
        
        
        const formattedDate = event.eventDate ? new Date(event.eventDate).toISOString().split('T')[0] : '';

        setFormData({
          name: event.name || '',
          eventType: event.eventType || '',
          eventDate: formattedDate,
          guestCount: event.guestCount?.toString() || '',
          bufferPercent: event.bufferPercent?.toString() || ''
        });
      } catch (error) {
        console.error("Failed to fetch event details", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadEvent();
  }, [eventId]);

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;

    try {
      const { name, eventType, eventDate, guestCount, bufferPercent } = formData;
      const formattedEventDate = eventDate ? new Date(eventDate).toISOString().split('T')[0] : '';

      const eventPayload = {
        name,
        eventType,
        eventDate: formattedEventDate,
        guestCount: parseInt(guestCount, 10),
        bufferPercent: parseInt(bufferPercent, 10)
      };

      await updateEvent(eventId, eventPayload);
      console.log('Event updated successfully!');
      navigate('/dashboard'); 
    } catch (error) {
      console.error('Failed to update event', error);
    }
  };

  if (isLoading) return <div>Loading event details...</div>;

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2>Edit Event #{eventId}</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        <label>
          Event Name:
          <input 
            type="text" 
            required 
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </label>

        <label>
          Event Type:
          <input 
            type="text" 
            required 
            value={formData.eventType}
            onChange={(e) => setFormData({...formData, eventType: e.target.value})}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </label>

        <label>
          Date:
          <input 
            type="date" 
            required 
            value={formData.eventDate}
            onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </label>

        <label>
          Guest Count:
          <input 
            type="number" 
            min="1" 
            required 
            value={formData.guestCount}
            onChange={(e) => setFormData({...formData, guestCount: e.target.value})}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </label>

        <label>
          Buffer Percentage (%):
          <input 
            type="number" 
            min="0"
            step="0.1" 
            required 
            value={formData.bufferPercent}
            onChange={(e) => setFormData({...formData, bufferPercent: e.target.value})}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </label>

        <button type="submit" style={{ padding: '10px', background: '#0056b3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Update Event
        </button>
      </form>
    </div>
  );
}