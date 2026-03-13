import { 
  Smartphone, 
  Shirt, 
  Home, 
  Sparkles, 
  ShoppingBag, 
  Car,
  Gamepad2,
  Baby,
  Watch,
  Gift,
  Footprints,
  Headphones,
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
  subcategories: SubCategory[];
}

export const categories: Category[] = [
  {
    id: "men-fashion",
    name: "Mode Homme",
    slug: "mode-homme",
    icon: Shirt,
    subcategories: [
      { id: "men-tshirts", name: "T-shirts Homme", slug: "tshirts-homme" },
      { id: "men-pants", name: "Pantalons Homme", slug: "pantalons-homme" },
      { id: "men-jackets", name: "Vestes & Manteaux Homme", slug: "vestes-manteaux-homme" },
      { id: "men-clothing", name: "Vêtements Homme", slug: "vetements-homme" },
      { id: "men-sportswear", name: "Sportwear & Streetwear", slug: "sportwear-streetwear" },
      { id: "men-grooming", name: "Soins de barbe & Beauté Homme", slug: "soins-barbe-beaute-homme" },
      { id: "men-accessories", name: "Lunettes & Casquettes Homme", slug: "lunettes-casquettes" },
      { id: "men-suits", name: "Costumes & Chemises Homme", slug: "costumes-chemises-homme" },
    ]
  },
  {
    id: "women-fashion",
    name: "Mode Femme",
    slug: "mode-femme",
    icon: Sparkles,
    subcategories: [
      { id: "women-dresses", name: "Robes Femme", slug: "robes-femme" },
      { id: "women-tshirts", name: "T-shirts & Tops Femme", slug: "tshirts-tops-femme" },
      { id: "women-clothing", name: "Vêtements Femme", slug: "vetements-femme" },
      { id: "women-bags", name: "Sacs Femme & Maroquinerie", slug: "sacs-main-maroquinerie" },
      { id: "women-jewelry", name: "Bijoux & Montres Femme", slug: "bijoux-montres-femme" },
      { id: "women-lingerie", name: "Lingerie & Sous-vêtements", slug: "lingerie-sous-vetements" },
      { id: "women-beauty", name: "Beauté, Maquillage & Soins", slug: "beaute-maquillage-soins" },
      { id: "women-muslim", name: "Mode musulmane & Voiles", slug: "mode-musulmane-voiles" },
      { id: "women-accessories", name: "Accessoires Femme", slug: "accessoires-femme" },
    ]
  },
  {
    id: "kids-baby",
    name: "Mode Enfant & Bébé",
    slug: "enfants-bebes",
    icon: Baby,
    subcategories: [
      { id: "kids-boys", name: "Vêtements Garçon", slug: "vetements-garcon" },
      { id: "kids-girls", name: "Vêtements Fille", slug: "vetements-fille" },
      { id: "kids-baby-clothes", name: "Vêtements Bébé", slug: "vetements-bebe" },
      { id: "kids-shoes", name: "Chaussures Enfant", slug: "chaussures-enfant" },
      { id: "kids-toys", name: "Jouets & Jeux éducatifs", slug: "jouets-jeux-educatifs" },
      { id: "kids-strollers", name: "Poussettes & Accessoires Bébé", slug: "poussettes-accessoires-bebe" },
      { id: "kids-school", name: "Fournitures scolaires & Sac à dos", slug: "fournitures-scolaires-sac-dos" },
    ]
  },
  {
    id: "shoes",
    name: "Chaussures",
    slug: "chaussures",
    icon: Footprints,
    subcategories: [
      { id: "shoes-men", name: "Chaussures Homme", slug: "chaussures-homme" },
      { id: "shoes-women", name: "Chaussures Femme", slug: "chaussures-femme" },
      { id: "shoes-kids", name: "Chaussures Enfant", slug: "chaussures-enfant-cat" },
      { id: "shoes-sneakers", name: "Baskets & Sneakers", slug: "baskets-sneakers" },
      { id: "shoes-sandals", name: "Sandales & Claquettes", slug: "sandales-claquettes" },
      { id: "shoes-sport", name: "Chaussures de sport", slug: "chaussures-sport" },
    ]
  },
  {
    id: "watches-jewelry",
    name: "Montres & Bijoux",
    slug: "montres-bijoux",
    icon: Watch,
    subcategories: [
      { id: "watches-men", name: "Montres Homme", slug: "montres-homme" },
      { id: "watches-women", name: "Montres Femme", slug: "montres-femme" },
      { id: "watches-accessories", name: "Montres & Accessoires", slug: "montres-accessoires" },
      { id: "jewelry-general", name: "Bijoux & Parures", slug: "bijoux-parures" },
      { id: "watches-jewelry-perfume", name: "Montres, Bijoux & Parfums", slug: "montres-bijoux-parfums" },
    ]
  },
  {
    id: "tech",
    name: "Électronique",
    slug: "technologie-electronique",
    icon: Smartphone,
    subcategories: [
      { id: "tech-phones", name: "Téléphones portables", slug: "telephones-portables-accessoires" },
      { id: "tech-phone-accessories", name: "Accessoires Téléphones", slug: "accessoires-telephones" },
      { id: "tech-headphones", name: "Casques & Écouteurs", slug: "casques-ecouteurs" },
      { id: "tech-computers", name: "Ordinateurs & Accessoires", slug: "ordinateurs-accessoires" },
      { id: "tech-tablets", name: "Tablettes & Accessoires", slug: "tablettes-accessoires" },
      { id: "tech-tv", name: "Télévisions & Audio", slug: "televisions-audio" },
      { id: "tech-gaming", name: "Jeux vidéo & Consoles", slug: "jeux-video-consoles" },
      { id: "tech-smart", name: "Électroménager intelligent", slug: "electromenager-intelligent" },
    ]
  },
  {
    id: "home-living",
    name: "Maison & Vie quotidienne",
    slug: "maison-vie-quotidienne",
    icon: Home,
    subcategories: [
      { id: "home-furniture", name: "Meubles & Décoration intérieure", slug: "meubles-decoration-interieure" },
      { id: "home-kitchen", name: "Cuisine & Ustensiles", slug: "cuisine-ustensiles" },
      { id: "home-linen", name: "Linge de maison & Literie", slug: "linge-maison-literie" },
      { id: "home-garden", name: "Jardin & Extérieur", slug: "jardin-exterieur" },
      { id: "home-storage", name: "Rangement & Organisation", slug: "rangement-organisation" },
    ]
  },
  {
    id: "beauty-cosmetics",
    name: "Beauté & Cosmétique",
    slug: "beaute-cosmetique",
    icon: Sparkles,
    subcategories: [
      { id: "beauty-makeup", name: "Maquillage", slug: "maquillage" },
      { id: "beauty-skincare", name: "Soins de la peau", slug: "soins-peau" },
      { id: "beauty-perfume", name: "Parfums", slug: "parfums" },
      { id: "beauty-hair", name: "Coiffure & Extensions", slug: "coiffure-extensions" },
      { id: "beauty-health", name: "Santé & Hygiène", slug: "sante-hygiene" },
    ]
  },
  {
    id: "auto-moto",
    name: "Auto & Moto",
    slug: "auto-moto",
    icon: Car,
    subcategories: [
      { id: "auto-parts", name: "Pièces & Accessoires Auto", slug: "pieces-accessoires-auto" },
      { id: "auto-maintenance", name: "Entretien & Nettoyage Véhicule", slug: "entretien-nettoyage-vehicule" },
      { id: "moto-accessories", name: "Moto & Accessoires", slug: "moto-accessoires" },
      { id: "auto-safety", name: "Équipement de sécurité", slug: "equipement-securite" },
    ]
  },
  {
    id: "sports-wellness",
    name: "Sport, Santé & Bien-être",
    slug: "sport-sante-bien-etre",
    icon: Gamepad2,
    subcategories: [
      { id: "sports-clothing", name: "Vêtements de sport", slug: "vetements-sport" },
      { id: "sports-equipment", name: "Équipements sportifs", slug: "equipements-sportifs" },
      { id: "sports-fitness", name: "Fitness & Gym", slug: "fitness-gym" },
      { id: "sports-nutrition", name: "Nutrition & Bien-être", slug: "nutrition-bien-etre" },
    ]
  },
  {
    id: "food-grocery",
    name: "Alimentation & Épicerie",
    slug: "alimentation-epicerie",
    icon: ShoppingBag,
    subcategories: [
      { id: "food-local", name: "Produits locaux & Africains", slug: "produits-locaux-africains" },
      { id: "food-imported", name: "Produits importés", slug: "produits-importes" },
      { id: "food-drinks", name: "Boissons & Jus", slug: "boissons-jus" },
      { id: "food-general", name: "Épicerie générale", slug: "epicerie-generale" },
    ]
  },
  {
    id: "accessories-lifestyle",
    name: "Accessoires & Lifestyle",
    slug: "accessoires-lifestyle",
    icon: Gift,
    subcategories: [
      { id: "lifestyle-bags", name: "Sacs, Ceintures & Portefeuilles", slug: "sacs-ceintures-portefeuilles" },
      { id: "lifestyle-glasses", name: "Lunettes & Accessoires de mode", slug: "lunettes-accessoires-mode" },
      { id: "lifestyle-gifts", name: "Cadeaux & Gadgets", slug: "cadeaux-gadgets" },
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
