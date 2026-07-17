import { registerRootComponent } from 'expo';
import { StripeProvider } from '@stripe/stripe-react-native';

import App from './App';

function Root() {
  return (
    <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_KEY || 'pk_test_placeholder'}>
      <App />
    </StripeProvider>
  );
}

registerRootComponent(Root);
