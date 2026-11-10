import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchDishes } from '../services/catalogService';
import { saveEventMenu } from '../services/eventService';

export default function SelectDishes() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState<any[]>([]);
  const [selections, setSelections] = useState<{ [dishId: number]: number }>({});
  const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
    const loadCatalog = async () => {
      try {
        const data = await fetchDishes();
        
        // ADD THIS CONSOLE LOG to see exactly what the backend returns
        console.log("RAW BACKEND RESPONSE:", data); 

        // Update state
        setCatalog(data?.dishes || data || []); 
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

    
    const payload = Object.entries(selections).map(([dishId, plannedServings]) => ({
      dishId: parseInt(dishId, 10),
      plannedServings
    }));

    try {
      await saveEventMenu(eventId, payload);
      navigate('/dashboard');
    } catch (error) {
      console.error("Failed to save menu", error);
    }
  };

  if (isLoading) return <div> Loading available dishes...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>
      <h2>Select Dishes for Event #{eventId}</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gap: '15px', marginBottom: '20px' }}>
          {catalog.map(dish => (
            <div key={dish.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
              <div>
                <strong>{dish.name}</strong> ({dish.category})
              </div>
              <div>
                <label style={{ marginRight: '10px' }}>Planned Servings:</label>
                <input 
                  type="number" 
                  min="0"
                  placeholder="0"
                  value={selections[dish.id] || ''}
                  onChange={(e) => handleServingsChange(dish.id, e.target.value)}
                  style={{ width: '80px', padding: '5px' }}
                />
              </div>
            </div>
          ))}
        </div>
        <button 
          type="submit" 
          style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Save Menu
        </button>
      </form>
    </div>
  );
}