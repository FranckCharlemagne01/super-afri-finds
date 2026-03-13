export interface Commune {
  name: string;
  city: string;
  countryCode: string;
}

export const communes: Commune[] = [
  // Abidjan - Côte d'Ivoire
  { name: "Abobo", city: "Abidjan", countryCode: "CI" },
  { name: "Adjamé", city: "Abidjan", countryCode: "CI" },
  { name: "Attécoubé", city: "Abidjan", countryCode: "CI" },
  { name: "Cocody", city: "Abidjan", countryCode: "CI" },
  { name: "Koumassi", city: "Abidjan", countryCode: "CI" },
  { name: "Marcory", city: "Abidjan", countryCode: "CI" },
  { name: "Plateau", city: "Abidjan", countryCode: "CI" },
  { name: "Port-Bouët", city: "Abidjan", countryCode: "CI" },
  { name: "Treichville", city: "Abidjan", countryCode: "CI" },
  { name: "Yopougon", city: "Abidjan", countryCode: "CI" },
  { name: "Bingerville", city: "Abidjan", countryCode: "CI" },
  { name: "Songon", city: "Abidjan", countryCode: "CI" },
  { name: "Anyama", city: "Abidjan", countryCode: "CI" },

  // Bouaké
  { name: "Bouaké Centre", city: "Bouaké", countryCode: "CI" },
  { name: "Dar-es-Salam", city: "Bouaké", countryCode: "CI" },
  { name: "Belleville", city: "Bouaké", countryCode: "CI" },
  { name: "Air France", city: "Bouaké", countryCode: "CI" },
  { name: "Zone Industrielle", city: "Bouaké", countryCode: "CI" },

  // Yamoussoukro
  { name: "Yamoussoukro Centre", city: "Yamoussoukro", countryCode: "CI" },
  { name: "Habitat", city: "Yamoussoukro", countryCode: "CI" },
  { name: "Morofé", city: "Yamoussoukro", countryCode: "CI" },

  // Daloa
  { name: "Daloa Centre", city: "Daloa", countryCode: "CI" },
  { name: "Lobia", city: "Daloa", countryCode: "CI" },
  { name: "Tazibouo", city: "Daloa", countryCode: "CI" },

  // San-Pédro
  { name: "San-Pédro Centre", city: "San-Pédro", countryCode: "CI" },
  { name: "Bardot", city: "San-Pédro", countryCode: "CI" },
  { name: "Lac", city: "San-Pédro", countryCode: "CI" },

  // Korhogo
  { name: "Korhogo Centre", city: "Korhogo", countryCode: "CI" },
  { name: "Soba", city: "Korhogo", countryCode: "CI" },

  // Dakar - Sénégal
  { name: "Dakar Plateau", city: "Dakar", countryCode: "SN" },
  { name: "Médina", city: "Dakar", countryCode: "SN" },
  { name: "Grand Dakar", city: "Dakar", countryCode: "SN" },
  { name: "Parcelles Assainies", city: "Dakar", countryCode: "SN" },
  { name: "Guédiawaye", city: "Dakar", countryCode: "SN" },
  { name: "Pikine", city: "Dakar", countryCode: "SN" },
  { name: "Rufisque", city: "Dakar", countryCode: "SN" },
  { name: "Almadies", city: "Dakar", countryCode: "SN" },
  { name: "Mermoz", city: "Dakar", countryCode: "SN" },
  { name: "Ouakam", city: "Dakar", countryCode: "SN" },

  // Bamako - Mali
  { name: "Commune I", city: "Bamako", countryCode: "ML" },
  { name: "Commune II", city: "Bamako", countryCode: "ML" },
  { name: "Commune III", city: "Bamako", countryCode: "ML" },
  { name: "Commune IV", city: "Bamako", countryCode: "ML" },
  { name: "Commune V", city: "Bamako", countryCode: "ML" },
  { name: "Commune VI", city: "Bamako", countryCode: "ML" },

  // Ouagadougou - Burkina Faso
  { name: "Ouaga 2000", city: "Ouagadougou", countryCode: "BF" },
  { name: "Koulouba", city: "Ouagadougou", countryCode: "BF" },
  { name: "Dassasgho", city: "Ouagadougou", countryCode: "BF" },
  { name: "Pissy", city: "Ouagadougou", countryCode: "BF" },
  { name: "Tampouy", city: "Ouagadougou", countryCode: "BF" },
  { name: "Karpala", city: "Ouagadougou", countryCode: "BF" },

  // Cotonou - Bénin
  { name: "Cadjèhoun", city: "Cotonou", countryCode: "BJ" },
  { name: "Ganhi", city: "Cotonou", countryCode: "BJ" },
  { name: "Dantokpa", city: "Cotonou", countryCode: "BJ" },
  { name: "Fidjrossè", city: "Cotonou", countryCode: "BJ" },
  { name: "Akpakpa", city: "Cotonou", countryCode: "BJ" },

  // Lomé - Togo
  { name: "Bè", city: "Lomé", countryCode: "TG" },
  { name: "Adidogomé", city: "Lomé", countryCode: "TG" },
  { name: "Tokoin", city: "Lomé", countryCode: "TG" },
  { name: "Hédzranawoé", city: "Lomé", countryCode: "TG" },
  { name: "Agoè", city: "Lomé", countryCode: "TG" },

  // Conakry - Guinée
  { name: "Kaloum", city: "Conakry", countryCode: "GN" },
  { name: "Dixinn", city: "Conakry", countryCode: "GN" },
  { name: "Matam", city: "Conakry", countryCode: "GN" },
  { name: "Ratoma", city: "Conakry", countryCode: "GN" },
  { name: "Matoto", city: "Conakry", countryCode: "GN" },

  // Niamey - Niger
  { name: "Niamey I", city: "Niamey", countryCode: "NE" },
  { name: "Niamey II", city: "Niamey", countryCode: "NE" },
  { name: "Niamey III", city: "Niamey", countryCode: "NE" },
  { name: "Niamey IV", city: "Niamey", countryCode: "NE" },
  { name: "Niamey V", city: "Niamey", countryCode: "NE" },

  // Douala - Cameroun
  { name: "Akwa", city: "Douala", countryCode: "CM" },
  { name: "Bonabéri", city: "Douala", countryCode: "CM" },
  { name: "Bonanjo", city: "Douala", countryCode: "CM" },
  { name: "Deido", city: "Douala", countryCode: "CM" },
  { name: "New Bell", city: "Douala", countryCode: "CM" },

  // Yaoundé - Cameroun
  { name: "Centre Administratif", city: "Yaoundé", countryCode: "CM" },
  { name: "Bastos", city: "Yaoundé", countryCode: "CM" },
  { name: "Mvog-Mbi", city: "Yaoundé", countryCode: "CM" },
  { name: "Nlongkak", city: "Yaoundé", countryCode: "CM" },
  { name: "Essos", city: "Yaoundé", countryCode: "CM" },

  // Accra - Ghana
  { name: "Osu", city: "Accra", countryCode: "GH" },
  { name: "Madina", city: "Accra", countryCode: "GH" },
  { name: "East Legon", city: "Accra", countryCode: "GH" },
  { name: "Tema", city: "Accra", countryCode: "GH" },
  { name: "Dansoman", city: "Accra", countryCode: "GH" },

  // Lagos - Nigeria
  { name: "Victoria Island", city: "Lagos", countryCode: "NG" },
  { name: "Ikeja", city: "Lagos", countryCode: "NG" },
  { name: "Lekki", city: "Lagos", countryCode: "NG" },
  { name: "Surulere", city: "Lagos", countryCode: "NG" },
  { name: "Yaba", city: "Lagos", countryCode: "NG" },

  // Paris - France
  { name: "1er arrondissement", city: "Paris", countryCode: "FR" },
  { name: "Belleville", city: "Paris", countryCode: "FR" },
  { name: "Château Rouge", city: "Paris", countryCode: "FR" },
  { name: "Barbès", city: "Paris", countryCode: "FR" },
  { name: "La Chapelle", city: "Paris", countryCode: "FR" },
  { name: "Saint-Denis", city: "Paris", countryCode: "FR" },

  // Montréal - Canada
  { name: "Montréal-Nord", city: "Montréal", countryCode: "CA" },
  { name: "Côte-des-Neiges", city: "Montréal", countryCode: "CA" },
  { name: "Plateau Mont-Royal", city: "Montréal", countryCode: "CA" },
  { name: "Villeray", city: "Montréal", countryCode: "CA" },

  // Bruxelles - Belgique
  { name: "Matonge", city: "Bruxelles", countryCode: "BE" },
  { name: "Molenbeek", city: "Bruxelles", countryCode: "BE" },
  { name: "Ixelles", city: "Bruxelles", countryCode: "BE" },
  { name: "Saint-Gilles", city: "Bruxelles", countryCode: "BE" },
];

export const getCommunesByCity = (city: string): Commune[] => {
  return communes.filter(c => c.city.toLowerCase() === city.toLowerCase());
};
