import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getSubCategoryBySlug } from '@/data/categories';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { useToast } from '@/hooks/use-toast';

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

  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const categoryInfo = slug ? getSubCategoryBySlug(slug) : null;

  useEffect(() => {
    const fetchProducts = async () => {
      if (!slug) return;

      try {
        setLoading(true);

        // Fetch products for this category
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('category', slug)
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
  }, [slug, toast]);

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

  const Icon = categoryInfo.category.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b">
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
            <h1 className="text-lg font-semibold">{categoryInfo.subcategory.name}</h1>
          </div>
        </div>
      </header>

      {/* Category Banner */}
      <div className="bg-gradient-to-r from-primary/20 to-secondary/20 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-card rounded-full mb-4">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">{categoryInfo.subcategory.name}</h2>
          <p className="text-muted-foreground">
            {categoryInfo.category.name} • {products.length} produit{products.length > 1 ? 's' : ''}
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
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
