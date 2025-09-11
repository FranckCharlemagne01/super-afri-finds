import { products } from "@/data/products";
import { HeroSection } from "@/components/HeroSection";
import { ProductCard } from "@/components/ProductCard";
import { CategoryCard } from "@/components/CategoryCard";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import { 
  Smartphone, 
  Shirt, 
  Headphones, 
  Home, 
  Car, 
  Gamepad2,
  Search,
  ShoppingCart,
  Menu,
  User,
  Heart,
  Tv,
  Sparkles,
  ShoppingBag
} from "lucide-react";

// Import product images
import productPhone from "@/assets/product-phone.jpg";
import productClothing from "@/assets/product-clothing.jpg";
import productHeadphones from "@/assets/product-headphones.jpg";
import productBlender from "@/assets/product-blender.jpg";

// Import category images
import categoryPhones from "@/assets/category-phones.jpg";
import categoryElectronics from "@/assets/category-electronics.jpg";
import categoryFashion from "@/assets/category-fashion.jpg";
import categoryHome from "@/assets/category-home.jpg";
import categoryBeauty from "@/assets/category-beauty.jpg";
import categoryGrocery from "@/assets/category-grocery.jpg";
import categoryAuto from "@/assets/category-auto.jpg";

const Index = () => {
  const { user, signOut } = useAuth();
  const { cartCount } = useCart();
  const { favoriteIds } = useFavorites();
  const { isSuperAdmin } = useUserRole();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleProfileClick = () => {
    if (user) {
      navigate('/seller');
    } else {
      navigate('/auth');
    }
  };

  const handleCartClick = () => {
    navigate('/cart');
  };

  const handleFavoritesClick = () => {
    navigate('/favorites');
  };

  const handleViewAllCategories = () => {
    // Pour l'instant, on peut faire défiler vers les produits ou naviguer vers une page de catégories
    console.log('Navigation vers toutes les catégories');
    // navigate('/categories'); // À implémenter plus tard
  };

  const handleRefreshRecommendations = () => {
    setRefreshKey(prev => prev + 1);
    console.log('Recommandations actualisées');
  };
  const categories = [
    { title: "Téléphones & Tablettes", itemCount: 1250, image: categoryPhones },
    { title: "Électroménager / TV & Audio", itemCount: 890, image: categoryElectronics },
    { title: "Mode", itemCount: 1450, image: categoryFashion },
    { title: "Maison & Décoration", itemCount: 1100, image: categoryHome },
    { title: "Beauté & Soins personnels", itemCount: 675, image: categoryBeauty },
    { title: "Épicerie & Produits alimentaires", itemCount: 820, image: categoryGrocery },
    { title: "Auto & Accessoires", itemCount: 340, image: categoryAuto },
  ];
  
  // Use the real products from data file with correct UUIDs
  // Mélanger les produits pour les recommandations avec refreshKey
  const shuffleArray = (array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const displayProducts = products;
  const shuffledProducts = refreshKey > 0 ? shuffleArray(products) : products;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-lg border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="w-5 h-5" />
              </Button>
              <h1 className="text-xl md:text-2xl font-bold gradient-text-primary">
                Djassa
              </h1>
              <Badge className="gradient-accent text-xs px-2 py-1 hidden sm:inline-flex">
                Côte d'Ivoire
              </Badge>
            </div>
            
            <div className="flex-1 max-w-md mx-4 hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher des produits..."
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative" onClick={handleFavoritesClick}>
                <Heart className={`w-5 h-5 ${favoriteIds.length > 0 ? 'fill-current text-promo' : ''}`} />
                {favoriteIds.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 bg-promo text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {favoriteIds.length}
                  </Badge>
                )}
              </Button>
              <Button variant="ghost" size="icon" className="relative" onClick={handleCartClick}>
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 bg-promo text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {cartCount}
                  </Badge>
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={handleProfileClick}>
                <User className={`w-5 h-5 ${user ? 'text-primary' : ''}`} />
              </Button>
              {isSuperAdmin && (
                <Button variant="ghost" size="sm" onClick={() => navigate('/superadmin')}>
                  Admin
                </Button>
              )}
              {user && (
                <Button variant="ghost" size="sm" onClick={signOut}>
                  Déconnexion
                </Button>
              )}
            </div>
          </div>
          
          {/* Mobile search */}
          <div className="mt-3 md:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Hero Section */}
        <HeroSection />

        {/* Categories */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Catégories populaires</h2>
            <Button variant="ghost" size="sm" onClick={handleViewAllCategories}>
              Voir tout
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {categories.map((category, index) => (
              <CategoryCard
                key={index}
                title={category.title}
                itemCount={category.itemCount}
                image={category.image}
                onClick={() => console.log(`Catégorie ${category.title} sélectionnée`)}
              />
            ))}
          </div>
        </section>

        {/* Flash Sales */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center">
                <span className="text-white text-lg">⚡</span>
              </div>
              <h2 className="text-xl font-bold text-foreground">Ventes Flash</h2>
            </div>
            <Badge className="bg-promo text-promo-foreground animate-pulse-promo">
              Limitées dans le temps
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {displayProducts.slice(0, 6).map((product) => (
              <ProductCard key={product.id} {...product} videoUrl={product.videoUrl} />
            ))}
          </div>
        </section>

        {/* Recommended Products */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Recommandés pour vous</h2>
            <Button variant="outline" size="sm" onClick={handleRefreshRecommendations}>
              Actualiser
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4" key={refreshKey}>
            {shuffledProducts.map((product) => (
              <ProductCard key={`${product.id}-${refreshKey}`} {...product} videoUrl={product.videoUrl} />
            ))}
          </div>
        </section>

        {/* Promotional Banner */}
        <section className="mb-8">
          <div className="gradient-accent rounded-2xl p-6 text-center">
            <h3 className="text-2xl font-bold text-foreground mb-2">
              🎁 Parrainez vos amis et gagnez !
            </h3>
            <p className="text-muted-foreground mb-4">
              Recevez 5,000 FCFA pour chaque ami qui passe sa première commande
            </p>
            <Button variant="default" size="lg">
              Commencer à parrainer
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-secondary mt-12 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div>
              <h4 className="font-semibold mb-2">Service Client</h4>
              <p className="text-sm text-muted-foreground">Support 24/7</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Livraison</h4>
              <p className="text-sm text-muted-foreground">2-5 jours en CI</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Paiement</h4>
              <p className="text-sm text-muted-foreground">Mobile Money, CB</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Garantie</h4>
              <p className="text-sm text-muted-foreground">Satisfait ou remboursé</p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            © 2024 Djassa - Votre marketplace de confiance en Côte d'Ivoire
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;