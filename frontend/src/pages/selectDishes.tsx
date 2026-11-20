import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchDishes } from '../services/catalogService';
import { fetchEventMenu, saveEventMenu } from '../services/eventService';
import { ArrowLeft, Utensils } from 'lucide-react';

export default function SelectDishes() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState<any[]>([]);
  const [selections, setSelections] = useState<{ [dishId: number]: number }>({});
  const [hasExistingMenu, setHasExistingMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadCatalogAndMenu = async () => {
      try {
        const [catalogData, savedMenuData] = await Promise.all([
          fetchDishes(),
          eventId ? fetchEventMenu(eventId) : Promise.resolve({ dishes: [] }),
        ]);

        const allDishes = catalogData?.dishes || catalogData || [];
        const activeDishes = allDishes.filter(
          (dish: any) => dish.isActive !== false && !dish.isDeleted && !dish.deletedAt
        );
        setCatalog(activeDishes);

        // Pre-populate selections from the last saved menu (active dishes only)
        const activeIds = new Set(activeDishes.map((d: any) => d.id));
        const savedDishes = savedMenuData?.dishes || [];
        const initialSelections: { [dishId: number]: number } = {};

        for (const item of savedDishes) {
          const id = item.dishId ?? item.dish?.id;
          if (id && item.plannedServings > 0 && activeIds.has(id)) {
            initialSelections[id] = item.plannedServings;
          }
        }

        setSelections(initialSelections);
        setHasExistingMenu(Object.keys(initialSelections).length > 0);
      } catch (error) {
        console.error("Failed to load catalog or saved menu", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCatalogAndMenu();
  }, [eventId]);

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
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading available dishes...</p>
      </div>
    );
  }

  const estimatedTotal = catalog.reduce((sum, dish) => {
    const servings = selections[dish.id] || 0;
    return sum + servings * Number(dish.pricePerServing || 0);
  }, 0);

  return (
    <div className="min-h-[calc(100vh-65px)] bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-6 font-medium"
        >
          <ArrowLeft size={20} /> Back to Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-green-600 px-8 py-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Utensils size={28} />
              <div>
                <h2 className="text-2xl font-bold">Select Menu</h2>
                <p className="text-green-100 text-sm mt-1">
                  {hasExistingMenu
                    ? `Showing your last saved menu for Event #${eventId}`
                    : `Plan the dishes and servings for Event #${eventId}`}
                </p>
              </div>
            </div>
            {hasExistingMenu && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500 text-white border border-green-400">
                {Object.keys(selections).length} Selected
              </span>
            )}
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 mb-6">
                {catalog.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No active dishes available in the catalog.</p>
                ) : (
                  catalog.map(dish => {
                    const price = Number(dish.pricePerServing || 0);
                    const servings = selections[dish.id] || 0;
                    const dishSubtotal = servings * price;
                    const isSelected = servings > 0;

                    return (
                      <div
                        key={dish.id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg transition-colors shadow-sm ${
                          isSelected
                            ? 'border-green-400 bg-green-50/40'
                            : 'border-gray-200 hover:border-green-300 bg-white'
                        }`}
                      >
                        <div>
                          <h3 className="font-bold text-gray-900">{dish.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {dish.category}
                            </span>
                            <span className="text-sm font-semibold text-green-700">
                              ₹{price.toFixed(2)} / serving
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {isSelected && (
                            <span className="text-sm font-medium text-gray-500">
                              ₹{dishSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          )}
                          <label className="text-sm font-medium text-gray-700">Servings:</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={selections[dish.id] || ''}
                            onChange={(e) => handleServingsChange(dish.id, e.target.value)}
                            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors text-center bg-white"
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex justify-between items-center bg-gray-50 border border-gray-200 rounded-lg px-5 py-4 mb-6">
                <span className="text-sm font-medium text-gray-600">
                  Estimated Menu Cost (before buffer &amp; adjustments)
                </span>
                <span className="text-xl font-bold text-gray-900">
                  ₹{estimatedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
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
                  disabled={isSaving || (!hasExistingMenu && Object.keys(selections).length === 0)}
                  className="flex-1 flex justify-center bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isSaving ? 'Saving Menu...' : hasExistingMenu ? 'Update Menu' : 'Save Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}