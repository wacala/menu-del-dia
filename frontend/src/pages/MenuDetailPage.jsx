import { CookingPot, ClipboardList, Calendar, Clock, Hourglass, X, Check, PartyPopper, Inbox, Sparkles, RefreshCw, UtensilsCrossed, AlertTriangle, Package, Search, Star, Banknote, CreditCard } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { menusAPI, ordersAPI, paymentsAPI } from '../api';
import StripePaymentForm from '../components/StripePaymentForm';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function MenuDetailPage() {
  const { t } = useTranslation();
  const { menuId } = useParams();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState({});
  const [deliveryType, setDeliveryType] = useState('pickup');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [placedOrder, setPlacedOrder] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [publishableKey, setPublishableKey] = useState('');

  const stripePromise = useMemo(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [publishableKey],
  );

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
        menuId: parseInt(menuId, 10),
        items: cartItems.map((item) => ({
          menuItemId: item.id,
          quantity: cart[item.id],
        })),
        deliveryType,
        specialInstructions: notes,
        paymentMethod,
      };

      const response = await ordersAPI.create(orderData);
      const order = response.data.order;

      if (paymentMethod === 'cash') {
        navigate('/marketplace/orders');
        return;
      }

      const intentResponse = await paymentsAPI.createIntent(order.id);
      setPlacedOrder(order);
      setClientSecret(intentResponse.data.clientSecret);
      setPublishableKey(intentResponse.data.publishableKey);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = () => {
    if (placedOrder?.id) {
      navigate(`/marketplace/orders/${placedOrder.id}`);
    } else {
      navigate('/marketplace/orders');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <svg className="animate-spin h-8 w-8 text-primary-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="text-5xl mb-4">😕</div>
          <p className="text-stone-500 text-lg mb-4">Menu not found</p>
          <Link to="/marketplace" className="btn-primary">Back to Marketplace</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="bg-white/80 backdrop-blur-sm border-b border-stone-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <Link to="/marketplace" className="btn-ghost text-sm">← Back to Marketplace</Link>
            <LanguageSwitcher />
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
            <span><AlertTriangle className="w-4 h-4 " /></span><span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="card-static mb-6">
              <div className="flex items-start justify-between mb-3">
                <h1 className="text-2xl font-extrabold text-stone-800">{menu.title}</h1>
                <span className="badge-published">Active</span>
              </div>
              <p className="text-stone-500 text-sm mb-4">{menu.description}</p>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-stone-50 rounded-xl p-3">
                  <span className="text-stone-400 text-xs">👨‍<CookingPot className="w-5 h-5 text-white" /> Cook</span>
                  <p className="font-semibold text-stone-700">{menu.cook_first_name} {menu.cook_last_name}</p>
                </div>
                <div className="bg-stone-50 rounded-xl p-3">
                  <span className="text-stone-400 text-xs"><Star className="w-4 h-4 " /> Rating</span>
                  <p className="font-semibold text-stone-700">{menu.cook_rating || 'No rating'}</p>
                </div>
                <div className="bg-stone-50 rounded-xl p-3">
                  <span className="text-stone-400 text-xs"><Calendar className="w-4 h-4 " /> Date</span>
                  <p className="font-semibold text-stone-700">{new Date(menu.menu_date).toLocaleDateString()}</p>
                </div>
                <div className="bg-stone-50 rounded-xl p-3">
                  <span className="text-stone-400 text-xs">📍 Pickup</span>
                  <p className="font-semibold text-stone-700">{menu.pickup_location}</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-stone-100">
                <h2 className="text-lg font-bold text-stone-800 mb-3">Available Items</h2>
                <div className="space-y-3">
                  {menu.items && menu.items.length > 0 ? (
                    menu.items.map((item) => {
                      const quantity = cart[item.id] || 0;
                      const available = item.quantity_available > 0;
                      return (
                        <div key={item.id} className="flex items-center justify-between bg-stone-50 rounded-xl p-4 hover:bg-stone-100 transition-colors">
                          <div className="flex-1">
                            <h3 className="font-semibold text-stone-800">{item.name}</h3>
                            {item.description && <p className="text-stone-400 text-xs mt-0.5">{item.description}</p>}
                            {item.dietary_tags && <p className="text-xs text-primary-600 mt-1">🏷️ {item.dietary_tags}</p>}
                          </div>
                          <div className="text-right mx-4">
                            <p className="text-lg font-bold text-primary-600">${item.price}</p>
                            <p className="text-xs text-stone-400">{item.quantity_available - item.quantity_sold} left</p>
                          </div>
                          {available ? (
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleRemoveFromCart(item.id)} disabled={quantity === 0}
                                className="w-8 h-8 rounded-lg bg-stone-200 text-stone-700 font-bold hover:bg-stone-300 disabled:opacity-30 transition">−</button>
                              <span className="w-6 text-center font-bold text-stone-800">{quantity}</span>
                              <button onClick={() => handleAddToCart(item.id)}
                                className="w-8 h-8 rounded-lg bg-primary-500 text-white font-bold hover:bg-primary-600 transition">+</button>
                            </div>
                          ) : (
                            <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-1 rounded-lg">Sold out</span>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-stone-400 text-center py-4">No items available</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="card-static sticky top-20">
              <h3 className="text-lg font-bold text-stone-800 mb-4">Order Summary</h3>
              <div className="bg-stone-50 rounded-xl p-3 mb-4 max-h-64 overflow-y-auto">
                {cartItems.length > 0 ? (
                  <div className="space-y-2">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-stone-600">{item.name} ×{cart[item.id]}</span>
                        <span className="font-semibold text-stone-800">${(parseFloat(item.price) * cart[item.id]).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-stone-400 text-sm text-center py-2">Cart is empty</p>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Delivery Type</label>
                  <select value={deliveryType} onChange={(e) => setDeliveryType(e.target.value)} className="input-field">
                    {menu.pickup_available && <option value="pickup">🏪 Pickup</option>}
                    {menu.delivery_available && <option value="delivery">🚚 Delivery</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Payment</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="input-field">
                    <option value="cash"><Banknote className="w-4 h-4 " /> Cash</option>
                    <option value="stripe"><CreditCard className="w-4 h-4 " /> Card (Stripe)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Notes</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                    placeholder="Special requests (optional)" rows="3" className="input-field resize-none" />
                </div>
              </div>
              <div className="border-t border-stone-100 pt-4 mt-4">
                <div className="flex justify-between items-baseline mb-4">
                  <span className="font-semibold text-stone-700">Total</span>
                  <span className="text-2xl font-extrabold text-primary-600">${cartTotal}</span>
                </div>
                <button onClick={handlePlaceOrder} disabled={cartItems.length === 0 || submitting}
                  className="w-full btn-primary py-3">
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Placing order...
                    </span>
                  ) : paymentMethod === 'stripe' ? 'Continue to payment' : 'Place Order'}
                </button>
              </div>
              {clientSecret && stripePromise && placedOrder && (
                <div className="border-t border-stone-100 pt-4 mt-4">
                  <h4 className="font-bold text-stone-800 mb-3">Complete your card payment</h4>
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <StripePaymentForm
                      orderId={placedOrder.id}
                      onPaid={handlePaymentSuccess}
                      onCancel={() => { setClientSecret(''); setPublishableKey(''); setPlacedOrder(null); }}
                    />
                  </Elements>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
