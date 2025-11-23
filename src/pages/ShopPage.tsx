import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Store, Plus, Calendar, Grid3x3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProductCard } from '@/components/ProductCard';
import { useAuth } from '@/hooks/useAuth';
import { SellerShopDashboard } from '@/components/SellerShopDashboard';
import { useUserLocation } from '@/hooks/useUserLocation';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  description?: string;
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
  stock_quantity?: number;
  is_active?: boolean;
  is_boosted?: boolean;
  boosted_until?: string;
  is_sold?: boolean;
  created_at: string;
}

const ShopPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { location: userLocation } = useUserLocation();

  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [similarShops, setSimilarShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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
          
          // Fetch similar shops based on the main category of this shop's products
          if (productsData.length > 0) {
            const mainCategory = productsData[0].category;
            
            const { data: similarShopsData } = await supabase
              .from('seller_shops')
              .select(`
                id,
                shop_name,
                shop_slug,
                shop_description,
                logo_url,
                banner_url,
                seller_id,
                created_at,
                subscription_active
              `)
              .eq('is_active', true)
              .neq('id', shopData.id)
              .limit(6);
            
            if (similarShopsData) {
              // Filter shops that have products in the same category
              const shopsWithCategory = await Promise.all(
                similarShopsData.map(async (s) => {
                  const { data: shopProducts } = await supabase
                    .from('products')
                    .select('category')
                    .eq('shop_id', s.id)
                    .eq('category', mainCategory)
                    .limit(1);
                  
                  return shopProducts && shopProducts.length > 0 ? s : null;
                })
              );
              
              setSimilarShops(shopsWithCategory.filter((s): s is Shop => s !== null).slice(0, 4));
            }
          }
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
  }, [slug, navigate, toast, refreshKey]);

  // Separate effect to check ownership when user or shop changes
  useEffect(() => {
    if (shop && user) {
      setIsOwner(user.id === shop.seller_id);
    } else {
      setIsOwner(false);
    }
  }, [user, shop]);

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

  // If user is the owner, show the seller dashboard
  if (isOwner) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header with back button */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/seller-dashboard')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold">Tableau de bord - {shop.shop_name}</h1>
            </div>
          </div>
        </header>

        <SellerShopDashboard
          shop={shop}
          products={products}
          loading={loading}
          onProductsUpdate={() => setRefreshKey(prev => prev + 1)}
        />
      </div>
    );
  }

  // Public shop view for visitors
  return (
    <div className="min-h-screen bg-background">
      {/* Header with back button */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="transition-all hover:bg-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 
            className="text-lg font-bold gradient-text-primary cursor-pointer transition-transform hover:scale-105" 
            onClick={() => navigate('/')}
          >
            Djassa
          </h1>
          <div className="flex items-center gap-2 ml-2">
            <Store className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold">{shop.shop_name}</span>
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
        </div>

        {/* Products Section */}
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

              const categories = Object.keys(productsByCategory);
              const hasMultipleCategories = categories.length > 1;

              // Filter products based on selected category
              const displayedProducts = selectedCategory 
                ? productsByCategory[selectedCategory] || []
                : products;

              return (
                <div className="space-y-6">
                  {/* Show category menu only if multiple categories */}
                  {hasMultipleCategories && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">
                        Catégories
                      </h3>
                      <ScrollArea className="w-full whitespace-nowrap rounded-lg">
                        <div className="flex gap-2 pb-3 px-1">
                          <Button
                            variant={selectedCategory === null ? "default" : "outline"}
                            onClick={() => setSelectedCategory(null)}
                            className="flex items-center gap-2 min-w-fit px-4 py-2 text-sm font-medium transition-all hover:scale-105"
                            size="sm"
                          >
                            <Grid3x3 className="h-3.5 w-3.5" />
                            Tout ({products.length})
                          </Button>
                          {categories.map((category) => (
                            <Button
                              key={category}
                              variant={selectedCategory === category ? "default" : "outline"}
                              onClick={() => setSelectedCategory(category)}
                              className="capitalize min-w-fit px-4 py-2 text-sm font-medium transition-all hover:scale-105"
                              size="sm"
                            >
                              {category.replace(/-/g, ' ')} ({productsByCategory[category].length})
                            </Button>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {/* Products grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {displayedProducts.map((product) => (
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
                        stockQuantity={product.stock_quantity}
                        isSold={product.is_sold || false}
                        isActive={product.is_active}
                      />
                    ))}
                  </div>
                </div>
              );
            })()
          )}
        </div>

        {/* Similar Shops Section */}
        {similarShops.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Boutiques similaires</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {similarShops.map((similarShop) => (
                <Card
                  key={similarShop.id}
                  className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/boutique/${similarShop.shop_slug}`)}
                >
                  <div className="flex items-center gap-3 mb-2">
                    {similarShop.logo_url ? (
                      <img
                        src={similarShop.logo_url}
                        alt={similarShop.shop_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <Store className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{similarShop.shop_name}</h4>
                      {similarShop.subscription_active && (
                        <Badge variant="secondary" className="text-xs">Premium</Badge>
                      )}
                    </div>
                  </div>
                  {similarShop.shop_description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {similarShop.shop_description}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopPage;
