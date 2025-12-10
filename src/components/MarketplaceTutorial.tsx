import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { ChevronRight, X, ShoppingBag, Search, Heart, ShoppingCart, Truck, Sparkles } from 'lucide-react';

const TUTORIAL_KEY = 'djassa_tutorial_completed';

interface TutorialStep {
  id: number;
  icon: React.ReactNode;
  title: string;
  message: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 1,
    icon: <Sparkles className="h-8 w-8 text-primary" />,
    title: "Bienvenue sur Djassa Market !",
    message: "Découvrez les meilleurs produits près de chez vous. Une marketplace 100% ivoirienne."
  },
  {
    id: 2,
    icon: <Search className="h-8 w-8 text-primary" />,
    title: "Recherche facile",
    message: "Utilisez la barre de recherche pour trouver un produit rapidement parmi des milliers d'articles."
  },
  {
    id: 3,
    icon: <Heart className="h-8 w-8 text-promo" />,
    title: "Vos favoris",
    message: "Ajoutez vos articles favoris en un clic pour les retrouver facilement plus tard."
  },
  {
    id: 4,
    icon: <ShoppingCart className="h-8 w-8 text-success" />,
    title: "Panier simple",
    message: "Ajoutez des produits au panier et passez votre commande en quelques clics."
  },
  {
    id: 5,
    icon: <Truck className="h-8 w-8 text-accent" />,
    title: "Suivi en temps réel",
    message: "Passez votre commande facilement et suivez-la en temps réel jusqu'à la livraison."
  }
];

interface ProductImage {
  url: string;
  id: string;
}

export const MarketplaceTutorial = () => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const tutorialCompleted = localStorage.getItem(TUTORIAL_KEY);
    if (!tutorialCompleted) {
      setShowTutorial(true);
      fetchProductImages();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchProductImages = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, images')
        .eq('is_active', true)
        .not('images', 'is', null)
        .limit(20);

      if (error) {
        console.error('Error fetching product images:', error);
        setIsLoading(false);
        return;
      }

      const images: ProductImage[] = [];
      data?.forEach(product => {
        if (product.images && Array.isArray(product.images)) {
          product.images.forEach((img: string) => {
            if (img && img.startsWith('http')) {
              images.push({ url: img, id: product.id });
            }
          });
        }
      });

      setProductImages(images.slice(0, 15));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTutorial();
    }
  };

  const handleSkip = () => {
    completeTutorial();
  };

  const completeTutorial = () => {
    localStorage.setItem(TUTORIAL_KEY, 'true');
    setShowTutorial(false);
  };

  if (isLoading || !showTutorial) return null;

  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;

  return (
    <AnimatePresence>
      {showTutorial && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Semi-transparent backdrop - products visible behind */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Light overlay to keep products visible */}
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-10" />
            
            {/* Product images grid - more visible */}
            <div className="absolute inset-0 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 p-3 opacity-80">
              {productImages.map((img, index) => (
                <motion.div
                  key={`${img.id}-${index}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03, duration: 0.4 }}
                  className="aspect-square rounded-xl overflow-hidden shadow-md"
                >
                  <img
                    src={img.url}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </motion.div>
              ))}
            </div>

            {/* Subtle animated accents */}
            <motion.div
              animate={{ 
                y: [0, -15, 0],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ 
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-[10%] left-[5%] w-24 h-24 bg-primary/30 rounded-full blur-3xl z-5"
            />
            <motion.div
              animate={{ 
                y: [0, 15, 0],
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{ 
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute bottom-[15%] right-[10%] w-32 h-32 bg-accent/25 rounded-full blur-3xl z-5"
            />
          </div>

          {/* Tutorial card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-20 w-full max-w-md"
          >
            <div className="bg-card/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/50 overflow-hidden">
              {/* Header with logo */}
              <div className="px-6 pt-6 pb-4 text-center border-b border-border/30">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="inline-flex items-center gap-2 mb-2"
                >
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-lg shadow-primary/25">
                    <ShoppingBag className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-primary to-promo bg-clip-text text-transparent">
                    DJASSA
                  </span>
                </motion.div>
                <p className="text-xs text-muted-foreground">Votre marketplace ivoirienne</p>
              </div>

              {/* Step content */}
              <div className="p-6 sm:p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="text-center"
                  >
                    {/* Icon */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, type: "spring" }}
                      className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 mb-4"
                    >
                      {step.icon}
                    </motion.div>

                    {/* Title */}
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3">
                      {step.title}
                    </h2>

                    {/* Message */}
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {step.message}
                    </p>
                  </motion.div>
                </AnimatePresence>

                {/* Progress dots */}
                <div className="flex items-center justify-center gap-2 mt-6 mb-6">
                  {tutorialSteps.map((_, index) => (
                    <motion.div
                      key={index}
                      initial={false}
                      animate={{
                        scale: index === currentStep ? 1.2 : 1,
                        backgroundColor: index === currentStep 
                          ? 'hsl(var(--primary))' 
                          : index < currentStep 
                            ? 'hsl(var(--primary) / 0.5)' 
                            : 'hsl(var(--muted))'
                      }}
                      className="w-2 h-2 rounded-full transition-colors"
                    />
                  ))}
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    className="flex-1 h-12 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Quitter
                  </Button>
                  <Button
                    onClick={handleNext}
                    className="flex-1 h-12 bg-gradient-to-r from-primary to-primary-hover hover:opacity-90 shadow-lg shadow-primary/25 font-semibold"
                  >
                    {isLastStep ? (
                      <>
                        Commencer
                        <Sparkles className="w-4 h-4 ml-2" />
                      </>
                    ) : (
                      <>
                        Suivant
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Step counter */}
              <div className="px-6 pb-4 text-center">
                <span className="text-xs text-muted-foreground">
                  Étape {currentStep + 1} sur {tutorialSteps.length}
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
