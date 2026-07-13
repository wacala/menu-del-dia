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
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'menu-del-dia-session';
const API_URL = process.env.EXPO_PUBLIC_API_URL || Platform.select({
  ios: 'http://localhost:3001/api',
  android: 'http://10.0.2.2:3001/api',
  default: 'http://localhost:3001/api',
});

const colors = {
  bg: '#fafaf9',
  card: '#ffffff',
  text: '#292524',
  muted: '#78716c',
  primary: '#f97316',
  primaryDark: '#ea580c',
  primaryLight: '#fff7ed',
  border: '#e7e5e4',
  danger: '#dc2626',
  success: '#16a34a',
  amber: '#d97706',
  emerald: '#059669',
  purple: '#7c3aed',
};

// ── i18n ────────────────────────────────────────────────────
const LANG_KEY = 'menu-del-dia-lang';
let currentLang = 'es-MX';

const t = (key) => {
  const tr = translations[currentLang] || translations['es-MX'];
  return key.split('.').reduce((o, k) => o?.[k], tr) || key;
};

const translations = {
  'es-MX': {
    app: { name: 'Menú del Día', tagline: 'Comida casera en tu comunidad' },
    splash: { description: 'Compra y vende comida casera en tu comunidad.', login: 'Iniciar sesión', register: 'Crear cuenta' },
    auth: { login: 'Iniciar sesión', register: 'Registrarse', email: 'Correo', password: 'Contraseña', confirmPassword: 'Confirmar contraseña', firstName: 'Nombre', lastName: 'Apellido', signIn: 'Iniciar sesión', createAccount: 'Crear cuenta', member: 'Miembro', cook: 'Cocinero', checkEmail: 'Revisa tu correo', verificationSent: 'Te mandamos un enlace a:', verificationInstructions: 'Dale clic al enlace para activar tu cuenta.', backToLogin: 'Volver al inicio', passwordsMatch: 'Las contraseñas no coinciden', passwordLength: 'Mínimo 6 caracteres' },
    market: { title: 'Marketplace', loading: 'Cargando...', noMenus: 'No hay menús disponibles', until: 'Hasta', viewMenu: 'Ver menú' },
    menu: { back: '← Volver', items: 'Platillos', quantity: 'Cantidad', deliveryType: 'Tipo de entrega', pickup: 'Recoger', delivery: 'A domicilio', notes: 'Notas', notesPlaceholder: 'Peticiones especiales', total: 'Total', placeOrder: 'Hacer pedido', addItem: 'Agrega al menos un platillo', orderPlaced: 'Pedido realizado con éxito' },
    orders: { title: 'Mis pedidos', noOrders: 'Sin pedidos aún', from: 'de', deliveryType: 'Entrega:', total: 'Total:' },
    profile: { title: 'Perfil', logout: 'Cerrar sesión', role: 'Rol', member: 'Miembro', cook: 'Cocinero' },
    cook: { dashboard: 'Panel', orders: 'Pedidos', menus: 'Menús', profile: 'Perfil', noOrders: 'Sin pedidos aún', totalAmount: 'Total:', deliveryType: 'Entrega:', itemsToPrepare: 'Por preparar:', specialRequests: 'Peticiones especiales:' }
  },
  en: {
    app: { name: 'Menú del Día', tagline: 'Community food, made simple' },
    splash: { description: 'Buy and sell homemade food in your community.', login: 'Sign in', register: 'Create account' },
    auth: { login: 'Login', register: 'Register', email: 'Email', password: 'Password', confirmPassword: 'Confirm password', firstName: 'First name', lastName: 'Last name', signIn: 'Sign in', createAccount: 'Create account', member: 'Member', cook: 'Cook', checkEmail: 'Check your email', verificationSent: 'We sent a verification link to:', verificationInstructions: 'Click the link to activate your account.', backToLogin: 'Back to Login', passwordsMatch: 'Passwords do not match', passwordLength: 'Password must be at least 6 characters' },
    market: { title: 'Marketplace', loading: 'Loading...', noMenus: 'No menus available', until: 'Until', viewMenu: 'View menu' },
    menu: { back: '← Back', items: 'Items', quantity: 'Qty', deliveryType: 'Delivery type', pickup: 'Pickup', delivery: 'Delivery', notes: 'Notes', notesPlaceholder: 'Special requests', total: 'Total', placeOrder: 'Place order', addItem: 'Add at least one item', orderPlaced: 'Order placed successfully' },
    orders: { title: 'My orders', noOrders: 'No orders yet', from: 'from', deliveryType: 'Delivery:', total: 'Total:' },
    profile: { title: 'Profile', logout: 'Logout', role: 'Role', member: 'Member', cook: 'Cook' },
    cook: { dashboard: 'Dashboard', orders: 'Orders', menus: 'Menus', profile: 'Profile', noOrders: 'No orders yet', totalAmount: 'Total:', deliveryType: 'Delivery:', itemsToPrepare: 'To prepare:', specialRequests: 'Special requests:' }
  }
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
  const [screen, setScreen] = useState('splash');
  const [authMode, setAuthMode] = useState('login');
  const [lang, setLang] = useState('es-MX');
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
  const [cookOrders, setCookOrders] = useState([]);
  const [cookStats, setCookStats] = useState({ activeMenus: 0, totalOrders: 0, pendingOrders: 0, revenue: '0' });
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [menuForm, setMenuForm] = useState({
    title: '', description: '', menuDate: new Date().toISOString().split('T')[0],
    orderStartTime: '', orderEndTime: '', pickupAvailable: true, deliveryAvailable: false, pickupLocation: '',
  });

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const session = JSON.parse(stored);
        setToken(session.token);
        setUser(session.user);
        if (session.token) setScreen(session.user?.role === 'cook' ? 'cookDashboard' : 'market');
      }
      const savedLang = await AsyncStorage.getItem(LANG_KEY);
      if (savedLang) { currentLang = savedLang; setLang(savedLang); }
      setReady(true);
    })();
  }, []);

  // Deep link handler for email verification
  useEffect(() => {
    const handleDeepLink = (event) => {
      const { url } = event;
      if (!url) return;
      const match = url.match(/[?&]token=([^&]+)/);
      if (match) {
        verifyEmailToken(match[1]);
      }
    };

    const verifyEmailToken = async (token) => {
      try {
        await api('/auth/verify-email', { method: 'POST', body: { token } });
        setError('');
        setMessage('Email verified! You can now log in.');
        setScreen('auth');
      } catch (err) {
        setError(err.message || 'Verification failed. The link may have expired.');
      }
    };

    // Handle cold start
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    // Handle warm start
    const sub = Linking.addEventListener('url', handleDeepLink);
    return () => sub.remove();
  }, []);

  const changeLang = async (l) => {
    currentLang = l;
    setLang(l);
    await AsyncStorage.setItem(LANG_KEY, l);
  };

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

  const loadCookOrders = async () => {
    setLoading(true); setError('');
    try {
      const data = await api('/orders/cook', { token });
      setCookOrders(data.orders || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const loadCookStats = async () => {
    try {
      const [menusRes, ordersRes] = await Promise.all([
        api('/menus', { token }),
        api('/orders/cook', { token }),
      ]);
      const allMenus = menusRes.menus || [];
      const allOrders = ordersRes.orders || [];
      setCookOrders(allOrders);
      setCookStats({
        activeMenus: allMenus.filter(m => m.status === 'published').length,
        totalOrders: allOrders.length,
        pendingOrders: allOrders.filter(o => o.status === 'pending').length,
        revenue: allOrders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0).toFixed(2),
      });
    } catch (e) { setError(e.message); }
  };

  const createMenu = async () => {
    setLoading(true); setError('');
    try {
      await api('/menus', { method: 'POST', token, body: menuForm });
      setShowMenuForm(false);
      setMenuForm({ title: '', description: '', menuDate: new Date().toISOString().split('T')[0], orderStartTime: '', orderEndTime: '', pickupAvailable: true, deliveryAvailable: false, pickupLocation: '' });
      loadCookStats();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await api(`/orders/${orderId}/status`, { method: 'PUT', token, body: { status } });
      loadCookOrders();
    } catch (e) { setError(e.message); }
  };

  useEffect(() => {
    if (!ready || !token) return;
    if (user?.role === 'cook') { loadCookStats(); return; }
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
    // Splash
    if (screen === 'splash') {
      return (
        <ScrollView contentContainerStyle={styles.auth}>
          <Text style={styles.icon}>🍽️</Text>
          <Text style={styles.title}>{t('app.name')}</Text>
          <Text style={styles.subtitle}>{t('app.tagline')}</Text>
          <Text style={styles.body}>{t('splash.description')}</Text>
          <Pressable style={styles.primary} onPress={() => setScreen('auth')}>
            <Text style={styles.primaryText}>{t('splash.login')}</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={() => { setScreen('auth'); setAuthMode('register'); }}>
            <Text style={styles.secondaryText}>{t('splash.register')}</Text>
          </Pressable>
          <View style={[styles.row, { justifyContent: 'center', marginTop: 24 }]}>
            <Pressable onPress={() => changeLang('es-MX')} style={[styles.langBtn, lang === 'es-MX' && styles.langBtnActive]}><Text style={[styles.langText, lang === 'es-MX' && styles.langTextActive]}>🇲🇽 ES</Text></Pressable>
            <Pressable onPress={() => changeLang('en')} style={[styles.langBtn, lang === 'en' && styles.langBtnActive]}><Text style={[styles.langText, lang === 'en' && styles.langTextActive]}>🇺🇸 EN</Text></Pressable>
          </View>
          <StatusBar style="dark" />
        </ScrollView>
      );
    }

    // Auth form
    return (
      <ScrollView contentContainerStyle={styles.auth}>
        <Text style={styles.icon}>🍽️</Text>
        <Text style={styles.title}>{t('app.name')}</Text>

        <View style={styles.row}>
          <Chip label={t('auth.login')} active={authMode === 'login'} onPress={() => { setAuthMode('login'); setError(''); }} />
          <Chip label={t('auth.register')} active={authMode === 'register'} onPress={() => { setAuthMode('register'); setError(''); }} />
        </View>

        <Field placeholder={t('auth.email')} value={auth.email} autoCapitalize="none" onChangeText={(email) => setAuth((c) => ({ ...c, email }))} />
        <Field placeholder={t('auth.password')} value={auth.password} secureTextEntry onChangeText={(password) => setAuth((c) => ({ ...c, password }))} />

        {authMode === 'register' && (
          <>
            <Field placeholder={t('auth.confirmPassword')} value={auth.confirmPassword} secureTextEntry onChangeText={(v) => setAuth((c) => ({ ...c, confirmPassword: v }))} />
            <Field placeholder={t('auth.firstName')} value={auth.firstName} onChangeText={(v) => setAuth((c) => ({ ...c, firstName: v }))} />
            <Field placeholder={t('auth.lastName')} value={auth.lastName} onChangeText={(v) => setAuth((c) => ({ ...c, lastName: v }))} />
            <View style={styles.row}>
              <Chip label={t('auth.member')} active={auth.role === 'member'} onPress={() => setAuth((c) => ({ ...c, role: 'member' }))} />
              <Chip label={t('auth.cook')} active={auth.role === 'cook'} onPress={() => setAuth((c) => ({ ...c, role: 'cook' }))} />
            </View>
          </>
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}
        <Pressable style={styles.primary} onPress={submitAuth}>
          <Text style={styles.primaryText}>{authMode === 'login' ? t('auth.signIn') : t('auth.createAccount')}</Text>
        </Pressable>

        <Pressable onPress={() => setScreen('splash')}>
          <Text style={styles.link}>← {t('app.name')}</Text>
        </Pressable>

        <View style={[styles.row, { justifyContent: 'center', marginTop: 16 }]}>
          <Pressable onPress={() => changeLang('es-MX')} style={[styles.langBtn, lang === 'es-MX' && styles.langBtnActive]}><Text style={[styles.langText, lang === 'es-MX' && styles.langTextActive]}>🇲🇽 ES</Text></Pressable>
          <Pressable onPress={() => changeLang('en')} style={[styles.langBtn, lang === 'en' && styles.langBtnActive]}><Text style={[styles.langText, lang === 'en' && styles.langTextActive]}>🇺🇸 EN</Text></Pressable>
        </View>
        <StatusBar style="dark" />
      </ScrollView>
    );
  }

  const marketView = (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>{t('market.title')}</Text>
        <Pressable onPress={loadMenus}><Text style={styles.link}>↻</Text></Pressable>
      </View>
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <FlatList
          data={publishedMenus}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={<Text style={styles.helper}>{t('market.noMenus')}</Text>}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => openMenu(item.id)}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.muted}>{item.cook_first_name} {item.cook_last_name}</Text>
              <Text style={styles.body} numberOfLines={2}>{item.description || ''}</Text>
              <Text style={styles.link}>{t('market.viewMenu')}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );

  const ordersView = (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>{t('orders.title')}</Text>
        <Pressable onPress={loadOrders}><Text style={styles.link}>↻</Text></Pressable>
      </View>
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : orders.length === 0 ? (
        <Text style={styles.helper}>{t('orders.noOrders')}</Text>
      ) : (
        orders.map((order) => (
          <View key={order.id} style={styles.card}>
            <Text style={styles.cardTitle}>{order.order_number}</Text>
            <Text style={styles.muted}>{order.menu_title}</Text>
            <Text style={styles.body}>{t('orders.total')} {money(order.total_amount)}</Text>
          </View>
        ))
      )}
    </View>
  );

  const profileView = (
    <View style={styles.section}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{user?.email}</Text>
        <Text style={styles.body}>{t('profile.role')}: {user?.role === 'cook' ? t('profile.cook') : t('profile.member')}</Text>
      </View>
      <Pressable style={styles.secondary} onPress={logout}>
        <Text style={styles.secondaryText}>{t('profile.logout')}</Text>
      </Pressable>
      <View style={[styles.row, { justifyContent: 'center', marginTop: 24 }]}>
        <Pressable onPress={() => changeLang('es-MX')} style={[styles.langBtn, lang === 'es-MX' && styles.langBtnActive]}><Text style={[styles.langText, lang === 'es-MX' && styles.langTextActive]}>🇲🇽 ES</Text></Pressable>
        <Pressable onPress={() => changeLang('en')} style={[styles.langBtn, lang === 'en' && styles.langBtnActive]}><Text style={[styles.langText, lang === 'en' && styles.langTextActive]}>🇺🇸 EN</Text></Pressable>
      </View>
    </View>
  );

  const menuView = (
    <ScrollView contentContainerStyle={styles.section}>
      <Pressable onPress={() => setScreen('market')}>
        <Text style={styles.link}>{t('menu.back')}</Text>
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
            <Chip label="−" onPress={() => setDraft((c) => ({ ...c, quantities: { ...c.quantities, [item.id]: Math.max(0, Number(c.quantities[item.id] || 1) - 1) } }))} />
            <Text style={styles.qtyValue}>{draft.quantities[item.id] || 0}</Text>
            <Chip label="+" onPress={() => setDraft((c) => ({ ...c, quantities: { ...c.quantities, [item.id]: Number(c.quantities[item.id] || 0) + 1 } }))} />
          </View>
        </View>
      ))}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('menu.deliveryType')}</Text>
        <View style={styles.row}>
          <Chip label={t('menu.pickup')} active={draft.deliveryType === 'pickup'} onPress={() => setDraft((c) => ({ ...c, deliveryType: 'pickup' }))} />
          <Chip label={t('menu.delivery')} active={draft.deliveryType === 'delivery'} onPress={() => setDraft((c) => ({ ...c, deliveryType: 'delivery' }))} />
        </View>
        {draft.deliveryType === 'delivery' && (
          <Field placeholder="Address" value={draft.deliveryAddress} onChangeText={(v) => setDraft((c) => ({ ...c, deliveryAddress: v }))} />
        )}
        <Field placeholder={t('menu.notesPlaceholder')} value={draft.specialInstructions} multiline onChangeText={(v) => setDraft((c) => ({ ...c, specialInstructions: v }))} />
        {!!error && <Text style={styles.error}>{error}</Text>}
        <Pressable style={styles.primary} onPress={placeOrder}>
          <Text style={styles.primaryText}>{t('menu.placeOrder')}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );

  // ── Cook views ──────────────────────────────────────────────
  const cookDashboardView = (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('cook.dashboard')}</Text>
      <View style={styles.row}>
        <View style={[styles.statCard, { borderLeftColor: colors.primary }]}>
          <Text style={styles.statValue}>{cookStats.activeMenus}</Text>
          <Text style={styles.statLabel}>{t('cook.activeMenus')}</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: colors.emerald }]}>
          <Text style={styles.statValue}>{cookStats.totalOrders}</Text>
          <Text style={styles.statLabel}>{t('cook.totalOrders')}</Text>
        </View>
      </View>
      <View style={styles.row}>
        <View style={[styles.statCard, { borderLeftColor: colors.amber }]}>
          <Text style={styles.statValue}>{cookStats.pendingOrders}</Text>
          <Text style={styles.statLabel}>{t('cook.pendingOrders')}</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: colors.purple }]}>
          <Text style={styles.statValue}>${cookStats.revenue}</Text>
          <Text style={styles.statLabel}>{t('cook.revenue')}</Text>
        </View>
      </View>
      <Pressable style={styles.primary} onPress={loadCookStats}>
        <Text style={styles.primaryText}>↻ {t('cook.refreshNow')}</Text>
      </Pressable>
    </View>
  );

  const cookOrdersView = (
    <ScrollView contentContainerStyle={styles.section}>
      <Text style={styles.sectionTitle}>{t('cook.ordersTitle')}</Text>
      {cookOrders.length === 0 ? (
        <Text style={styles.helper}>{t('cook.noOrders')}</Text>
      ) : (
        cookOrders.map((order) => (
          <View key={order.id} style={styles.card}>
            <Text style={styles.cardTitle}>#{order.id} — {order.member_name || order.member_email}</Text>
            <Text style={styles.muted}>{t('cook.totalAmount')} {money(order.total_amount)}</Text>
            {(order.items || []).map((item, idx) => (
              <Text key={idx} style={styles.body}>• {item.name} ×{item.quantity}</Text>
            ))}
            {order.status === 'pending' && (
              <View style={styles.row}>
                <Pressable style={[styles.primary, { flex: 1 }]} onPress={() => updateOrderStatus(order.id, 'confirmed')}>
                  <Text style={styles.primaryText}>✓ Confirmar</Text>
                </Pressable>
              </View>
            )}
            {order.status === 'confirmed' && (
              <Pressable style={[styles.primary, { backgroundColor: colors.emerald }]} onPress={() => updateOrderStatus(order.id, 'ready')}>
                <Text style={styles.primaryText}>🟢 {t('cook.readyForPickupCook')}</Text>
              </Pressable>
            )}
            {order.status !== 'pending' && order.status !== 'confirmed' && (
              <Text style={[styles.chipText, { color: colors.muted }]}>{order.status}</Text>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );

  return (
    <View style={styles.app}>
      <StatusBar style="dark" />
      <View style={styles.top}>
        <Text style={styles.brand}>{t('app.name')}</Text>
        <View style={styles.row}>
          {user?.role === 'cook' ? (
            <>
              <Chip label="📊" active={screen === 'cookDashboard'} onPress={() => setScreen('cookDashboard')} />
              <Chip label="📋" active={screen === 'cookOrders'} onPress={() => setScreen('cookOrders')} />
              <Chip label="👤" active={screen === 'profile'} onPress={() => setScreen('profile')} />
            </>
          ) : (
            <>
              <Chip label="🛒" active={screen === 'market'} onPress={() => setScreen('market')} />
              <Chip label="📦" active={screen === 'orders'} onPress={() => setScreen('orders')} />
              <Chip label="👤" active={screen === 'profile'} onPress={() => setScreen('profile')} />
            </>
          )}
        </View>
      </View>

      {!!message && <Text style={styles.success}>{message}</Text>}
      {!!error && <Text style={styles.error}>{error}</Text>}

      {screen === 'market' && marketView}
      {screen === 'orders' && ordersView}
      {screen === 'profile' && profileView}
      {screen === 'menu' && menuView}
      {screen === 'cookDashboard' && cookDashboardView}
      {screen === 'cookOrders' && cookOrdersView}
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
  icon: { fontSize: 48, textAlign: 'center', marginBottom: 12 },
  link: { color: colors.primary, fontWeight: '700', marginTop: 4 },
  input: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, color: colors.text },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.card },
  chipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
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
  langBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  langBtnActive: { backgroundColor: colors.primaryLight },
  langText: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  langTextActive: { color: colors.primary },
  statCard: { flex: 1, backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4, padding: 12, gap: 4 },
  statValue: { fontSize: 24, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 12, color: colors.muted, fontWeight: '600' },
});
