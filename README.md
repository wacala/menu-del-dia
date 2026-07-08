# Menú del Día 🍽️

Community food marketplace where local cooks can offer, sell, and deliver food to community members.

## Features
- Cook profiles & menu management
- Community marketplace
- Order management & tracking
- Payment processing (cash & online)
- WhatsApp notifications
- Delivery tracking
- Ratings & reviews

## Tech Stack
- Backend: Node.js + Express
- Database: PostgreSQL
- Frontend: React + Tailwind CSS
- Mobile: React Native + Expo
- Messaging: Twilio WhatsApp API

## Getting Started

```bash
cd backend
npm install
npm run dev
## Deployment (Railway)

### Backend service
- Root directory: `backend`
- Builder: Dockerfile
- Required env vars:
  - `NODE_ENV=production`
  - `PORT=3001`
  - `CLIENT_URL=<your frontend URL>`
  - `DB_HOST`
  - `DB_PORT`
  - `DB_USER`
  - `DB_PASSWORD`
  - `DB_NAME`
  - `JWT_SECRET`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PUBLIC_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_PHONE_NUMBER`

### Frontend service
- Root directory: `frontend`
- Builder: Dockerfile
- Required env vars:
  - `VITE_API_URL=<your backend URL>/api`


## Error Tracking (Sentry)

Add these env vars for production monitoring:
- `SENTRY_DSN` in `backend/.env`
- `VITE_SENTRY_DSN` in `frontend/.env`

This captures unexpected backend exceptions and frontend crashes.


## Database Backups

A scheduled GitHub Actions workflow creates a daily PostgreSQL dump and uploads it as an artifact.

### Required GitHub secrets
- `DATABASE_URL` (preferred)
- or `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`

### Manual backup
```bash
cd backend
npm run db:backup
```


## Uptime Monitoring

A scheduled GitHub Actions workflow checks the public backend health endpoint and frontend URL every 15 minutes.

### Required GitHub secrets
- `BACKEND_HEALTH_URL` (example: `https://your-backend.railway.app/api/health`)
- `FRONTEND_URL` (example: `https://your-frontend.railway.app`)
