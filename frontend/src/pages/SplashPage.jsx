import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'es-MX', label: '🇲🇽 ES' },
  { code: 'en', label: '🇺🇸 EN' },
];

export default function SplashPage() {
  const { t, i18n } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
      <div className="w-full max-w-sm text-center">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary-500 shadow-lg shadow-primary-500/30 mb-6">
          <span className="text-4xl">🍽️</span>
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
        <div className="mt-8 flex justify-center gap-2">
          {languages.map(({ code, label }) => (
            <button
              key={code}
              onClick={() => i18n.changeLanguage(code)}
              className={`text-xs px-3 py-1 rounded-lg font-medium transition ${
                i18n.language === code
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}