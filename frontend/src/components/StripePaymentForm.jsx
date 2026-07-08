import { useState } from 'react';
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { paymentsAPI } from '../api';

export default function StripePaymentForm({ orderId, onPaid, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/marketplace/orders/${orderId}`,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        setError(confirmError.message || 'Payment failed');
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        await paymentsAPI.confirm(orderId, paymentIntent.id);
        onPaid();
      } else if (paymentIntent?.status === 'processing') {
        onPaid();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <PaymentElement />

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!stripe || submitting}
          className="btn-primary flex-1 disabled:opacity-50"
        >
          {submitting ? 'Processing payment...' : 'Pay now'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
