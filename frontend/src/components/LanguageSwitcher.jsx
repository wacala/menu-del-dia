import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'es-MX', label: '🇲🇽 ES' },
  { code: 'en', label: '🇺🇸 EN' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <div className="flex gap-1">
      {languages.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => i18n.changeLanguage(code)}
          className={`text-xs px-2 py-1 rounded-lg font-medium transition ${
            i18n.language === code
              ? 'bg-primary-100 text-primary-700'
              : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}