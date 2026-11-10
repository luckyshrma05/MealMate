import { useEffect, useState, useContext } from 'react';
import { fetchUserEvents } from '../services/eventService';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/authContext';
import { Calendar, Users, Percent, LogOut } from 'lucide-react';

export default function Dashboard() {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

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

  const handleLogout = () => {
    auth?.logout();
    navigate('/login');
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-gray-500 text-lg">Loading your events...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">MealMate</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 font-medium">Hello, {auth?.user?.name}</span>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">My Events</h2>
            <p className="mt-1 text-sm text-gray-500">Manage and plan menus for your upcoming events.</p>
          </div>
          <button 
            onClick={() => navigate('/events/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-colors"
          >
            + Create New Event
          </button>
        </div>

        {events.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No upcoming events</h3>
            <p className="text-gray-500 mb-6">Get started by creating your first event.</p>
            <button onClick={() => navigate('/events/new')} className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg font-medium transition-colors">
              Create Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div key={event.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow flex flex-col">
                <div className="mb-4 flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{event.name}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {event.eventType}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mt-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-400" />
                      <span>{new Date(event.eventDate).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-gray-400" />
                      <span>{event.guestCount} Guests</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Percent size={16} className="text-gray-400" />
                      <span>{event.bufferPercent}% Buffer</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex gap-3 pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => navigate(`/events/${event.id}/edit`)}
                    className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-200"
                  >
                    Edit Details
                  </button>
                  <button 
                    onClick={() => navigate(`/events/${event.id}/dishes`)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                  >
                    Select Menu
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}