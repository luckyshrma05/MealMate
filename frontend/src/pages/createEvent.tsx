import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { createNewEvent } from '../services/eventService'; 
import { ArrowLeft, CalendarPlus } from 'lucide-react';

export default function CreateEvent() {
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [guestCount, setGuestCount] = useState('100');
  const [eventType, setEventType] = useState('Party');
  const [bufferPercent, setBufferPercent] = useState('10');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const payload = {
        name,
        eventDate,
        guestCount: Number(guestCount),
        eventType,
        bufferPercent: Number(bufferPercent)
      };
      
      // CALLING YOUR EXACT FUNCTION
      const response = await createNewEvent(payload); 
      
      const newEventId = response.id || response.event?.id;
      if (newEventId) {
        navigate(`/events/${newEventId}/dishes`);
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-6 font-medium"
        >
          <ArrowLeft size={20} /> Back to Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-blue-600 px-8 py-6 text-white flex items-center gap-3">
            <CalendarPlus size={28} />
            <div>
              <h2 className="text-2xl font-bold">Create New Event</h2>
              <p className="text-blue-100 text-sm mt-1">Set up your event details to start planning the menu.</p>
            </div>
          </div>

          <div className="p-8">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm mb-6 border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
                <input 
                  type="text" 
                  required 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="e.g., Annual Tech Conference Dinner"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input 
                    type="date" 
                    required 
                    value={eventDate} 
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                  <select 
                    value={eventType} 
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
                  >
                    <option value="Party">Party</option>
                    <option value="Wedding">Wedding</option>
                    <option value="Corporate">Corporate Event</option>
                    <option value="Catering">General Catering</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Guest Count</label>
                  <input 
                    type="number" 
                    min="1"
                    required 
                    value={guestCount} 
                    onChange={(e) => setGuestCount(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="e.g., 150"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Food Buffer (%)</label>
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    step="0.1"
                    required 
                    value={bufferPercent} 
                    onChange={(e) => setBufferPercent(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="e.g., 10"
                  />
                  <p className="text-xs text-gray-500 mt-1">Extra ingredient buffer for safety.</p>
                </div>
              </div>

              <div className="flex gap-4 pt-6 mt-6 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg font-medium transition-colors border border-gray-300"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="flex-1 flex justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isLoading ? 'Saving...' : 'Create & Select Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}