import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CookingPot, ClipboardList, Calendar, Clock, Hourglass, X, Check, PartyPopper, Inbox, Sparkles, RefreshCw, UtensilsCrossed, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../context/authStore';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();

  useEffect(() => {
    clearError();
  }, [clearError]);

  // Sync autofilled values from browser on mount
  const handleAutofill = (setter) => (e) => {
    if (e.animationName === 'onAutoFillStart' && e.target.value) {
      setter(e.target.value);
    }
  };

  useEffect(() => {
    // Fallback: poll once after mount for browsers that don't fire animation
    const timer = setTimeout(() => {
      if (emailRef.current?.value && !email) setEmail(emailRef.current.value);
      if (passwordRef.current?.value && !password) setPassword(passwordRef.current.value);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      // Error is handled by store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-stone-50 to-amber-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500 shadow-lg shadow-primary-500/30 mb-4">
            <span className="text-3xl"><UtensilsCrossed className="w-8 h-8 text-white" /></span>
          </div>
          <h1 className="text-3xl font-extrabold text-stone-800 tracking-tight">{t('app.name')}</h1>
          <p className="text-stone-500 mt-1 text-sm">{t('app.tagline')}</p>
        </div>

        {/* Card */}
        <div className="card-static">
          <h2 className="text-xl font-bold text-stone-800 mb-1">{t('auth.welcomeBack')}</h2>
          <p className="text-stone-400 text-sm mb-6">{t('auth.signInToAccount')}</p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm">
              <span><AlertTriangle className="w-4 h-4 " /></span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <input
                type="email"
                ref={emailRef}
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearError(); }}
                required
                placeholder=" "
                autoComplete="email"
                onAnimationStart={handleAutofill(setEmail)}
                className="input-field pt-6 pb-3 peer"
              />
              <label className={`absolute left-4 text-sm pointer-events-none transition-all duration-200 ease-out
                ${email ? 'top-[9px] text-[11px]' : 'top-5 text-stone-400'}
                peer-focus:top-[9px] peer-focus:text-[11px] peer-focus:text-primary-500 peer-focus:font-semibold`}>
                {t('auth.email')}
              </label>
            </div>

            <div className="relative">
              <input
                type="password"
                ref={passwordRef}
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearError(); }}
                required
                placeholder=" "
                autoComplete="current-password"
                onAnimationStart={handleAutofill(setPassword)}
                className="input-field pt-6 pb-3 peer"
              />
              <label className={`absolute left-4 text-sm pointer-events-none transition-all duration-200 ease-out
                ${password ? 'top-[9px] text-[11px]' : 'top-5 text-stone-400'}
                peer-focus:top-[9px] peer-focus:text-[11px] peer-focus:text-primary-500 peer-focus:font-semibold`}>
                {t('auth.password')}
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 text-base"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t('auth.signingIn')}
                </span>
              ) : t('auth.signIn')}
            </button>

            <Link
              to="/forgot-password"
              className="block text-center text-sm text-primary-600 hover:text-primary-700 transition-colors"
              onClick={clearError}
            >
              {t('auth.forgotPassword')}
            </Link>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-stone-500">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors" onClick={clearError}>
            {t('auth.createOne')}
          </Link>
        </p>
        <div className="mt-6 flex justify-center">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}
