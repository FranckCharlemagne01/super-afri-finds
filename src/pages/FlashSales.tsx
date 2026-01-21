import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Clock } from 'lucide-react';
import { useUserLocation } from '@/hooks/useUserLocation';
import { getProductImage } from '@/utils/productImageHelper';

// Product interface (seller_id optional for public views)
interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  original_price?: number;
  discount_percentage?: number;
  category: string;
  images?: string[];
  seller_id?: string; // Hidden in products_public view for privacy
  rating?: number;
  reviews_count?: number;
  badge?: string;
  is_flash_sale?: boolean;
  stock_quantity?: number;
  in_stock?: boolean; // From products_public view
  video_url?: string;
  created_at?: string;
}

const FlashSales = () => {
  const navigate = useNavigate();
  const { location: userLocation } = useUserLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlashSaleProducts();
  }, [userLocation.city, userLocation.country]);

  const fetchFlashSaleProducts = async () => {
    try {
      setLoading(true);
      // Use products_public view to hide sensitive seller data
      const { data, error } = await supabase
        .from('products_public')
        .select('*')
        .eq('is_flash_sale', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching flash sale products:', error);
        return;
      }
      
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching flash sale products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Convert Supabase product to ProductCard props
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des ventes flash...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/')}
              className="hover:bg-secondary"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center">
                <span className="text-white text-lg">⚡</span>
              </div>
              <h1 className="text-xl font-bold text-foreground">Ventes Flash</h1>
            </div>
            <Badge className="bg-promo text-promo-foreground animate-pulse-promo">
              <Clock className="w-3 h-3 mr-1" />
              Limitées dans le temps
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">⚡</span>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Aucune vente flash en cours
            </h2>
            <p className="text-muted-foreground mb-6">
              Revenez plus tard pour découvrir nos offres limitées dans le temps !
            </p>
            <Button onClick={() => navigate('/')}>
              Retour à l'accueil
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-muted-foreground">
                {products.length} produit{products.length > 1 ? 's' : ''} en vente flash disponible{products.length > 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {products.map((product) => (
                <ProductCard 
                  key={product.id} 
                  {...convertToProductCardProps(product)} 
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default FlashSales;