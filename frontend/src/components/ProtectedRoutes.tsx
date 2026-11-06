import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/authContext';

export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const auth = useContext(AuthContext);

  if (auth?.isLoading) {
    return <div>Verifying session...</div>;
  }

  if (!auth?.token) {
    return <Navigate to="/" replace />;
  }

  return children;
};