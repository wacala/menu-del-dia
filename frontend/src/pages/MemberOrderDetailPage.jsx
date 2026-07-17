import { CookingPot, ClipboardList, Calendar, Clock, Hourglass, X, Check, PartyPopper, Inbox, Sparkles, RefreshCw, UtensilsCrossed, AlertTriangle, Package, Search, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ordersAPI } from '../api';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function MemberOrderDetailPage() {
  const { t } = useTranslation();
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  useEffect(() => {
    if (!autoRefresh || !order || order.status === 'delivered' || order.status === 'cancelled') {
      return;
    }

    const interval = setInterval(fetchOrder, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [autoRefresh, order]);

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

  const statusSteps = ['pending', 'confirmed', 'ready', 'delivered'];
  
  const getStatusIndex = () => {
    if (order?.status === 'cancelled') return -1;
    return statusSteps.indexOf(order?.status || 'pending');
  };

  const statusEmojis = {
    pending: '<Hourglass className="w-4 h-4 " />',
    confirmed: '<Check className="w-4 h-4 " />',
    ready: '🟢',
    delivered: '<PartyPopper className="w-4 h-4 " />',
    cancelled: '<X className="w-4 h-4 " />',
  };

  const statusMessages = {
    pending: 'Your order has been placed. Waiting for cook confirmation.',
    confirmed: 'Cook has confirmed your order! It\'s being prepared.',
    ready: '<PartyPopper className="w-4 h-4 " /> Your order is ready for pickup!',
    delivered: 'Order delivered! Thank you for your purchase.',
    cancelled: 'This order has been cancelled.',
  };

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
          <Link to="/marketplace/orders" className="btn-primary">
            Back to My Orders
          </Link>
        </div>
      </div>
    );
  }

  const statusIndex = getStatusIndex();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link to="/marketplace/orders" className="text-blue-600 hover:underline">
              ← Back to My Orders
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Header */}
        <div className="card mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Order #{order.id}</h1>
              <p className="text-gray-600">
                from {order.cook_first_name} {order.cook_last_name}
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
          {/* Status Timeline */}
          <div className="lg:col-span-2">
            <div className="card mb-6">
              <h2 className="text-xl font-semibold mb-6">Order Status</h2>

              {order.status === 'cancelled' ? (
                <div className="bg-red-50 border-2 border-red-200 rounded p-6 text-center">
                  <p className="text-3xl mb-2"><X className="w-4 h-4 " /></p>
                  <p className="text-red-800 font-medium">This order has been cancelled</p>
                </div>
              ) : (
                <div>
                  {/* Status Steps */}
                  <div className="space-y-4 mb-6">
                    {statusSteps.map((step, index) => {
                      const isCompleted = index <= statusIndex;
                      const isCurrent = index === statusIndex;

                      return (
                        <div key={step} className="flex items-center">
                          <div
                            className={`flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center font-bold text-white ${
                              isCompleted
                                ? 'bg-green-600'
                                : 'bg-gray-300'
                            }`}
                          >
                            {isCompleted ? '✓' : index + 1}
                          </div>
                          <div className="ml-4 flex-1">
                            <p
                              className={`text-lg font-semibold ${
                                isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-600'
                              }`}
                            >
                              {step.charAt(0).toUpperCase() + step.slice(1)}
                            </p>
                            <p className="text-gray-600 text-sm">
                              {step === 'pending' && 'Waiting for confirmation'}
                              {step === 'confirmed' && 'Cook is preparing your order'}
                              {step === 'ready' && 'Ready for pickup'}
                              {step === 'delivered' && 'Order completed'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Current Status Message */}
                  <div className={`p-4 rounded-lg text-center ${
                    order.status === 'ready'
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-blue-50 border border-blue-200'
                  }`}>
                    <p className="text-lg font-medium">
                      {statusEmojis[order.status]} {statusMessages[order.status]}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Order Items</h2>
              <div className="space-y-3">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">
                          Qty: {item.quantity} @ ${item.price} each
                        </p>
                      </div>
                      <p className="font-semibold">
                        ${(item.quantity * parseFloat(item.price)).toFixed(2)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No items found</p>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div>
            <div className="card sticky top-4">
              <h3 className="text-lg font-semibold mb-4">Order Summary</h3>

              <div className="space-y-3 mb-4">
                <div>
                  <span className="text-gray-600 text-sm">Delivery Type</span>
                  <p className="font-medium">
                    {order.delivery_type === 'pickup' ? '🏪 Pickup' : '🚚 Delivery'}
                  </p>
                </div>

                <div>
                  <span className="text-gray-600 text-sm">Status</span>
                  <p className="font-medium">
                    {statusEmojis[order.status]} {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </p>
                </div>

                {order.notes && (
                  <div>
                    <span className="text-gray-600 text-sm">Special Requests</span>
                    <p className="text-sm mt-1">{order.notes}</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span>${order.total_amount}</span>
                </div>
                <div className="flex justify-between mb-4">
                  <span className="text-gray-600">Tax</span>
                  <span>$0.00</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-blue-600">${order.total_amount}</span>
                </div>
              </div>

              {order.status === 'ready' && (
                <div className="bg-green-50 border-2 border-green-200 rounded p-3 text-center">
                  <p className="text-green-800 font-medium text-sm">
                    Ready for pickup! <PartyPopper className="w-4 h-4 " />
                  </p>
                </div>
              )}

              {order.status === 'pending' && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded p-3 text-center">
                  <p className="text-yellow-800 font-medium text-sm">
                    Waiting for confirmation <Hourglass className="w-4 h-4 " />
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
