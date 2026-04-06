import SEOHead from "@/components/SEOHead";
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getCategoryBySlug, getSubCategoryBySlug } from '@/data/categories';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { useToast } from '@/hooks/use-toast';
import { useUserLocation } from '@/hooks/useUserLocation';
import { getProductImage } from '@/utils/productImageHelper';
import { cn } from '@/lib/utils';
import { popularSuggestions } from '@/data/categories';

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

const SORT_OPTIONS = [
  { value: "recent", label: "Plus récents" },
  { value: "price-asc", label: "Prix croissant" },
  { value: "price-desc", label: "Prix décroissant" },
  { value: "popular", label: "Populaires" },
];

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { location: userLocation } = useUserLocation();

  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Support both parent category slugs and subcategory slugs
  const parentCategory = slug ? getCategoryBySlug(slug) : null;
  const subCategoryMatch = slug && !parentCategory ? getSubCategoryBySlug(slug) : null;
  
  const categoryInfo = parentCategory || subCategoryMatch?.category;
  const activeSubSlug = subCategoryMatch ? slug : null;

  const { isVisible: isHeaderVisible } = useScrollDirection();

  useEffect(() => {
    if (activeSubSlug) {
      setSelectedSubcategory(activeSubSlug);
    }
  }, [activeSubSlug]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!slug || !categoryInfo) return;

      try {
        setLoading(true);

        const subcategorySlugs = categoryInfo.subcategories.map(sub => sub.slug);

        let query = supabase
          .from('products')
          .select('*')
          .in('category', subcategorySlugs)
          .eq('is_active', true);

        if (userLocation.city) {
          query = query.ilike('city', userLocation.city);
        }

        const { data: productsData, error: productsError } = await query
          .order('created_at', { ascending: false });

        if (productsError) throw productsError;

        setProducts(productsData || []);

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
  }, [slug, categoryInfo, toast, userLocation.city]);

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

  // Apply filters
  let filteredProducts = selectedShop === 'all' 
    ? products 
    : products.filter(p => p.shop_id === selectedShop);

  if (selectedSubcategory !== 'all') {
    filteredProducts = filteredProducts.filter(p => p.category === selectedSubcategory);
  }

  // Sort
  filteredProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc': return a.price - b.price;
      case 'price-desc': return b.price - a.price;
      case 'popular': return (b.reviews_count || 0) - (a.reviews_count || 0);
      default: return 0; // already sorted by created_at
    }
  });

  const Icon = categoryInfo.icon;

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-0">
      <SEOHead
        title={`${categoryInfo.name} – Produits Locaux Afrique | Djassa`}
        description={`Découvrez les produits ${categoryInfo.name} sur Djassa. Achetez local auprès de commerçants africains.`}
        url={`/category/${slug}`}
      />
      
      {/* Header */}
      <header 
        className={cn(
          "sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b transition-transform duration-300 ease-out md:translate-y-0",
          isHeaderVisible ? 'translate-y-0' : '-translate-y-full md:translate-y-0'
        )}
      >
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/categories')} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-lg">{categoryInfo.emoji}</span>
            <h1 className="text-base sm:text-lg font-semibold truncate">{categoryInfo.name}</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="shrink-0 gap-1.5"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filtres</span>
          </Button>
        </div>

        {/* Subcategory chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-2.5 scroll-snap-x touch-scroll-x scroll-gpu">
          <button
            onClick={() => setSelectedSubcategory('all')}
            className={cn(
              "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              selectedSubcategory === 'all'
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground"
            )}
          >
            Tous ({products.length})
          </button>
          {categoryInfo.subcategories.map((sub) => {
            const count = products.filter(p => p.category === sub.slug).length;
            return (
              <button
                key={sub.id}
                onClick={() => setSelectedSubcategory(selectedSubcategory === sub.slug ? 'all' : sub.slug)}
                className={cn(
                  "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap",
                  selectedSubcategory === sub.slug
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {sub.name} {count > 0 ? `(${count})` : ''}
              </button>
            );
          })}
        </div>
      </header>

      {/* Filters panel */}
      {showFilters && (
        <div className="border-b bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex flex-wrap gap-3">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px] h-9 text-xs">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {shops.length > 0 && (
              <Select value={selectedShop} onValueChange={setSelectedShop}>
                <SelectTrigger className="w-[180px] h-9 text-xs">
                  <SelectValue placeholder="Boutique" />
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
            )}

            {userLocation.city && (
              <span className="flex items-center text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                📍 {userLocation.city}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Banner */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 py-6 sm:py-10">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-card rounded-2xl shadow-sm mb-3">
            <Icon className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1">{categoryInfo.name}</h2>
          <p className="text-sm text-muted-foreground">
            {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} disponible{filteredProducts.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Suggestions */}
      {products.length === 0 && !loading && (
        <div className="container mx-auto px-4 py-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">🔥 Suggestions populaires</h3>
          <div className="flex flex-wrap gap-2">
            {popularSuggestions.map(s => (
              <button
                key={s.slug}
                onClick={() => navigate(`/category/${s.slug}`)}
                className="px-3 py-1.5 rounded-full bg-muted text-xs font-medium text-foreground hover:bg-accent transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Products */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Chargement des produits...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card className="p-10 sm:p-12 text-center">
            <Icon className="h-14 w-14 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-sm">
              {selectedShop !== 'all' 
                ? 'Aucun produit de cette boutique dans cette catégorie.'
                : userLocation.city
                  ? `Aucun produit disponible à ${userLocation.city} pour le moment.`
                  : 'Aucun produit disponible dans cette catégorie.'}
            </p>
            <Button variant="outline" onClick={() => navigate('/categories')} className="mt-4">
              Explorer d'autres catégories
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
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
