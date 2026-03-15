import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { categories } from "@/data/categories";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Search, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { CategoryProductCard } from "@/components/CategoryProductCard";
import { cn } from "@/lib/utils";
import { getProductImage } from "@/utils/productImageHelper";
import { useUserLocation } from "@/hooks/useUserLocation";
import { Skeleton } from "@/components/ui/skeleton";

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

const PAGE_SIZE = 20;

/** Skeleton grid for loading state */
const ProductGridSkeleton = memo(() => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="rounded-xl overflow-hidden border border-border/50">
        <Skeleton className="w-full h-[180px] sm:h-[220px] rounded-none" />
        <div className="p-2 space-y-2">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
    ))}
  </div>
));
ProductGridSkeleton.displayName = "ProductGridSkeleton";

/** Horizontal scroll carousel for desktop category sections */
const ProductCarousel = memo(({ products }: { products: Product[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    el?.addEventListener("scroll", checkScroll, { passive: true });
    return () => el?.removeEventListener("scroll", checkScroll);
  }, [products, checkScroll]);

  const scroll = useCallback((dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -el.clientWidth * 0.7 : el.clientWidth * 0.7, behavior: "smooth" });
  }, []);

  if (products.length === 0) return null;

  return (
    <div className="relative group">
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-background/90 border border-border shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
      )}
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 scroll-smooth">
        {products.map((product) => (
          <div key={product.id} className="flex-shrink-0 w-[200px] lg:w-[220px]">
            <CategoryProductCard
              id={product.id}
              image={getProductImage(product.images, 0)}
              images={product.images}
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
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-background/90 border border-border shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent"
        >
          <ChevronRight className="w-5 h-5 text-foreground" />
        </button>
      )}
    </div>
  );
});
ProductCarousel.displayName = "ProductCarousel";

const CategoriesPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isVisible: isHeaderVisible } = useScrollDirection();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { location } = useUserLocation();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const pageRef = useRef(0);

  const formatProduct = (product: any): Product => ({
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
  });

  const buildQuery = useCallback(
    (from: number, to: number) => {
      let query = supabase
        .from("products")
        .select(
          `*, seller_shops!products_shop_id_fkey ( shop_slug, shop_name )`
        )
        .eq("is_active", true)
        .order("is_boosted", { ascending: false })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (location.city) {
        query = query.ilike("city", location.city);
      }

      return query;
    },
    [location.city]
  );

  // Initial fetch
  useEffect(() => {
    const fetchInitial = async () => {
      setLoading(true);
      pageRef.current = 0;
      const { data, error } = await buildQuery(0, PAGE_SIZE - 1);
      if (!error && data) {
        setProducts(data.map(formatProduct));
        setHasMore(data.length === PAGE_SIZE);
      }
      setLoading(false);
    };
    fetchInitial();
  }, [buildQuery]);

  // Load more
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = pageRef.current + 1;
    const from = nextPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await buildQuery(from, to);
    if (!error && data) {
      setProducts((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        const newItems = data.map(formatProduct).filter((p) => !ids.has(p.id));
        return [...prev, ...newItems];
      });
      setHasMore(data.length === PAGE_SIZE);
      pageRef.current = nextPage;
    }
    setLoadingMore(false);
  }, [buildQuery, loadingMore, hasMore]);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "400px" }
    );
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [loadMore]);

  // Commune prioritization + category/search filtering
  const filteredProducts = (() => {
    let list = products;

    // Category filter
    if (selectedCategory) {
      const cat = categories.find((c) => c.id === selectedCategory);
      if (cat) {
        const slugs = new Set(cat.subcategories.map((s) => s.slug));
        list = list.filter((p) => slugs.has(p.category));
      }
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    // Commune priority
    if (location.commune) {
      const commune = location.commune.toLowerCase();
      const local = list.filter((p) => p.commune?.toLowerCase() === commune);
      const rest = list.filter((p) => p.commune?.toLowerCase() !== commune);
      return [...local, ...rest];
    }

    return list;
  })();

  // ─── MOBILE ───
  if (isMobile) {
    return (
      <div className="min-h-[100dvh] bg-muted/30 pb-20 flex flex-col">
        {/* Sticky header */}
        <div
          className={cn(
            "sticky top-0 z-40 bg-background border-b border-border shadow-sm transition-transform duration-300 ease-out",
            isHeaderVisible ? "translate-y-0" : "-translate-y-full"
          )}
        >
          <div className="px-3 py-2.5">
            <div className="flex items-center gap-2.5 mb-2">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="w-9 h-9 rounded-full">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-base font-semibold text-foreground">Produits</h1>
              {location.city && (
                <span className="ml-auto text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  📍 {location.city}{location.commune ? ` - ${location.commune}` : ""}
                </span>
              )}
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

          {/* Category chips - horizontal scroll */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide px-3 pb-2.5">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                selectedCategory === null
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground"
              )}
            >
              Tous ({products.length})
            </button>
            {categories.map((cat) => {
              const slugs = new Set(cat.subcategories.map((s) => s.slug));
              const count = products.filter((p) => slugs.has(p.category)).length;
              if (count === 0) return null;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                  className={cn(
                    "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors",
                    selectedCategory === cat.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat.name.split(" ")[0]} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Product grid */}
        <div className="flex-1 px-2.5 pt-3">
          {searchQuery && (
            <div className="px-2 py-2 mb-2 bg-background rounded-xl border border-border shadow-sm">
              <p className="text-xs text-muted-foreground">
                <span className="font-bold text-foreground">{filteredProducts.length}</span> résultat{filteredProducts.length !== 1 ? "s" : ""} pour "<span className="font-medium text-primary">{searchQuery}</span>"
              </p>
            </div>
          )}

          {loading ? (
            <ProductGridSkeleton />
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 px-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Search className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">Aucun produit trouvé</p>
              <p className="text-xs text-muted-foreground">
                {searchQuery ? "Essayez une autre recherche" : "Aucun produit disponible"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {filteredProducts.map((product) => (
                <CategoryProductCard
                  key={product.id}
                  id={product.id}
                  image={getProductImage(product.images, 0)}
                  images={product.images}
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

          {/* Infinite scroll sentinel */}
          {!loading && hasMore && !selectedCategory && !searchQuery && (
            <div ref={sentinelRef} className="flex justify-center py-6">
              {loadingMore && (
                <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              )}
            </div>
          )}

          {!hasMore && filteredProducts.length > 0 && !selectedCategory && !searchQuery && (
            <p className="text-center text-xs text-muted-foreground py-6">
              Vous avez vu tous les produits 🎉
            </p>
          )}
        </div>
      </div>
    );
  }

  // ─── DESKTOP ───
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate("/")} className="shrink-0">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Produits par catégorie</h1>
          {location.city && (
            <span className="ml-auto text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
              📍 {location.city}{location.commune ? ` - ${location.commune}` : ""}
            </span>
          )}
        </div>

        {/* Search + category chips */}
        <div className="relative max-w-lg mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher dans les catégories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-xl"
          />
        </div>

        <div className="flex gap-2 flex-wrap mb-8">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors",
              selectedCategory === null
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-accent"
            )}
          >
            Tous ({products.length})
          </button>
          {categories.map((cat) => {
            const slugs = new Set(cat.subcategories.map((s) => s.slug));
            const count = products.filter((p) => slugs.has(p.category)).length;
            if (count === 0) return null;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors",
                  selectedCategory === cat.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {loading ? (
          <ProductGridSkeleton />
        ) : (
          <div className="space-y-10">
            {categories.map((category) => {
              const Icon = category.icon;
              const slugs = new Set(category.subcategories.map((s) => s.slug));
              const categoryProducts = filteredProducts.filter((p) => slugs.has(p.category));
              if (categoryProducts.length === 0) return null;

              return (
                <section key={category.id} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2.5 rounded-xl">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-foreground">{category.name}</h2>
                        <p className="text-xs text-muted-foreground">
                          {categoryProducts.length} produit{categoryProducts.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/category/${category.subcategories[0]?.slug || ""}`)}
                      className="text-primary text-xs hover:text-primary/80"
                    >
                      Voir tout →
                    </Button>
                  </div>

                  {/* Vertical grid instead of carousel */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {categoryProducts.map((product) => (
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
                </section>
              );
            })}
          </div>
        )}

        {/* Desktop infinite scroll sentinel */}
        {!loading && hasMore && !selectedCategory && !searchQuery && (
          <div ref={!isMobile ? sentinelRef : undefined} className="flex justify-center py-8">
            {loadingMore && (
              <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            )}
          </div>
        )}

        {!hasMore && filteredProducts.length > 0 && !selectedCategory && !searchQuery && (
          <p className="text-center text-xs text-muted-foreground py-6">
            Vous avez vu tous les produits 🎉
          </p>
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;
