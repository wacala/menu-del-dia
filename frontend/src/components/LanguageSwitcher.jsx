import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'es-MX', flag: '🇲🇽' },
  { code: 'en', flag: '🇺🇸' },
];

let fadeTimeout = null;

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [fading, setFading] = useState(false);
  const current = languages.find(l => l.code === i18n.language) || languages[0];
  const other = languages.find(l => l.code !== current.code);

  const changeLanguage = useCallback((code) => {
    if (fading) return;
    setFading(true);
    setOpen(false);
    clearTimeout(fadeTimeout);
    fadeTimeout = setTimeout(() => {
      i18n.changeLanguage(code);
      setTimeout(() => setFading(false), 100);
    }, 500);
  }, [i18n, fading]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-lg px-2 py-1 rounded-lg hover:bg-stone-100 transition"
        title={current.code}
      >
        {current.flag}
      </button>
      {open && other && (
        <button
          onClick={() => changeLanguage(other.code)}
          className={`absolute top-10 right-0 text-lg px-2 py-1 rounded-lg bg-white border border-stone-200 shadow-sm hover:bg-stone-50 z-50 transition ${fading ? 'opacity-50' : ''}`}
        >
          {other.flag}
        </button>
      )}
    </div>
  );
}