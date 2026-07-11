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
    <div className="min-h-screen bg-stone-50">
      <nav className="bg-white/80 backdrop-blur-sm border-b border-stone-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center shadow-sm shadow-primary-500/20">
                <span className="text-lg">🍳</span>
              </div>
              <h1 className="text-xl font-extrabold text-stone-800 tracking-tight">Cook Dashboard</h1>
            </div>
            <button onClick={() => { logout(); window.location.href = '/login'; }} className="btn-secondary text-sm py-2">Logout</button>
          </div>
          <div className="mt-4 flex gap-1 bg-stone-100 rounded-xl p-1">
            <Link to="/cook/dashboard" className="px-4 py-2 rounded-lg text-sm font-semibold bg-white text-stone-800 shadow-sm transition">Overview</Link>
            <Link to="/cook/menus" className="px-4 py-2 rounded-lg text-sm font-medium text-stone-500 hover:text-stone-700 transition">Menus</Link>
            <Link to="/cook/orders" className="px-4 py-2 rounded-lg text-sm font-medium text-stone-500 hover:text-stone-700 transition">Orders</Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-lg font-bold text-stone-800 mb-6">Dashboard Overview</h2>

        {loading && (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-primary-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="card-static border-l-4 border-l-primary-500 bg-gradient-to-br from-primary-50/50 to-white">
              <p className="text-sm font-medium text-stone-500">Active Menus</p>
              <p className="text-3xl font-extrabold text-primary-600 mt-1">{stats.activeMenus}</p>
              <Link to="/cook/menus" className="text-xs font-semibold text-primary-500 hover:text-primary-700 mt-3 inline-block">Manage →</Link>
            </div>
            <div className="card-static border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-50/50 to-white">
              <p className="text-sm font-medium text-stone-500">Total Orders</p>
              <p className="text-3xl font-extrabold text-emerald-600 mt-1">{stats.totalOrders}</p>
              <Link to="/cook/orders" className="text-xs font-semibold text-emerald-500 hover:text-emerald-700 mt-3 inline-block">View →</Link>
            </div>
            <div className="card-static border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50/50 to-white">
              <p className="text-sm font-medium text-stone-500">Pending</p>
              <p className="text-3xl font-extrabold text-amber-600 mt-1">{stats.pendingOrders}</p>
              <p className="text-xs text-amber-500 mt-3">Need attention</p>
            </div>
            <div className="card-static border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50/50 to-white">
              <p className="text-sm font-medium text-stone-500">Revenue</p>
              <p className="text-3xl font-extrabold text-purple-600 mt-1">${stats.revenue}</p>
              <p className="text-xs text-purple-400 mt-3">All time</p>
            </div>
          </div>
        )}

        <div className="card-static">
          <h3 className="text-lg font-bold text-stone-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Link to="/cook/menus?create=true" className="btn-primary text-center">+ Create New Menu</Link>
            <Link to="/cook/orders" className="btn-secondary text-center font-semibold">View All Orders</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
