import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search } from "lucide-react";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  original_price?: number;
  discount_percentage?: number;
  category: string;
  images?: string[];
  seller_id: string;
  rating?: number;
  reviews_count?: number;
  badge?: string;
  is_flash_sale?: boolean;
  stock_quantity?: number;
  video_url?: string;
}

const CategoryPage = () => {
  const { categoryName } = useParams<{ categoryName: string }>();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (categoryName) {
      fetchCategoryProducts();
    }
  }, [categoryName]);

  const fetchCategoryProducts = async () => {
    try {
      setLoading(true);
      
      // Decode the URL parameter
      const decodedCategoryName = decodeURIComponent(categoryName || '');
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .ilike('category', `%${decodedCategoryName}%`)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching category products:', error);
        return;
      }
      
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching category products:', error);
    } finally {
      setLoading(false);
    }
  };

  const convertToProductCardProps = (product: Product) => ({
    id: product.id,
    image: product.images?.[0] || "/placeholder.svg",
    title: product.title,
    originalPrice: product.original_price || product.price,
    salePrice: product.price,
    discount: product.discount_percentage || 0,
    rating: product.rating || 0,
    reviews: product.reviews_count || 0,
    badge: product.badge,
    isFlashSale: product.is_flash_sale || false,
    seller_id: product.seller_id,
    videoUrl: product.video_url
  });

  // Fonction pour normaliser le text et tolérer les fautes d'orthographe
  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[ñ]/g, 'n');
  };

  // Fonction pour calculer la distance de Levenshtein (tolérance aux fautes)
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  };

  const filteredProducts = products.filter(product => {
    if (!searchTerm.trim()) return true;

    const normalizedQuery = normalizeText(searchTerm);
    const queryWords = normalizedQuery.split(' ').filter(word => word.length > 0);
    
    const normalizedTitle = normalizeText(product.title);
    const normalizedDescription = normalizeText(product.description || '');
    
    // Recherche exacte d'abord
    for (const word of queryWords) {
      if (normalizedTitle.includes(word) || normalizedDescription.includes(word)) {
        return true;
      }
    }

    // Recherche avec tolérance aux fautes (distance max de 2)
    const titleWords = normalizedTitle.split(' ');
    const descWords = normalizedDescription.split(' ');
    
    for (const queryWord of queryWords) {
      if (queryWord.length < 3) continue; // Skip très courts mots
      
      const allWords = [...titleWords, ...descWords];
      for (const word of allWords) {
        if (word.length >= 3 && levenshteinDistance(queryWord, word) <= 2) {
          return true;
        }
      }
    }

    return false;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des produits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-lg border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/')}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground capitalize">
              {categoryName?.replace('-', ' ')}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="max-w-md">
            <SearchBar 
              placeholder="Rechercher dans cette catégorie..."
              onSearch={(term) => setSearchTerm(term)}
              showResults={false}
            />
          </div>
        </div>

        {/* Products Count */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''} trouvé{filteredProducts.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} {...convertToProductCardProps(product)} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Aucun produit trouvé
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? `Aucun produit ne correspond à "${searchTerm}" dans cette catégorie.`
                : `Aucun produit n'est disponible dans la catégorie "${categoryName?.replace('-', ' ')}".`
              }
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              Retourner à l'accueil
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default CategoryPage;