import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/authStore';

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user?.role === 'cook') {
      navigate('/cook/dashboard', { replace: true });
    } else if (user?.role === 'member') {
      navigate('/marketplace', { replace: true });
    }
  }, [user, navigate]);

  return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
}
