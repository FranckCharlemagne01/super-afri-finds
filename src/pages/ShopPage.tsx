import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Store, MapPin, Calendar, Star, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProductCard } from '@/components/ProductCard';
import { useCart } from '@/hooks/useCart';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { ProductForm } from '@/components/ProductForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Shop {
  id: string;
  shop_name: string;
  shop_slug: string;
  shop_description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  seller_id: string;
  created_at: string;
  subscription_active: boolean;
}

interface Product {
  id: string;
  title: string;
  price: number;
  original_price: number | null;
  discount_percentage: number | null;
  images: string[];
  rating: number;
  reviews_count: number;
  category: string;
  is_flash_sale: boolean;
  badge: string | null;
  seller_id: string;
}

const ShopPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { favoriteIds, toggleFavorite, isFavorite } = useFavorites();

  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const fetchShopData = async () => {
      if (!slug) return;

      try {
        setLoading(true);

        // Fetch shop details
        const { data: shopData, error: shopError } = await supabase
          .from('seller_shops')
          .select('*')
          .eq('shop_slug', slug)
          .eq('is_active', true)
          .single();

        if (shopError || !shopData) {
          toast({
            title: 'Boutique introuvable',
            description: 'Cette boutique n\'existe pas ou est inactive.',
            variant: 'destructive',
          });
          navigate('/');
          return;
        }

        setShop(shopData);

        // Fetch shop products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('shop_id', shopData.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (!productsError && productsData) {
          setProducts(productsData);
        }
      } catch (error) {
        console.error('Error fetching shop:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger la boutique.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchShopData();
  }, [slug, navigate, toast]);

  // Separate effect to check ownership when user or shop changes
  useEffect(() => {
    if (shop && user) {
      setIsOwner(user.id === shop.seller_id);
    } else {
      setIsOwner(false);
    }
  }, [user, shop]);

  const handleProductPublished = () => {
    setIsProductFormOpen(false);
    // Refresh products list
    const fetchProducts = async () => {
      if (!shop) return;
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shop.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (productsData) {
        setProducts(productsData);
      }
    };
    fetchProducts();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement de la boutique...</p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with back button */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">{shop.shop_name}</h1>
          </div>
          {shop.subscription_active && (
            <Badge variant="secondary" className="ml-auto">
              Premium
            </Badge>
          )}
        </div>
      </header>

      {/* Shop Banner */}
      <div className="relative w-full h-48 md:h-64 bg-gradient-to-r from-primary/20 to-secondary/20">
        {shop.banner_url ? (
          <img
            src={shop.banner_url}
            alt={`${shop.shop_name} banner`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Store className="h-24 w-24 text-muted-foreground/30" />
          </div>
        )}
      </div>

      {/* Shop Info */}
      <div className="container mx-auto px-4 -mt-16 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <Card className="flex-1 p-6 w-full">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Shop Logo */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden bg-card border-4 border-background shadow-lg">
                {shop.logo_url ? (
                  <img
                    src={shop.logo_url}
                    alt={`${shop.shop_name} logo`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Store className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>

            {/* Shop Details */}
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">{shop.shop_name}</h2>
              
              {shop.shop_description && (
                <p className="text-muted-foreground mb-4">{shop.shop_description}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Membre depuis {new Date(shop.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Store className="h-4 w-4" />
                  <span>{products.length} produit{products.length > 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </div>
          </Card>
          
          {/* Publish Product Button - Only visible to shop owner */}
          {isOwner && (
            <Button
              onClick={() => setIsProductFormOpen(true)}
              size="lg"
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg w-full md:w-auto md:self-start"
            >
              <Plus className="w-5 h-5 mr-2" />
              Publier un produit
            </Button>
          )}
        </div>

        {/* Products Section - Grouped by Category */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Produits de la boutique</h3>
          
          {products.length === 0 ? (
            <Card className="p-12 text-center">
              <Store className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Cette boutique n'a pas encore de produits.</p>
            </Card>
          ) : (
            (() => {
              // Group products by category
              const productsByCategory = products.reduce((acc, product) => {
                if (!acc[product.category]) {
                  acc[product.category] = [];
                }
                acc[product.category].push(product);
                return acc;
              }, {} as Record<string, Product[]>);

              return (
                <div className="space-y-8">
                  {Object.entries(productsByCategory).map(([category, categoryProducts]) => (
                    <div key={category}>
                      <h4 className="text-lg font-medium mb-4 capitalize">
                        {category.replace(/-/g, ' ')}
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {categoryProducts.map((product) => (
                          <ProductCard
                            key={product.id}
                            id={product.id}
                            title={product.title}
                            originalPrice={product.original_price || product.price}
                            salePrice={product.price}
                            image={product.images[0] || ''}
                            rating={product.rating}
                            reviews={product.reviews_count}
                            badge={product.badge || undefined}
                            isFlashSale={product.is_flash_sale}
                            discount={product.discount_percentage || 0}
                            seller_id={product.seller_id}
                            isBoosted={false}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()
          )}
        </div>
      </div>

      {/* Product Form Dialog */}
      <Dialog open={isProductFormOpen} onOpenChange={setIsProductFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Publier un nouveau produit</DialogTitle>
            <DialogDescription>
              Ajoutez un nouveau produit à votre boutique. Un jeton sera déduit de votre compte.
            </DialogDescription>
          </DialogHeader>
          <ProductForm
            onSave={handleProductPublished}
            onCancel={() => setIsProductFormOpen(false)}
            shopId={shop?.id}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShopPage;
