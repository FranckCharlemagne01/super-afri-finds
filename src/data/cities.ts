export interface City {
  name: string;
  countryCode: string;
}

export const cities: City[] = [
  // Côte d'Ivoire
  { name: "Abidjan", countryCode: "CI" },
  { name: "Bouaké", countryCode: "CI" },
  { name: "Yamoussoukro", countryCode: "CI" },
  { name: "Daloa", countryCode: "CI" },
  { name: "San-Pédro", countryCode: "CI" },
  { name: "Korhogo", countryCode: "CI" },
  { name: "Man", countryCode: "CI" },
  { name: "Gagnoa", countryCode: "CI" },
  { name: "Divo", countryCode: "CI" },
  { name: "Soubré", countryCode: "CI" },
  
  // Sénégal
  { name: "Dakar", countryCode: "SN" },
  { name: "Thiès", countryCode: "SN" },
  { name: "Saint-Louis", countryCode: "SN" },
  { name: "Kaolack", countryCode: "SN" },
  { name: "Ziguinchor", countryCode: "SN" },
  { name: "Touba", countryCode: "SN" },
  
  // Mali
  { name: "Bamako", countryCode: "ML" },
  { name: "Sikasso", countryCode: "ML" },
  { name: "Mopti", countryCode: "ML" },
  { name: "Koulikoro", countryCode: "ML" },
  { name: "Ségou", countryCode: "ML" },
  { name: "Kayes", countryCode: "ML" },
  
  // Burkina Faso
  { name: "Ouagadougou", countryCode: "BF" },
  { name: "Bobo-Dioulasso", countryCode: "BF" },
  { name: "Koudougou", countryCode: "BF" },
  { name: "Ouahigouya", countryCode: "BF" },
  { name: "Banfora", countryCode: "BF" },
  
  // Bénin
  { name: "Cotonou", countryCode: "BJ" },
  { name: "Porto-Novo", countryCode: "BJ" },
  { name: "Parakou", countryCode: "BJ" },
  { name: "Abomey-Calavi", countryCode: "BJ" },
  
  // Togo
  { name: "Lomé", countryCode: "TG" },
  { name: "Sokodé", countryCode: "TG" },
  { name: "Kara", countryCode: "TG" },
  { name: "Atakpamé", countryCode: "TG" },
  
  // Niger
  { name: "Niamey", countryCode: "NE" },
  { name: "Zinder", countryCode: "NE" },
  { name: "Maradi", countryCode: "NE" },
  { name: "Agadez", countryCode: "NE" },
  
  // Guinée
  { name: "Conakry", countryCode: "GN" },
  { name: "Nzérékoré", countryCode: "GN" },
  { name: "Kankan", countryCode: "GN" },
  { name: "Labé", countryCode: "GN" },
  
  // Cameroun
  { name: "Yaoundé", countryCode: "CM" },
  { name: "Douala", countryCode: "CM" },
  { name: "Garoua", countryCode: "CM" },
  { name: "Bafoussam", countryCode: "CM" },
  { name: "Bamenda", countryCode: "CM" },
  
  // Ghana
  { name: "Accra", countryCode: "GH" },
  { name: "Kumasi", countryCode: "GH" },
  { name: "Tamale", countryCode: "GH" },
  { name: "Takoradi", countryCode: "GH" },
  
  // Nigeria
  { name: "Lagos", countryCode: "NG" },
  { name: "Abuja", countryCode: "NG" },
  { name: "Kano", countryCode: "NG" },
  { name: "Ibadan", countryCode: "NG" },
  { name: "Port Harcourt", countryCode: "NG" },
  
  // France
  { name: "Paris", countryCode: "FR" },
  { name: "Lyon", countryCode: "FR" },
  { name: "Marseille", countryCode: "FR" },
  { name: "Toulouse", countryCode: "FR" },
  { name: "Nice", countryCode: "FR" },
  { name: "Bordeaux", countryCode: "FR" },
  
  // Canada
  { name: "Montréal", countryCode: "CA" },
  { name: "Toronto", countryCode: "CA" },
  { name: "Vancouver", countryCode: "CA" },
  { name: "Ottawa", countryCode: "CA" },
  
  // Belgique
  { name: "Bruxelles", countryCode: "BE" },
  { name: "Anvers", countryCode: "BE" },
  { name: "Gand", countryCode: "BE" },
  { name: "Liège", countryCode: "BE" },
  
  // Suisse
  { name: "Genève", countryCode: "CH" },
  { name: "Zurich", countryCode: "CH" },
  { name: "Berne", countryCode: "CH" },
  { name: "Lausanne", countryCode: "CH" },
];

export const getCitiesByCountry = (countryCode: string): City[] => {
  return cities.filter(city => city.countryCode === countryCode);
};
