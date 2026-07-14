import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UtensilsCrossed } from 'lucide-react';

export default function SplashPage() {
  const { t, i18n } = useTranslation();

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
          <button
            onClick={() => i18n.changeLanguage(i18n.language === 'es-MX' ? 'en' : 'es-MX')}
            className="text-lg px-3 py-1 rounded-lg hover:bg-stone-100 transition"
          >
            {i18n.language === 'es-MX' ? '🇲🇽' : '🇺🇸'}
          </button>
        </div>
      </div>
    </div>
  );
}