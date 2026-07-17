import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'es-MX', flag: '🇲🇽' },
  { code: 'en', flag: '🇺🇸' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = languages.find(l => l.code === i18n.language) || languages[0];
  const other = languages.find(l => l.code !== current.code);

  return (
    <button
      onClick={() => other && i18n.changeLanguage(other.code)}
      className="text-lg px-2 py-1 rounded-lg hover:bg-stone-100 transition"
      title={current.code}
    >
      {current.flag}
    </button>
  );
}