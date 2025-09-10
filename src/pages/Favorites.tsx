import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, ShoppingCart, Star } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useCart } from "@/hooks/useCart";
import { useNavigate } from "react-router-dom";
import { Product } from "@/data/products";

export default function Favorites() {
  const { favoriteIds } = useFavorites();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFavoriteProducts = async () => {
      if (favoriteIds.length === 0) {
        setFavoriteProducts([]);
        return;
      }

      setLoading(true);
      try {
        // Import products locally instead of fetching from Supabase
        const { products } = await import('@/data/products');
        const filteredProducts = products.filter(product => favoriteIds.includes(product.id));
        setFavoriteProducts(filteredProducts);
      } catch (error) {
        console.error('Error fetching favorite products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavoriteProducts();
  }, [favoriteIds]);

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
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
            <h1 className="text-xl font-bold text-foreground">Mes Favoris</h1>
            <Badge className="bg-promo text-promo-foreground">
              {favoriteIds.length} favori{favoriteIds.length > 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Chargement...</p>
          </div>
        ) : favoriteProducts.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Aucun favori pour le moment</h2>
            <p className="text-muted-foreground mb-6">
              Découvrez nos produits et ajoutez-les à vos favoris
            </p>
            <Button onClick={() => navigate('/')}>
              Découvrir les produits
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {favoriteProducts.map((product) => (
              <Card key={product.id} className="relative overflow-hidden hover-lift cursor-pointer border-0 shadow-lg">
                {/* Heart Icon */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    // toggleFavorite(product.id);
                  }}
                  className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors"
                >
                  <Heart className="w-4 h-4 text-promo fill-current" />
                </button>

                {/* Badges */}
                <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                  {product.badge && (
                    <Badge className="bg-success text-success-foreground text-xs px-2 py-1">
                      {product.badge}
                    </Badge>
                  )}
                  {product.discount > 0 && (
                    <Badge className="bg-promo text-promo-foreground text-xs px-2 py-1 font-bold">
                      -{product.discount}%
                    </Badge>
                  )}
                </div>

                {/* Product Image */}
                <div 
                  className="relative aspect-square overflow-hidden bg-muted cursor-pointer"
                  onClick={() => handleProductClick(product.id)}
                >
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                  />
                </div>

                {/* Product Info */}
                <div className="p-3 space-y-2">
                  <h3 
                    className="text-sm font-medium text-foreground line-clamp-2 leading-tight cursor-pointer"
                    onClick={() => handleProductClick(product.id)}
                  >
                    {product.title}
                  </h3>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < Math.floor(product.rating || 0)
                              ? "text-accent fill-current"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">({product.reviews})</span>
                  </div>
                  
                  {/* Price */}
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-promo">
                      {product.salePrice.toLocaleString()} FCFA
                    </span>
                    {product.originalPrice && product.originalPrice > product.salePrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        {product.originalPrice.toLocaleString()} FCFA
                      </span>
                    )}
                  </div>

                  {/* Action Button */}
                  <Button 
                    variant="promo" 
                    size="sm" 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product.id);
                    }}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Ajouter au panier
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}