import { useTranslation } from 'react-i18next';import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ordersAPI } from '../api';

export default function CookOrdersPage() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
    // Poll for new orders every 10 seconds
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.listCookOrders();
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter((o) => o.status === filter);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    ready: 'bg-green-100 text-green-800',
    delivered: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const statusEmojis = {
    pending: '⏳',
    confirmed: '✅',
    ready: '🟢',
    delivered: '🎉',
    cancelled: '❌',
  };

  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const readyCount = orders.filter((o) => o.status === 'ready').length;

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="bg-white/80 backdrop-blur-sm border-b border-stone-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-extrabold text-stone-800 tracking-tight">📋 {t('cook.ordersTitle')}</h1>
          <Link to="/cook/dashboard" className="btn-ghost text-sm">{t('cook.backToDashboard')}</Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {pendingCount > 0 && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <span className="text-xl">⏳</span>
            <p className="text-amber-800 font-medium text-sm">You have {pendingCount} new order{pendingCount > 1 ? 's' : ''} waiting for confirmation</p>
          </div>
        )}

        {readyCount > 0 && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
            <span className="text-xl">✨</span>
            <p className="text-emerald-800 font-medium text-sm">{readyCount} order{readyCount > 1 ? 's' : ''} ready for pickup</p>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-3">Filter by Status</h2>
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'confirmed', 'ready', 'delivered', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  filter === status
                    ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                    : 'bg-white text-stone-500 border border-stone-200 hover:border-stone-300 hover:text-stone-700'
                }`}
              >
                {statusEmojis[status] || ''} {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <button onClick={fetchOrders} className="btn-ghost text-sm">🔄 {t('cook.refreshNow')}</button>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-primary-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}

        {!loading && filteredOrders.length === 0 && (
          <div className="card-static text-center py-12">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-stone-500 text-lg">
              {filter === 'all' ? t('cook.noOrdersYet') : t('orders.noFilterOrders', { filter })}
            </p>
          </div>
        )}

        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Link
              key={order.id}
              to={`/cook/orders/${order.id}`}
              className="card hover:shadow-lg transition-shadow cursor-pointer block"
            >
              {/* Order Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    Order #{order.id}
                  </h3>
                  <p className="text-sm text-gray-600">
                    from {order.member_first_name} {order.member_last_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(order.created_at).toLocaleDateString()} at{' '}
                    {new Date(order.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <span
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    statusColors[order.status] || ''
                  }`}
                >
                  {statusEmojis[order.status]} {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>

              {/* Items Summary */}
              <div className="mb-4">
                <h4 className="font-medium mb-2 text-sm">{t('cook.itemsToPrepare')}</h4>
                {order.items && order.items.length > 0 ? (
                  <div className="space-y-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-700">{item.name}</span>
                        <span className="font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          x{item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No items found</p>
                )}
              </div>

              {/* Order Details */}
              <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4 mb-4">
                <div>
                  <span className="text-gray-600">{t('cook.deliveryTypeLabel')}</span>
                  <p className="font-medium">
                    {order.delivery_type.charAt(0).toUpperCase()
                      + order.delivery_type.slice(1)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">{t('cook.totalAmount')}</span>
                  <p className="text-lg font-bold text-blue-600">
                    ${order.total_amount}
                  </p>
                </div>
              </div>

              {/* Special Requests */}
              {order.notes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                  <p className="text-yellow-800 text-sm font-medium">{t('cook.specialRequests')}</p>
                  <p className="text-yellow-900 text-sm mt-1">{order.notes}</p>
                </div>
              )}

              {/* Status-Specific Message */}
              {order.status === 'pending' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <p className="text-yellow-800 text-sm">
                    👉 {t('cook.tapToConfirm')}
                  </p>
                </div>
              )}

              {order.status === 'confirmed' && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-blue-800 text-sm">
                    🍳 {t('cook.orderConfirmed')}
                  </p>
                </div>
              )}

              {order.status === 'ready' && (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-green-800 text-sm">
                    ✨ {t('cook.readyForPickupCook')}
                  </p>
                </div>
              )}
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
