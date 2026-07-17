import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UtensilsCrossed, User, LogOut } from 'lucide-react';
import { useAuthStore } from '../context/authStore';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function SplashPage() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);
  const isInitializing = useAuthStore((state) => state.isInitializing);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <p className="text-stone-400">Loading...</p>
      </div>
    );
  }

  // Logged-in splash
  if (token && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
        <div className="w-full max-w-sm text-center">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary-500 shadow-lg shadow-primary-500/30 mb-6">
            <UtensilsCrossed className="w-10 h-10 text-white" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-extrabold text-stone-800 tracking-tight mb-2">
            {t('app.name')}
          </h1>
          <p className="text-stone-500 text-sm leading-relaxed mb-8">
            {t('app.tagline')}
          </p>

          {/* Signed-in user card */}
          <div className="card-static mb-4">
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center">
                <User className="w-7 h-7 text-primary-600" />
              </div>
              <div>
                <p className="font-bold text-stone-800 text-lg">
                  @{user?.username || user?.first_name || user?.email}
                </p>
                <p className="text-sm text-stone-500">{user?.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  user?.role === 'cook'
                    ? 'bg-primary-50 text-primary-700 border border-primary-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {user?.role === 'cook' ? t('cook.dashboard') : t('marketplace.title')}
                </span>
                <span className="text-xs text-stone-400">✓ Sesión activa</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              to={user?.role === 'cook' ? '/cook/dashboard' : '/marketplace'}
              className="btn-primary w-full block text-center py-3"
            >
              {user?.role === 'cook' ? t('cook.dashboard') : t('marketplace.title')}
            </Link>
            <button
              onClick={logout}
              className="btn-secondary w-full py-3 font-semibold inline-flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              {t('profile.logout') || 'Cerrar sesión'}
            </button>
          </div>

          <div className="mt-8 flex justify-center">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    );
  }

  // Non-logged-in splash
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
      <div className="w-full max-w-sm text-center">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary-500 shadow-lg shadow-primary-500/30 mb-6">
          <UtensilsCrossed className="w-10 h-10 text-white" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-extrabold text-stone-800 tracking-tight mb-2">
          {t('app.name')}
        </h1>

        {/* Description */}
        <p className="text-stone-500 text-sm leading-relaxed mb-8">
          {t('splash.description')}
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <Link to="/login" className="btn-primary w-full block text-center py-3">
            {t('splash.login')}
          </Link>
          <Link to="/register" className="btn-secondary w-full block text-center py-3 font-semibold">
            {t('splash.register')}
          </Link>
        </div>

        {/* Language Switcher */}
        <div className="mt-8 flex justify-center">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}