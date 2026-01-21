import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getCategoryBySlug } from '@/data/categories';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { useToast } from '@/hooks/use-toast';
import { useUserLocation } from '@/hooks/useUserLocation';
import { getProductImage } from '@/utils/productImageHelper';

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
  shop_id: string | null;
  stock_quantity?: number;
  is_sold?: boolean;
  is_active?: boolean;
}

interface Shop {
  id: string;
  shop_name: string;
  shop_slug: string;
}

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { location: userLocation } = useUserLocation();

  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const categoryInfo = slug ? getCategoryBySlug(slug) : null;
  const { isVisible: isHeaderVisible } = useScrollDirection();
  useEffect(() => {
    const fetchProducts = async () => {
      if (!slug || !categoryInfo) return;

      try {
        setLoading(true);

        // Get all subcategory slugs for this main category
        const subcategorySlugs = categoryInfo.subcategories.map(sub => sub.slug);

        // Fetch products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .in('category', subcategorySlugs)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (productsError) throw productsError;

        setProducts(productsData || []);

        // Fetch unique shops that have products in this category
        if (productsData && productsData.length > 0) {
          const shopIds = Array.from(new Set(productsData.map(p => p.shop_id).filter(Boolean)));
          
          if (shopIds.length > 0) {
            const { data: shopsData, error: shopsError } = await supabase
              .from('seller_shops')
              .select('id, shop_name, shop_slug')
              .in('id', shopIds)
              .eq('is_active', true);

            if (!shopsError && shopsData) {
              setShops(shopsData);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching category products:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les produits de cette catégorie.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [slug, categoryInfo, toast]);

  if (!categoryInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Catégorie introuvable</p>
          <Button onClick={() => navigate('/categories')} className="mt-4">
            Retour aux catégories
          </Button>
        </Card>
      </div>
    );
  }

  const filteredProducts = selectedShop === 'all' 
    ? products 
    : products.filter(p => p.shop_id === selectedShop);

  const Icon = categoryInfo.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Desktop: always visible, Mobile: hide on scroll down */}
      <header 
        className={`
          sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b
          transition-transform duration-300 ease-out
          md:translate-y-0
          ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full md:translate-y-0'}
        `}
      >
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/categories')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">{categoryInfo.name}</h1>
          </div>
        </div>
      </header>

      {/* Category Banner */}
      <div className="bg-gradient-to-r from-primary/20 to-secondary/20 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-card rounded-full mb-4">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">{categoryInfo.name}</h2>
          <p className="text-muted-foreground">
            {products.length} produit{products.length > 1 ? 's' : ''} disponible{products.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 py-6">
        {shops.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Filtrer par boutique</label>
            <Select value={selectedShop} onValueChange={setSelectedShop}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Toutes les boutiques" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les boutiques</SelectItem>
                {shops.map((shop) => (
                  <SelectItem key={shop.id} value={shop.id}>
                    {shop.shop_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Chargement des produits...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card className="p-12 text-center">
            <Icon className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">
              {selectedShop === 'all' 
                ? 'Aucun produit disponible dans cette catégorie.'
                : 'Aucun produit de cette boutique dans cette catégorie.'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                title={product.title}
                originalPrice={product.original_price || product.price}
                salePrice={product.price}
                image={getProductImage(product.images, 0)}
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
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
