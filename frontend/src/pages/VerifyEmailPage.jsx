import { UtensilsCrossed, Check, X, Hourglass } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../api';

export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage(t('verification.verificationFailed'));
      return;
    }

    authAPI.verifyEmail(token)
      .then(() => {
        setStatus('success');
        setMessage(t('verification.verificationSuccess'));
      })
      .catch(() => {
        setStatus('error');
        setMessage(t('verification.verificationExpired'));
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-stone-50 to-amber-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500 shadow-lg shadow-primary-500/30 mb-4">
            <UtensilsCrossed className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-stone-800 tracking-tight">{t('app.name')}</h1>
        </div>

        <div className="card-static text-center">
          {status === 'verifying' && (
            <>
              <Hourglass className="w-10 h-10 mx-auto text-primary-500 mb-4" />
              <p className="text-stone-500">{t('verification.verifyingEmail')}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-100 mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-stone-800 mb-2">{t('verification.verificationSuccess')}</h2>
              <p className="text-stone-500 mb-6">{message}</p>
              <Link to="/login" className="btn-primary inline-block py-3 px-6">{t('auth.backToLogin')}</Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-100 mb-4">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-stone-800 mb-2">{t('verification.verificationFailed')}</h2>
              <p className="text-stone-500 mb-6">{message}</p>
              <Link to="/login" className="text-primary-600 hover:underline font-semibold">{t('auth.backToLogin')}</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
