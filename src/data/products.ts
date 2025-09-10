// Import product images
import productPhone from "@/assets/product-phone.jpg";
import productClothing from "@/assets/product-clothing.jpg";
import productHeadphones from "@/assets/product-headphones.jpg";
import productBlender from "@/assets/product-blender.jpg";

export interface Product {
  id: string;
  image: string;
  title: string;
  description: string;
  originalPrice: number;
  salePrice: number;
  discount: number;
  rating: number;
  reviews: number;
  badge?: string;
  isFlashSale?: boolean;
  seller_id: string;
  stock: number;
  specifications: string[];
}

export const products: Product[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    image: productPhone,
    title: "Smartphone 5G Ultra - 128GB - Caméra 48MP",
    description: "Un smartphone haut de gamme avec écran AMOLED 6.7 pouces, processeur octa-core, caméra triple 48MP + 12MP + 5MP, batterie 5000mAh avec charge rapide 65W. Compatible 5G pour une connectivité ultra-rapide.",
    originalPrice: 85000,
    salePrice: 52000,
    discount: 39,
    rating: 4.8,
    reviews: 234,
    badge: "Vendeur fiable",
    isFlashSale: true,
    seller_id: "550e8400-e29b-41d4-a716-446655440011",
    stock: 15,
    specifications: [
      "Écran: AMOLED 6.7 pouces",
      "Processeur: Snapdragon 888",
      "RAM: 8GB",
      "Stockage: 128GB",
      "Caméra: 48MP + 12MP + 5MP",
      "Batterie: 5000mAh"
    ]
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    image: productClothing,
    title: "Robe Africaine Traditionnelle - Motifs Wax Premium",
    description: "Magnifique robe traditionnelle confectionnée en tissu wax authentique. Coupe élégante et confortable, parfaite pour les occasions spéciales ou le quotidien. Taille ajustable.",
    originalPrice: 25000,
    salePrice: 18000,
    discount: 28,
    rating: 4.9,
    reviews: 156,
    badge: "Top ventes",
    seller_id: "550e8400-e29b-41d4-a716-446655440012",
    stock: 8,
    specifications: [
      "Matière: 100% coton wax",
      "Tailles: S, M, L, XL",
      "Motifs: Authentiques africains",
      "Entretien: Lavage à 30°C",
      "Origine: Côte d'Ivoire"
    ]
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440003",
    image: productHeadphones,
    title: "Casque Audio Sans Fil - Réduction de Bruit Active",
    description: "Casque audio premium avec réduction de bruit active, autonomie 30h, bluetooth 5.0. Son haute définition avec basses profondes et aigus cristallins.",
    originalPrice: 35000,
    salePrice: 21000,
    discount: 40,
    rating: 4.7,
    reviews: 89,
    isFlashSale: true,
    seller_id: "550e8400-e29b-41d4-a716-446655440013",
    stock: 12,
    specifications: [
      "Autonomie: 30 heures",
      "Bluetooth: 5.0",
      "Réduction de bruit: Active",
      "Drivers: 40mm",
      "Charge rapide: 10min = 3h d'écoute"
    ]
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440004",
    image: productBlender,
    title: "Blender Multifonction 1500W - 5 Vitesses",
    description: "Blender puissant 1500W avec 5 vitesses, bol en verre 2L, lames en acier inoxydable. Parfait pour smoothies, soupes, sauces et bien plus.",
    originalPrice: 45000,
    salePrice: 29000,
    discount: 36,
    rating: 4.6,
    reviews: 67,
    badge: "Nouveau",
    seller_id: "550e8400-e29b-41d4-a716-446655440014",
    stock: 5,
    specifications: [
      "Puissance: 1500W",
      "Bol: Verre 2L",
      "Vitesses: 5 + pulse",
      "Lames: Acier inoxydable",
      "Garantie: 2 ans"
    ]
  }
];

export const getProductById = (id: string): Product | undefined => {
  return products.find(p => p.id === id);
};