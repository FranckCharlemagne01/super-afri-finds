import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { categories } from "@/data/categories";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { CategoryProductCard } from "@/components/CategoryProductCard";
import { cn } from "@/lib/utils";
import { getProductImage } from "@/utils/productImageHelper";
import { useUserLocation } from "@/hooks/useUserLocation";

interface Product {
  id: string;
  title: string;
  price: number;
  original_price: number;
  discount_percentage: number;
  images: string[];
  category: string;
  rating: number;
  reviews_count: number;
  badge?: string;
  is_flash_sale: boolean;
  seller_id: string;
  video_url?: string;
  is_boosted: boolean;
  boosted_until?: string;
  shop_slug?: string;
  shop_name?: string;
  city?: string;
  commune?: string;
}

/** Horizontal scroll carousel for a category's products */
const ProductCarousel = ({ products, categoryId }: { products: Product[]; categoryId: string }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    el?.addEventListener('scroll', checkScroll, { passive: true });
    return () => el?.removeEventListener('scroll', checkScroll);
  }, [products]);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.7;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (products.length === 0) return null;

  return (
    <div className="relative group">
      {/* Left arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-background/90 border border-border shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
      )}

      {/* Scrollable row */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 scroll-smooth"
      >
        {products.map((product) => (
          <div key={product.id} className="flex-shrink-0 w-[200px] lg:w-[220px]">
            <CategoryProductCard
              id={product.id}
              image={getProductImage(product.images, 0)}
              title={product.title}
              originalPrice={product.original_price}
              salePrice={product.price}
              discount={product.discount_percentage}
              rating={product.rating}
              reviews={product.reviews_count}
              badge={product.badge}
              isFlashSale={product.is_flash_sale}
              isBoosted={product.is_boosted}
              boostedUntil={product.boosted_until}
              shop_name={product.shop_name}
            />
          </div>
        ))}
      </div>

      {/* Right arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-background/90 border border-border shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent"
        >
          <ChevronRight className="w-5 h-5 text-foreground" />
        </button>
      )}
    </div>
  );
};

const CategoriesPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isVisible: isHeaderVisible } = useScrollDirection();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { location } = useUserLocation();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      let query = supabase
        .from('products')
        .select(`
          *,
          seller_shops!products_shop_id_fkey (
            shop_slug,
            shop_name
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // Apply city filter if user has a location set
      if (location.city) {
        query = query.ilike('city', location.city);
      }

      const { data, error } = await query;

      if (!error && data) {
        const formattedProducts = data.map((product: any) => ({
          id: product.id,
          title: product.title,
          price: product.price,
          original_price: product.original_price || product.price,
          discount_percentage: product.discount_percentage || 0,
          images: product.images || [],
          category: product.category,
          rating: product.rating || 0,
          reviews_count: product.reviews_count || 0,
          badge: product.badge,
          is_flash_sale: product.is_flash_sale || false,
          seller_id: product.seller_id,
          video_url: product.video_url,
          is_boosted: product.is_boosted || false,
          boosted_until: product.boosted_until,
          shop_slug: product.seller_shops?.shop_slug,
          shop_name: product.seller_shops?.shop_name,
          city: product.city,
          commune: product.commune,
        }));
        setProducts(formattedProducts);
      }
      setLoading(false);
    };

    fetchProducts();
  }, [location.city]);

  // Apply commune prioritization
  const applyLocalPriority = (list: Product[]) => {
    if (!location.commune) return list;
    const local = list.filter(p => p.commune?.toLowerCase() === location.commune?.toLowerCase());
    const rest = list.filter(p => p.commune?.toLowerCase() !== location.commune?.toLowerCase());
    return [...local, ...rest];
  };

  // Filter products based on selected category and search query
  const filteredProducts = applyLocalPriority(
    products.filter((product) => {
      if (selectedCategory) {
        let matchesCategory = false;
        for (const cat of categories) {
          if (cat.subcategories.some(sub => sub.slug === product.category)) {
            matchesCategory = cat.id === selectedCategory;
            break;
          }
        }
        if (!matchesCategory) return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          product.title.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query)
        );
      }

      return true;
    })
  );

  // Mobile layout
  if (isMobile) {
    return (
      <div className="min-h-[100dvh] bg-muted/30 pb-20 flex flex-col">
        <div
          className={`
            sticky top-0 z-40 bg-background border-b border-border shadow-sm
            transition-transform duration-300 ease-out
            ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}
          `}
        >
          <div className="px-3 py-2.5">
            <div className="flex items-center gap-2.5 mb-2.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="w-9 h-9 rounded-full"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-base font-semibold text-foreground">Catégories</h1>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-full bg-muted border-0 text-sm placeholder:text-muted-foreground focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex overflow-x-hidden">
          <div className="w-[76px] bg-background border-r border-border scrollbar-hide flex-shrink-0">
            <div className="py-2">
              <button
                onClick={() => { setSelectedCategory(null); setSearchQuery(""); }}
                className={cn(
                  "w-full py-3 px-1.5 flex flex-col items-center gap-1.5 transition-all",
                  selectedCategory === null
                    ? "bg-primary/5 border-l-[3px] border-primary"
                    : "border-l-[3px] border-transparent"
                )}
              >
                <div className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center shadow-sm",
                  selectedCategory === null ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  <span className="text-lg">🛍️</span>
                </div>
                <span className={cn("text-[10px] font-medium", selectedCategory === null ? "text-primary" : "text-muted-foreground")}>Tous</span>
                <span className={cn("text-[9px] font-semibold px-2 py-0.5 rounded-full", selectedCategory === null ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>{products.length}</span>
              </button>

              {categories.map((category) => {
                const Icon = category.icon;
                const count = products.filter(p => category.subcategories.some(sub => sub.slug === p.category)).length;
                return (
                  <button
                    key={category.id}
                    onClick={() => { setSelectedCategory(category.id); setSearchQuery(""); }}
                    className={cn(
                      "w-full py-3 px-1.5 flex flex-col items-center gap-1.5 transition-all",
                      selectedCategory === category.id
                        ? "bg-primary/5 border-l-[3px] border-primary"
                        : "border-l-[3px] border-transparent"
                    )}
                  >
                    <div className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center shadow-sm",
                      selectedCategory === category.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={cn("text-[9px] font-medium text-center leading-tight line-clamp-2 px-0.5 min-h-[24px] flex items-center", selectedCategory === category.id ? "text-primary" : "text-muted-foreground")}>{category.name}</span>
                    <span className={cn("text-[9px] font-semibold px-2 py-0.5 rounded-full", selectedCategory === category.id ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 min-w-0 bg-muted/20">
            <div className="p-2.5">
              {searchQuery && (
                <div className="px-3 py-2.5 mb-2.5 bg-background rounded-xl border border-border shadow-sm">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-bold text-foreground">{filteredProducts.length}</span> résultat{filteredProducts.length !== 1 ? 's' : ''} pour "<span className="font-medium text-primary">{searchQuery}</span>"
                  </p>
                </div>
              )}

              {selectedCategory && !searchQuery && (
                <div className="px-1 py-2 mb-2">
                  <h2 className="text-sm font-bold text-foreground">
                    {categories.find(c => c.id === selectedCategory)?.name || 'Produits'}
                  </h2>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''}</p>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-10 h-10 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-20 px-6">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <Search className="w-8 h-8 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">Aucun produit trouvé</p>
                  <p className="text-xs text-muted-foreground">
                    {searchQuery ? "Essayez une autre recherche" : selectedCategory ? "Cette catégorie est vide pour le moment" : "Aucun produit disponible"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {filteredProducts.map((product) => (
                    <CategoryProductCard
                      key={product.id}
                      id={product.id}
                      image={getProductImage(product.images, 0)}
                      title={product.title}
                      originalPrice={product.original_price}
                      salePrice={product.price}
                      discount={product.discount_percentage}
                      rating={product.rating}
                      reviews={product.reviews_count}
                      badge={product.badge}
                      isFlashSale={product.is_flash_sale}
                      isBoosted={product.is_boosted}
                      boostedUntil={product.boosted_until}
                      shop_name={product.shop_name}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop layout — categories with product carousels
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate('/')} className="shrink-0">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Produits par catégorie
          </h1>
        </div>

        {/* Search bar for desktop */}
        <div className="relative max-w-lg mb-8">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher dans les catégories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-xl"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          </div>
        ) : (
          <div className="space-y-10">
            {categories.map((category) => {
              const Icon = category.icon;
              const categoryProducts = filteredProducts.filter((product) =>
                category.subcategories.some(sub => sub.slug === product.category)
              );

              if (categoryProducts.length === 0) return null;

              return (
                <section key={category.id} className="space-y-4">
                  {/* Category header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2.5 rounded-xl">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-foreground">{category.name}</h2>
                        <p className="text-xs text-muted-foreground">
                          {categoryProducts.length} produit{categoryProducts.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/category/${category.subcategories[0]?.slug || ''}`)}
                      className="text-primary text-xs hover:text-primary/80"
                    >
                      Voir tout →
                    </Button>
                  </div>

                  {/* Subcategory chips */}
                  <div className="flex gap-2 flex-wrap">
                    {category.subcategories.map((sub) => {
                      const count = products.filter(p => p.category === sub.slug).length;
                      if (count === 0) return null;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => navigate(`/category/${sub.slug}`)}
                          className="px-3 py-1.5 text-xs font-medium rounded-full border border-border bg-background hover:bg-accent hover:border-primary/30 transition-colors text-foreground"
                        >
                          {sub.name} <span className="text-muted-foreground">({count})</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Product carousel */}
                  <ProductCarousel products={categoryProducts} categoryId={category.id} />
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;
