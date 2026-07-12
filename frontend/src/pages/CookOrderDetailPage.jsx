import { useTranslation } from 'react-i18next';import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ordersAPI } from '../api';

export default function CookOrderDetailPage() {
  const { t } = useTranslation();
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchOrder, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchOrder = async () => {
    try {
      const response = await ordersAPI.getById(orderId);
      setOrder(response.data.order);
      setError('');
    } catch (err) {
      console.error('Failed to load order:', err);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      setError('');
      setSuccess('');

      await ordersAPI.updateStatus(orderId, newStatus);
      setSuccess(`Order marked as ${newStatus}`);
      
      // Refresh order immediately
      await fetchOrder();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const statusEmojis = {
    pending: '⏳',
    confirmed: '✅',
    ready: '🟢',
    delivered: '🎉',
    cancelled: '❌',
  };

  const statusTransitions = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['ready', 'cancelled'],
    ready: ['delivered', 'cancelled'],
    delivered: [],
    cancelled: [],
  };

  const nextSteps = statusTransitions[order?.status] || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Order not found</p>
          <Link to="/cook/orders" className="btn-primary">
            Back to Orders
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
          <Link to="/cook/orders" className="text-blue-600 hover:underline">
            ← Back to Orders
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

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            {success}
          </div>
        )}

        {/* Header */}
        <div className="card mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Order #{order.id}</h1>
              <p className="text-gray-600">
                from {order.member_first_name} {order.member_last_name}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Placed on {new Date(order.created_at).toLocaleDateString()} at{' '}
                {new Date(order.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-blue-600">${order.total_amount}</span>
              <div className="mt-2 flex gap-2 items-center justify-end">
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="mr-2"
                  />
                  Live updates
                </label>
                <button
                  onClick={fetchOrder}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Details */}
          <div className="lg:col-span-2">
            {/* Current Status */}
            <div className="card mb-6">
              <h2 className="text-xl font-semibold mb-4">Current Status</h2>
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div>
                  <p className="text-gray-600 text-sm">Order Status</p>
                  <p className="text-2xl font-bold">
                    {statusEmojis[order.status]} {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </p>
                </div>
                {order.status === 'ready' && (
                  <div className="text-right">
                    <p className="text-sm text-green-700 font-medium">Ready for pickup</p>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Info */}
            <div className="card mb-6">
              <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-600 text-sm">Name</span>
                  <p className="font-medium">
                    {order.member_first_name} {order.member_last_name}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Delivery Type</span>
                  <p className="font-medium">
                    {order.delivery_type === 'pickup' ? '🏪 Pickup' : '🚚 Delivery'}
                  </p>
                </div>
                {order.notes && (
                  <div>
                    <span className="text-gray-600 text-sm">Special Requests</span>
                    <p className="mt-1 p-2 bg-yellow-50 rounded border border-yellow-200">
                      {order.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Items to Prepare</h2>
              <div className="space-y-3">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-gray-50 rounded border-l-4 border-blue-500"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-semibold text-lg">{item.name}</p>
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-full font-bold">
                          x{item.quantity}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                      )}
                      <p className="text-sm text-gray-600">
                        Unit Price: ${item.price}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No items found</p>
                )}
              </div>
            </div>
          </div>

          {/* Status Management Sidebar */}
          <div>
            <div className="card sticky top-4">
              <h3 className="text-lg font-semibold mb-4">Actions</h3>

              {/* Order Summary */}
              <div className="space-y-3 mb-6 pb-6 border-b">
                <div>
                  <span className="text-gray-600 text-sm">Order Total</span>
                  <p className="text-2xl font-bold text-blue-600">${order.total_amount}</p>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Items Count</span>
                  <p className="font-medium">
                    {order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} items
                  </p>
                </div>
              </div>

              {/* Status Transitions */}
              {nextSteps.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 mb-3">Update Order Status</p>
                  {nextSteps.map((status) => (
                    <button
                      key={status}
                      onClick={() => handleUpdateStatus(status)}
                      disabled={updatingStatus}
                      className={`w-full py-2 px-3 rounded font-medium transition ${
                        status === 'cancelled'
                          ? 'btn-secondary'
                          : 'btn-primary'
                      } disabled:opacity-50`}
                    >
                      Mark as {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 p-3 rounded text-center">
                  <p className="text-gray-600 text-sm">
                    {order.status === 'delivered' && 'Order delivered ✓'}
                    {order.status === 'cancelled' && 'Order cancelled ✗'}
                  </p>
                </div>
              )}

              {/* Help Text */}
              {order.status === 'pending' && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
                  <p className="text-yellow-800">
                    👉 Confirm this order to start preparing it
                  </p>
                </div>
              )}

              {order.status === 'confirmed' && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs">
                  <p className="text-blue-800">
                    👉 Mark as ready when the order is ready for pickup/delivery
                  </p>
                </div>
              )}

              {order.status === 'ready' && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-xs">
                  <p className="text-green-800">
                    ✓ Order is ready! Customer can pickup now
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
