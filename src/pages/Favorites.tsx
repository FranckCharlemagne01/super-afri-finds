import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, ShoppingCart, Star } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useCart } from "@/hooks/useCart";
import { useNavigate } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  title: string;
  price: number;
  original_price?: number;
  discount_percentage?: number;
  category: string;
  images?: string[];
  rating?: number;
  reviews_count?: number;
  badge?: string;
}

export default function Favorites() {
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
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
        // Fetch real products from Supabase database
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .in('id', favoriteIds)
          .eq('is_active', true);

        if (error) throw error;
        setFavoriteProducts(data || []);
      } catch (error) {
        console.error('Error fetching favorite products:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger vos favoris",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFavoriteProducts();
  }, [favoriteIds, toast]);

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  return (
    <div className="min-h-screen bg-background page-transition">
      {/* Header - Style mobile native */}
      <header className="native-header">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/')}
              className="rounded-xl h-11 w-11 active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Mes Favoris</h1>
            <Badge className="bg-primary text-primary-foreground rounded-full px-3 py-1">
              {favoriteIds.length}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 pb-24">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
            <p className="mt-3 text-muted-foreground">Chargement...</p>
          </div>
        ) : favoriteProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Heart className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Aucun favori</h2>
            <p className="text-muted-foreground mb-6 max-w-xs mx-auto">
              Découvrez nos produits et ajoutez-les à vos favoris
            </p>
            <Button 
              onClick={() => navigate('/')}
              className="rounded-xl h-12 px-6 font-semibold active:scale-95 transition-transform"
            >
              Découvrir les produits
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {favoriteProducts.map((product) => (
              <Card key={product.id} className="native-card relative overflow-hidden">
                {/* Heart Icon - Style app native */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(product.id);
                  }}
                  className="absolute top-2 right-2 z-10 p-2 rounded-full bg-white/90 shadow-sm active:scale-90 transition-transform"
                >
                  <Heart className="w-5 h-5 text-primary fill-current" />
                </button>

                {/* Badges */}
                <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                  {product.badge && (
                    <Badge className="bg-success text-success-foreground text-xs px-2 py-1 rounded-lg">
                      {product.badge}
                    </Badge>
                  )}
                  {product.discount_percentage && product.discount_percentage > 0 && (
                    <Badge className="bg-primary text-primary-foreground text-xs px-2 py-1 font-bold rounded-lg">
                      -{product.discount_percentage}%
                    </Badge>
                  )}
                </div>

                {/* Product Image */}
                <div 
                  className="relative aspect-square overflow-hidden bg-muted cursor-pointer active:opacity-80 transition-opacity"
                  onClick={() => handleProductClick(product.id)}
                >
                  <img
                    src={product.images?.[0] || "/placeholder.svg"}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Product Info */}
                <div className="p-3 space-y-2">
                  <h3 
                    className="text-sm font-semibold text-foreground line-clamp-2 leading-tight cursor-pointer active:opacity-70"
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
                          className={`w-3.5 h-3.5 ${
                            i < Math.floor(product.rating || 0)
                              ? "text-accent fill-current"
                              : "text-muted-foreground/40"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">({product.reviews_count || 0})</span>
                  </div>
                  
                  {/* Price */}
                  <div className="flex flex-wrap items-baseline gap-1.5">
                    <span className="text-base font-bold text-primary tabular-nums">
                      {product.price.toLocaleString()} FCFA
                    </span>
                    {product.original_price && product.original_price > product.price && (
                      <span className="text-xs text-muted-foreground line-through tabular-nums">
                        {product.original_price.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Action Button - Style app native */}
                  <Button 
                    size="sm" 
                    className="w-full h-11 rounded-xl font-semibold active:scale-95 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product.id);
                      toast({
                        title: "🛒 Ajouté au panier",
                        description: "Le produit a été ajouté à votre panier",
                      });
                    }}
                  >
                    <ShoppingCart className="w-4 h-4 mr-1.5" />
                    Ajouter
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