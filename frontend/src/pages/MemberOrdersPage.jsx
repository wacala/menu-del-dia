import { CookingPot, ClipboardList, Calendar, Clock, Hourglass, X, Check, PartyPopper, Inbox, Sparkles, RefreshCw, UtensilsCrossed, AlertTriangle, Package, Search, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ordersAPI } from '../api';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function MemberOrdersPage() {
  const { t } = useTranslation();
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
    delivered: '🎉',
    cancelled: 'bg-red-100 text-red-800',
  };

  const statusEmojis = {
    pending: '<Hourglass className="w-4 h-4 " />',
    confirmed: '<Check className="w-4 h-4 " />',
    ready: '🟢',
    delivered: '🎉',
    cancelled: '<X className="w-4 h-4 " />',
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="bg-white/80 backdrop-blur-sm border-b border-stone-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-extrabold text-stone-800 tracking-tight"><Package className="w-4 h-4 " /> {t('orders.title')}</h1>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link to="/marketplace" className="btn-ghost text-sm">{t('orders.backToShopping')}</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-3">{t('orders.filterByStatus')}</h2>
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
            <div className="text-5xl mb-4"><Inbox className="w-8 h-8 text-stone-300" /></div>
            <p className="text-stone-500 text-lg mb-4">
              {filter === 'all' ? t('orders.noOrders') : t('orders.noFilterOrders', { filter: t(`orders.${filter}`) })}
            </p>
            <Link to="/marketplace" className="btn-primary">{t('marketplace.browseMenus')}</Link>
          </div>
        )}

        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Link
              key={order.id}
              to={`/marketplace/orders/${order.id}`}
              className="card block group"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-stone-800 group-hover:text-primary-600 transition-colors">Order #{order.id}</h3>
                  <p className="text-sm text-stone-500">{t('orders.orderFrom')} {order.cook_first_name} {order.cook_last_name}</p>
                  <p className="text-xs text-stone-400 mt-1">
                    {new Date(order.created_at).toLocaleDateString()} at{' '}
                    {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className={`badge-${order.status}`}>
                  {statusEmojis[order.status]} {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>

              <div className="bg-stone-50 rounded-xl p-3 mb-4">
                <div className="flex items-center justify-between text-xs">
                  {['pending', 'confirmed', 'ready', 'delivered'].map((step, i) => {
                    const statusIndex = ['pending', 'confirmed', 'ready', 'delivered'].indexOf(order.status);
                    return (
                      <div key={step} className="flex items-center flex-1">
                        <div className={`flex flex-col items-center ${i <= statusIndex ? 'text-emerald-600' : 'text-stone-300'}`}>
                          <span className="text-sm">{i <= statusIndex ? '●' : '○'}</span>
                          <span className="font-medium mt-0.5">{step.charAt(0).toUpperCase() + step.slice(1)}</span>
                        </div>
                        {i < 3 && <div className={`flex-1 h-0.5 mx-1 ${i < statusIndex ? 'bg-emerald-400' : 'bg-stone-200'}`} />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-xs text-stone-400 uppercase tracking-wider mb-2">{t('orders.items')}</h4>
                {order.items && order.items.length > 0 ? (
                  <ul className="text-sm space-y-1">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="flex justify-between text-stone-600">
                        <span>{item.name} ×{item.quantity}</span>
                        <span className="font-semibold text-stone-800">${(item.quantity * parseFloat(item.price)).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-stone-400 text-sm">{t('orders.noItemsFound')}</p>
                )}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-stone-100">
                <span className="text-sm text-stone-500">
                  {order.delivery_type === 'pickup' ? '🏪 Pickup' : '🚚 Delivery'}
                </span>
                <span className="text-lg font-extrabold text-primary-600">${order.total_amount}</span>
              </div>

              {order.status === 'ready' && (
                <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2">
                  <span><Sparkles className="w-4 h-4 " /></span>
                  <p className="text-emerald-700 text-sm font-medium">Your order is ready for pickup!</p>
                </div>
              )}
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
