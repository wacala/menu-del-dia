import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UtensilsCrossed, ArrowLeft, AlertTriangle, Mail, CheckCircle2 } from 'lucide-react';
import { authAPI } from '../api';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) return;
    setLoading(true);
    try {
      await authAPI.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Error');
    } finally {
      setLoading(false);
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
          {!sent ? (
            <>
              <h2 className="text-xl font-bold text-stone-800 mb-1">{t('auth.recoverPassword')}</h2>
              <p className="text-stone-400 text-sm mb-6">{t('auth.forgotPassword')}</p>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm">
                  <span><AlertTriangle className="w-4 h-4" /></span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder=" "
                    autoComplete="email"
                    className="input-field pt-6 pb-3 peer"
                  />
                  <label className={`absolute left-4 text-sm pointer-events-none transition-all duration-200 ease-out
                    ${email ? 'top-[9px] text-[11px]' : 'top-5 text-stone-400'}
                    peer-focus:top-[9px] peer-focus:text-[11px] peer-focus:text-primary-500 peer-focus:font-semibold`}>
                    {t('auth.email')}
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-3 text-base"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {t('auth.sendResetLink')}
                    </span>
                  ) : t('auth.sendResetLink')}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-100 mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-stone-800 mb-2">{t('auth.checkEmail')}</h2>
                <div className="flex items-center justify-center gap-2 text-stone-500 text-sm mb-2">
                  <Mail className="w-4 h-4" />
                  <span className="font-semibold text-stone-700">{email}</span>
                </div>
                <p className="text-stone-400 text-sm">{t('auth.resetLinkSent')}</p>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link to="/login" className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {t('auth.backToLogin')}
          </Link>
        </div>
        <div className="mt-6 flex justify-center">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}