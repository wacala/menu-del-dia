import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ordersAPI } from '../api';

export default function CookOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchOrders();
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

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      await ordersAPI.updateStatus(orderId, newStatus);
      setOrders(
        orders.map((o) =>
          o.id === orderId ? { ...o, status: newStatus } : o,
        ),
      );
    } catch (error) {
      console.error('Failed to update order status:', error);
    } finally {
      setUpdatingId(null);
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

  const nextStatuses = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['ready', 'cancelled'],
    ready: ['delivered', 'cancelled'],
    delivered: [],
    cancelled: [],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link to="/cook/dashboard" className="text-blue-600 hover:underline mb-4 block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold">📦 Orders</h1>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
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
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {' '}
                ({filteredOrders.length})
              </button>
            ))}
          </div>
        </div>

        {loading && <p className="text-center text-gray-500">Loading orders...</p>}

        {!loading && filteredOrders.length === 0 && (
          <div className="card text-center">
            <p className="text-gray-500">
              {filter === 'all'
                ? 'No orders yet'
                : `No ${filter} orders`}
            </p>
          </div>
        )}

        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Order #{order.id}</h3>
                  <p className="text-gray-600 text-sm">
                    {order.member_first_name} {order.member_last_name}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded text-sm font-medium ${statusColors[order.status] || ''}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>

              <div className="bg-gray-50 p-3 rounded mb-4">
                <h4 className="font-medium text-sm mb-2">Items:</h4>
                <ul className="text-sm space-y-1">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, idx) => (
                      <li key={idx} className="text-gray-700">
                        • {item.name} x{item.quantity} @ ${item.price}
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-500">No items</li>
                  )}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-600">Delivery Type:</span>
                  <p className="font-medium">{order.delivery_type}</p>
                </div>
                <div>
                  <span className="text-gray-600">Total:</span>
                  <p className="font-medium text-lg">${order.total_amount}</p>
                </div>
                {order.notes && (
                  <div className="col-span-2">
                    <span className="text-gray-600">Notes:</span>
                    <p className="text-sm">{order.notes}</p>
                  </div>
                )}
              </div>

              {nextStatuses[order.status].length > 0 && (
                <div className="flex gap-2 pt-3 border-t">
                  {nextStatuses[order.status].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusUpdate(order.id, status)}
                      disabled={updatingId === order.id}
                      className="btn-primary text-sm py-1 disabled:opacity-50"
                    >
                      Mark {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
