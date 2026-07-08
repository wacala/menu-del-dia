import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ordersAPI } from '../api';

export default function MemberOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.listMine();
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">📦 My Orders</h1>
            <Link to="/marketplace" className="text-blue-600 hover:underline">
              Back to Shopping
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Filter by Status</h2>
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'confirmed', 'ready', 'delivered', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {statusEmojis[status] || ''}
                {' '}
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {loading && (
          <p className="text-center text-gray-500">Loading your orders...</p>
        )}

        {!loading && filteredOrders.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-gray-500 text-lg mb-4">
              {filter === 'all'
                ? 'No orders yet. Start shopping!'
                : `No ${filter} orders`}
            </p>
            <Link to="/marketplace" className="btn-primary inline-block">
              Browse Menus
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="card hover:shadow-lg transition-shadow"
            >
              {/* Order Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    Order #{order.id}
                  </h3>
                  <p className="text-sm text-gray-600">
                    from {order.cook_first_name} {order.cook_last_name}
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

              {/* Status Timeline */}
              <div className="bg-gray-50 p-4 rounded mb-4">
                <div className="flex items-center justify-between text-sm">
                  <div className={order.status !== 'pending' ? 'text-green-600 font-medium' : 'text-gray-600'}>
                    ✓ Ordered
                  </div>
                  <div className="flex-1 h-1 mx-2 bg-gray-300" />
                  <div className={['confirmed', 'ready', 'delivered'].includes(order.status) ? 'text-green-600 font-medium' : 'text-gray-600'}>
                    ✓ Confirmed
                  </div>
                  <div className="flex-1 h-1 mx-2 bg-gray-300" />
                  <div className={['ready', 'delivered'].includes(order.status) ? 'text-green-600 font-medium' : 'text-gray-600'}>
                    ✓ Ready
                  </div>
                  <div className="flex-1 h-1 mx-2 bg-gray-300" />
                  <div className={order.status === 'delivered' ? 'text-green-600 font-medium' : 'text-gray-600'}>
                    ✓ Delivered
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="mb-4">
                <h4 className="font-medium mb-2">Items Ordered:</h4>
                {order.items && order.items.length > 0 ? (
                  <ul className="text-sm space-y-1">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="text-gray-700">
                        • {item.name} x{item.quantity} @ ${item.price} each{' '}
                        <span className="font-medium">
                          = ${(item.quantity * parseFloat(item.price)).toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No items found</p>
                )}
              </div>

              {/* Order Details */}
              <div className="grid grid-cols-2 gap-4 text-sm mb-4 border-t pt-4">
                <div>
                  <span className="text-gray-600">Delivery Type:</span>
                  <p className="font-medium">
                    {order.delivery_type.charAt(0).toUpperCase()
                      + order.delivery_type.slice(1)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Total Amount:</span>
                  <p className="text-xl font-bold text-blue-600">
                    ${order.total_amount}
                  </p>
                </div>
                {order.notes && (
                  <div className="col-span-2">
                    <span className="text-gray-600">Notes:</span>
                    <p className="text-gray-700">{order.notes}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              {order.status === 'ready' && (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-green-800 text-sm">
                    ✨ Your order is ready for pickup!
                  </p>
                </div>
              )}

              {order.status === 'pending' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <p className="text-yellow-800 text-sm">
                    ⏳ Waiting for cook confirmation
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
