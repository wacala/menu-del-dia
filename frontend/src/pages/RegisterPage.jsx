import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../context/authStore';

export default function RegisterPage() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'member',
  });
  const [passwordError, setPasswordError] = useState('');
  const [registered, setRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const { register, isLoading, error, clearError } = useAuthStore();

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (e.target.name === 'confirmPassword' || e.target.name === 'password') {
      setPasswordError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    try {
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      setRegisteredEmail(formData.email);
      setRegistered(true);
    } catch {
      // Error is handled by store
    }
  };

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-stone-50 to-amber-50 p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500 shadow-lg shadow-primary-500/30 mb-4">
              <span className="text-3xl">🍽️</span>
            </div>
            <h1 className="text-3xl font-extrabold text-stone-800 tracking-tight">{t('app.name')}</h1>
          </div>
          <div className="card-static text-center">
            <div className="text-6xl mb-4">📧</div>
            <h2 className="text-xl font-bold text-stone-800 mb-2">{t('auth.checkEmail')}</h2>
            <p className="text-stone-500 text-sm mb-2">{t('auth.verificationSent')}</p>
            <p className="font-semibold text-stone-800 mb-6 bg-stone-50 py-2 px-4 rounded-xl inline-block">{registeredEmail}</p>
            <p className="text-stone-400 text-sm mb-6">{t('auth.verificationInstructions')}</p>
            <Link to="/login" className="btn-primary inline-block" onClick={clearError}>
              {t('auth.backToLogin')}
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
            <span className="text-3xl">🍽️</span>
          </div>
          <h1 className="text-3xl font-extrabold text-stone-800 tracking-tight">{t('app.name')}</h1>
          <p className="text-stone-500 mt-1 text-sm">{t('auth.joinCommunity')}</p>
        </div>

        <div className="card-static">
          <h2 className="text-xl font-bold text-stone-800 mb-1">{t('auth.createAccount')}</h2>
          <p className="text-stone-400 text-sm mb-6">{t('auth.startToday')}</p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm">
              <span>⚠️</span><span>{error}</span>
            </div>
          )}
          {passwordError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm">
              <span>⚠️</span><span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required placeholder=" " autoComplete="given-name" className="input-field pt-6 pb-3 peer" />
                <label className={`absolute left-4 text-sm pointer-events-none transition-all duration-200 ease-out ${formData.firstName ? 'top-[9px] text-[11px]' : 'top-5 text-stone-400'} peer-focus:top-[9px] peer-focus:text-[11px] peer-focus:text-primary-500 peer-focus:font-semibold`}>{t('auth.firstName')}</label>
              </div>
              <div className="relative">
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder=" " autoComplete="family-name" className="input-field pt-6 pb-3 peer" />
                <label className={`absolute left-4 text-sm pointer-events-none transition-all duration-200 ease-out ${formData.lastName ? 'top-[9px] text-[11px]' : 'top-5 text-stone-400'} peer-focus:top-[9px] peer-focus:text-[11px] peer-focus:text-primary-500 peer-focus:font-semibold`}>{t('auth.lastName')}</label>
              </div>
            </div>
            <div className="relative">
              <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder=" " autoComplete="email" className="input-field pt-6 pb-3 peer" />
              <label className={`absolute left-4 text-sm pointer-events-none transition-all duration-200 ease-out ${formData.email ? 'top-[9px] text-[11px]' : 'top-5 text-stone-400'} peer-focus:top-[9px] peer-focus:text-[11px] peer-focus:text-primary-500 peer-focus:font-semibold`}>{t('auth.email')}</label>
            </div>
            <div className="relative">
              <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder=" " autoComplete="new-password" className="input-field pt-6 pb-3 peer" />
              <label className={`absolute left-4 text-sm pointer-events-none transition-all duration-200 ease-out ${formData.password ? 'top-[9px] text-[11px]' : 'top-5 text-stone-400'} peer-focus:top-[9px] peer-focus:text-[11px] peer-focus:text-primary-500 peer-focus:font-semibold`}>{t('auth.password')}</label>
            </div>
            <div className="relative">
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required placeholder=" " autoComplete="new-password" className="input-field pt-6 pb-3 peer" />
              <label className={`absolute left-4 text-sm pointer-events-none transition-all duration-200 ease-out ${formData.confirmPassword ? 'top-[9px] text-[11px]' : 'top-5 text-stone-400'} peer-focus:top-[9px] peer-focus:text-[11px] peer-focus:text-primary-500 peer-focus:font-semibold`}>{t('auth.confirmPassword')}</label>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">{t('auth.iWantTo')}</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setFormData({ ...formData, role: 'member' })}
                  className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${formData.role === 'member' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300'}`}>
                  🛒 {t('auth.buyFood')}
                </button>
                <button type="button" onClick={() => setFormData({ ...formData, role: 'cook' })}
                  className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${formData.role === 'cook' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300'}`}>
                  🍳 {t('auth.sellFood')}
                </button>
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="w-full btn-primary py-3 text-base mt-2">
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  {t('auth.creatingAccount')}
                </span>
              ) : t('auth.createAccountBtn')}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-stone-500">
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors" onClick={clearError}>{t('auth.signInLink')}</Link>
        </p>
      </div>
    </div>
  );
}
