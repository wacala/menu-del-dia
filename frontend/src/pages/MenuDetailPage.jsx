import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { menusAPI, ordersAPI } from '../api';

export default function MenuDetailPage() {
  const { menuId } = useParams();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState({});
  const [deliveryType, setDeliveryType] = useState('pickup');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMenu();
  }, [menuId]);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const response = await menusAPI.getById(menuId);
      setMenu(response.data.menu);
    } catch (err) {
      console.error('Failed to load menu:', err);
      setError('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (itemId) => {
    setCart({
      ...cart,
      [itemId]: (cart[itemId] || 0) + 1,
    });
  };

  const handleRemoveFromCart = (itemId) => {
    if (cart[itemId] > 1) {
      setCart({
        ...cart,
        [itemId]: cart[itemId] - 1,
      });
    } else {
      const newCart = { ...cart };
      delete newCart[itemId];
      setCart(newCart);
    }
  };

  const cartItems = menu?.items
    ? menu.items.filter((item) => cart[item.id])
    : [];

  const cartTotal = cartItems.reduce(
    (sum, item) => sum + parseFloat(item.price) * cart[item.id],
    0,
  ).toFixed(2);

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      setError('Please add items to your order');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const orderData = {
        menuId: parseInt(menuId),
        items: cartItems.map((item) => ({
          menuItemId: item.id,
          quantity: cart[item.id],
        })),
        deliveryType,
        specialInstructions: notes,
      };

      await ordersAPI.create(orderData);
      navigate('/marketplace/orders');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading menu...</p>
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Menu not found</p>
          <Link to="/marketplace" className="btn-primary">
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link to="/marketplace" className="text-blue-600 hover:underline">
            ← Back to Marketplace
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Menu Details */}
          <div className="md:col-span-2">
            <div className="card mb-6">
              <h1 className="text-3xl font-bold mb-2">{menu.title}</h1>
              <p className="text-gray-600 mb-4">{menu.description}</p>

              <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div>
                  <span className="text-gray-600">👨‍🍳 Cook:</span>
                  <p className="font-medium">
                    {menu.cook_first_name} {menu.cook_last_name}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">⭐ Rating:</span>
                  <p className="font-medium">{menu.cook_rating || 'No rating'}</p>
                </div>
                <div>
                  <span className="text-gray-600">📅 Date:</span>
                  <p className="font-medium">{new Date(menu.menu_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-gray-600">📍 Pickup Location:</span>
                  <p className="font-medium">{menu.pickup_location}</p>
                </div>
              </div>

              <hr className="my-6" />

              {/* Menu Items */}
              <h2 className="text-xl font-semibold mb-4">Available Items</h2>
              <div className="space-y-4">
                {menu.items && menu.items.length > 0 ? (
                  menu.items.map((item) => {
                    const quantity = cart[item.id] || 0;
                    const available = item.quantity_available > 0;

                    return (
                      <div
                        key={item.id}
                        className="border rounded-lg p-4 hover:bg-gray-50"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">{item.name}</h3>
                            {item.description && (
                              <p className="text-gray-600 text-sm">
                                {item.description}
                              </p>
                            )}
                            {item.dietary_tags && (
                              <p className="text-xs text-blue-600 mt-1">
                                🏷️ {item.dietary_tags}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-blue-600">
                              ${item.price}
                            </p>
                            <p className="text-xs text-gray-600">
                              {item.quantity_available - item.quantity_sold} available
                            </p>
                          </div>
                        </div>

                        {available ? (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleRemoveFromCart(item.id)}
                              disabled={quantity === 0}
                              className="px-3 py-1 bg-gray-200 text-gray-800 rounded disabled:opacity-50"
                            >
                              −
                            </button>
                            <span className="w-8 text-center font-medium">
                              {quantity}
                            </span>
                            <button
                              onClick={() => handleAddToCart(item.id)}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <p className="text-red-600 text-sm font-medium">
                            Sold out
                          </p>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500">No items available</p>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div>
            <div className="card sticky top-4">
              <h3 className="text-lg font-semibold mb-4">Order Summary</h3>

              {/* Order Items */}
              <div className="bg-gray-50 p-3 rounded mb-4 max-h-64 overflow-y-auto">
                {cartItems.length > 0 ? (
                  <div className="space-y-2">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm"
                      >
                        <span>
                          {item.name} x{cart[item.id]}
                        </span>
                        <span className="font-medium">
                          ${(parseFloat(item.price) * cart[item.id]).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Cart is empty</p>
                )}
              </div>

              {/* Delivery Options */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Delivery Type
                </label>
                <select
                  value={deliveryType}
                  onChange={(e) => setDeliveryType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  {menu.pickup_available && (
                    <option value="pickup">Pickup</option>
                  )}
                  {menu.delivery_available && (
                    <option value="delivery">Delivery</option>
                  )}
                </select>
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special requests (optional)"
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Total and Button */}
              <div className="border-t pt-4">
                <div className="flex justify-between mb-4">
                  <span className="font-medium">Total:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ${cartTotal}
                  </span>
                </div>
                <button
                  onClick={handlePlaceOrder}
                  disabled={cartItems.length === 0 || submitting}
                  className="w-full btn-primary disabled:opacity-50"
                >
                  {submitting ? 'Placing order...' : 'Place Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
