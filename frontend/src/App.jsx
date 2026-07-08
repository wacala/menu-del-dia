import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './context/authStore';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MemberMarketplacePage from './pages/MemberMarketplacePage';
import CookDashboardPage from './pages/CookDashboardPage';
import CookMenusPage from './pages/CookMenusPage';
import CookOrdersPage from './pages/CookOrdersPage';
import './index.css';

function ProtectedRoute({ children }) {
  const token = useAuthStore((state) => state.token);
  return token ? children : <Navigate to="/login" replace />;
}

function CookRoute({ children }) {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  return token && user?.role === 'cook' ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketplace"
          element={
            <ProtectedRoute>
              <MemberMarketplacePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cook/dashboard"
          element={
            <CookRoute>
              <CookDashboardPage />
            </CookRoute>
          }
        />
        <Route
          path="/cook/menus"
          element={
            <CookRoute>
              <CookMenusPage />
            </CookRoute>
          }
        />
        <Route
          path="/cook/orders"
          element={
            <CookRoute>
              <CookOrdersPage />
            </CookRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
