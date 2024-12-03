import { useAuth } from '@/hooks/AuthProvider.tsx';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = () => {
  const { token } = useAuth();
  if (!token) return <Navigate to={'/'} />;
  return <Outlet />;
};

export default PrivateRoute;
