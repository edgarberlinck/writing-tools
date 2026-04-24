import { SUPPORTED_LOCALES } from '../db/types';

interface Props {
  selectedLocale: string;
  onChange: (locale: string) => void;
}

export default function LanguageTabs({ selectedLocale, onChange }: Props) {
  return (
    <div className="flex gap-1">
      {SUPPORTED_LOCALES.map((loc) => (
        <button
          key={loc.code}
          onClick={() => onChange(loc.code)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            selectedLocale === loc.code
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {loc.label}
        </button>
      ))}
    </div>
  );
}
