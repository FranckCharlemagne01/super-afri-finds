import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { ContactSellerButton } from "@/components/ContactSellerButton";
import { QuickOrderDialog } from "@/components/QuickOrderDialog";
import { products } from "@/data/products";
import { 
  ArrowLeft, 
  Heart, 
  Star, 
  ShoppingCart,
  Plus,
  Minus
} from "lucide-react";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  const [quantity, setQuantity] = useState(1);
  const [personalMessage, setPersonalMessage] = useState('');

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
            <div className="space-y-3">
              {/* Desktop: Full layout */}
              <div className="hidden sm:flex gap-3">
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
              </div>

              {/* Mobile: Icon layout */}
              <div className="flex sm:hidden gap-2">
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
                  <ShoppingCart className="w-5 h-5" />
                </Button>
              </div>
              
              <QuickOrderDialog
                productId={product.id}
                productTitle={product.title}
                productPrice={product.salePrice}
                sellerId={product.seller_id}
              />
              
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