import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/authStore';
import { menusAPI } from '../api';

export default function MemberMarketplacePage() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      const response = await menusAPI.list();
      setMenus(response.data);
    } catch (error) {
      console.error('Failed to load menus:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Menú del Día - Marketplace</h1>
          <button
            onClick={handleLogout}
            className="btn-secondary"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold mb-6">Available Menus Today</h2>

        {loading && <p className="text-center text-gray-500">Loading menus...</p>}

        {!loading && menus.length === 0 && (
          <p className="text-center text-gray-500">No menus available today</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menus.map((menu) => (
            <div key={menu.id} className="card hover:shadow-lg transition">
              <h3 className="text-lg font-semibold mb-2">{menu.name}</h3>
              <p className="text-gray-600 mb-2">By: {menu.cook_name}</p>
              <p className="text-sm text-gray-500 mb-3">{menu.description}</p>

              <div className="mb-4">
                <h4 className="font-medium mb-2">Items:</h4>
                {menu.items && menu.items.length > 0 ? (
                  <ul className="text-sm space-y-1">
                    {menu.items.map((item, idx) => (
                      <li key={idx} className="text-gray-700">
                        • {item.name} - ${item.price}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No items listed</p>
                )}
              </div>

              <button className="w-full btn-primary text-sm">
                View & Order
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
