import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/authContext';

interface ProtectedRouteProps {
  children: JSX.Element;
  allowedRoles?: ("ADMIN" | "USER")[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const auth = useContext(AuthContext);

  if (auth?.isLoading) {
    return <div style={{ padding: "20px" }}>Verifying session...</div>;
  }

  if (!auth?.token || !auth?.user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(auth.user.role)) {
    return <Navigate to={auth.user.role === "ADMIN" ? "/admin" : "/dashboard"} replace />;
  }

  return children;
};