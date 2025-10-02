export interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
}

export const countries: Country[] = [
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", dialCode: "+225" },
  { code: "SN", name: "Sénégal", flag: "🇸🇳", dialCode: "+221" },
  { code: "ML", name: "Mali", flag: "🇲🇱", dialCode: "+223" },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫", dialCode: "+226" },
  { code: "GH", name: "Ghana", flag: "🇬🇭", dialCode: "+233" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬", dialCode: "+234" },
  { code: "BJ", name: "Bénin", flag: "🇧🇯", dialCode: "+229" },
  { code: "TG", name: "Togo", flag: "🇹🇬", dialCode: "+228" },
  { code: "GN", name: "Guinée", flag: "🇬🇳", dialCode: "+224" },
  { code: "LR", name: "Liberia", flag: "🇱🇷", dialCode: "+231" },
  { code: "SL", name: "Sierra Leone", flag: "🇸🇱", dialCode: "+232" },
  { code: "MR", name: "Mauritanie", flag: "🇲🇷", dialCode: "+222" },
  { code: "NE", name: "Niger", flag: "🇳🇪", dialCode: "+227" },
  { code: "TD", name: "Tchad", flag: "🇹🇩", dialCode: "+235" },
  { code: "CM", name: "Cameroun", flag: "🇨🇲", dialCode: "+237" },
  { code: "GA", name: "Gabon", flag: "🇬🇦", dialCode: "+241" },
  { code: "CG", name: "Congo", flag: "🇨🇬", dialCode: "+242" },
  { code: "CD", name: "République démocratique du Congo", flag: "🇨🇩", dialCode: "+243" },
  { code: "CF", name: "République centrafricaine", flag: "🇨🇫", dialCode: "+236" },
  { code: "GQ", name: "Guinée équatoriale", flag: "🇬🇶", dialCode: "+240" },
  { code: "ST", name: "São Tomé-et-Principe", flag: "🇸🇹", dialCode: "+239" },
  { code: "CV", name: "Cap-Vert", flag: "🇨🇻", dialCode: "+238" },
  { code: "GM", name: "Gambie", flag: "🇬🇲", dialCode: "+220" },
  { code: "GW", name: "Guinée-Bissau", flag: "🇬🇼", dialCode: "+245" },
  { code: "MA", name: "Maroc", flag: "🇲🇦", dialCode: "+212" },
  { code: "DZ", name: "Algérie", flag: "🇩🇿", dialCode: "+213" },
  { code: "TN", name: "Tunisie", flag: "🇹🇳", dialCode: "+216" },
  { code: "EG", name: "Égypte", flag: "🇪🇬", dialCode: "+20" },
  { code: "LY", name: "Libye", flag: "🇱🇾", dialCode: "+218" },
  { code: "SD", name: "Soudan", flag: "🇸🇩", dialCode: "+249" },
  { code: "SS", name: "Soudan du Sud", flag: "🇸🇸", dialCode: "+211" },
  { code: "ET", name: "Éthiopie", flag: "🇪🇹", dialCode: "+251" },
  { code: "ER", name: "Érythrée", flag: "🇪🇷", dialCode: "+291" },
  { code: "DJ", name: "Djibouti", flag: "🇩🇯", dialCode: "+253" },
  { code: "SO", name: "Somalie", flag: "🇸🇴", dialCode: "+252" },
  { code: "KE", name: "Kenya", flag: "🇰🇪", dialCode: "+254" },
  { code: "UG", name: "Ouganda", flag: "🇺🇬", dialCode: "+256" },
  { code: "TZ", name: "Tanzanie", flag: "🇹🇿", dialCode: "+255" },
  { code: "RW", name: "Rwanda", flag: "🇷🇼", dialCode: "+250" },
  { code: "BI", name: "Burundi", flag: "🇧🇮", dialCode: "+257" },
  { code: "MW", name: "Malawi", flag: "🇲🇼", dialCode: "+265" },
  { code: "ZM", name: "Zambie", flag: "🇿🇲", dialCode: "+260" },
  { code: "ZW", name: "Zimbabwe", flag: "🇿🇼", dialCode: "+263" },
  { code: "BW", name: "Botswana", flag: "🇧🇼", dialCode: "+267" },
  { code: "NA", name: "Namibie", flag: "🇳🇦", dialCode: "+264" },
  { code: "ZA", name: "Afrique du Sud", flag: "🇿🇦", dialCode: "+27" },
  { code: "LS", name: "Lesotho", flag: "🇱🇸", dialCode: "+266" },
  { code: "SZ", name: "Eswatini", flag: "🇸🇿", dialCode: "+268" },
  { code: "MZ", name: "Mozambique", flag: "🇲🇿", dialCode: "+258" },
  { code: "MG", name: "Madagascar", flag: "🇲🇬", dialCode: "+261" },
  { code: "MU", name: "Maurice", flag: "🇲🇺", dialCode: "+230" },
  { code: "SC", name: "Seychelles", flag: "🇸🇨", dialCode: "+248" },
  { code: "KM", name: "Comores", flag: "🇰🇲", dialCode: "+269" },
  { code: "AO", name: "Angola", flag: "🇦🇴", dialCode: "+244" }
];

export const getCountryByCode = (code: string): Country | undefined => {
  return countries.find(country => country.code === code);
};

export const getCountryName = (code: string): string => {
  const country = getCountryByCode(code);
  return country ? country.name : code;
};