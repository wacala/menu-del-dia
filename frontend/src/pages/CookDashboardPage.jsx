import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../context/authStore';
import { menusAPI, ordersAPI } from '../api';

export default function CookDashboardPage() {
  const [stats, setStats] = useState({
    activeMenus: 0,
    totalOrders: 0,
    pendingOrders: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const { logout } = useAuthStore();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get all menus to count active ones
      const menusResponse = await menusAPI.list();
      const activeMenus = menusResponse.data.menus?.filter(
        (m) => m.status === 'published',
      ).length || 0;

      // Get cook's orders
      const ordersResponse = await ordersAPI.listCookOrders();
      const orders = ordersResponse.data.orders || [];
      const pendingOrders = orders.filter((o) => o.status === 'pending').length;
      const revenue = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

      setStats({
        activeMenus,
        totalOrders: orders.length,
        pendingOrders,
        revenue: revenue.toFixed(2),
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">🍳 Cook Dashboard</h1>
            <button
              onClick={() => {
                logout();
                window.location.href = '/login';
              }}
              className="btn-secondary"
            >
              Logout
            </button>
          </div>
          <div className="mt-4 flex gap-4 border-b">
            <Link to="/cook/dashboard" className="pb-2 border-b-2 border-blue-500 text-blue-600 font-medium">
              Overview
            </Link>
            <Link to="/cook/menus" className="pb-2 text-gray-600 hover:text-gray-900">
              Menus
            </Link>
            <Link to="/cook/orders" className="pb-2 text-gray-600 hover:text-gray-900">
              Orders
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold mb-6">Dashboard Overview</h2>

        {loading && <p className="text-gray-500">Loading stats...</p>}

        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Active Menus */}
            <div className="card bg-blue-50 border-l-4 border-blue-500">
              <div className="text-sm text-gray-600 font-medium">Active Menus</div>
              <div className="text-3xl font-bold text-blue-600 mt-2">{stats.activeMenus}</div>
              <Link to="/cook/menus" className="text-sm text-blue-500 hover:underline mt-3 block">
                Manage Menus →
              </Link>
            </div>

            {/* Total Orders */}
            <div className="card bg-green-50 border-l-4 border-green-500">
              <div className="text-sm text-gray-600 font-medium">Total Orders</div>
              <div className="text-3xl font-bold text-green-600 mt-2">{stats.totalOrders}</div>
              <Link to="/cook/orders" className="text-sm text-green-500 hover:underline mt-3 block">
                View Orders →
              </Link>
            </div>

            {/* Pending Orders */}
            <div className="card bg-orange-50 border-l-4 border-orange-500">
              <div className="text-sm text-gray-600 font-medium">Pending Orders</div>
              <div className="text-3xl font-bold text-orange-600 mt-2">{stats.pendingOrders}</div>
              <div className="text-xs text-orange-600 mt-3">Need your attention</div>
            </div>

            {/* Revenue */}
            <div className="card bg-purple-50 border-l-4 border-purple-500">
              <div className="text-sm text-gray-600 font-medium">Total Revenue</div>
              <div className="text-3xl font-bold text-purple-600 mt-2">${stats.revenue}</div>
              <div className="text-xs text-purple-600 mt-3">All time</div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/cook/menus/create"
              className="btn-primary inline-block text-center"
            >
              + Create New Menu
            </Link>
            <Link
              to="/cook/orders"
              className="btn-primary inline-block text-center"
            >
              View All Orders
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
