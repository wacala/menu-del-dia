import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

const t = (key, lng) => {
  const tr = translations[lng || 'es-MX'] || translations['es-MX'];
  return key.split('.').reduce((o, k) => o?.[k], tr) || key;
};

const translations = {
  'es-MX': {
    app: { name: 'Menú del Día', tagline: 'Comida casera en tu comunidad' },
    splash: { description: 'Compra y vende comida casera en tu comunidad.', login: 'Iniciar sesión', register: 'Crear cuenta', home: 'Inicio', goToPanel: 'Ir al panel' },
    auth: { login: 'Iniciar sesión', register: 'Registrarse', email: 'Correo', password: 'Contraseña', confirmPassword: 'Confirmar contraseña', firstName: 'Nombre', lastName: 'Apellido', username: 'Usuario', signIn: 'Iniciar sesión', createAccount: 'Crear cuenta', member: 'Miembro', cook: 'Cocinero', checkEmail: 'Revisa tu correo', verificationSent: 'Te mandamos un enlace a:', verificationInstructions: 'Dale clic al enlace para activar tu cuenta.', backToLogin: 'Volver a inicio de sesión', passwordsMatch: 'Las contraseñas no coinciden', passwordLength: 'Mínimo 6 caracteres', forgotPassword: '¿Olvidaste tu contraseña?', recoverPassword: 'Recuperar contraseña', sendResetLink: 'Enviar enlace', resetLinkSent: 'Si ese correo existe, recibirás un enlace para restablecer tu contraseña.', emailInvalid: 'Formato de correo inválido' },
    market: { title: 'Marketplace', loading: 'Cargando...', noMenus: 'No hay menús disponibles', until: 'Hasta', viewMenu: 'Ver menú' },
    menu: { back: '← Volver', items: 'Platillos', quantity: 'Cantidad', deliveryType: 'Tipo de entrega', pickup: 'Recoger', delivery: 'A domicilio', notes: 'Notas', notesPlaceholder: 'Peticiones especiales', total: 'Total', placeOrder: 'Hacer pedido', addItem: 'Agrega al menos un platillo', orderPlaced: 'Pedido realizado con éxito' },
    orders: { title: 'Mis pedidos', noOrders: 'Sin pedidos aún', from: 'de', deliveryType: 'Entrega:', total: 'Total:' },
    profile: { title: 'Perfil', logout: 'Cerrar sesión', role: 'Rol', member: 'Miembro', cook: 'Cocinero', settings: 'Configuración' },
    cook: { dashboard: 'Panel', orders: 'Pedidos', menus: 'Menús', profile: 'Perfil', noOrders: 'Sin pedidos aún', totalAmount: 'Total:', deliveryType: 'Entrega:', itemsToPrepare: 'Por preparar:', specialRequests: 'Peticiones especiales:' }
  },
  en: {
    app: { name: 'Menú del Día', tagline: 'Community food, made simple' },
    splash: { description: 'Buy and sell homemade food in your community.', login: 'Sign in', register: 'Create account', home: 'Home', goToPanel: 'Go to dashboard' },
    auth: { login: 'Login', register: 'Register', email: 'Email', password: 'Password', confirmPassword: 'Confirm password', firstName: 'First name', lastName: 'Last name', username: 'Username', signIn: 'Sign in', createAccount: 'Create account', member: 'Member', cook: 'Cook', checkEmail: 'Check your email', verificationSent: 'We sent a verification link to:', verificationInstructions: 'Click the link to activate your account.', backToLogin: 'Back to Login', passwordsMatch: 'Passwords do not match', passwordLength: 'Password must be at least 6 characters', forgotPassword: 'Forgot password?', recoverPassword: 'Recover password', sendResetLink: 'Send reset link', resetLinkSent: 'If that email exists, you will receive a reset link.', emailInvalid: 'Invalid email format' },
    market: { title: 'Marketplace', loading: 'Loading...', noMenus: 'No menus available', until: 'Until', viewMenu: 'View menu' },
    menu: { back: '← Back', items: 'Items', quantity: 'Qty', deliveryType: 'Delivery type', pickup: 'Pickup', delivery: 'Delivery', notes: 'Notes', notesPlaceholder: 'Special requests', total: 'Total', placeOrder: 'Place order', addItem: 'Add at least one item', orderPlaced: 'Order placed successfully' },
    orders: { title: 'My orders', noOrders: 'No orders yet', from: 'from', deliveryType: 'Delivery:', total: 'Total:' },
    profile: { title: 'Profile', logout: 'Logout', role: 'Role', member: 'Member', cook: 'Cook', settings: 'Settings' },
    cook: { dashboard: 'Dashboard', orders: 'Orders', menus: 'Menus', profile: 'Profile', noOrders: 'No orders yet', totalAmount: 'Total:', deliveryType: 'Delivery:', itemsToPrepare: 'To prepare:', specialRequests: 'Special requests:' }
  }
};

const money = (value) => `${Number(value || 0).toFixed(2)}`;

const translateError = (msg, lng) => {
  const map = {
    'Ingresa un correo electrónico válido': { 'es-MX': 'Ingresa un correo electrónico válido', en: 'Enter a valid email' },
    'La contraseña es obligatoria': { 'es-MX': 'La contraseña es obligatoria', en: 'Password is required' },
    'Invalid credentials': { 'es-MX': 'Correo o contraseña incorrectos', en: 'Invalid email or password' },
    'Invalid value': { 'es-MX': 'Valor inválido', en: 'Invalid value' },
    'Please verify your email before logging in. Check your inbox.': { 'es-MX': 'Verifica tu correo antes de iniciar sesión', en: 'Please verify your email before logging in' },
  };
  return map[msg]?.[lng] || map[msg]?.['es-MX'] || msg;
};

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
    const errMsg = data.message
      || (data.errors && data.errors.map((e) => e.msg || e.message).join('. '))
      || `Request failed (${response.status})`;
    const err = new Error(errMsg);
    err.data = data;
    throw err;
  }

  return data;
}

