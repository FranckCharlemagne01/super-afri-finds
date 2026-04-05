import { 
  Smartphone, 
  Shirt, 
  Home, 
  Sparkles, 
  ShoppingBag, 
  Car,
  Baby,
  Footprints,
  Gift,
  Dog,
  Wrench,
  Briefcase,
  Sofa,
  UtensilsCrossed,
  LucideIcon
} from "lucide-react";

export interface SubCategory {
  id: string;
  name: string;
  slug: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: LucideIcon;
  emoji: string;
  subcategories: SubCategory[];
}

export const categories: Category[] = [
  {
    id: "mode-vetements",
    name: "Mode & Vêtements",
    slug: "mode-vetements",
    icon: Shirt,
    emoji: "👗",
    subcategories: [
      { id: "mode-homme", name: "Homme", slug: "vetements-homme" },
      { id: "mode-homme-tshirts", name: "T-shirts Homme", slug: "tshirts-homme" },
      { id: "mode-homme-pantalons", name: "Pantalons Homme", slug: "pantalons-homme" },
      { id: "mode-homme-vestes", name: "Vestes & Manteaux", slug: "vestes-manteaux-homme" },
      { id: "mode-homme-costumes", name: "Costumes & Chemises", slug: "costumes-chemises-homme" },
      { id: "mode-homme-sport", name: "Sportwear & Streetwear", slug: "sportwear-streetwear" },
      { id: "mode-femme", name: "Femme", slug: "vetements-femme" },
      { id: "mode-femme-robes", name: "Robes Femme", slug: "robes-femme" },
      { id: "mode-femme-tops", name: "T-shirts & Tops Femme", slug: "tshirts-tops-femme" },
      { id: "mode-femme-lingerie", name: "Lingerie", slug: "lingerie-sous-vetements" },
      { id: "mode-femme-musulmane", name: "Mode musulmane & Voiles", slug: "mode-musulmane-voiles" },
      { id: "mode-africaine", name: "Tenues africaines", slug: "tenues-africaines" },
      { id: "mode-sport", name: "Vêtements de sport", slug: "vetements-sport" },
    ]
  },
  {
    id: "chaussures",
    name: "Chaussures",
    slug: "chaussures",
    icon: Footprints,
    emoji: "👟",
    subcategories: [
      { id: "chaussures-homme", name: "Chaussures Homme", slug: "chaussures-homme" },
      { id: "chaussures-femme", name: "Chaussures Femme", slug: "chaussures-femme" },
      { id: "chaussures-enfant", name: "Chaussures Enfant", slug: "chaussures-enfant" },
      { id: "chaussures-enfant-cat", name: "Chaussures Enfant", slug: "chaussures-enfant-cat" },
      { id: "baskets-sneakers", name: "Baskets & Sneakers", slug: "baskets-sneakers" },
      { id: "sandales-claquettes", name: "Sandales & Claquettes", slug: "sandales-claquettes" },
      { id: "chaussures-sport", name: "Chaussures de sport", slug: "chaussures-sport" },
    ]
  },
  {
    id: "sacs-accessoires",
    name: "Sacs & Accessoires",
    slug: "sacs-accessoires",
    icon: ShoppingBag,
    emoji: "👜",
    subcategories: [
      { id: "sacs-main", name: "Sacs & Maroquinerie", slug: "sacs-main-maroquinerie" },
      { id: "sacs-ceintures", name: "Sacs, Ceintures & Portefeuilles", slug: "sacs-ceintures-portefeuilles" },
      { id: "lunettes-casquettes", name: "Lunettes & Casquettes", slug: "lunettes-casquettes" },
      { id: "lunettes-mode", name: "Lunettes & Accessoires de mode", slug: "lunettes-accessoires-mode" },
      { id: "bijoux-montres", name: "Bijoux & Montres", slug: "bijoux-montres-femme" },
      { id: "bijoux-parures", name: "Bijoux & Parures", slug: "bijoux-parures" },
      { id: "montres-homme", name: "Montres Homme", slug: "montres-homme" },
      { id: "montres-femme", name: "Montres Femme", slug: "montres-femme" },
      { id: "montres-accessoires", name: "Montres & Accessoires", slug: "montres-accessoires" },
      { id: "montres-bijoux-parfums", name: "Montres, Bijoux & Parfums", slug: "montres-bijoux-parfums" },
      { id: "accessoires-femme", name: "Accessoires Femme", slug: "accessoires-femme" },
    ]
  },
  {
    id: "telephones-electronique",
    name: "Téléphones & Électronique",
    slug: "telephones-electronique",
    icon: Smartphone,
    emoji: "📱",
    subcategories: [
      { id: "smartphones", name: "Smartphones", slug: "telephones-portables-accessoires" },
      { id: "accessoires-tel", name: "Accessoires Téléphones", slug: "accessoires-telephones" },
      { id: "casques-ecouteurs", name: "Casques & Écouteurs", slug: "casques-ecouteurs" },
      { id: "ordinateurs", name: "Ordinateurs", slug: "ordinateurs-accessoires" },
      { id: "tablettes", name: "Tablettes", slug: "tablettes-accessoires" },
      { id: "tv-audio", name: "TV & Audio", slug: "televisions-audio" },
      { id: "jeux-video", name: "Jeux vidéo & Consoles", slug: "jeux-video-consoles" },
      { id: "electromenager", name: "Électroménager", slug: "electromenager-intelligent" },
    ]
  },
  {
    id: "beaute-coiffure",
    name: "Beauté & Coiffure",
    slug: "beaute-coiffure",
    icon: Sparkles,
    emoji: "💄",
    subcategories: [
      { id: "produits-capillaires", name: "Produits capillaires", slug: "coiffure-extensions" },
      { id: "maquillage", name: "Maquillage", slug: "maquillage" },
      { id: "beaute-maquillage-soins", name: "Beauté & Soins", slug: "beaute-maquillage-soins" },
      { id: "parfums", name: "Parfums", slug: "parfums" },
      { id: "soins-peau", name: "Soins de la peau", slug: "soins-peau" },
      { id: "soins-barbe", name: "Soins barbe & Beauté Homme", slug: "soins-barbe-beaute-homme" },
      { id: "sante-hygiene", name: "Santé & Hygiène", slug: "sante-hygiene" },
    ]
  },
  {
    id: "maison-cuisine",
    name: "Maison & Cuisine",
    slug: "maison-cuisine",
    icon: Home,
    emoji: "🏠",
    subcategories: [
      { id: "cuisine-ustensiles", name: "Cuisine & Ustensiles", slug: "cuisine-ustensiles" },
      { id: "linge-maison", name: "Linge de maison & Literie", slug: "linge-maison-literie" },
      { id: "jardin", name: "Jardin & Extérieur", slug: "jardin-exterieur" },
      { id: "rangement", name: "Rangement & Organisation", slug: "rangement-organisation" },
      { id: "maison-general", name: "Maison & Vie quotidienne", slug: "maison-vie-quotidienne" },
    ]
  },
  {
    id: "meubles",
    name: "Meubles",
    slug: "meubles",
    icon: Sofa,
    emoji: "🛋️",
    subcategories: [
      { id: "meubles-deco", name: "Meubles & Décoration", slug: "meubles-decoration-interieure" },
    ]
  },
  {
    id: "auto-moto",
    name: "Auto & Moto",
    slug: "auto-moto",
    icon: Car,
    emoji: "🚗",
    subcategories: [
      { id: "voitures", name: "Voitures", slug: "voitures" },
      { id: "motos", name: "Motos", slug: "motos" },
      { id: "pieces-auto", name: "Pièces & Accessoires Auto", slug: "pieces-accessoires-auto" },
      { id: "entretien-vehicule", name: "Entretien Véhicule", slug: "entretien-nettoyage-vehicule" },
      { id: "moto-accessoires", name: "Moto & Accessoires", slug: "moto-accessoires" },
      { id: "equipement-securite", name: "Équipement de sécurité", slug: "equipement-securite" },
    ]
  },
  {
    id: "bebe-enfants",
    name: "Bébé & Enfants",
    slug: "bebe-enfants",
    icon: Baby,
    emoji: "👶",
    subcategories: [
      { id: "bebe-0-3", name: "Bébé (0–3 ans)", slug: "vetements-bebe" },
      { id: "garcon", name: "Garçon", slug: "vetements-garcon" },
      { id: "fille", name: "Fille", slug: "vetements-fille" },
      { id: "jouets", name: "Jouets & Jeux éducatifs", slug: "jouets-jeux-educatifs" },
      { id: "fournitures-scolaires", name: "Fournitures scolaires", slug: "fournitures-scolaires-sac-dos" },
      { id: "poussettes", name: "Poussettes & Accessoires", slug: "poussettes-accessoires-bebe" },
    ]
  },
  {
    id: "alimentation",
    name: "Alimentation",
    slug: "alimentation",
    icon: UtensilsCrossed,
    emoji: "🍽️",
    subcategories: [
      { id: "produits-locaux", name: "Produits locaux & Africains", slug: "produits-locaux-africains" },
      { id: "produits-importes", name: "Produits importés", slug: "produits-importes" },
      { id: "boissons", name: "Boissons & Jus", slug: "boissons-jus" },
      { id: "epicerie", name: "Épicerie générale", slug: "epicerie-generale" },
    ]
  },
  {
    id: "cadeaux-artisanat",
    name: "Cadeaux & Artisanat",
    slug: "cadeaux-artisanat",
    icon: Gift,
    emoji: "🎁",
    subcategories: [
      { id: "cadeaux", name: "Cadeaux & Gadgets", slug: "cadeaux-gadgets" },
      { id: "artisanat-local", name: "Artisanat local", slug: "artisanat-local" },
      { id: "decoration-artisanale", name: "Décoration artisanale", slug: "decoration-artisanale" },
    ]
  },
  {
    id: "animaux",
    name: "Animaux",
    slug: "animaux",
    icon: Dog,
    emoji: "🐾",
    subcategories: [
      { id: "nourriture-animaux", name: "Nourriture animaux", slug: "nourriture-animaux" },
      { id: "accessoires-animaux", name: "Accessoires animaux", slug: "accessoires-animaux" },
    ]
  },
  {
    id: "bricolage",
    name: "Bricolage",
    slug: "bricolage",
    icon: Wrench,
    emoji: "🔧",
    subcategories: [
      { id: "outils", name: "Outils", slug: "outils-bricolage" },
      { id: "materiaux", name: "Matériaux de construction", slug: "materiaux-construction" },
      { id: "plomberie-electricite", name: "Plomberie & Électricité", slug: "plomberie-electricite" },
    ]
  },
  {
    id: "services",
    name: "Services",
    slug: "services",
    icon: Briefcase,
    emoji: "💼",
    subcategories: [
      { id: "services-menagers", name: "Services ménagers", slug: "services-menagers" },
      { id: "services-informatique", name: "Informatique & Réparation", slug: "services-informatique" },
      { id: "services-beaute", name: "Coiffure & Beauté à domicile", slug: "services-beaute-domicile" },
      { id: "cours-formations", name: "Cours & Formations", slug: "cours-formations" },
    ]
  },
];

