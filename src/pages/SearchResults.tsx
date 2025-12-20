import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchBar } from '@/components/SearchBar';
import { ArrowLeft, Search } from 'lucide-react';
import { useSearch } from '@/hooks/useSearch';
import { getProductImage } from '@/utils/productImageHelper';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  seller_id: string;
  original_price?: number;
  discount_percentage?: number;
  rating?: number;
  reviews_count?: number;
  is_flash_sale?: boolean;
  badge?: string;
  video_url?: string;
}

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const { searchResults, loading, setSearchTerm } = useSearch();

  useEffect(() => {
    if (query) {
      setSearchTerm(query);
    }
  }, [query, setSearchTerm]);

  const convertToProductCardProps = (product: Product) => ({
    id: product.id,
    image: getProductImage(product.images, 0),
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

  const handleCategoryRedirect = () => {
    navigate('/');
    // Scroll vers les catégories populaires
    setTimeout(() => {
      const categoriesSection = document.getElementById('popular-categories');
      if (categoriesSection) {
        categoriesSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header avec navigation */}
      <header className="bg-background border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Button>
            
            <div className="flex-1 max-w-2xl">
              <SearchBar 
                placeholder="Rechercher des produits..."
                showResults={true}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="container mx-auto px-4 py-6">
        {/* En-tête des résultats */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Search className="w-5 h-5 text-muted-foreground" />
            <h1 className="text-xl font-bold">
              Résultats de recherche
            </h1>
          </div>
          
          {query && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>pour</span>
              <Badge variant="outline" className="font-medium">
                "{query}"
              </Badge>
              {!loading && (
                <span className="text-sm">
                  ({searchResults.length} résultat{searchResults.length > 1 ? 's' : ''} trouvé{searchResults.length > 1 ? 's' : ''})
                </span>
              )}
            </div>
          )}
        </div>

        {/* États de chargement et résultats */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Recherche en cours...</p>
            </div>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {searchResults.map((product) => (
              <ProductCard
                key={product.id}
                {...convertToProductCardProps(product)}
              />
            ))}
          </div>
        ) : query ? (
          // Aucun résultat trouvé
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                🔍 Aucun produit trouvé
              </h3>
              <p className="text-muted-foreground mb-6">
                Essayez un autre mot-clé ou explorez nos catégories populaires !
              </p>
              
              <div className="space-y-3">
                <Button 
                  onClick={handleCategoryRedirect}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  Voir les catégories populaires
                </Button>
                
                <div className="text-sm text-muted-foreground">
                  <p>💡 Conseils de recherche :</p>
                  <ul className="text-left mt-2 space-y-1">
                    <li>• Vérifiez l'orthographe</li>
                    <li>• Utilisez des mots-clés plus généraux</li>
                    <li>• Essayez des synonymes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // État initial (pas de recherche)
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Recherchez vos produits préférés
            </h3>
            <p className="text-muted-foreground">
              Utilisez la barre de recherche pour trouver des produits
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default SearchResults;