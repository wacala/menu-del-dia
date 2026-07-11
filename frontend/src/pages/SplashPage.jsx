import { Link } from 'react-router-dom';

export default function SplashPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
      <div className="w-full max-w-sm text-center">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary-500 shadow-lg shadow-primary-500/30 mb-6">
          <span className="text-4xl">🍽️</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-extrabold text-stone-800 tracking-tight mb-2">
          Menú del Día
        </h1>

        {/* Description */}
        <p className="text-stone-500 text-sm leading-relaxed mb-8">
          Compra y vende comida casera en tu comunidad.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <Link to="/login" className="btn-primary w-full block text-center py-3">
            Iniciar sesión
          </Link>
          <Link to="/register" className="btn-secondary w-full block text-center py-3 font-semibold">
            Crear cuenta
          </Link>
        </div>
      </div>
    </div>
  );
}