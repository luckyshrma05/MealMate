import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchDishes } from '../services/catalogService';
import { saveEventMenu } from '../services/eventService';
import { ArrowLeft, Utensils } from 'lucide-react';

export default function SelectDishes() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState<any[]>([]);
  const [selections, setSelections] = useState<{ [dishId: number]: number }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const data = await fetchDishes();
        
        const allDishes = data?.dishes || data || [];
        
        const activeDishes = allDishes.filter((dish: any) => !dish.isDeleted && !dish.deletedAt);
        
        setCatalog(activeDishes); 
      } catch (error) {
        console.error("Failed to load catalog", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCatalog();
  }, []);

  const handleServingsChange = (dishId: number, servings: string) => {
    const value = parseInt(servings, 10);
    setSelections(prev => {
      const updated = { ...prev };
      if (isNaN(value) || value <= 0) {
        delete updated[dishId];
      } else {
        updated[dishId] = value;
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;
    setIsSaving(true);

    const payload = Object.entries(selections).map(([dishId, plannedServings]) => ({
      dishId: parseInt(dishId, 10),
      plannedServings
    }));

    try {
      await saveEventMenu(eventId, payload);
      navigate('/dashboard');
    } catch (error) {
      console.error("Failed to save menu", error);
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-gray-500">Loading available dishes...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-6 font-medium"
        >
          <ArrowLeft size={20} /> Back to Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-green-600 px-8 py-6 text-white flex items-center gap-3">
            <Utensils size={28} />
            <div>
              <h2 className="text-2xl font-bold">Select Menu</h2>
              <p className="text-green-100 text-sm mt-1">Plan the dishes and servings for Event #{eventId}</p>
            </div>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 mb-8">
                {catalog.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No active dishes available in the catalog.</p>
                ) : (
                  catalog.map(dish => (
                    <div key={dish.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-green-300 transition-colors bg-white shadow-sm">
                      <div>
                        <h3 className="font-bold text-gray-900">{dish.name}</h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 mt-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {dish.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700">Servings:</label>
                        <input 
                          type="number" 
                          min="0"
                          placeholder="0"
                          value={selections[dish.id] || ''}
                          onChange={(e) => handleServingsChange(dish.id, e.target.value)}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors text-center"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-4 pt-6 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg font-medium transition-colors border border-gray-300"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving || Object.keys(selections).length === 0}
                  className="flex-1 flex justify-center bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isSaving ? 'Saving Menu...' : 'Save Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}