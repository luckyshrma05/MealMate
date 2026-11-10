import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getEventById, updateEvent } from '../services/eventService'; 
import { ArrowLeft, Edit } from 'lucide-react';

export default function EditEvent() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [name, setName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [eventType, setEventType] = useState('Party');
  const [bufferPercent, setBufferPercent] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadEvent = async () => {
      try {
        if (!id) return;
        const data = await getEventById(id);
        const event = data.event || data; // Handle different backend response structures
        
        setName(event.name);
        // Format date for the HTML date input (YYYY-MM-DD)
        setEventDate(new Date(event.eventDate).toISOString().split('T')[0]);
        setGuestCount(String(event.guestCount));
        setEventType(event.eventType);
        setBufferPercent(String(event.bufferPercent));
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load event details.');
      } finally {
        setIsLoading(false);
      }
    };
    loadEvent();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      const payload = {
        name,
        eventDate,
        guestCount: Number(guestCount),
        eventType,
        bufferPercent: Number(bufferPercent)
      };
      
      if (id) {
        await updateEvent(id, payload);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update event. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-gray-500">Loading event details...</p></div>;
  }

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
            <Edit size={28} />
            <div>
              <h2 className="text-2xl font-bold">Edit Event</h2>
              <p className="text-blue-100 text-sm mt-1">Update your event details and logistics.</p>
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
                  />
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
                  disabled={isSaving}
                  className="flex-1 flex justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isSaving ? 'Saving Updates...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}