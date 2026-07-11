import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { menusAPI } from '../api';

export default function CookMenusPage() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    menuDate: new Date().toISOString().split('T')[0],
    orderStartTime: '',
    orderEndTime: '',
    pickupAvailable: true,
    deliveryAvailable: false,
    pickupLocation: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchMenus();
    if (searchParams.get('create') === 'true') {
      setShowForm(true);
    }
  }, []);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      // Fetch today's menus
      const response = await menusAPI.list(new Date().toISOString().split('T')[0]);
      setMenus(response.data.menus || []);
    } catch (err) {
      console.error('Failed to load menus:', err);
      setError('Failed to load menus');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleCreateMenu = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await menusAPI.create(formData);
      setSuccess('Menu created successfully!');
      setFormData({
        title: '',
        description: '',
        menuDate: new Date().toISOString().split('T')[0],
        orderStartTime: '',
        orderEndTime: '',
        pickupAvailable: true,
        deliveryAvailable: false,
        pickupLocation: '',
      });
      setShowForm(false);
      fetchMenus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create menu');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="bg-white/80 backdrop-blur-sm border-b border-stone-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Link to="/cook/dashboard" className="btn-ghost text-sm">← Back</Link>
              <h1 className="text-xl font-extrabold text-stone-800 tracking-tight">📋 My Menus</h1>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Active Menus</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary"
          >
            {showForm ? 'Cancel' : '+ Create Menu'}
          </button>
        </div>

        {showForm && (
          <div className="card-static mb-8">
            <h3 className="text-lg font-bold text-stone-800 mb-4">Create New Menu</h3>
            <form onSubmit={handleCreateMenu} className="space-y-5">
              <div className="relative">
                <input type="text" name="title" value={formData.title} onChange={handleInputChange} required placeholder=" " className="input-field pt-6 pb-3 peer" />
                <label className="absolute left-4 top-5 text-sm text-stone-400 pointer-events-none transition-all duration-200 ease-out peer-focus:top-2.5 peer-focus:text-[11px] peer-focus:text-primary-500 peer-focus:font-semibold peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:text-[11px]">Menu Title *</label>
              </div>

              <div className="relative">
                <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder=" " rows="3" className="input-field pt-6 pb-3 peer resize-none" />
                <label className="absolute left-4 top-5 text-sm text-stone-400 pointer-events-none transition-all duration-200 ease-out peer-focus:top-2.5 peer-focus:text-[11px] peer-focus:text-primary-500 peer-focus:font-semibold peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:text-[11px]">Description</label>
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">Menu Date *</label>
                <input type="date" name="menuDate" value={formData.menuDate} onChange={handleInputChange} required className="input-field" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Order Start *</label>
                  <input type="datetime-local" name="orderStartTime" value={formData.orderStartTime} onChange={handleInputChange} required className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Order End *</label>
                  <input type="datetime-local" name="orderEndTime" value={formData.orderEndTime} onChange={handleInputChange} required className="input-field" />
                </div>
              </div>

              <div className="relative">
                <input type="text" name="pickupLocation" value={formData.pickupLocation} onChange={handleInputChange} required placeholder=" " className="input-field pt-6 pb-3 peer" />
                <label className="absolute left-4 top-5 text-sm text-stone-400 pointer-events-none transition-all duration-200 ease-out peer-focus:top-2.5 peer-focus:text-[11px] peer-focus:text-primary-500 peer-focus:font-semibold peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:text-[11px]">Pickup Location *</label>
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="pickupAvailable" checked={formData.pickupAvailable} onChange={handleInputChange} className="w-4 h-4 rounded border-stone-300 text-primary-500 focus:ring-primary-500" />
                  <span className="text-sm font-medium text-stone-700">Pickup Available</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="deliveryAvailable" checked={formData.deliveryAvailable} onChange={handleInputChange} className="w-4 h-4 rounded border-stone-300 text-primary-500 focus:ring-primary-500" />
                  <span className="text-sm font-medium text-stone-700">Delivery Available</span>
                </label>
              </div>

              <button type="submit" className="btn-primary w-full">
                Create Menu
              </button>
            </form>
          </div>
        )}

        {/* Menus List */}
        {loading && <p className="text-center text-gray-500">Loading menus...</p>}

        {!loading && menus.length === 0 && (
          <div className="card text-center">
            <p className="text-gray-500 mb-4">No menus yet. Create your first menu!</p>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              + Create Menu
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {menus.map((menu) => (
            <div key={menu.id} className="card hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold">{menu.title}</h3>
                  <p className="text-gray-600 text-sm">{menu.description}</p>
                </div>
                <span className={`px-3 py-1 rounded text-sm font-medium ${
                  menu.status === 'published'
                    ? 'bg-green-100 text-green-800'
                    : menu.status === 'draft'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                }`}>
                  {menu.status}
                </span>
              </div>

              <div className="text-sm text-gray-600 mb-3">
                <p>📅 {new Date(menu.menu_date).toLocaleDateString()}</p>
                <p>🕐 Orders: {new Date(menu.order_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(menu.order_end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                <p>📍 {menu.pickup_location}</p>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Link
                  to={`/cook/menus/${menu.id}`}
                  className="btn-secondary text-sm py-1"
                >
                  View Details
                </Link>
                {menu.status === 'draft' && (
                  <button className="btn-primary text-sm py-1">
                    Publish
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
