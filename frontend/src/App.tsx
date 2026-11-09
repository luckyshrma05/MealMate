import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/authContext';
import { ProtectedRoute } from './components/ProtectedRoutes';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateEvent from './pages/createEvent';
import SelectDishes from './pages/selectDishes';
  
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/create-event" element={
            <ProtectedRoute>
              <CreateEvent />
            </ProtectedRoute>
          } />

          <Route path="/events/:eventId/dishes" element={
              <ProtectedRoute>
                  <SelectDishes />
              </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
