# 🍽️ Menú del Día — AI Context Document

> Proyecto: Plataforma de compra y venta de comida casera comunitaria.
> Cualquier AI que lea este documento puede ponerse al día inmediatamente.

---

## 📋 Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Frontend Web** | React + Vite + Tailwind CSS 4 | React 19 |
| **Frontend Móvil** | Expo + React Native | Expo ~54 |
| **Backend** | Node.js + Express | — |
| **Base de datos** | PostgreSQL (Railway) | — |
| **Autenticación** | JWT + bcrypt | — |
| **Pagos** | Stripe *(pendiente integrar frontend)* | — |
| **Emails** | Resend | — |
| **Hosting** | Railway | — |

## 🏗️ Estructura del Proyecto

```
menu-del-dia/
├── backend/               # API REST (Express + PostgreSQL)
│   ├── src/
│   │   ├── config/        # Config (DB, JWT, Stripe, email)
│   │   ├── middleware/     # Auth, error handler
│   │   ├── routes/         # auth, menus, orders, users, payments, notifications
│   │   └── services/       # Email (Resend)
│   └── scripts/            # SQL migrations
├── frontend/               # Web (React + Vite + Tailwind + i18next)
│   └── src/
│       ├── api/            # Cliente Axios + endpoints
│       ├── components/     # LanguageSwitcher, StripePaymentForm
│       ├── context/        # Zustand auth store
│       ├── i18n/           # Traducciones ES/EN
│       └── pages/          # Login, Register, Dashboard, Marketplace, etc.
├── mobile/                 # Expo (React Native, single-file App.js)
│   ├── App.js              # ~1300 líneas, toda la app en un archivo
│   ├── CLAUDE.md           # Instrucciones para AI sobre Expo
│   └── AGENTS.md           # Contexto adicional
└── scripts/                # Scripts de utilidad

## 🧠 Arquitectura (Mobile App.js)

La app móvil es un solo archivo `App.js` (~1300 líneas) que contiene:

### Estado global (useState en App)
- `screen` — Pantalla activa: splash, auth, market, menu, orders, profile, cookDashboard, cookOrders, cookMenus, forgotPassword
- `auth` — Formulario de auth (email, password, firstName, lastName, username, role)
- `user`, `token` — Sesión
- `menu`, `menus`, `orders`, `myMenus` — Datos
- `searchText`, `cuisineFilter`, `filterDelivery`, `sortBy` — Filtros marketplace
- `menuStep`, `menuItems`, `menuForm` — Wizard creación menú

### Flujo de navegación
1. **Splash** → Login/Register o si hay token → Dashboard (según rol)
2. **Member** → Marketplace (con buscador + filtros) → Menu Detail → Order
3. **Cook** → Dashboard (stats) → Mis Menús (wizard 3 pasos) → Órdenes
4. **Drawer** lateral con opciones según rol

### Sistema de traducciones
- `_t(key, lng)` — Función global que traduce del objeto `translations`
- `lang` — Estado: 'es-MX' (default forzado) o 'en'
- Sin dependencias externas de i18n en móvil (implementación propia)

## 🔌 API Endpoints

### Auth
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/auth/register | Registrar usuario |
| POST | /api/auth/login | Iniciar sesión |
| POST | /api/auth/forgot-password | Solicitar reset de contraseña |
| POST | /api/auth/reset-password | Resetear contraseña con token |
| POST | /api/auth/verify-email | Verificar email |
| POST | /api/auth/resend-verification | Reenviar verificación |

### Menus
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/menus | Listar menús publicados (filtro por date) |
| GET | /api/menus/:id | Detalle de menú |
| POST | /api/menus | Crear menú (cook) |
| GET | /api/menus/my/menus | Menús del cook |
| POST | /api/menus/:id/items | Agregar item al menú |
| PUT | /api/menus/:id/publish | Publicar menú |

### Orders
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/orders | Crear pedido |
| GET | /api/orders/my | Pedidos del miembro |
| GET | /api/orders/cook | Pedidos del cook |
| GET | /api/orders/:id | Detalle del pedido |
| PUT | /api/orders/:id/status | Actualizar estado |

## 🗄️ Base de Datos (PostgreSQL)

### Tablas principales
- `users` — id, email, password_hash, first_name, last_name, username, role (cook\|member), email_verified
- `cook_profiles` — user_id, cuisine_type, bio, rating, status
- `member_profiles` — user_id
- `menus` — cook_id, title, description, menu_date, order_start/end_time, pickup/delivery_available, pickup_location, status (draft\|published)
- `menu_items` — menu_id, name, description, price, quantity_available, quantity_sold, dietary_tags
- `orders` — member_id, menu_id, delivery_type, status (pending\|confirmed\|ready\|delivered\|cancelled), total_amount, notes
- `order_items` — order_id, menu_item_id, quantity, unit_price
- `password_resets` — user_id, token, expires_at, used
- `email_verifications` — user_id, token, expires_at, used
- `payments` — order_id, amount, status, stripe_payment_intent_id

## 🚀 Funcionalidades Implementadas

### ✅ Completadas
- [x] Autenticación (registro, login, verificación email, recuperación contraseña)
- [x] Splash con usuario firmado (avatar, username, email, rol)
- [x] Marketplace con buscador inteligente (texto, tipo cocina, tipo entrega, ordenar)
- [x] Detalle de menú con carrito y pedido
- [x] Órdenes con timeline de estado y auto-refresh (miembro y cook)
- [x] Dashboard del cook con stats
- [x] Sistema experto para crear menús (wizard 3 pasos: info → platillos → revisar)
- [x] Traducciones ES/EN con fade transition
- [x] Menú hamburguesa con opciones según rol
- [x] Validación email en tiempo real

### 🟡 En Progreso / Pendientes

| # | Prioridad | Tarea |
|---|-----------|-------|
| 1 | 🔴 Alta | **Sistema de cobros** — Stripe: integrar frontend móvil/web, solo pago por plataforma |
| 2 | 🟡 Media | **Replicar a Web** — Buscador inteligente + creador menús desde mobile a web |
| 3 | 🟡 Media | **Testing** — Pruebas de flujos críticos (registro, pago, creación menú) |
| 4 | 🟢 Futuro | **Community Manager Agent** — AI para redes sociales y comunicación |
| 5 | 🟢 Futuro | **Framework** — Extraer base reutilizable del proyecto |

## ⚙️ Configuración Local

```bash
# Backend
cd backend && npm run dev

