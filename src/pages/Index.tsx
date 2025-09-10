import { HeroSection } from "@/components/HeroSection";
import { ProductCard } from "@/components/ProductCard";
import { CategoryCard } from "@/components/CategoryCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Heart
} from "lucide-react";

// Import product images
import productPhone from "@/assets/product-phone.jpg";
import productClothing from "@/assets/product-clothing.jpg";
import productHeadphones from "@/assets/product-headphones.jpg";
import productBlender from "@/assets/product-blender.jpg";

const Index = () => {
  const categories = [
    { icon: Smartphone, title: "Téléphones", itemCount: 1250, bgColor: "gradient-primary" },
    { icon: Shirt, title: "Mode", itemCount: 890, bgColor: "bg-promo" },
    { icon: Headphones, title: "Audio", itemCount: 456, bgColor: "bg-success" },
    { icon: Home, title: "Maison", itemCount: 1100, bgColor: "gradient-accent" },
    { icon: Car, title: "Auto", itemCount: 234, bgColor: "bg-primary" },
    { icon: Gamepad2, title: "Gaming", itemCount: 567, bgColor: "bg-promo" },
  ];

  const products = [
    {
      image: productPhone,
      title: "Smartphone 5G Ultra - 128GB - Caméra 48MP",
      originalPrice: 85000,
      salePrice: 52000,
      discount: 39,
      rating: 4.8,
      reviews: 234,
      badge: "Vendeur fiable",
      isFlashSale: true,
    },
    {
      image: productClothing,
      title: "Robe Africaine Traditionnelle - Motifs Wax Premium",
      originalPrice: 25000,
      salePrice: 18000,
      discount: 28,
      rating: 4.9,
      reviews: 156,
      badge: "Top ventes",
    },
    {
      image: productHeadphones,
      title: "Casque Audio Sans Fil - Réduction de Bruit Active",
      originalPrice: 35000,
      salePrice: 21000,
      discount: 40,
      rating: 4.7,
      reviews: 89,
      isFlashSale: true,
    },
    {
      image: productBlender,
      title: "Blender Multifonction 1500W - 5 Vitesses",
      originalPrice: 45000,
      salePrice: 29000,
      discount: 36,
      rating: 4.6,
      reviews: 67,
      badge: "Nouveau",
    },
    {
      image: productPhone,
      title: "Tablette 10 pouces - WiFi + 4G - 64GB",
      originalPrice: 65000,
      salePrice: 42000,
      discount: 35,
      rating: 4.5,
      reviews: 123,
    },
    {
      image: productClothing,
      title: "Ensemble Bogolan Homme - Coton Premium",
      originalPrice: 35000,
      salePrice: 24000,
      discount: 31,
      rating: 4.8,
      reviews: 78,
      badge: "Vendeur fiable",
    },
  ];

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
              <Button variant="ghost" size="icon">
                <Heart className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="w-5 h-5" />
                <Badge className="absolute -top-1 -right-1 bg-promo text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  3
                </Badge>
              </Button>
              <Button variant="ghost" size="icon">
                <User className="w-5 h-5" />
              </Button>
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
            <Button variant="ghost" size="sm">
              Voir tout
            </Button>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {categories.map((category, index) => (
              <CategoryCard
                key={index}
                icon={category.icon}
                title={category.title}
                itemCount={category.itemCount}
                bgColor={category.bgColor}
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
            {products.slice(0, 6).map((product, index) => (
              <ProductCard key={index} {...product} />
            ))}
          </div>
        </section>

        {/* Recommended Products */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Recommandés pour vous</h2>
            <Button variant="outline" size="sm">
              Actualiser
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {products.map((product, index) => (
              <ProductCard key={`rec-${index}`} {...product} />
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