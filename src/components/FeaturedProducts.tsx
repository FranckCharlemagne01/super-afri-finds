import { ProductCard } from "@/components/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight } from "lucide-react";

// Sample featured products data
const featuredProducts = [
  {
    id: "featured-1",
    title: "Smartphone Samsung Galaxy A54",
    description: "Écran Super AMOLED 6.4', Triple caméra 50MP, 128GB",
    price: 295000,
    originalPrice: 350000,
    discountPercentage: 16,
    category: "Téléphones",
    images: ["/placeholder.svg"],
    rating: 4.5,
    reviewsCount: 128,
    badge: "Top Vente",
    isFlashSale: true,
  },
  {
    id: "featured-2", 
    title: "Robe Élégante Africaine",
    description: "Tissu Wax authentique, coupe moderne, tailles disponibles",
    price: 35000,
    originalPrice: 45000,
    discountPercentage: 22,
    category: "Mode",
    images: ["/placeholder.svg"],
    rating: 4.8,
    reviewsCount: 89,
    badge: "Nouveau",
  },
  {
    id: "featured-3",
    title: "Casque Bluetooth Premium",
    description: "Réduction de bruit active, autonomie 30h, haute qualité",
    price: 85000,
    originalPrice: 120000,
    discountPercentage: 29,
    category: "Électronique",
    images: ["/placeholder.svg"],
    rating: 4.6,
    reviewsCount: 156,
    badge: "Promo",
    isFlashSale: true,
  },
  {
    id: "featured-4",
    title: "Set de Cuisine Moderne",
    description: "Ustensiles complets, acier inoxydable, design élégant",
    price: 55000,
    originalPrice: 75000,
    discountPercentage: 27,
    category: "Maison",
    images: ["/placeholder.svg"],
    rating: 4.4,
    reviewsCount: 72,
    badge: "Qualité+",
  },
];

export const FeaturedProducts = () => {
  return (
    <section className="py-12 bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-primary animate-pulse-promo" />
            <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-text-primary bg-clip-text text-transparent">
              Produits Phares
            </h2>
            <Sparkles className="w-8 h-8 text-primary animate-pulse-promo" />
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Découvrez notre sélection de produits tendance : mode, électronique, maison et bien plus !
          </p>
          <Badge variant="secondary" className="mt-4 px-4 py-2 text-sm font-semibold">
            ✨ Tout ce que vous recherchez sur Djassa
          </Badge>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {featuredProducts.map((product) => (
            <div key={product.id} className="hover-lift">
              <ProductCard
                id={product.id}
                title={product.title}
                image={product.images[0]}
                originalPrice={product.originalPrice}
                salePrice={product.price}
                discount={product.discountPercentage}
                rating={product.rating}
                reviews={product.reviewsCount}
                badge={product.badge}
                isFlashSale={product.isFlashSale}
              />
            </div>
          ))}
        </div>

        {/* Call to action */}
        <div className="text-center">
          <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-full font-bold text-lg hover-lift transition-all duration-300 shadow-vibrant">
            <span>Voir tous les produits</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
};