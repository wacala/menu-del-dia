import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Carrito global persistente para compradores.
 * Estructura:
 *   cart[menuId] = {
 *     items: { [itemId]: qty },
 *     menuTitle,
 *     cookName,
 *     pickupLocation,
 *     deliveryAvailable,
 *     pickupAvailable,
 *   }
 */
export const useCartStore = create(
  persist(
    (set, get) => ({
      cart: {},

      addItem: (menuId, itemId, menuMeta = {}) => {
        const { cart } = get();
        const current = cart[menuId] || { items: {} };
        set({
          cart: {
            ...cart,
            [menuId]: {
              ...current,
              ...menuMeta,
              items: {
                ...current.items,
                [itemId]: (current.items[itemId] || 0) + 1,
              },
            },
          },
        });
      },

      removeItem: (menuId, itemId) => {
        const { cart } = get();
        const current = cart[menuId];
        if (!current) return;
        const qty = current.items[itemId] || 0;
        if (qty <= 1) {
          const items = { ...current.items };
          delete items[itemId];
          set({
            cart: {
              ...cart,
              [menuId]: { ...current, items },
            },
          });
        } else {
          set({
            cart: {
              ...cart,
              [menuId]: {
                ...current,
                items: { ...current.items, [itemId]: qty - 1 },
              },
            },
          });
        }
      },

      setQty: (menuId, itemId, qty) => {
        const { cart } = get();
        const current = cart[menuId];
        if (!current) return;
        const items = { ...current.items };
        if (qty <= 0) {
          delete items[itemId];
        } else {
          items[itemId] = qty;
        }
        set({
          cart: {
            ...cart,
            [menuId]: { ...current, items },
          },
        });
      },

      clearMenu: (menuId) => {
        const { cart } = get();
        const next = { ...cart };
        delete next[menuId];
        set({ cart: next });
      },

      clearCart: () => set({ cart: {} }),

      getMenuIds: () => Object.keys(get().cart),
      getMenuCount: () => Object.keys(get().cart).length,
    }),
    {
      name: 'menu-del-dia-cart',
    },
  ),
);

// Selectores auxiliares
export const selectCartCount = (cart) =>
  Object.values(cart).reduce(
    (sum, menu) =>
      sum + Object.values(menu.items || {}).reduce((s, q) => s + q, 0),
    0,
  );

export const selectCartTotal = (cart, itemsByMenu = {}) =>
  Object.entries(cart).reduce((sum, [menuId, menu]) => {
    const items = itemsByMenu[menuId] || {};
    return (
      sum +
      Object.entries(menu.items || {}).reduce((s, [itemId, qty]) => {
        const item = items[itemId];
        return s + (item ? parseFloat(item.price) * qty : 0);
      }, 0)
    );
  }, 0);