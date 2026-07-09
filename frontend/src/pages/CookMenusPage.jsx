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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link to="/cook/dashboard" className="text-blue-600 hover:underline mb-4 block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold">📋 My Menus</h1>
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

        {/* Create Menu Form */}
        {showForm && (
          <div className="card mb-8">
            <h3 className="text-lg font-semibold mb-4">Create New Menu</h3>
            <form onSubmit={handleCreateMenu} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Menu Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Arroz con Pollo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your menu..."
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Menu Date *</label>
                  <input
                    type="date"
                    name="menuDate"
                    value={formData.menuDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Order Start Time *</label>
                  <input
                    type="datetime-local"
                    name="orderStartTime"
                    value={formData.orderStartTime}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Order End Time *</label>
                  <input
                    type="datetime-local"
                    name="orderEndTime"
                    value={formData.orderEndTime}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Pickup Location *</label>
                <input
                  type="text"
                  name="pickupLocation"
                  value={formData.pickupLocation}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Downtown Plaza"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="pickupAvailable"
                    checked={formData.pickupAvailable}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-sm">Pickup Available</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="deliveryAvailable"
                    checked={formData.deliveryAvailable}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-sm">Delivery Available</span>
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
