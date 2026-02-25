import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { categories } from "@/data/categories";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { ProductCard } from "@/components/ProductCard";
import { CategoryProductCard } from "@/components/CategoryProductCard";
import { cn } from "@/lib/utils";
import { getProductImage } from "@/utils/productImageHelper";

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

const CategoriesPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isVisible: isHeaderVisible } = useScrollDirection();
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

  // Mobile layout: Style native e-commerce (Jumia, Amazon)
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50/80 pb-20 flex flex-col">
        {/* Header mobile - Clean native style with dynamic hide/show */}
        <div 
          className={`
            sticky top-0 z-40 bg-white border-b border-gray-100/80 shadow-sm
            transition-transform duration-300 ease-out
            ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}
          `}
        >
          <div className="px-3 py-2.5">
            {/* Titre et bouton retour */}
            <div className="flex items-center gap-2.5 mb-2.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="w-9 h-9 rounded-full bg-gray-50 hover:bg-gray-100 active:scale-95 transition-transform"
              >
                <ArrowLeft className="w-4 h-4 text-gray-700" />
              </Button>
              <h1 className="text-base font-semibold text-gray-900">Catégories</h1>
            </div>

            {/* Barre de recherche native */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-full bg-gray-100 border-0 text-sm placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Layout split - Sidebar étroite + Produits */}
        <div className="flex flex-1 min-h-0 overflow-x-hidden">
          {/* Sidebar gauche - Style natif compact */}
          <div className="w-[76px] bg-white border-r border-gray-100/80 overflow-y-auto scrollbar-hide flex-shrink-0">
            <div className="py-2">
              {/* Option "Tous" */}
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setSearchQuery("");
                }}
                className={cn(
                  "w-full py-3 px-1.5 flex flex-col items-center gap-1.5 transition-all active:bg-gray-50",
                  selectedCategory === null
                    ? "bg-primary/5 border-l-[3px] border-primary"
                    : "border-l-[3px] border-transparent"
                )}
              >
                <div className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center transition-all shadow-sm",
                  selectedCategory === null 
                    ? "bg-primary text-white" 
                    : "bg-gray-100 text-gray-500"
                )}>
                  <span className="text-lg">🛍️</span>
                </div>
                <span className={cn(
                  "text-[10px] font-medium text-center leading-tight",
                  selectedCategory === null ? "text-primary" : "text-gray-600"
                )}>
                  Tous
                </span>
                <span className={cn(
                  "text-[9px] font-semibold px-2 py-0.5 rounded-full",
                  selectedCategory === null 
                    ? "bg-primary/10 text-primary" 
                    : "bg-gray-100 text-gray-500"
                )}>
                  {products.length}
                </span>
              </button>

              {/* Liste des catégories */}
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
                      "w-full py-3 px-1.5 flex flex-col items-center gap-1.5 transition-all active:bg-gray-50",
                      selectedCategory === category.id
                        ? "bg-primary/5 border-l-[3px] border-primary"
                        : "border-l-[3px] border-transparent"
                    )}
                  >
                    <div className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center transition-all shadow-sm",
                      selectedCategory === category.id 
                        ? "bg-primary text-white" 
                        : "bg-gray-100 text-gray-500"
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={cn(
                      "text-[9px] font-medium text-center leading-tight line-clamp-2 px-0.5 min-h-[24px] flex items-center",
                      selectedCategory === category.id ? "text-primary" : "text-gray-600"
                    )}>
                      {category.name}
                    </span>
                    <span className={cn(
                      "text-[9px] font-semibold px-2 py-0.5 rounded-full",
                      selectedCategory === category.id 
                        ? "bg-primary/10 text-primary" 
                        : "bg-gray-100 text-gray-500"
                    )}>
                      {categoryProductCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Zone principale - Produits */}
          <div className="flex-1 overflow-y-auto bg-gray-50/50 [scroll-behavior:smooth]">
            <div className="p-2.5">
              {/* Info résultats recherche */}
              {searchQuery && (
                <div className="px-3 py-2.5 mb-2.5 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <p className="text-xs text-gray-600">
                    <span className="font-bold text-gray-900">{filteredProducts.length}</span> résultat{filteredProducts.length !== 1 ? 's' : ''} pour "<span className="font-medium text-primary">{searchQuery}</span>"
                  </p>
                </div>
              )}

              {/* Titre catégorie sélectionnée */}
              {selectedCategory && !searchQuery && (
                <div className="px-1 py-2 mb-2">
                  <h2 className="text-sm font-bold text-gray-900">
                    {categories.find(c => c.id === selectedCategory)?.name || 'Produits'}
                  </h2>
                  <p className="text-[11px] text-gray-500 mt-0.5">{filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''} disponible{filteredProducts.length !== 1 ? 's' : ''}</p>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-10 h-10 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-20 px-6">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <Search className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">
                    Aucun produit trouvé
                  </p>
                  <p className="text-xs text-gray-400">
                    {searchQuery 
                      ? `Essayez une autre recherche`
                      : selectedCategory 
                        ? "Cette catégorie est vide pour le moment"
                        : "Aucun produit disponible"
                    }
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

export default CategoriesPage;
