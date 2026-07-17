import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UtensilsCrossed, ArrowLeft, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';
import { authAPI } from '../api';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.passwordMinLength'));
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || t('auth.invalidResetToken'));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-stone-50 to-amber-50 p-4">
        <div className="w-full max-w-md text-center">
          <div className="card-static">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-100 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-stone-800 mb-2">{t('auth.invalidResetToken')}</h2>
            <Link to="/login" className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors mt-4">
              <ArrowLeft className="w-4 h-4" />
              {t('auth.backToLoginAfterReset')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-stone-50 to-amber-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500 shadow-lg shadow-primary-500/30 mb-4">
            <span className="text-3xl"><UtensilsCrossed className="w-8 h-8 text-white" /></span>
          </div>
          <h1 className="text-3xl font-extrabold text-stone-800 tracking-tight">{t('app.name')}</h1>
          <p className="text-stone-500 mt-1 text-sm">{t('app.tagline')}</p>
        </div>

        <div className="card-static">
          {!success ? (
            <>
              <h2 className="text-xl font-bold text-stone-800 mb-1">{t('auth.resetPassword')}</h2>
              <p className="text-stone-400 text-sm mb-6">{t('auth.forgotPassword')}</p>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm">
                  <span><AlertTriangle className="w-4 h-4" /></span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="relative">
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder=" " autoComplete="new-password" className="input-field pt-6 pb-3 peer" />
                  <label className={`absolute left-4 text-sm pointer-events-none transition-all duration-200 ease-out ${password ? 'top-[9px] text-[11px]' : 'top-5 text-stone-400'} peer-focus:top-[9px] peer-focus:text-[11px] peer-focus:text-primary-500 peer-focus:font-semibold`}>{t('auth.newPassword')}</label>
                </div>

                <div className="relative">
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder=" " autoComplete="new-password" className="input-field pt-6 pb-3 peer" />
                  <label className={`absolute left-4 text-sm pointer-events-none transition-all duration-200 ease-out ${confirmPassword ? 'top-[9px] text-[11px]' : 'top-5 text-stone-400'} peer-focus:top-[9px] peer-focus:text-[11px] peer-focus:text-primary-500 peer-focus:font-semibold`}>{t('auth.confirmNewPassword')}</label>
                </div>

                <button type="submit" disabled={loading} className="w-full btn-primary py-3 text-base">
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {t('auth.resetPassword')}
                    </span>
                  ) : t('auth.resetPassword')}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-100 mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-stone-800 mb-2">
                <span className="inline-flex items-center gap-2"><Lock className="w-5 h-5 text-green-600" /> {t('auth.passwordResetSuccess')}</span>
              </h2>
              <Link to="/login" className="btn-primary inline-block mt-4 py-3 px-6 text-center">{t('auth.backToLoginAfterReset')}</Link>
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-center">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}