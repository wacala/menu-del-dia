import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import MenuDetailPage from './MenuDetailPage';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useParams: () => ({ menuId: '7' }),
  };
});

vi.mock('../api', () => ({
  menusAPI: {
    getById: vi.fn(),
  },
  ordersAPI: {
    create: vi.fn(),
  },
  paymentsAPI: {
    createIntent: vi.fn(),
  },
}));

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve({})),
}));

vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }) => <div data-testid="stripe-elements">{children}</div>,
}));

vi.mock('../components/StripePaymentForm', () => ({
  default: () => <div data-testid="stripe-payment-form">Stripe form</div>,
}));

import { menusAPI, ordersAPI, paymentsAPI } from '../api';

const menuResponse = {
  data: {
    menu: {
      id: 7,
      title: 'Test Menu',
      description: 'Tasty food',
      cook_first_name: 'Ana',
      cook_last_name: 'Lopez',
      cook_rating: 4.8,
      menu_date: '2026-07-08',
      pickup_location: 'Community kitchen',
      pickup_available: true,
      delivery_available: false,
      items: [
        {
          id: 11,
          name: 'Rice Bowl',
          description: 'With veggies',
          price: '12.50',
          quantity_available: 3,
          quantity_sold: 0,
          dietary_tags: 'vegan',
        },
      ],
    },
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  menusAPI.getById.mockResolvedValue(menuResponse);
  ordersAPI.create.mockResolvedValue({
    data: {
      order: {
        id: 123,
        order_number: 'ORD-123',
      },
    },
  });
  paymentsAPI.createIntent.mockResolvedValue({
    data: {
      clientSecret: 'cs_test_123',
      publishableKey: 'pk_test_123',
    },
  });
});

afterEach(() => {
  navigateMock.mockReset();
});

function renderPage() {
  return render(
    <MemoryRouter>
      <MenuDetailPage />
    </MemoryRouter>,
  );
}

test('places a cash order and navigates to orders list', async () => {
  renderPage();

  expect(await screen.findByText('Test Menu')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '+' }));
  fireEvent.click(screen.getByRole('button', { name: /place order/i }));

  await waitFor(() => {
    expect(ordersAPI.create).toHaveBeenCalledWith(
      expect.objectContaining({
        menuId: 7,
        paymentMethod: 'cash',
        specialInstructions: '',
        items: [{ menuItemId: 11, quantity: 1 }],
      }),
    );
  });

  expect(navigateMock).toHaveBeenCalledWith('/marketplace/orders');
});

test('creates a stripe payment intent when card payment is selected', async () => {
  renderPage();

  expect(await screen.findByText('Test Menu')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '+' }));
  fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: 'stripe' } });
  fireEvent.click(screen.getByRole('button', { name: /continue to payment/i }));

  await waitFor(() => {
    expect(ordersAPI.create).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentMethod: 'stripe',
      }),
    );
  });

  await waitFor(() => {
    expect(paymentsAPI.createIntent).toHaveBeenCalledWith(123);
  });

  expect(await screen.findByText(/complete your card payment/i)).toBeInTheDocument();
  expect(await screen.findByTestId('stripe-payment-form')).toBeInTheDocument();
});
