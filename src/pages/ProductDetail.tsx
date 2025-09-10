import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { ContactSellerButton } from "@/components/ContactSellerButton";
import { 
  ArrowLeft, 
  Heart, 
  Star, 
  ShoppingCart,
  Plus,
  Minus
} from "lucide-react";

// Import product images (simulating data)
import productPhone from "@/assets/product-phone.jpg";
import productClothing from "@/assets/product-clothing.jpg";
import productHeadphones from "@/assets/product-headphones.jpg";
import productBlender from "@/assets/product-blender.jpg";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  
  const [quantity, setQuantity] = useState(1);
  const [personalMessage, setPersonalMessage] = useState('');

  // Simulated product data
  const products = [
    {
      id: "prod-001",
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
      seller_id: "seller-001",
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
      id: "prod-002",
      image: productClothing,
      title: "Robe Africaine Traditionnelle - Motifs Wax Premium",
      description: "Magnifique robe traditionnelle confectionnée en tissu wax authentique. Coupe élégante et confortable, parfaite pour les occasions spéciales ou le quotidien. Taille ajustable.",
      originalPrice: 25000,
      salePrice: 18000,
      discount: 28,
      rating: 4.9,
      reviews: 156,
      badge: "Top ventes",
      seller_id: "seller-002",
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
      id: "prod-003",
      image: productHeadphones,
      title: "Casque Audio Sans Fil - Réduction de Bruit Active",
      description: "Casque audio premium avec réduction de bruit active, autonomie 30h, bluetooth 5.0. Son haute définition avec basses profondes et aigus cristallins.",
      originalPrice: 35000,
      salePrice: 21000,
      discount: 40,
      rating: 4.7,
      reviews: 89,
      isFlashSale: true,
      seller_id: "seller-003",
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
      id: "prod-004",
      image: productBlender,
      title: "Blender Multifonction 1500W - 5 Vitesses",
      description: "Blender puissant 1500W avec 5 vitesses, bol en verre 2L, lames en acier inoxydable. Parfait pour smoothies, soupes, sauces et bien plus.",
      originalPrice: 45000,
      salePrice: 29000,
      discount: 36,
      rating: 4.6,
      reviews: 67,
      badge: "Nouveau",
      seller_id: "seller-004",
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

  const product = products.find(p => p.id === id);

  useEffect(() => {
    if (!product) {
      navigate('/');
    }
  }, [product, navigate]);

  if (!product) {
    return null;
  }

  const handleAddToCart = () => {
    // Add to cart with the selected quantity
    for (let i = 0; i < quantity; i++) {
      addToCart(product.id);
    }
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  const handleToggleFavorite = () => {
    toggleFavorite(product.id);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-lg border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold gradient-text-primary">
              Détails du produit
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="relative">
              <img
                src={product.image}
                alt={product.title}
                className="w-full h-96 lg:h-[500px] object-cover rounded-lg"
              />
              {product.badge && (
                <Badge className="absolute top-3 left-3 bg-promo text-promo-foreground">
                  {product.badge}
                </Badge>
              )}
              {product.isFlashSale && (
                <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground animate-pulse-promo">
                  ⚡ Flash Sale
                </Badge>
              )}
              {product.discount && (
                <Badge className="absolute bottom-3 left-3 bg-success text-success-foreground">
                  -{product.discount}%
                </Badge>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                {product.title}
              </h1>
              
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating) 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-sm text-muted-foreground ml-2">
                    {product.rating} ({product.reviews} avis)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <span className="text-3xl font-bold text-primary">
                  {product.salePrice.toLocaleString()} FCFA
                </span>
                {product.originalPrice && (
                  <span className="text-lg text-muted-foreground line-through">
                    {product.originalPrice.toLocaleString()} FCFA
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">
                {product.description}
              </p>
            </div>

            {/* Specifications */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Caractéristiques</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {product.specifications.map((spec, index) => (
                  <li key={index}>{spec}</li>
                ))}
              </ul>
            </div>

            {/* Stock */}
            <div>
              <p className="text-sm text-muted-foreground">
                Stock disponible: <span className="font-semibold text-foreground">{product.stock} unités</span>
              </p>
            </div>

            {/* Quantity Selector */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Quantité</h3>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-lg font-semibold px-4">{quantity}</span>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= product.stock}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Personal Message */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Message pour le vendeur (optionnel)</h3>
              <Textarea
                placeholder="Ajoutez un message personnalisé pour le vendeur..."
                value={personalMessage}
                onChange={(e) => setPersonalMessage(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleToggleFavorite}
                className="shrink-0"
              >
                <Heart className={`w-5 h-5 ${
                  isFavorite(product.id) ? 'fill-current text-promo' : ''
                }`} />
              </Button>
              
              <Button 
                onClick={handleAddToCart}
                className="flex-1 bg-primary hover:bg-primary/90"
                size="lg"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Ajouter au panier ({(product.salePrice * quantity).toLocaleString()} FCFA)
              </Button>
              
              <ContactSellerButton
                productId={product.id}
                sellerId={product.seller_id}
                productTitle={product.title}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductDetail;