import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createNewEvent } from '../services/eventService';

export default function CreateEvent() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    eventType: '',
    eventDate: '',
    guestCount: '',
    bufferPercent: '10' 
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
    
    const payload = {
      name: formData.name,
      eventType: formData.eventType,
      eventDate: new Date(formData.eventDate).toISOString(),
      guestCount: parseInt(formData.guestCount, 10),
      bufferPercent: parseFloat(formData.bufferPercent)
    };

    await createNewEvent(payload);
    
    navigate('/dashboard'); 
  } catch (error) {
    console.error("Failed to create event", error);
   
  }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2>Create New Event</h2>
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
            type="datetime-local" 
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
          Save Event
        </button>
      </form>
    </div>
  );
}