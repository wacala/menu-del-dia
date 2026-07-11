import React, { useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'menu-del-dia-session';
const API_URL = process.env.EXPO_PUBLIC_API_URL || Platform.select({
  ios: 'http://localhost:3001/api',
  android: 'http://10.0.2.2:3001/api',
  default: 'http://localhost:3001/api',
});

const colors = {
  bg: '#f6f8fb',
  card: '#ffffff',
  text: '#102033',
  muted: '#66788a',
  primary: '#0f766e',
  border: '#d9e2ec',
  danger: '#b42318',
  success: '#0a7d4f',
};

const money = (value) => `$${Number(value || 0).toFixed(2)}`;

async function api(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}

function Chip({ label, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Field(props) {
  return <TextInput placeholderTextColor={colors.muted} style={styles.input} {...props} />;
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState('market');
  const [authMode, setAuthMode] = useState('login');
  const [auth, setAuth] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'member',
  });
  const [menus, setMenus] = useState([]);
  const [menu, setMenu] = useState(null);
  const [orders, setOrders] = useState([]);
  const [draft, setDraft] = useState({
    deliveryType: 'pickup',
    deliveryAddress: '',
    specialInstructions: '',
    quantities: {},
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pendingVerification, setPendingVerification] = useState(null);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const session = JSON.parse(stored);
        setToken(session.token);
        setUser(session.user);
      }
      setReady(true);
    })();
  }, []);

  const saveSession = async (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ token: nextToken, user: nextUser }));
  };

  const logout = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
    setMenus([]);
    setMenu(null);
    setOrders([]);
    setScreen('market');
  };

  const loadMenus = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api('/menus');
      setMenus(data.menus || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    if (!token || user?.role !== 'member') return;
    setLoading(true);
    setError('');
    try {
      const data = await api('/orders/my', { token });
      setOrders(data.orders || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ready || !token) return;
    loadMenus();
    loadOrders();
  }, [ready, token]);

  const openMenu = async (id) => {
    setLoading(true);
    setError('');
    try {
      const data = await api(`/menus/${id}`);
      setMenu(data.menu);
      const quantities = {};
      (data.menu.items || []).forEach((item) => {
        quantities[item.id] = 1;
      });
      setDraft((current) => ({ ...current, quantities }));
      setScreen('menu');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const submitAuth = async () => {
    setError('');
    if (authMode === 'register') {
      if (auth.password !== auth.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (auth.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
    }
    setLoading(true);
    try {
      const path = authMode === 'login' ? '/auth/login' : '/auth/register';
      const payload = authMode === 'login'
        ? { email: auth.email.trim(), password: auth.password }
        : {
            email: auth.email.trim(),
            password: auth.password,
            firstName: auth.firstName.trim(),
            lastName: auth.lastName.trim(),
            role: auth.role,
          };
      const data = await api(path, { method: 'POST', body: payload });
      if (authMode === 'register') {
        setPendingVerification(auth.email.trim());
        return;
      }
      await saveSession(data.token, data.user);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const placeOrder = async () => {
    const items = (menu?.items || [])
      .map((item) => ({ menuItemId: item.id, quantity: Number(draft.quantities[item.id] || 0) }))
      .filter((item) => item.quantity > 0);

    if (items.length === 0) {
      setError('Add at least one item.');
      return;
    }

    if (draft.deliveryType === 'delivery' && !draft.deliveryAddress.trim()) {
      setError('Add a delivery address.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api('/orders', {
        method: 'POST',
        token,
        body: {
          menuId: menu.id,
          items,
          deliveryType: draft.deliveryType,
          deliveryAddress: draft.deliveryAddress.trim() || undefined,
          specialInstructions: draft.specialInstructions.trim() || undefined,
        },
      });
      setMessage('Order placed successfully.');
      setScreen('orders');
      await loadOrders();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const publishedMenus = useMemo(() => menus.filter((entry) => entry.status === 'published'), [menus]);

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (pendingVerification) {
    return (
      <ScrollView contentContainerStyle={styles.auth}>
        <Text style={styles.title}>📧</Text>
        <Text style={styles.sectionTitle}>Check your email</Text>
        <Text style={styles.body}>We sent a verification link to:</Text>
        <Text style={[styles.body, { fontWeight: '800' }]}>{pendingVerification}</Text>
        <Text style={styles.muted}>Click the link in the email to activate your account before logging in.</Text>
        <Pressable style={styles.secondary} onPress={() => { setPendingVerification(null); setAuthMode('login'); setError(''); }}>
          <Text style={styles.secondaryText}>Back to Login</Text>
        </Pressable>
        <StatusBar style="dark" />
      </ScrollView>
    );
  }

  if (!token) {
    return (
      <ScrollView contentContainerStyle={styles.auth}>
        <Text style={styles.title}>Menú del Día</Text>
        <Text style={styles.subtitle}>Community food ordering for cooks and members.</Text>

        <View style={styles.row}>
          <Chip label="Login" active={authMode === 'login'} onPress={() => { setAuthMode('login'); setError(''); }} />
          <Chip label="Register" active={authMode === 'register'} onPress={() => { setAuthMode('register'); setError(''); }} />
        </View>

        <Field placeholder="Email" value={auth.email} autoCapitalize="none" onChangeText={(email) => setAuth((current) => ({ ...current, email }))} />
        <Field placeholder="Password" value={auth.password} secureTextEntry onChangeText={(password) => setAuth((current) => ({ ...current, password }))} />

        {authMode === 'register' && (
          <>
            <Field placeholder="Confirm password" value={auth.confirmPassword} secureTextEntry onChangeText={(confirmPassword) => setAuth((current) => ({ ...current, confirmPassword }))} />
            <Field placeholder="First name" value={auth.firstName} onChangeText={(firstName) => setAuth((current) => ({ ...current, firstName }))} />
            <Field placeholder="Last name" value={auth.lastName} onChangeText={(lastName) => setAuth((current) => ({ ...current, lastName }))} />
            <View style={styles.row}>
              <Chip label="Member" active={auth.role === 'member'} onPress={() => setAuth((current) => ({ ...current, role: 'member' }))} />
              <Chip label="Cook" active={auth.role === 'cook'} onPress={() => setAuth((current) => ({ ...current, role: 'cook' }))} />
            </View>
          </>
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}
        <Pressable style={styles.primary} onPress={submitAuth}>
          <Text style={styles.primaryText}>{authMode === 'login' ? 'Sign in' : 'Create account'}</Text>
        </Pressable>
        <StatusBar style="dark" />
      </ScrollView>
    );
  }

  const marketView = (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Today&apos;s menus</Text>
        <Pressable onPress={loadMenus}><Text style={styles.link}>Refresh</Text></Pressable>
      </View>
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <FlatList
          data={publishedMenus}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={<Text style={styles.helper}>No published menus yet.</Text>}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => openMenu(item.id)}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.muted}>{item.cook_first_name} {item.cook_last_name}</Text>
              <Text style={styles.body}>{item.description || 'Fresh community food.'}</Text>
              <Text style={styles.link}>View menu</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );

  const ordersView = (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>My orders</Text>
        <Pressable onPress={loadOrders}><Text style={styles.link}>Refresh</Text></Pressable>
      </View>
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : orders.length === 0 ? (
        <Text style={styles.helper}>You have not placed any orders yet.</Text>
      ) : (
        orders.map((order) => (
          <View key={order.id} style={styles.card}>
            <Text style={styles.cardTitle}>{order.order_number}</Text>
            <Text style={styles.muted}>{order.menu_title}</Text>
            <Text style={styles.body}>Status: {order.status}</Text>
            <Text style={styles.body}>{money(order.total_amount)}</Text>
          </View>
        ))
      )}
    </View>
  );

  const profileView = (
    <View style={styles.section}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{user?.email}</Text>
        <Text style={styles.body}>Role: {user?.role}</Text>
      </View>
      <Pressable style={styles.secondary} onPress={logout}>
        <Text style={styles.secondaryText}>Log out</Text>
      </Pressable>
    </View>
  );

  const menuView = (
    <ScrollView contentContainerStyle={styles.section}>
      <Pressable onPress={() => setScreen('market')}>
        <Text style={styles.link}>← Back</Text>
      </Pressable>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{menu?.title}</Text>
        <Text style={styles.body}>{menu?.description}</Text>
      </View>
      {(menu?.items || []).map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.muted}>{money(item.price)} · {item.quantity_available} left</Text>
          <View style={styles.qtyRow}>
            <Chip
              label="-"
              onPress={() => setDraft((current) => ({
                ...current,
                quantities: { ...current.quantities, [item.id]: Math.max(0, Number(current.quantities[item.id] || 1) - 1) },
              }))}
            />
            <Text style={styles.qtyValue}>{draft.quantities[item.id] || 0}</Text>
            <Chip
              label="+"
              onPress={() => setDraft((current) => ({
                ...current,
                quantities: { ...current.quantities, [item.id]: Number(current.quantities[item.id] || 0) + 1 },
              }))}
            />
          </View>
        </View>
      ))}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Order options</Text>
        <View style={styles.row}>
          <Chip label="Pickup" active={draft.deliveryType === 'pickup'} onPress={() => setDraft((current) => ({ ...current, deliveryType: 'pickup' }))} />
          <Chip label="Delivery" active={draft.deliveryType === 'delivery'} onPress={() => setDraft((current) => ({ ...current, deliveryType: 'delivery' }))} />
        </View>
        {draft.deliveryType === 'delivery' && (
          <Field
            placeholder="Delivery address"
            value={draft.deliveryAddress}
            onChangeText={(deliveryAddress) => setDraft((current) => ({ ...current, deliveryAddress }))}
          />
        )}
        <Field
          placeholder="Special instructions"
          value={draft.specialInstructions}
          multiline
          onChangeText={(specialInstructions) => setDraft((current) => ({ ...current, specialInstructions }))}
        />
        {!!error && <Text style={styles.error}>{error}</Text>}
        <Pressable style={styles.primary} onPress={placeOrder}>
          <Text style={styles.primaryText}>Place order</Text>
        </Pressable>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.app}>
      <StatusBar style="dark" />
      <View style={styles.top}>
        <Text style={styles.brand}>Menú del Día</Text>
        <View style={styles.row}>
          <Chip label="Market" active={screen === 'market'} onPress={() => setScreen('market')} />
          {user?.role === 'member' && <Chip label="Orders" active={screen === 'orders'} onPress={() => setScreen('orders')} />}
          <Chip label="Profile" active={screen === 'profile'} onPress={() => setScreen('profile')} />
        </View>
      </View>

      {!!message && <Text style={styles.success}>{message}</Text>}
      {!!error && <Text style={styles.error}>{error}</Text>}

      {screen === 'market' && marketView}
      {screen === 'orders' && ordersView}
      {screen === 'profile' && profileView}
      {screen === 'menu' && menuView}
    </View>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.bg, paddingTop: 56 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  auth: { padding: 24, gap: 12, flexGrow: 1, justifyContent: 'center' },
  top: { paddingHorizontal: 16, paddingBottom: 12, gap: 12 },
  section: { flexGrow: 1, padding: 16, gap: 12 },
  title: { fontSize: 32, fontWeight: '800', color: colors.text },
  subtitle: { color: colors.muted, fontSize: 16 },
  brand: { fontSize: 18, fontWeight: '800', color: colors.text },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  card: { backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 8 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  body: { color: colors.text },
  muted: { color: colors.muted, fontWeight: '600' },
  helper: { textAlign: 'center', color: colors.muted },
  link: { color: colors.primary, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, color: colors.text },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.card },
  chipActive: { backgroundColor: '#d9f5f1', borderColor: colors.primary },
  chipText: { color: colors.muted, fontWeight: '700' },
  chipTextActive: { color: colors.primary },
  primary: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '800' },
  secondary: { borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingVertical: 14, alignItems: 'center', backgroundColor: colors.card },
  secondaryText: { color: colors.text, fontWeight: '700' },
  error: { color: colors.danger, fontWeight: '700' },
  success: { color: colors.success, fontWeight: '700', paddingHorizontal: 16 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyValue: { minWidth: 24, textAlign: 'center', fontWeight: '800', color: colors.text },
});
