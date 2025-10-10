import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { categories } from "@/data/categories";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { ProductCard } from "@/components/ProductCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

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
}

export const CategoriesPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const { data, error } = await supabase
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
        }));
        setProducts(formattedProducts);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  // Filter products based on selected category and search query
  const filteredProducts = products.filter((product) => {
    // Filter by category if selected
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

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        product.title.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Mobile layout: deux zones (sidebar + products)
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-20 flex flex-col">
        {/* Header mobile avec barre de recherche */}
        <div className="sticky top-0 z-40 bg-background border-b shadow-sm">
          <div className="container mx-auto px-4 py-3">
            {/* Titre et bouton retour */}
            <div className="flex items-center gap-3 mb-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="min-w-[44px] min-h-[44px] flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-lg font-bold text-foreground">Catégories</h1>
            </div>

            {/* Barre de recherche avec loupe visible */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none z-10" />
              <Input
                type="text"
                placeholder="Rechercher un produit ou une catégorie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-muted/30 border-muted focus:bg-background focus:border-primary transition-all"
              />
            </div>
          </div>
        </div>

        {/* Layout à deux colonnes */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar gauche - Catégories (32% pour plus d'espace) */}
          <ScrollArea className="w-[32%] border-r bg-muted/20">
            <div className="py-1">
              {/* Option "Tous les produits" */}
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setSearchQuery("");
                }}
                className={cn(
                  "w-full px-2 py-3.5 text-left transition-all duration-200 border-l-4 active:scale-95 touch-manipulation",
                  selectedCategory === null
                    ? "bg-primary/15 border-primary text-primary font-semibold"
                    : "border-transparent hover:bg-muted/50 text-muted-foreground active:bg-muted"
                )}
              >
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-xs leading-tight font-semibold">Tous</span>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {products.length}
                  </span>
                </div>
              </button>

              {/* Liste des catégories - Affiche toutes les catégories */}
              {categories.map((category) => {
                const Icon = category.icon;
                const categoryProductCount = products.filter((product) => {
                  return category.subcategories.some(sub => sub.slug === product.category);
                }).length;

                return (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setSearchQuery("");
                    }}
                    className={cn(
                      "w-full px-2 py-3.5 text-left transition-all duration-200 border-l-4 active:scale-95 touch-manipulation",
                      selectedCategory === category.id
                        ? "bg-primary/15 border-primary text-primary font-semibold"
                        : "border-transparent hover:bg-muted/50 text-muted-foreground active:bg-muted"
                    )}
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      <Icon className="w-7 h-7 transition-transform" />
                      <span className="text-[10px] leading-tight text-center line-clamp-2 font-semibold px-1">
                        {category.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {categoryProductCount}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>

          {/* Zone principale droite - Produits */}
          <ScrollArea className="flex-1 bg-background">
            <div className="p-1">
              {/* Info sur les résultats */}
              {searchQuery && (
                <div className="px-3 py-2.5 mb-1.5 bg-muted/30 rounded-lg mx-1">
                  <p className="text-xs text-muted-foreground font-medium">
                    {filteredProducts.length} résultat{filteredProducts.length !== 1 ? 's' : ''} pour "{searchQuery}"
                  </p>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-20 px-4">
                  <p className="text-sm text-muted-foreground">
                    {searchQuery 
                      ? `Aucun produit trouvé pour "${searchQuery}"`
                      : selectedCategory 
                        ? "Aucun produit dans cette catégorie"
                        : "Aucun produit disponible"
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1 animate-fade-in">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      image={product.images[0] || '/placeholder.svg'}
                      title={product.title}
                      originalPrice={product.original_price}
                      salePrice={product.price}
                      discount={product.discount_percentage}
                      rating={product.rating}
                      reviews={product.reviews_count}
                      badge={product.badge}
                      isFlashSale={product.is_flash_sale}
                      seller_id={product.seller_id}
                      videoUrl={product.video_url}
                      isBoosted={product.is_boosted}
                      boostedUntil={product.boosted_until}
                      shop_slug={product.shop_slug}
                      shop_name={product.shop_name}
                    />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  }

  // Desktop layout: garde l'ancien affichage par catégories
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à l'accueil
        </Button>

        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
          Toutes les catégories
        </h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {categories.map((category) => {
              const Icon = category.icon;
              const categoryProducts = products.filter((product) => {
                return category.subcategories.some(sub => sub.slug === product.category);
              });

              if (categoryProducts.length === 0) return null;

              return (
                <div key={category.id} className="bg-card rounded-xl border shadow-sm p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="bg-primary/10 p-3 rounded-xl">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">
                        {category.name}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {categoryProducts.length.toLocaleString()} articles disponibles
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {category.subcategories.map((sub) => {
                      const count = products.filter(p => p.category === sub.slug).length;
                      
                      if (count === 0) return null;

                      return (
                        <button
                          key={sub.id}
                          onClick={() => navigate(`/category/${sub.slug}`)}
                          className="flex flex-col items-start p-4 rounded-lg border hover:border-primary hover:bg-accent/50 transition-all text-left group"
                        >
                          <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors mb-1">
                            {sub.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {count.toLocaleString()} article{count !== 1 ? 's' : ''}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
