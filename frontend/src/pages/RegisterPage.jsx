import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../context/authStore';

export default function RegisterPage() {
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
            <h1 className="text-3xl font-extrabold text-stone-800 tracking-tight">Menú del Día</h1>
          </div>
          <div className="card-static text-center">
            <div className="text-6xl mb-4">📧</div>
            <h2 className="text-xl font-bold text-stone-800 mb-2">Check your email</h2>
            <p className="text-stone-500 text-sm mb-2">We sent a verification link to:</p>
            <p className="font-semibold text-stone-800 mb-6 bg-stone-50 py-2 px-4 rounded-xl inline-block">{registeredEmail}</p>
            <p className="text-stone-400 text-sm mb-6">Click the link in the email to activate your account before logging in.</p>
            <Link to="/login" className="btn-primary inline-block" onClick={clearError}>
              Back to Login
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
          <h1 className="text-3xl font-extrabold text-stone-800 tracking-tight">Menú del Día</h1>
          <p className="text-stone-500 mt-1 text-sm">Join the community</p>
        </div>

        <div className="card-static">
          <h2 className="text-xl font-bold text-stone-800 mb-1">Create account</h2>
          <p className="text-stone-400 text-sm mb-6">Start ordering or selling today</p>

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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">First Name</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className="input-field" placeholder="John" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">Last Name</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="input-field" placeholder="Doe" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required className="input-field" placeholder="you@email.com" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required className="input-field" placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Confirm Password</label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="input-field" placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">I want to</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setFormData({ ...formData, role: 'member' })}
                  className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${formData.role === 'member' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300'}`}>
                  🛒 Buy food
                </button>
                <button type="button" onClick={() => setFormData({ ...formData, role: 'cook' })}
                  className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${formData.role === 'cook' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300'}`}>
                  🍳 Sell food
                </button>
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="w-full btn-primary py-3 text-base mt-2">
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Creating account...
                </span>
              ) : 'Create account'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-stone-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors" onClick={clearError}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