# Frontend Web
cd frontend && npm run dev

# Mobile
cd mobile && npx expo start
```

### Variables de entorno (backend)
- `DATABASE_URL` — PostgreSQL URL
- `JWT_SECRET` — Secreto JWT
- `RESEND_API_KEY` — API key para envío de emails
- `STRIPE_SECRET_KEY` / `STRIPE_PUBLIC_KEY` — Stripe
- `CLIENT_URL` — URL del frontend (para CORS y links en emails)

## 📐 Convenciones de Código

- **Mobile**: Todo en `App.js`, componentes inline, estilo `StyleSheet.create()` al final
- **Web**: Componentes por página en `pages/`, API calls en `api/`, traducciones en `i18n/locales/`
- **Backend**: Express con `express-validator`, middleware separado, rutas en `routes/`
- **Idioma**: Español por defecto (`es-MX`), inglés como alternativa
- **Commits**: Prefijos `feat:`, `fix:`, `chore:`, etc.

## 🔍 Notas para AI

- El proyecto usa **Expo SDK 54** — consultar docs en https://docs.expo.dev/versions/v54.0.0/
- No usar `@expo/vector-icons` para web — los iconos se cargan desde CDN
- La app móvil es **single-file** (`App.js`) — toda la UI en un componente
- El backend tiene **linter** con husky pre-commit hook
- Railway despliega automáticamente desde `main`
- La tabla `password_resets` se creó con script manual, no está en migraciones automáticas

---

*Última actualización: Julio 2026*

```