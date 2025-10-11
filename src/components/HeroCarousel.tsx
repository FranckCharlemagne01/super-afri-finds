import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import sneakersImg from "@/assets/product-sneakers.jpg";
import handbagImg from "@/assets/product-handbag.jpg";
import dressImg from "@/assets/product-dress.jpg";
import shirtImg from "@/assets/product-shirt.jpg";
import watchImg from "@/assets/product-watch.jpg";
import sunglassesImg from "@/assets/product-sunglasses.jpg";

interface BoostedProduct {
  id: string;
  title: string;
  price: number;
  original_price: number | null;
  discount_percentage: number | null;
  images: string[];
  description: string;
  seller_id: string;
}

export const HeroCarousel = () => {
  const [boostedProducts, setBoostedProducts] = useState<BoostedProduct[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBoostedProducts();
  }, []);

  useEffect(() => {
    if (boostedProducts.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % boostedProducts.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [boostedProducts.length]);

  const fetchBoostedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .eq("is_boosted", true)
        .gte("boosted_until", new Date().toISOString())
        .order("boosted_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setBoostedProducts(data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des produits vedettes:", error);
    } finally {
      setLoading(false);
    }
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + boostedProducts.length) % boostedProducts.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % boostedProducts.length);
  };

  if (loading) {
    return (
      <div className="relative w-full h-64 md:h-80 lg:h-96 rounded-xl bg-gradient-to-r from-amber-100/50 to-orange-100/50 animate-pulse mb-6" />
    );
  }

  if (boostedProducts.length === 0) {
    return null;
  }

  const currentProduct = boostedProducts[currentIndex];

  // Sample products for the banner with real images
  const sampleProducts = [
    { name: "CHAUSSURE", price: "17008 FCA", image: sneakersImg },
    { name: "SAC", price: "1500 FCA", image: handbagImg },
    { name: "ROBE", price: "20000 FCA", image: dressImg },
    { name: "CHEMISE", price: "12000 FCA", image: shirtImg },
    { name: "MONTRE", price: "25000 FCA", image: watchImg },
    { name: "LUNETTES", price: "8000 FCA", image: sunglassesImg }
  ];

  return (
    <div className="mb-6">
      {/* Main Hero Carousel */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] md:h-80 lg:h-96 rounded-xl overflow-hidden mb-3 group">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-red-500/10 z-10" />
        
        {/* Product image */}
        <img
          src={currentProduct.images[0] || "/placeholder.svg"}
          alt={currentProduct.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent z-20" />

        {/* Content */}
        <div className="absolute inset-0 z-30 flex items-center">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="max-w-xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-full mb-4 shadow-lg">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-bold">Produit Vedette</span>
              </div>

              {/* Title */}
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 line-clamp-2">
                {currentProduct.title}
              </h2>

              {/* Description */}
              <p className="text-white/90 text-sm md:text-base mb-4 line-clamp-2">
                {currentProduct.description}
              </p>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-3xl md:text-4xl font-bold text-amber-400">
                  {currentProduct.price.toLocaleString()} FCFA
                </span>
                {currentProduct.original_price && (
                  <div className="flex items-center gap-2">
                    <span className="text-lg text-white/60 line-through">
                      {currentProduct.original_price.toLocaleString()} FCFA
                    </span>
                    {currentProduct.discount_percentage && (
                      <span className="bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
                        -{currentProduct.discount_percentage}%
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* CTA Button */}
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold shadow-xl"
                onClick={() => navigate(`/product/${currentProduct.id}`)}
              >
                Découvrir maintenant
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-40 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 md:p-3 rounded-full transition-all md:opacity-0 md:group-hover:opacity-100 opacity-40"
          aria-label="Produit précédent"
        >
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-40 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 md:p-3 rounded-full transition-all md:opacity-0 md:group-hover:opacity-100 opacity-40"
          aria-label="Produit suivant"
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
        </button>

        {/* Dots indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex gap-2">
          {boostedProducts.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "bg-white w-8"
                  : "bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Aller au produit ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Buy & Resell Banner - Fine horizontal banner */}
      <div className="w-full bg-gradient-to-r from-orange-100 via-amber-50 to-yellow-100 rounded-lg shadow-sm border border-orange-200/30 overflow-hidden">
        <div className="flex flex-row items-center justify-between gap-3 px-3 md:px-4 py-2">
          {/* Left: Animated Text */}
          <div className="flex-shrink-0 z-10">
            <h3 className="text-sm md:text-base font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent animate-pulse-slow whitespace-nowrap">
              🛍️ Achetez & Revendez sur Djassa – Des milliers de produits à découvrir !
            </h3>
          </div>

          {/* Right: Mini Scrolling Product Cards */}
          <div className="relative flex-1 overflow-hidden max-w-md">
            <div className="flex items-center gap-2 animate-scroll-products">
              {/* Duplicate products for seamless infinite loop */}
              {[...sampleProducts, ...sampleProducts].map((product, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 bg-white rounded-md shadow-sm hover:shadow transition-all duration-300 overflow-hidden w-16 md:w-20 hover:scale-105 cursor-pointer border border-orange-100/50"
                >
                  {/* Mini Product Image */}
                  <div className="aspect-square bg-gray-50 p-1.5">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  
                  {/* Mini Info */}
                  <div className="px-1 py-1 bg-white">
                    <p className="text-[8px] md:text-[9px] font-semibold text-orange-600 text-center truncate mb-0.5">
                      {product.name}
                    </p>
                    <p className="text-[9px] md:text-[10px] font-bold text-gray-900 text-center bg-yellow-100 rounded px-0.5 py-0.5">
                      {product.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
