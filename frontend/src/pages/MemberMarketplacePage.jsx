import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../context/authStore';
import { menusAPI } from '../api';

export default function MemberMarketplacePage() {
  const { t } = useTranslation();
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
    <div className="min-h-screen bg-stone-50">
      <nav className="bg-white/80 backdrop-blur-sm border-b border-stone-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center shadow-sm shadow-primary-500/20">
                <span className="text-lg">🍽️</span>
              </div>
              <h1 className="text-xl font-extrabold text-stone-800 tracking-tight">{t('marketplace.title')}</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/marketplace/orders" className="btn-ghost text-sm">📦 {t('marketplace.myOrders')}</Link>
              <button onClick={handleLogout} className="btn-secondary text-sm py-2">{t('marketplace.logout')}</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="card-static mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">📅 Date</label>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="input-field" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">🔍 Search</label>
              <input type="text" placeholder="Search menus, cooks, or items..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-field" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-stone-800">
            {loading ? 'Loading...' : `${filteredMenus.length} menu${filteredMenus.length !== 1 ? 's' : ''} available`}
          </h2>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-primary-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}

        {!loading && filteredMenus.length === 0 && (
          <div className="card-static text-center py-12">
            <div className="text-5xl mb-4">{menus.length === 0 ? '🍽️' : '🔍'}</div>
            <p className="text-stone-500 text-lg mb-2">
              {menus.length === 0 ? 'No menus available for this date' : 'No menus match your search'}
            </p>
            <p className="text-stone-400 text-sm">
              {menus.length === 0 ? 'Check back later or try a different date.' : 'Try a different search term.'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMenus.map((menu) => (
            <div key={menu.id} className="card group cursor-pointer flex flex-col">
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-stone-800 group-hover:text-primary-600 transition-colors">{menu.title}</h3>
                  {menu.status === 'published' && <span className="badge-published text-[10px]">Active</span>}
                </div>
                <p className="text-stone-500 text-sm line-clamp-2 mb-3">{menu.description}</p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700">
                    {menu.cook_first_name?.[0]}{menu.cook_last_name?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-700">{menu.cook_first_name} {menu.cook_last_name}</p>
                    {menu.cook_rating && <p className="text-xs text-amber-500">⭐ {menu.cook_rating}</p>}
                  </div>
                </div>
              </div>

              <div className="bg-stone-50 rounded-xl p-3 mb-4 flex-1">
                <h4 className="font-semibold text-xs text-stone-400 uppercase tracking-wider mb-2">Menu items</h4>
                {menu.items && menu.items.length > 0 ? (
                  <ul className="space-y-1.5">
                    {menu.items.slice(0, 3).map((item, idx) => (
                      <li key={idx} className="flex justify-between items-center text-sm">
                        <span className="text-stone-700">{item.name}</span>
                        <span className="flex items-center gap-2">
                          <span className="font-semibold text-stone-800">${item.price}</span>
                          {item.quantity_available > 0 ? (
                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">{item.quantity_available}</span>
                          ) : (
                            <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">sold</span>
                          )}
                        </span>
                      </li>
                    ))}
                    {menu.items.length > 3 && <li className="text-xs text-stone-400 pt-1">+{menu.items.length - 3} more items</li>}
                  </ul>
                ) : (
                  <p className="text-stone-400 text-sm">No items listed</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                <p className="text-xs text-stone-400">🕐 Until {new Date(menu.order_end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                <Link to={`/marketplace/menu/${menu.id}`} className="btn-primary text-sm py-2 px-4">View & Order →</Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