// Fonction pour obtenir toutes les catégories aplaties (pour les selects)
export const getAllCategoriesFlat = (): Array<{ value: string; label: string; category: string }> => {
  const flat: Array<{ value: string; label: string; category: string }> = [];
  
  categories.forEach(cat => {
    cat.subcategories.forEach(sub => {
      flat.push({
        value: sub.slug,
        label: `${cat.name} > ${sub.name}`,
        category: cat.slug
      });
    });
  });
  
  return flat;
};

// Fonction pour obtenir une catégorie par slug
export const getCategoryBySlug = (slug: string) => {
  return categories.find(cat => cat.slug === slug);
};

// Fonction pour obtenir une sous-catégorie par slug
export const getSubCategoryBySlug = (slug: string): { category: Category; subcategory: SubCategory } | null => {
  for (const cat of categories) {
    const sub = cat.subcategories.find(s => s.slug === slug);
    if (sub) {
      return { category: cat, subcategory: sub };
    }
  }
  return null;
};

// Fonction pour compter les produits par catégorie/sous-catégorie
export const getCategoryProductCount = async (categorySlug: string): Promise<number> => {
  return 0;
};

// Suggestions populaires pour la recherche
export const popularSuggestions = [
  { label: "🔥 Robes fillette", slug: "vetements-fille" },
  { label: "⚡ Téléphones pas chers", slug: "telephones-portables-accessoires" },
  { label: "👟 Chaussures tendance", slug: "chaussures-homme" },
  { label: "💄 Maquillage", slug: "maquillage" },
  { label: "👗 Tenues africaines", slug: "tenues-africaines" },
  { label: "🎁 Cadeaux", slug: "cadeaux-gadgets" },
];
