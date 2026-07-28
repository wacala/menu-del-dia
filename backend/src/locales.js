/**
 * Localization strings for backend API responses.
 * Selected by Accept-Language header.
 */
const locales = {
  es: {
    'Menu not available for ordering': 'Menú no disponible para ordenar',
    'Member profile not found': 'Perfil de miembro no encontrado',
    'Invalid credentials': 'Correo o contraseña incorrectos',
    'Invalid value': 'Valor inválido',
    'Email or username already registered': 'El correo o usuario ya está registrado',
    'Please verify your email before logging in. Check your inbox.': 'Verifica tu correo antes de iniciar sesión',
    'Verification failed. The link may have expired.': 'Verificación fallida. El enlace puede haber expirado.',
    'Passwords do not match': 'Las contraseñas no coinciden',
    'Password must be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
    'Add at least one item.': 'Agrega al menos un platillo',
    'Add a delivery address.': 'Agrega una dirección de entrega',
    'Could not create order': 'No se pudo crear el pedido',
    'Order placed successfully.': 'Pedido realizado con éxito',
    'Invalid token': 'Sesión expirada. Inicia sesión de nuevo.',
    'No token provided': 'Sesión no iniciada',
    'You do not have permission to perform this action': 'No tienes permiso para realizar esta acción',
    'Menu created successfully': 'Menú creado con éxito',
    'Title is required': 'El título es obligatorio',
    'Add at least one item with a name': 'Agrega al menos un platillo con nombre',
    'Producto no encontrado': 'Producto no encontrado',
    'Stock insuficiente': 'Stock insuficiente',
    'Insufficient permissions': 'Permisos insuficientes',
    'Datos inválidos': 'Datos inválidos',
    'No puedes calificar esta orden': 'No puedes calificar esta orden',
    'Ya calificaste esta orden': 'Ya calificaste esta orden',
    'Calificación guardada': 'Calificación guardada',
  },
  en: {
    'Datos inválidos': 'Invalid data',
    'Perfil de miembro no encontrado': 'Member profile not found',
    'No puedes calificar esta orden': 'You cannot rate this order',
    'Ya calificaste esta orden': 'You already rated this order',
    'Calificación guardada': 'Rating saved',
    'Menú no disponible para ordenar': 'Menu not available for ordering',
  },
};

function t(msg, lang = 'es') {
  const l = lang.startsWith('es') ? 'es' : 'en';
  return locales[l]?.[msg] || locales.en?.[msg] || msg;
}

function parseLanguage(header = '') {
  return header.split(',')[0]?.split(';')[0]?.trim() || 'es-MX';
}

module.exports = { t, parseLanguage };
