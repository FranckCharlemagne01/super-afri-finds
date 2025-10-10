import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { useToast } from "@/hooks/use-toast";
import { ContactSellerButton } from "@/components/ContactSellerButton";
import { QuickOrderDialog } from "@/components/QuickOrderDialog";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, 
  Heart, 
  Star, 
  ShoppingCart,
  Plus,
  Minus
} from "lucide-react";

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
  shop_id?: string;
  rating?: number;
  reviews_count?: number;
  badge?: string;
  is_flash_sale?: boolean;
  stock_quantity?: number;
  video_url?: string;
}

interface Shop {
  id: string;
  shop_name: string;
  shop_slug: string;
  shop_description?: string;
  logo_url?: string;
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { toast } = useToast();

  const [quantity, setQuantity] = useState(1);
  const [personalMessage, setPersonalMessage] = useState('');
  const [showVideo, setShowVideo] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [shopProducts, setShopProducts] = useState<Product[]>([]);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [similarShops, setSimilarShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchProduct(id);
    }
  }, [id]);

  const fetchProduct = async (productId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('is_active', true)
        .single();
      
      if (error || !data) {
        console.error('Error fetching product:', error);
        setLoading(false);
        toast({
          title: "Produit introuvable",
          description: "Ce produit n'existe plus ou a été supprimé.",
          variant: "destructive",
        });
        setTimeout(() => navigate('/'), 2000);
        return;
      }
      
      setProduct(data);
      
      // Fetch shop info if shop_id exists
      if (data.shop_id) {
        const { data: shopData } = await supabase
          .from('seller_shops')
          .select('*')
          .eq('id', data.shop_id)
          .single();
        
        if (shopData) {
          setShop(shopData);
          
          // Fetch other products from the same shop
          const { data: shopProductsData } = await supabase
            .from('products')
            .select('*')
            .eq('shop_id', data.shop_id)
            .eq('is_active', true)
            .neq('id', productId)
            .limit(6);
          
          if (shopProductsData) {
            setShopProducts(shopProductsData);
          }
        }
      }
      
      // Fetch similar products from other shops (same category)
      const { data: similarData } = await supabase
        .from('products')
        .select('*')
        .eq('category', data.category)
        .eq('is_active', true)
        .neq('id', productId)
        .neq('shop_id', data.shop_id || '')
        .limit(6);
      
      if (similarData) {
        setSimilarProducts(similarData);
        
        // Fetch similar shops (shops that have similar products)
        const similarShopIds = Array.from(new Set(similarData.map(p => p.shop_id).filter(Boolean)));
        
        if (similarShopIds.length > 0) {
          const { data: similarShopsData } = await supabase
            .from('seller_shops')
            .select('*')
            .in('id', similarShopIds)
            .eq('is_active', true)
            .limit(4);
          
          if (similarShopsData) {
            setSimilarShops(similarShopsData);
          }
        }
      }
      
    } catch (error) {
      console.error('Error fetching product:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement du produit...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const handleAddToCart = () => {
    // Add to cart with the selected quantity
    for (let i = 0; i < quantity; i++) {
      addToCart(product.id);
    }
    
    // Show success message
    toast({
      title: "Produit ajouté au panier",
      description: `${quantity} ${quantity > 1 ? 'articles ajoutés' : 'article ajouté'} avec succès`,
    });
  };

  const handleOrder = () => {
    if (!user) {
      // Store current URL for redirect after login
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
      navigate('/auth');
      return;
    }
    // Open quick order dialog will be handled by the QuickOrderDialog component
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= (product.stock_quantity || 0)) {
      setQuantity(newQuantity);
    }
  };

  const handleToggleFavorite = () => {
    toggleFavorite(product.id);
  };

  const productImage = product.images?.[0] || "/placeholder.svg";
  const originalPrice = product.original_price || product.price;
  const salePrice = product.price;
  const discount = product.discount_percentage || 0;
  const rating = product.rating || 0;
  const reviewsCount = product.reviews_count || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/')}
                className="hover:bg-secondary"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-lg font-semibold text-foreground">
                Détails du produit
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image/Video */}
          <div className="space-y-4">
            <div className="relative">
              {showVideo && product.video_url ? (
                <div className="relative">
                  <video
                    controls
                    className="w-full h-96 lg:h-[500px] object-cover rounded-lg"
                    poster={productImage}
                  >
                    <source src={product.video_url} type="video/mp4" />
                    Votre navigateur ne supporte pas la lecture vidéo.
                  </video>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-3 right-3 bg-white/90"
                    onClick={() => setShowVideo(false)}
                  >
                    Voir l'image
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={productImage}
                    alt={product.title}
                    className="w-full h-96 lg:h-[500px] object-cover rounded-lg"
                  />
                  {product.video_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-3 right-3 bg-white/90 flex items-center gap-2"
                      onClick={() => setShowVideo(true)}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 5v10l7-5-7-5z"/>
                      </svg>
                      Voir la vidéo
                    </Button>
                  )}
                </div>
              )}
              
              {product.badge && (
                <Badge className="absolute top-3 left-3 bg-promo text-promo-foreground">
                  {product.badge}
                </Badge>
              )}
              {product.is_flash_sale && (
                <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground animate-pulse-promo">
                  ⚡ Flash Sale
                </Badge>
              )}
              {discount > 0 && (
                <Badge className="absolute bottom-3 left-3 bg-success text-success-foreground">
                  -{discount}%
                </Badge>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">
                {product.title}
              </h1>
              
              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {rating.toFixed(1)} ({reviewsCount} avis)
                </span>
              </div>

              {/* Price */}
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl lg:text-3xl font-bold text-primary">
                  {salePrice.toLocaleString()} FCFA
                </span>
                {originalPrice > salePrice && (
                  <span className="text-lg text-muted-foreground line-through">
                    {originalPrice.toLocaleString()} FCFA
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Category */}
              <div className="mb-6">
                <span className="text-sm text-muted-foreground">Catégorie: </span>
                <Badge variant="secondary">{product.category}</Badge>
              </div>

              {/* Stock */}
              <div className="mb-6">
                <span className="text-sm text-muted-foreground">
                  Stock disponible: {product.stock_quantity || 0} unités
                </span>
              </div>

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Quantité</label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= (product.stock_quantity || 0)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Personal Message */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Message personnalisé (optionnel)
                </label>
                <Textarea
                  placeholder="Ajoutez un message pour le vendeur..."
                  value={personalMessage}
                  onChange={(e) => setPersonalMessage(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Action Buttons - Desktop */}
              <div className="hidden lg:block space-y-4">
                {/* Primary Action - Add to Cart */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleAddToCart}
                    className="flex-1 h-12 text-base font-semibold"
                    disabled={!product.stock_quantity || product.stock_quantity === 0}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Ajouter au panier - {salePrice.toLocaleString()} FCFA
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleToggleFavorite}
                    className="h-12 px-4 hover:scale-105 transition-transform"
                  >
                    <Heart className={`w-5 h-5 ${isFavorite(product.id) ? 'fill-current text-red-500' : ''}`} />
                  </Button>
                </div>

                {/* Secondary Actions */}
                <div className="flex gap-3">
                  <QuickOrderDialog
                    productId={product.id}
                    productTitle={product.title}
                    productPrice={salePrice}
                    sellerId={product.seller_id}
                  />
                  <ContactSellerButton
                    productId={product.id}
                    sellerId={product.seller_id}
                    productTitle={product.title}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-50">
        <div className="space-y-3">
          {/* Quick Actions Row */}
          <div className="flex gap-2">
            <QuickOrderDialog
              productId={product.id}
              productTitle={product.title}
              productPrice={salePrice}
              sellerId={product.seller_id}
              iconOnly={true}
            />
            <ContactSellerButton
              productId={product.id}
              sellerId={product.seller_id}
              productTitle={product.title}
              iconOnly={true}
            />
            <Button
              variant="outline"
              onClick={handleToggleFavorite}
              className="px-4 hover:scale-105 transition-transform"
            >
              <Heart className={`w-5 h-5 ${isFavorite(product.id) ? 'fill-current text-red-500' : ''}`} />
            </Button>
          </div>
          
          {/* Primary Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            className="w-full h-12 text-base font-semibold shadow-lg"
            disabled={!product.stock_quantity || product.stock_quantity === 0}
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Ajouter au panier - {salePrice.toLocaleString()} FCFA
          </Button>
        </div>
      </div>

      {/* Mobile padding to prevent content being hidden behind action bar */}
      <div className="lg:hidden h-32"></div>

      {/* Shop Info Section */}
      {shop && (
        <section className="container mx-auto px-4 py-6 border-t">
          <div className="flex items-center gap-4 mb-6">
            {shop.logo_url ? (
              <img
                src={shop.logo_url}
                alt={shop.shop_name}
                className="w-16 h-16 rounded-full object-cover border-2 border-primary"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">🏪</span>
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-xl font-bold text-foreground">{shop.shop_name}</h3>
              {shop.shop_description && (
                <p className="text-sm text-muted-foreground">{shop.shop_description}</p>
              )}
            </div>
            <Button
              onClick={() => navigate(`/boutique/${shop.shop_slug}`)}
              className="bg-primary hover:bg-primary/90"
            >
              Voir la boutique
            </Button>
          </div>
        </section>
      )}

      {/* Products from the Same Shop */}
      {shopProducts.length > 0 && (
        <section className="container mx-auto px-4 py-6 border-t">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">Produits recommandés de cette boutique</h2>
            {shop && (
              <Button
                variant="outline"
                onClick={() => navigate(`/boutique/${shop.shop_slug}`)}
              >
                Voir tous
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {shopProducts.map((prod) => (
              <div
                key={prod.id}
                onClick={() => navigate(`/product/${prod.id}`)}
                className="cursor-pointer group"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg bg-muted mb-2">
                  <img
                    src={prod.images?.[0] || "/placeholder.svg"}
                    alt={prod.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  {prod.discount_percentage && prod.discount_percentage > 0 && (
                    <Badge className="absolute top-2 left-2 bg-promo text-promo-foreground">
                      -{prod.discount_percentage}%
                    </Badge>
                  )}
                </div>
                <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                  {prod.title}
                </h3>
                <p className="text-lg font-bold text-primary">
                  {prod.price.toLocaleString()} FCFA
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Similar Products from Other Shops */}
      {similarProducts.length > 0 && (
        <section className="container mx-auto px-4 py-6 border-t">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Produits similaires
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {similarProducts.map((prod) => (
              <div
                key={prod.id}
                onClick={() => navigate(`/product/${prod.id}`)}
                className="cursor-pointer group"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg bg-muted mb-2">
                  <img
                    src={prod.images?.[0] || "/placeholder.svg"}
                    alt={prod.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  {prod.discount_percentage && prod.discount_percentage > 0 && (
                    <Badge className="absolute top-2 left-2 bg-promo text-promo-foreground">
                      -{prod.discount_percentage}%
                    </Badge>
                  )}
                </div>
                <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                  {prod.title}
                </h3>
                <p className="text-lg font-bold text-primary">
                  {prod.price.toLocaleString()} FCFA
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Similar Shops */}
      {similarShops.length > 0 && (
        <section className="container mx-auto px-4 py-6 border-t">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Autres boutiques similaires
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {similarShops.map((similarShop) => (
              <div
                key={similarShop.id}
                onClick={() => navigate(`/boutique/${similarShop.shop_slug}`)}
                className="cursor-pointer group p-4 border rounded-lg hover:shadow-lg transition-all duration-300 bg-card"
              >
                <div className="flex flex-col items-center text-center gap-3">
                  {similarShop.logo_url ? (
                    <img
                      src={similarShop.logo_url}
                      alt={similarShop.shop_name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-primary/20 group-hover:border-primary transition-colors"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <span className="text-2xl">🏪</span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {similarShop.shop_name}
                    </h3>
                    {similarShop.shop_description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {similarShop.shop_description}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/boutique/${similarShop.shop_slug}`);
                    }}
                  >
                    Voir la boutique
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetail;