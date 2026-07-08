import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/authStore';
import { menusAPI } from '../api';

export default function MemberMarketplacePage() {
  const [menus, setMenus] = useState([]);
  const [filteredMenus, setFilteredMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  useEffect(() => {
    fetchMenus();
  }, [selectedDate]);

  useEffect(() => {
    filterMenus();
  }, [menus, searchTerm]);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const response = await menusAPI.list(selectedDate);
      setMenus(response.data.menus || []);
    } catch (error) {
      console.error('Failed to load menus:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterMenus = () => {
    const filtered = menus.filter(
      (menu) =>
        menu.title.toLowerCase().includes(searchTerm.toLowerCase())
        || menu.description.toLowerCase().includes(searchTerm.toLowerCase())
        || `${menu.cook_first_name} ${menu.cook_last_name}`.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredMenus(filtered);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">🛒 Marketplace</h1>
            <div className="flex gap-4">
              <Link
                to="/marketplace/orders"
                className="text-blue-600 hover:underline"
              >
                My Orders
              </Link>
              <button
                onClick={handleLogout}
                className="btn-secondary"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Search and Filter */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">📅 Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">🔍 Search</label>
              <input
                type="text"
                placeholder="Search menus, cooks, or items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Results Header */}
        <h2 className="text-xl font-semibold mb-6">
          {loading ? 'Loading...' : `${filteredMenus.length} menu${filteredMenus.length !== 1 ? 's' : ''} available`}
        </h2>

        {loading && <p className="text-center text-gray-500">Loading menus...</p>}

        {!loading && filteredMenus.length === 0 && (
          <div className="card text-center py-8">
            <p className="text-gray-500 text-lg">
              {menus.length === 0
                ? 'No menus available for this date'
                : 'No menus match your search'}
            </p>
          </div>
        )}

        {/* Menus Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMenus.map((menu) => (
            <div key={menu.id} className="card hover:shadow-lg transition-shadow cursor-pointer">
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-1">{menu.title}</h3>
                <p className="text-gray-600 text-sm mb-2">{menu.description}</p>
                <p className="text-sm font-medium text-blue-600">
                  👨‍🍳 {menu.cook_first_name} {menu.cook_last_name}
                </p>
                {menu.cook_rating && (
                  <p className="text-sm text-yellow-500">
                    ⭐ {menu.cook_rating} rating
                  </p>
                )}
              </div>

              <div className="bg-gray-50 p-3 rounded mb-4">
                <h4 className="font-medium text-sm mb-2">📍 Available Items:</h4>
                {menu.items && menu.items.length > 0 ? (
                  <ul className="text-sm space-y-1">
                    {menu.items.slice(0, 3).map((item, idx) => (
                      <li key={idx} className="text-gray-700">
                        • {item.name} - ${item.price}
                        {item.quantity_available > 0 ? (
                          <span className="text-xs text-gray-500"> ({item.quantity_available} left)</span>
                        ) : (
                          <span className="text-xs text-red-500"> (sold out)</span>
                        )}
                      </li>
                    ))}
                    {menu.items.length > 3 && (
                      <li className="text-xs text-gray-500 italic">
                        +{menu.items.length - 3} more items
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">No items available</p>
                )}
              </div>

              <div className="text-xs text-gray-600 mb-4">
                <p>🕐 Orders close: {new Date(menu.order_end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>

              <Link
                to={`/marketplace/menu/${menu.id}`}
                className="btn-primary w-full text-center"
              >
                View & Order
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

