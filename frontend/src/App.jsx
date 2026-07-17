import { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from './context/authStore';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MemberMarketplacePage from './pages/MemberMarketplacePage';
import MenuDetailPage from './pages/MenuDetailPage';
import MemberOrdersPage from './pages/MemberOrdersPage';
import MemberOrderDetailPage from './pages/MemberOrderDetailPage';
import CookDashboardPage from './pages/CookDashboardPage';
import CookMenusPage from './pages/CookMenusPage';
import CookOrdersPage from './pages/CookOrdersPage';
import CookOrderDetailPage from './pages/CookOrderDetailPage';
import SplashPage from './pages/SplashPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import './index.css';

function ProtectedRoute({ children }) {
  const token = useAuthStore((state) => state.token);
  const isInitializing = useAuthStore((state) => state.isInitializing);
  if (isInitializing) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  return token ? children : <Navigate to="/login" replace />;
}

function CookRoute({ children }) {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const isInitializing = useAuthStore((state) => state.isInitializing);
  if (isInitializing) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  return token && user?.role === 'cook' ? children : <Navigate to="/dashboard" replace />;
}

function MemberRoute({ children }) {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const isInitializing = useAuthStore((state) => state.isInitializing);
  if (isInitializing) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  return token && user?.role === 'member' ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const token = useAuthStore((state) => state.token);
  const { i18n } = useTranslation();
  const [animating, setAnimating] = useState(false);
  const prevLang = useRef(i18n.language);

  useEffect(() => {
    const isVerifyPage = window.location.pathname === '/verify-email';
    if (token && !isVerifyPage) fetchUser();
  }, []);

  useEffect(() => {
    if (i18n.language !== prevLang.current) {
      prevLang.current = i18n.language;
      setAnimating(true);
      setTimeout(() => setAnimating(false), 1000);
    }
  }, [i18n.language]);

  return (
    <Router>
      <div className={animating ? 'lang-fade' : ''}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
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
              <MemberRoute>
                <MemberMarketplacePage />
              </MemberRoute>
            }
          />
          <Route
            path="/marketplace/menu/:menuId"
            element={
              <MemberRoute>
                <MenuDetailPage />
              </MemberRoute>
            }
          />
          <Route
            path="/marketplace/orders"
            element={
              <MemberRoute>
                <MemberOrdersPage />
              </MemberRoute>
            }
          />
          <Route
            path="/marketplace/orders/:orderId"
            element={
              <MemberRoute>
                <MemberOrderDetailPage />
              </MemberRoute>
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
          <Route
            path="/cook/orders/:orderId"
            element={
              <CookRoute>
                <CookOrderDetailPage />
              </CookRoute>
            }
          />
          <Route path="/" element={<SplashPage />} />
        </Routes>
      </div>
    </Router>
  );
}