function Chip({ label, active, onPress, icon }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      {icon && <Ionicons name={icon} size={16} color={active ? colors.primary : colors.muted} style={{ marginRight: 4 }} />}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function getResponsiveBorder(width) {
  if (width >= 1024) return 2;      // 100% — tablets grandes
  if (width >= 768) return 1.5;     // 65%  — tablets
  return 1;                          // 50%  — móviles
}

function DrawerItem({ icon, label, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.drawerItem, active && styles.drawerItemActive]}>
      <Ionicons name={icon} size={20} color={active ? colors.primary : colors.muted} />
      <Text style={[styles.drawerItemText, active && styles.drawerItemTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Field(props) {
  return <TextInput placeholderTextColor={colors.muted} style={styles.input} {...props} />;
}

function FloatingField({ label, value, onChangeText, secureTextEntry, autoCapitalize, ...props }) {
  const [focused, setFocused] = useState(false);
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value || focused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value, focused]);

  const labelTop = anim.interpolate({ inputRange: [0, 1], outputRange: [16, 6] });
  const labelSize = anim.interpolate({ inputRange: [0, 1], outputRange: [14, 11] });
  const labelColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.muted, colors.primary],
  });

  return (
    <View style={styles.floatField}>
      <Animated.Text
        style={[styles.floatLabel, { top: labelTop, fontSize: labelSize, color: labelColor }]}
        pointerEvents="none">
        {label}
      </Animated.Text>
      <TextInput
        style={styles.floatInput}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        placeholderTextColor="transparent"
        {...props}
      />
    </View>
  );
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
    username: '',
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  // Smart search
  const [searchText, setSearchText] = useState('');
  const [filterDelivery, setFilterDelivery] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [cuisineFilter, setCuisineFilter] = useState('all');
  // Cook menu expert system
  const [myMenus, setMyMenus] = useState([]);
  const [menuStep, setMenuStep] = useState(1);
  const [menuItems, setMenuItems] = useState([]);
  const [reviewing, setReviewing] = useState(false);
  const [cookMenuId, setCookMenuId] = useState(null);
  const closeDrawer = () => {
    Animated.timing(slideAnim, {
      toValue: -280,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setDrawerOpen(false));
  };
  const slideAnim = useRef(new Animated.Value(-280)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const _t = (key) => t(key, lang);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: drawerOpen ? 0 : -280,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [drawerOpen]);
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
      setLang('es-MX');
      await AsyncStorage.setItem(LANG_KEY, 'es-MX');
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
        setAuthMode('login');
        setDrawerOpen(false);
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
    setLang(l);
    AsyncStorage.setItem(LANG_KEY, l);
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: false }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: false }),
    ]).start();
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

  const loadMyMenus = async () => {
    setLoading(true); setError('');
    try {
      const data = await api('/menus/my/menus', { token });
      setMyMenus(data.menus || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
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
            username: auth.username.trim(),
            role: auth.role,
          };
      const data = await api(path, { method: 'POST', body: payload });
      if (authMode === 'register') {
        setPendingVerification(auth.email.trim());
        return;
      }
      await saveSession(data.token, data.user);
      setScreen(data.user.role === 'cook' ? 'cookDashboard' : 'market');
    } catch (e) {
      if (e.data?.emailVerificationRequired) {
        setPendingVerification(auth.email.trim());
        return;
      }
      setError(translateError(e.message, lang));
    } finally {
      setLoading(false);
    }
  };

  const submitForgotPassword = async () => {
    setError('');
    setMessage('');
    if (!forgotEmail.trim()) return;
    setLoading(true);
    try {
      await api('/auth/forgot-password', { method: 'POST', body: { email: forgotEmail.trim() } });
      setMessage(_t('auth.resetLinkSent'));
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

  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(auth.email), [auth.email]);

  const publishedMenus = useMemo(() => {
    let filtered = menus.filter((entry) => entry.status === 'published');

    // Text search in title, description, cook name, items
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      filtered = filtered.filter((m) =>
        m.title?.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q) ||
        `${m.cook_first_name || ''} ${m.cook_last_name || ''}`.toLowerCase().includes(q) ||
        (m.items || []).some((item) => item.name?.toLowerCase().includes(q))
      );
    }

    // Cuisine filter
    if (cuisineFilter !== 'all') {
      filtered = filtered.filter((m) => m.cuisine_type === cuisineFilter);
    }

    // Delivery type filter
    if (filterDelivery === 'pickup') {
      filtered = filtered.filter((m) => m.pickup_available);
    } else if (filterDelivery === 'delivery') {
      filtered = filtered.filter((m) => m.delivery_available);
    }

    // Sort
    if (sortBy === 'price_asc') {
      filtered.sort((a, b) => {
        const aMin = Math.min(...(a.items || []).map((i) => parseFloat(i.price || 0)));
        const bMin = Math.min(...(b.items || []).map((i) => parseFloat(i.price || 0)));
        return aMin - bMin;
      });
    } else if (sortBy === 'price_desc') {
      filtered.sort((a, b) => {
        const aMin = Math.min(...(a.items || []).map((i) => parseFloat(i.price || 0)));
        const bMin = Math.min(...(b.items || []).map((i) => parseFloat(i.price || 0)));
        return bMin - aMin;
      });
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else {
      // Default: by rating desc
      filtered.sort((a, b) => (b.cook_rating || 0) - (a.cook_rating || 0));
    }

    return filtered;
  }, [menus, searchText, cuisineFilter, filterDelivery, sortBy]);

  const cuisines = useMemo(() => {
    const set = new Set();
    menus.forEach((m) => { if (m.cuisine_type) set.add(m.cuisine_type); });
    return ['all', ...Array.from(set)];
  }, [menus]);

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
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <Ionicons name="mail-unread-outline" size={48} color={colors.primary} />
        </View>
        <Text style={styles.sectionTitle}>{_t('auth.checkEmail')}</Text>
        <Text style={styles.body}>{_t('auth.verificationSent')}</Text>
        <Text style={[styles.body, { fontWeight: '800' }]}>{pendingVerification}</Text>
        <Text style={styles.muted}>{_t('auth.verificationInstructions')}</Text>
        <Pressable style={styles.secondary} onPress={() => { setPendingVerification(null); setAuthMode('login'); setError(''); }}>
          <Text style={styles.secondaryText}>{_t('auth.backToLogin')}</Text>
        </Pressable>
        <StatusBar style="dark" />
      </ScrollView>
    );
  }

  if (!token) {
    // Splash
    if (screen === 'splash') {
      return (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }} pointerEvents="box-none">
        <View style={styles.app}>
          <StatusBar style="dark" />
          <View style={styles.top}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View />
              {screen !== 'splash' && <Text style={styles.brand}>{_t('app.name')}</Text>}
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                {user && (
                  <Text style={[styles.langText, { fontSize: 12 }]}>@{user?.username || user?.first_name}</Text>
                )}
                <Pressable onPress={() => changeLang(lang === 'es-MX' ? 'en' : 'es-MX')} style={styles.langBtn}>
                  <Text style={styles.langText}>{lang === 'es-MX' ? '🇲🇽' : '🇺🇸'}</Text>
                </Pressable>
              </View>
            </View>
          </View>
          <ScrollView contentContainerStyle={styles.auth}>
            <Text style={styles.icon}>🍽️</Text>
            <Text style={styles.title}>{_t('app.name')}</Text>
            <Text style={styles.subtitle}>{_t('app.tagline')}</Text>
            <Text style={styles.body}>{_t('splash.description')}</Text>
            {user ? (
              <>
                <Pressable style={styles.primary} onPress={() => { setScreen(user.role === 'cook' ? 'cookDashboard' : 'market'); closeDrawer(); }}>
                  <Text style={styles.primaryText}>{_t('splash.goToPanel')}</Text>
                </Pressable>
                <Pressable style={styles.secondary} onPress={logout}>
                  <Text style={styles.secondaryText}>{_t('profile.logout')}</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable style={styles.primary} onPress={() => { setScreen('auth'); setAuthMode('login'); closeDrawer(); }}>
                  <Text style={styles.primaryText}>{_t('splash.login')}</Text>
                </Pressable>
                <Pressable style={styles.secondary} onPress={() => { setScreen('auth'); setAuthMode('register'); closeDrawer(); }}>
                  <Text style={styles.secondaryText}>{_t('splash.register')}</Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </View>
        </Animated.View>
      );
    }

    // Forgot password
    if (screen === 'forgotPassword') {
      return (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }} pointerEvents="box-none">
        <View style={styles.app}>
          <StatusBar style="dark" />
          <View style={styles.top}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View />
              <Text style={styles.brand}>{_t('app.name')}</Text>
              <Pressable onPress={() => changeLang(lang === 'es-MX' ? 'en' : 'es-MX')} style={styles.langBtn}>
                <Text style={styles.langText}>{lang === 'es-MX' ? '🇲🇽' : '🇺🇸'}</Text>
              </Pressable>
            </View>
          </View>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
          <ScrollView
            contentContainerStyle={styles.auth}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}>
            <Text style={styles.icon}>🔐</Text>
            <Text style={styles.sectionTitle}>{_t('auth.recoverPassword')}</Text>
            <Text style={[styles.body, { textAlign: 'center' }]}>{_t('auth.forgotPassword')}</Text>
            <FloatingField label={_t('auth.email')} value={forgotEmail} autoCapitalize="none" onChangeText={setForgotEmail} />
            {!!error && <Text style={styles.error}>{error}</Text>}
            {!!message && <Text style={styles.success}>{message}</Text>}
            <Pressable style={styles.primary} onPress={submitForgotPassword}>
              <Text style={styles.primaryText}>{loading ? '...' : _t('auth.sendResetLink')}</Text>
            </Pressable>
            <Pressable onPress={() => { setScreen('auth'); setAuthMode('login'); setError(''); setMessage(''); setForgotEmail(''); }}>
              <Text style={[styles.link, { textAlign: 'center' }]}>{_t('auth.backToLogin')}</Text>
            </Pressable>
          </ScrollView>
          </KeyboardAvoidingView>
        </View>
        </Animated.View>
      );
    }

    // Auth form
    return (
      <View style={styles.app}>
        <StatusBar style="dark" />
        <Animated.View style={{ flex: 1, opacity: fadeAnim }} pointerEvents="box-none">
        {/* Top bar with hamburger */}
        <View style={styles.top}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Pressable onPress={() => setDrawerOpen(true)} style={{ padding: 4 }}>
              <Ionicons name="menu" size={24} color={colors.text} />
            </Pressable>
            <Text style={styles.brand}>{_t('app.name')}</Text>
            <Pressable onPress={() => changeLang(lang === 'es-MX' ? 'en' : 'es-MX')} style={styles.langBtn}>
              <Text style={styles.langText}>{lang === 'es-MX' ? '🇲🇽' : '🇺🇸'}</Text>
            </Pressable>
          </View>
        </View>

        {/* Drawer overlay */}
        {drawerOpen && (
          <Pressable style={styles.drawerOverlay} onPress={closeDrawer}>
            <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
              <Pressable onPress={(e) => e.stopPropagation()} style={{ flex: 1 }}>
                <View style={{ paddingHorizontal: 16, paddingTop: 56 }}>
                  <Text style={styles.sectionTitle}>{_t('app.name')}</Text>
                </View>
                <DrawerItem icon="log-in" label={_t('auth.login')} active={authMode === 'login'} onPress={() => { setAuthMode('login'); closeDrawer(); setError(''); }} />
                <DrawerItem icon="person-add" label={_t('auth.register')} active={authMode === 'register'} onPress={() => { setAuthMode('register'); closeDrawer(); setError(''); }} />
                <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16, paddingHorizontal: 16 }}>
                  <Pressable style={styles.drawerLogout} onPress={() => { setScreen('splash'); closeDrawer(); setError(''); setMessage(''); }}>
                    <Text style={{ color: colors.muted, fontWeight: '600', marginLeft: 12 }}>{_t('splash.home')}</Text>
                  </Pressable>
                </View>
              </Pressable>
            </Animated.View>
          </Pressable>
        )}

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <ScrollView
          contentContainerStyle={styles.auth}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}>
          <Text style={styles.icon}>🍽️</Text>
          <Text style={styles.sectionTitle}>{authMode === 'login' ? _t('auth.login') : _t('auth.register')}</Text>

          <FloatingField label={_t('auth.email')} value={auth.email} autoCapitalize="none" onChangeText={(email) => { setAuth((c) => ({ ...c, email })); setError(''); setMessage(''); }} />
          {auth.email.length > 0 && !emailValid && (
            <Text style={{ color: colors.danger, fontSize: 12, marginTop: -8 }}>{_t('auth.emailInvalid')}</Text>
          )}
          <FloatingField label={_t('auth.password')} value={auth.password} secureTextEntry onChangeText={(password) => setAuth((c) => ({ ...c, password }))} />

          {authMode === 'register' && (
            <>
              <FloatingField label={_t('auth.confirmPassword')} value={auth.confirmPassword} secureTextEntry onChangeText={(v) => setAuth((c) => ({ ...c, confirmPassword: v }))} />
              <FloatingField label="@username" value={auth.username} autoCapitalize="none" onChangeText={(v) => setAuth((c) => ({ ...c, username: v }))} />
              <View style={styles.row}>
                <View style={{ flex: 1 }}><FloatingField label={_t('auth.firstName')} value={auth.firstName} onChangeText={(v) => setAuth((c) => ({ ...c, firstName: v }))} /></View>
                <View style={{ flex: 1 }}><FloatingField label={_t('auth.lastName')} value={auth.lastName} onChangeText={(v) => setAuth((c) => ({ ...c, lastName: v }))} /></View>
              </View>
              <View style={styles.segmentedControl}>
                <Pressable style={[styles.segment, auth.role === 'member' && styles.segmentActive]} onPress={() => setAuth((c) => ({ ...c, role: 'member' }))}>
                  <Ionicons name="cart" size={16} color={auth.role === 'member' ? colors.primary : colors.muted} />
                  <Text style={[styles.segmentText, auth.role === 'member' && styles.segmentTextActive]}>{_t('auth.member')}</Text>
                </Pressable>
                <Pressable style={[styles.segment, auth.role === 'cook' && styles.segmentActive]} onPress={() => setAuth((c) => ({ ...c, role: 'cook' }))}>
                  <Ionicons name="restaurant" size={16} color={auth.role === 'cook' ? colors.primary : colors.muted} />
                  <Text style={[styles.segmentText, auth.role === 'cook' && styles.segmentTextActive]}>{_t('auth.cook')}</Text>
                </Pressable>
              </View>
            </>
          )}

          {authMode === 'login' && (
            <Pressable onPress={() => setScreen('forgotPassword')}>
              <Text style={[styles.link, { textAlign: 'center', marginTop: -4 }]}>{_t('auth.forgotPassword')}</Text>
            </Pressable>
          )}

          {!!error && <Text style={styles.error}>{error}</Text>}
          <Pressable style={styles.primary} onPress={submitAuth}>
            <Text style={styles.primaryText}>{authMode === 'login' ? _t('auth.signIn') : _t('auth.createAccount')}</Text>
          </Pressable>
        </ScrollView>
        </KeyboardAvoidingView>
        </Animated.View>
      </View>
    );
  }

  const marketView = (
    <View style={styles.section}>
      {/* Search bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12 }}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, color: colors.text, fontSize: 15 }}
            placeholder="Buscar menús, platillos..."
            placeholderTextColor={colors.muted}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText ? (
            <Pressable onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
        <Pressable onPress={loadMenus} style={{ padding: 8 }}>
          <Ionicons name="refresh" size={20} color={colors.primary} />
        </Pressable>
      </View>

      {/* Filter chips row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }} contentContainerStyle={{ gap: 6 }}>
        {cuisines.map((c) => (
          <Pressable key={c} style={[styles.chip, cuisineFilter === c && styles.chipActive]} onPress={() => setCuisineFilter(c)}>
            <Text style={[styles.chipText, cuisineFilter === c && styles.chipTextActive]}>{c === 'all' ? 'Todas' : c}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Sort & delivery filter row */}
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {['all', 'pickup', 'delivery'].map((d) => (
          <Pressable key={d} style={[styles.chip, filterDelivery === d && styles.chipActive]} onPress={() => setFilterDelivery(d)}>
            <Text style={[styles.chipText, filterDelivery === d && styles.chipTextActive]}>
              {d === 'all' ? 'Todos' : d === 'pickup' ? '📦 Recoger' : '🚚 Delivery'}
            </Text>
          </Pressable>
        ))}
        <Pressable style={[styles.chip]} onPress={() => setSortBy((s) => ({ rating: 'price_asc', price_asc: 'price_desc', price_desc: 'name', name: 'rating' }[s] || 'rating'))}>
          <Text style={styles.chipText}>
            {sortBy === 'rating' ? '⭐ Mejor' : sortBy === 'price_asc' ? '💰 Menor' : sortBy === 'price_desc' ? '💰 Mayor' : '🔤 A-Z'}
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <FlatList
          data={publishedMenus}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <Ionicons name="search-outline" size={48} color={colors.border} />
              <Text style={[styles.helper, { marginTop: 12 }]}>
                {searchText || cuisineFilter !== 'all' || filterDelivery !== 'all'
                  ? 'No hay resultados con esos filtros'
                  : _t('market.noMenus')}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => openMenu(item.id)}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.muted}>👨‍🍳 {item.cook_first_name} {item.cook_last_name}{item.cook_rating ? `  ⭐ ${item.cook_rating}` : ''}</Text>
                </View>
                {item.cuisine_type ? (
                  <Text style={[styles.muted, { fontSize: 11, backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, overflow: 'hidden' }]}>{item.cuisine_type}</Text>
                ) : null}
              </View>
              <Text style={styles.body} numberOfLines={2}>{item.description || ''}</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                {item.pickup_available ? <Text style={[styles.muted, { fontSize: 12 }]}>📦 Recoger</Text> : null}
                {item.delivery_available ? <Text style={[styles.muted, { fontSize: 12 }]}>🚚 Delivery</Text> : null}
                {(item.items || []).length > 0 ? (
                  <Text style={[styles.muted, { fontSize: 12 }]}>
                    🍽️ {item.items.length} platillo{item.items.length !== 1 ? 's' : ''} • ${Math.min(...item.items.map((i) => parseFloat(i.price || 0))).toFixed(2)}+
                  </Text>
                ) : null}
              </View>
              <Text style={styles.link}>{_t('market.viewMenu')}</Text>
            </Pressable>
          )}
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      )}
    </View>
  );

  const ordersView = (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>{_t('orders.title')}</Text>
        <Pressable onPress={loadOrders}><Text style={styles.link}>↻</Text></Pressable>
      </View>
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : orders.length === 0 ? (
        <Text style={styles.helper}>{_t('orders.noOrders')}</Text>
      ) : (
        orders.map((order) => (
          <View key={order.id} style={styles.card}>
            <Text style={styles.cardTitle}>{order.order_number}</Text>
            <Text style={styles.muted}>{order.menu_title}</Text>
            <Text style={styles.body}>{_t('orders.total')} {money(order.total_amount)}</Text>
          </View>
        ))
      )}
    </View>
  );

  const profileView = (
    <ScrollView contentContainerStyle={styles.section}>
      {/* User info */}
      <View style={styles.card}>
        <View style={[styles.avatar, { alignSelf: 'center', marginBottom: 12 }]}>
          <Ionicons name="person" size={32} color={colors.primary} />
        </View>
        <Text style={[styles.cardTitle, { textAlign: 'center' }]}>@{user?.username || user?.first_name || user?.email}</Text>
        <Text style={[styles.body, { textAlign: 'center', color: colors.muted }]}>{user?.email}</Text>
        <View style={[styles.row, { justifyContent: 'center', marginTop: 8 }]}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{user?.role === 'cook' ? _t('profile.cook') : _t('profile.member')}</Text>
          </View>
        </View>
      </View>

      {/* Settings */}
      <Text style={[styles.sectionTitle, { marginTop: 8 }]}>{_t('profile.settings')}</Text>
      <Pressable style={styles.card} onPress={logout}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            <Text style={[styles.body, { color: colors.danger, fontWeight: '600' }]}>{_t('profile.logout')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </View>
      </Pressable>
    </ScrollView>
  );

  const menuView = (
    <ScrollView contentContainerStyle={styles.section}>
      <Pressable onPress={() => setScreen('market')}>
        <Text style={styles.link}>{_t('menu.back')}</Text>
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
        <Text style={styles.cardTitle}>{_t('menu.deliveryType')}</Text>
        <View style={styles.row}>
          <Chip label={_t('menu.pickup')} active={draft.deliveryType === 'pickup'} onPress={() => setDraft((c) => ({ ...c, deliveryType: 'pickup' }))} />
          <Chip label={_t('menu.delivery')} active={draft.deliveryType === 'delivery'} onPress={() => setDraft((c) => ({ ...c, deliveryType: 'delivery' }))} />
        </View>
        {draft.deliveryType === 'delivery' && (
          <FloatingField label="Address" value={draft.deliveryAddress} onChangeText={(v) => setDraft((c) => ({ ...c, deliveryAddress: v }))} />
        )}
        <FloatingField label={_t('menu.notesPlaceholder')} value={draft.specialInstructions} multiline onChangeText={(v) => setDraft((c) => ({ ...c, specialInstructions: v }))} />
        {!!error && <Text style={styles.error}>{error}</Text>}
        <Pressable style={styles.primary} onPress={placeOrder}>
          <Text style={styles.primaryText}>{_t('menu.placeOrder')}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );

  // ── Cook views ──────────────────────────────────────────────
  const cookDashboardView = (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{_t('cook.dashboard')}</Text>
      <View style={styles.row}>
        <View style={[styles.statCard, { borderLeftColor: colors.primary }]}>
          <Text style={styles.statValue}>{cookStats.activeMenus}</Text>
          <Text style={styles.statLabel}>{_t('cook.activeMenus')}</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: colors.emerald }]}>
          <Text style={styles.statValue}>{cookStats.totalOrders}</Text>
          <Text style={styles.statLabel}>{_t('cook.totalOrders')}</Text>
        </View>
      </View>
      <View style={styles.row}>
        <View style={[styles.statCard, { borderLeftColor: colors.amber }]}>
          <Text style={styles.statValue}>{cookStats.pendingOrders}</Text>
          <Text style={styles.statLabel}>{_t('cook.pendingOrders')}</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: colors.purple }]}>
          <Text style={styles.statValue}>${cookStats.revenue}</Text>
          <Text style={styles.statLabel}>{_t('cook.revenue')}</Text>
        </View>
      </View>
      <Pressable style={styles.primary} onPress={loadCookStats}>
        <Text style={styles.primaryText}>↻ {_t('cook.refreshNow')}</Text>
      </Pressable>
    </View>
  );

  const cookOrdersView = (
    <ScrollView contentContainerStyle={styles.section}>
      <Text style={styles.sectionTitle}>{_t('cook.ordersTitle')}</Text>
      {cookOrders.length === 0 ? (
        <Text style={styles.helper}>{_t('cook.noOrders')}</Text>
      ) : (
        cookOrders.map((order) => (
          <View key={order.id} style={styles.card}>
            <Text style={styles.cardTitle}>#{order.id} — {order.member_name || order.member_email}</Text>
            <Text style={styles.muted}>{_t('cook.totalAmount')} {money(order.total_amount)}</Text>
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
                <Text style={styles.primaryText}>🟢 {_t('cook.readyForPickupCook')}</Text>
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

  const cookMenusView = (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>📋 {_t('cook.myMenus')}</Text>
        <Pressable onPress={loadMyMenus}><Ionicons name="refresh" size={20} color={colors.primary} /></Pressable>
      </View>

      {/* Create new menu button */}
      {!cookMenuId && (
        <Pressable style={[styles.primary, { marginBottom: 12 }]} onPress={() => { setCookMenuId('new'); setMenuStep(1); setMenuItems([]); setMenuForm({ title: '', description: '', menuDate: new Date().toISOString().split('T')[0], orderStartTime: '', orderEndTime: '', pickupAvailable: true, deliveryAvailable: false, pickupLocation: '' }); }}>
          <Text style={styles.primaryText}>+ {_t('cook.createMenuBtn')}</Text>
        </Pressable>
      )}

      {cookMenuId === 'new' ? (
        <ScrollView contentContainerStyle={{ gap: 12 }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: 'row', gap: 4, marginBottom: 4 }}>
            {[1, 2, 3].map((s) => (
              <View key={s} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: menuStep >= s ? colors.primary : colors.border }} />
            ))}
          </View>
          {menuStep === 1 && (
            <>
              <Text style={{ fontWeight: '800', color: colors.text }}>Paso 1 — Información general</Text>
              <FloatingField label={_t('cook.menuTitle')} value={menuForm.title} onChangeText={(v) => setMenuForm((c) => ({ ...c, title: v }))} />
              <FloatingField label={_t('cook.description')} value={menuForm.description} onChangeText={(v) => setMenuForm((c) => ({ ...c, description: v }))} />
              <FloatingField label={_t('cook.menuDate')} value={menuForm.menuDate} onChangeText={(v) => setMenuForm((c) => ({ ...c, menuDate: v }))} />
              <FloatingField label={_t('cook.orderStart')} value={menuForm.orderStartTime} onChangeText={(v) => setMenuForm((c) => ({ ...c, orderStartTime: v }))} />
              <FloatingField label={_t('cook.orderEnd')} value={menuForm.orderEndTime} onChangeText={(v) => setMenuForm((c) => ({ ...c, orderEndTime: v }))} />
              <FloatingField label={_t('cook.pickupLocation')} value={menuForm.pickupLocation} onChangeText={(v) => setMenuForm((c) => ({ ...c, pickupLocation: v }))} />
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <Pressable style={[styles.chip, menuForm.pickupAvailable && styles.chipActive]} onPress={() => setMenuForm((c) => ({ ...c, pickupAvailable: !c.pickupAvailable }))}>
                  <Text style={[styles.chipText, menuForm.pickupAvailable && styles.chipTextActive]}>📦 {_t('cook.pickupAvailable')}</Text>
                </Pressable>
                <Pressable style={[styles.chip, menuForm.deliveryAvailable && styles.chipActive]} onPress={() => setMenuForm((c) => ({ ...c, deliveryAvailable: !c.deliveryAvailable }))}>
                  <Text style={[styles.chipText, menuForm.deliveryAvailable && styles.chipTextActive]}>🚚 {_t('cook.deliveryAvailable')}</Text>
                </Pressable>
              </View>
              <Pressable style={styles.primary} onPress={() => { if (menuForm.title.trim()) setMenuStep(2); else setError('El título es obligatorio'); }}>
                <Text style={styles.primaryText}>Siguiente →</Text>
              </Pressable>
            </>
          )}
          {menuStep === 2 && (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontWeight: '800', color: colors.text }}>Paso 2 — Platillos</Text>
                <Pressable onPress={() => setMenuItems((prev) => [...prev, { name: '', price: '', quantity: '10', dietary: '' }])}>
                  <Ionicons name="add-circle" size={28} color={colors.primary} />
                </Pressable>
              </View>
              {menuItems.length === 0 && <Text style={styles.helper}>Agrega al menos un platillo</Text>}
              {menuItems.map((item, idx) => (
                <View key={idx} style={[styles.card, { gap: 6 }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontWeight: '700', color: colors.text }}>Platillo #{idx + 1}</Text>
                    <Pressable onPress={() => setMenuItems((prev) => prev.filter((_, i) => i !== idx))}>
                      <Ionicons name="trash-outline" size={18} color={colors.danger} />
                    </Pressable>
                  </View>
                  <FloatingField label="Nombre del platillo *" value={item.name} onChangeText={(v) => setMenuItems((prev) => prev.map((p, i) => i === idx ? { ...p, name: v } : p))} />
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1 }}><FloatingField label="Precio $" value={item.price} keyboardType="decimal-pad" onChangeText={(v) => setMenuItems((prev) => prev.map((p, i) => i === idx ? { ...p, price: v } : p))} /></View>
                    <View style={{ flex: 1 }}><FloatingField label="Cantidad" value={item.quantity} keyboardType="number-pad" onChangeText={(v) => setMenuItems((prev) => prev.map((p, i) => i === idx ? { ...p, quantity: v } : p))} /></View>
                  </View>
                  <FloatingField label="Etiquetas (ej: vegano, sin gluten)" value={item.dietary} onChangeText={(v) => setMenuItems((prev) => prev.map((p, i) => i === idx ? { ...p, dietary: v } : p))} />
                </View>
              ))}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable style={[styles.secondary, { flex: 1 }]} onPress={() => setMenuStep(1)}>
                  <Text style={styles.secondaryText}>← Atrás</Text>
                </Pressable>
                <Pressable style={[styles.primary, { flex: 1 }]} onPress={() => { if (menuItems.some((i) => i.name.trim())) setMenuStep(3); else setError('Agrega al menos un platillo con nombre'); }}>
                  <Text style={styles.primaryText}>Revisar →</Text>
                </Pressable>
              </View>
            </>
          )}
          {menuStep === 3 && (
            <>
              <Text style={{ fontWeight: '800', color: colors.text }}>Paso 3 — Revisar y publicar</Text>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{menuForm.title || 'Sin título'}</Text>
                <Text style={styles.body}>{menuForm.description || 'Sin descripción'}</Text>
                <Text style={styles.muted}>📅 {menuForm.menuDate}</Text>
                <Text style={styles.muted}>🕐 {menuForm.orderStartTime} — {menuForm.orderEndTime}</Text>
                <Text style={styles.muted}>📍 {menuForm.pickupLocation}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {menuForm.pickupAvailable ? <Text style={[styles.muted, { fontSize: 12 }]}>📦 Recoger</Text> : null}
                  {menuForm.deliveryAvailable ? <Text style={[styles.muted, { fontSize: 12 }]}>🚚 Delivery</Text> : null}
                </View>
              </View>
              {menuItems.length > 0 && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Platillos ({menuItems.length})</Text>
                  {menuItems.map((item, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                      <Text style={styles.body}>{item.name}</Text>
                      <Text style={{ fontWeight: '700', color: colors.text }}>${parseFloat(item.price || 0).toFixed(2)}</Text>
                    </View>
                  ))}
                  <Text style={styles.muted}>Total: ${menuItems.reduce((s, i) => s + parseFloat(i.price || 0) * parseInt(i.quantity || 1), 0).toFixed(2)}</Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable style={[styles.secondary, { flex: 1 }]} onPress={() => setMenuStep(2)}>
                  <Text style={styles.secondaryText}>← Editar</Text>
                </Pressable>
                <Pressable style={[styles.primary, { flex: 1 }]} onPress={async () => {
                  setLoading(true); setError('');
                  try {
                    const data = await api('/menus', { method: 'POST', token, body: menuForm });
                    const mid = data.menu?.id;
                    if (mid && menuItems.length > 0) {
                      for (const item of menuItems) {
                        await api(`/menus/${mid}/items`, { method: 'POST', token, body: { name: item.name, price: parseFloat(item.price || 0), quantityAvailable: parseInt(item.quantity || 1), dietaryTags: item.dietary } });
                      }
                    }
                    setCookMenuId(null); setMenuStep(1); setMenuItems([]);
                    setMessage('Menú creado con éxito');
                    loadMyMenus(); loadCookStats();
                  } catch (e) { setError(e.message); }
                  finally { setLoading(false); }
                }}>
                  <Text style={styles.primaryText}>{loading ? 'Publicando...' : '📢 Publicar menú'}</Text>
                </Pressable>
              </View>
            </>
          )}
          {!!error && <Text style={styles.error}>{error}</Text>}
        </ScrollView>
      ) : (
        <>
          {loading ? <ActivityIndicator color={colors.primary} /> : null}
          <FlatList
            data={myMenus}
            keyExtractor={(item) => String(item.id)}
            ListEmptyComponent={<Text style={styles.helper}>{_t('cook.noMenusYet')}</Text>}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={[styles.chipText, { fontSize: 12, color: item.status === 'published' ? colors.success : colors.amber }]}>{item.status}</Text>
                </View>
                <Text style={styles.muted}>📅 {item.menu_date ? new Date(item.menu_date).toLocaleDateString() : ''}</Text>
                <Text style={styles.muted}>📦 {item.order_count || 0} pedidos</Text>
                {item.status === 'draft' && (
                  <Pressable style={[styles.primary, { marginTop: 8 }]} onPress={async () => {
                    try { await api(`/menus/${item.id}/publish`, { method: 'PUT', token }); loadMyMenus(); }
                    catch (e) { setError(e.message); }
                  }}>
                    <Text style={styles.primaryText}>📢 Publicar</Text>
                  </Pressable>
                )}
              </View>
            )}
            ListFooterComponent={<View style={{ height: 100 }} />}
          />
        </>
      )}
    </View>
  );

  const loggedSplashView = (
    <ScrollView contentContainerStyle={styles.section}>
      <View style={{ alignItems: 'center', gap: 16, paddingTop: 40 }}>
        <Text style={styles.icon}>🍽️</Text>
        <Text style={styles.title}>{_t('app.name')}</Text>
        <Text style={styles.subtitle}>{_t('app.tagline')}</Text>
        <View style={[styles.card, { width: '100%', alignItems: 'center', gap: 8 }]}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={28} color={colors.primary} />
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.cardTitle}>@{user?.username || user?.first_name || user?.email}</Text>
            <Text style={[styles.body, { color: colors.muted }]}>{user?.email}</Text>
          </View>
          <View style={styles.row}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{user?.role === 'cook' ? _t('profile.cook') : _t('profile.member')}</Text>
            </View>
            <Text style={[styles.muted, { fontSize: 12 }]}>✓ Sesión activa</Text>
          </View>
        </View>
        <View style={[styles.card, { width: '100%', gap: 4 }]}>
          <Pressable style={styles.drawerItem} onPress={() => { setScreen(user?.role === 'cook' ? 'cookDashboard' : 'market'); }}>
            <Ionicons name={user?.role === 'cook' ? 'grid' : 'cart'} size={20} color={colors.text} />
            <Text style={styles.drawerItemText}>{user?.role === 'cook' ? _t('cook.dashboard') : _t('market.title')}</Text>
          </Pressable>
          <Pressable style={styles.drawerItem} onPress={() => { setScreen('profile'); }}>
            <Ionicons name="person" size={20} color={colors.text} />
            <Text style={styles.drawerItemText}>{_t('profile.title')}</Text>
          </Pressable>
          <Pressable style={styles.drawerItem} onPress={logout}>
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            <Text style={[styles.drawerItemText, { color: colors.danger }]}>{_t('profile.logout')}</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.app}>
      <StatusBar style="dark" />
      <Animated.View style={{ flex: 1, opacity: fadeAnim }} pointerEvents="box-none">
      <View style={styles.top}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable onPress={() => setDrawerOpen(true)} style={{ padding: 4 }}>
            <Ionicons name="menu" size={24} color={colors.text} />
          </Pressable>
          {screen !== 'splash' && <Text style={styles.brand}>{_t('app.name')}</Text>}
          <Pressable onPress={() => changeLang(lang === 'es-MX' ? 'en' : 'es-MX')} style={styles.langBtn}>
            <Text style={styles.langText}>{lang === 'es-MX' ? '🇲🇽' : '🇺🇸'}</Text>
          </Pressable>
        </View>
      </View>

      {/* ── Drawer ──────────────────────────────────────── */}
      {drawerOpen && (
        <Pressable style={styles.drawerOverlay} onPress={closeDrawer}>
          <View />
        </Pressable>
      )}
      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.cardTitle, { marginTop: 8 }]}>@{user?.username || user?.first_name || user?.email}</Text>
          <Text style={[styles.body, { color: colors.muted, marginBottom: 16 }]}>{user?.email}</Text>
        </View>

        {user?.role === 'cook' ? (
          <>
            <DrawerItem icon="grid" label={_t('cook.dashboard')} active={screen === 'cookDashboard'} onPress={() => { setScreen('cookDashboard'); closeDrawer(); }} />
            <DrawerItem icon="document-text" label={_t('cook.myMenus')} active={screen === 'cookMenus'} onPress={() => { setScreen('cookMenus'); closeDrawer(); loadMyMenus(); }} />
            <DrawerItem icon="list" label={_t('cook.orders')} active={screen === 'cookOrders'} onPress={() => { setScreen('cookOrders'); closeDrawer(); }} />
          </>
        ) : (
          <>
            <DrawerItem icon="cart" label={_t('market.title')} active={screen === 'market'} onPress={() => { setScreen('market'); closeDrawer(); }} />
            <DrawerItem icon="receipt" label={_t('orders.title')} active={screen === 'orders'} onPress={() => { setScreen('orders'); closeDrawer(); }} />
          </>
        )}
        <DrawerItem icon="person" label={_t('profile.title')} active={screen === 'profile'} onPress={() => { setScreen('profile'); closeDrawer(); }} />
        <DrawerItem icon="home" label={_t('splash.home')} onPress={() => { setScreen('splash'); closeDrawer(); }} />

        <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16, paddingHorizontal: 16 }}>
          <Pressable style={styles.drawerLogout} onPress={logout}>
            <Ionicons name="log-out-outline" size={18} color={colors.danger} />
            <Text style={{ color: colors.danger, fontWeight: '600', marginLeft: 12 }}>{_t('profile.logout')}</Text>
          </Pressable>
        </View>
      </Animated.View>

      {!!message && <Text style={styles.success}>{message}</Text>}
      {!!error && <Text style={styles.error}>{error}</Text>}

      {screen === 'market' && marketView}
      {screen === 'orders' && ordersView}
      {screen === 'profile' && profileView}
      {screen === 'menu' && menuView}
      {screen === 'cookDashboard' && cookDashboardView}
      {screen === 'cookMenus' && cookMenusView}
      {screen === 'cookOrders' && cookOrdersView}
      {screen === 'splash' && loggedSplashView}
      </Animated.View>
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
  input: { borderColor: colors.border, backgroundColor: colors.card, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, color: colors.text, borderWidth: 1 },
  floatField: { paddingTop: 6 },
  floatLabel: { position: 'absolute', left: 16, zIndex: 10, fontWeight: '600' },
  floatInput: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: 14, paddingHorizontal: 14, paddingTop: 18, paddingBottom: 8, color: colors.text, fontSize: 15 },
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
  langText: { fontSize: 18, color: colors.muted, fontWeight: '600' },
  langTextActive: { color: colors.primary },
  langDrop: { position: 'absolute', top: 40, right: 0, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, zIndex: 200 },
  statCard: { flex: 1, backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4, padding: 12, gap: 4 },
  statValue: { fontSize: 24, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  roleBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  roleBadgeText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  drawer: { position: 'absolute', top: 0, left: 0, bottom: 0, width: 280, backgroundColor: colors.card, zIndex: 100 },
  drawerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 99 },
  drawerItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  drawerItemActive: { backgroundColor: colors.primaryLight },
  drawerItemText: { fontSize: 15, color: colors.text, fontWeight: '600' },
  drawerItemTextActive: { color: colors.primary },
  drawerLogout: { flexDirection: 'row', alignItems: 'center' },
  segmentedControl: { flexDirection: 'row', backgroundColor: colors.border, borderRadius: 14, padding: 4 },
  segment: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 11 },
  segmentActive: { backgroundColor: colors.card },
  segmentText: { fontSize: 14, color: colors.muted, fontWeight: '600' },
  segmentTextActive: { color: colors.text },
  authPillContainer: { flexDirection: 'row', backgroundColor: colors.border, borderRadius: 14, padding: 4, position: 'relative' },
  authPill: { position: 'absolute', top: 4, left: 4, height: 36, backgroundColor: colors.card, borderRadius: 11, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  authPillBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, zIndex: 10 },
  authPillText: { fontSize: 14, color: colors.muted, fontWeight: '600' },
  authPillTextActive: { color: colors.text },
});
