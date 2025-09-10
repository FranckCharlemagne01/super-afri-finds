export interface Country {
  code: string;
  name: string;
  flag: string;
}

export const countries: Country[] = [
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮" },
  { code: "SN", name: "Sénégal", flag: "🇸🇳" },
  { code: "ML", name: "Mali", flag: "🇲🇱" },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫" },
  { code: "GH", name: "Ghana", flag: "🇬🇭" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "BJ", name: "Bénin", flag: "🇧🇯" },
  { code: "TG", name: "Togo", flag: "🇹🇬" },
  { code: "GN", name: "Guinée", flag: "🇬🇳" },
  { code: "LR", name: "Liberia", flag: "🇱🇷" },
  { code: "SL", name: "Sierra Leone", flag: "🇸🇱" },
  { code: "MR", name: "Mauritanie", flag: "🇲🇷" },
  { code: "NE", name: "Niger", flag: "🇳🇪" },
  { code: "TD", name: "Tchad", flag: "🇹🇩" },
  { code: "CM", name: "Cameroun", flag: "🇨🇲" },
  { code: "GA", name: "Gabon", flag: "🇬🇦" },
  { code: "CG", name: "Congo", flag: "🇨🇬" },
  { code: "CD", name: "République démocratique du Congo", flag: "🇨🇩" },
  { code: "CF", name: "République centrafricaine", flag: "🇨🇫" },
  { code: "GQ", name: "Guinée équatoriale", flag: "🇬🇶" },
  { code: "ST", name: "São Tomé-et-Principe", flag: "🇸🇹" },
  { code: "CV", name: "Cap-Vert", flag: "🇨🇻" },
  { code: "GM", name: "Gambie", flag: "🇬🇲" },
  { code: "GW", name: "Guinée-Bissau", flag: "🇬🇼" },
  { code: "MA", name: "Maroc", flag: "🇲🇦" },
  { code: "DZ", name: "Algérie", flag: "🇩🇿" },
  { code: "TN", name: "Tunisie", flag: "🇹🇳" },
  { code: "EG", name: "Égypte", flag: "🇪🇬" },
  { code: "LY", name: "Libye", flag: "🇱🇾" },
  { code: "SD", name: "Soudan", flag: "🇸🇩" },
  { code: "SS", name: "Soudan du Sud", flag: "🇸🇸" },
  { code: "ET", name: "Éthiopie", flag: "🇪🇹" },
  { code: "ER", name: "Érythrée", flag: "🇪🇷" },
  { code: "DJ", name: "Djibouti", flag: "🇩🇯" },
  { code: "SO", name: "Somalie", flag: "🇸🇴" },
  { code: "KE", name: "Kenya", flag: "🇰🇪" },
  { code: "UG", name: "Ouganda", flag: "🇺🇬" },
  { code: "TZ", name: "Tanzanie", flag: "🇹🇿" },
  { code: "RW", name: "Rwanda", flag: "🇷🇼" },
  { code: "BI", name: "Burundi", flag: "🇧🇮" },
  { code: "MW", name: "Malawi", flag: "🇲🇼" },
  { code: "ZM", name: "Zambie", flag: "🇿🇲" },
  { code: "ZW", name: "Zimbabwe", flag: "🇿🇼" },
  { code: "BW", name: "Botswana", flag: "🇧🇼" },
  { code: "NA", name: "Namibie", flag: "🇳🇦" },
  { code: "ZA", name: "Afrique du Sud", flag: "🇿🇦" },
  { code: "LS", name: "Lesotho", flag: "🇱🇸" },
  { code: "SZ", name: "Eswatini", flag: "🇸🇿" },
  { code: "MZ", name: "Mozambique", flag: "🇲🇿" },
  { code: "MG", name: "Madagascar", flag: "🇲🇬" },
  { code: "MU", name: "Maurice", flag: "🇲🇺" },
  { code: "SC", name: "Seychelles", flag: "🇸🇨" },
  { code: "KM", name: "Comores", flag: "🇰🇲" },
  { code: "AO", name: "Angola", flag: "🇦🇴" }
];

export const getCountryByCode = (code: string): Country | undefined => {
  return countries.find(country => country.code === code);
};

export const getCountryName = (code: string): string => {
  const country = getCountryByCode(code);
  return country ? country.name : code;
};