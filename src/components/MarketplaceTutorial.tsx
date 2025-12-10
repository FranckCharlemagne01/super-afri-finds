import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { ChevronRight, ChevronLeft, X, ShoppingBag, Search, Heart, ShoppingCart, Truck, Sparkles } from 'lucide-react';

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
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

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
      setDirection(1);
      setCurrentStep(prev => prev + 1);
    } else {
      completeTutorial();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleClose = () => {
    completeTutorial();
  };

  const completeTutorial = () => {
    localStorage.setItem(TUTORIAL_KEY, 'true');
    setShowTutorial(false);
  };

  if (isLoading || !showTutorial) return null;

  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;
  const isFirstStep = currentStep === 0;

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  return (
    <AnimatePresence>
      {showTutorial && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4"
        >
          {/* Semi-transparent backdrop - products visible behind */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Light overlay to keep products visible */}
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-10" />
            
            {/* Product images grid - more visible */}
            <div className="absolute inset-0 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3 p-2 sm:p-3 opacity-80">
              {productImages.map((img, index) => (
                <motion.div
                  key={`${img.id}-${index}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03, duration: 0.4 }}
                  className="aspect-square rounded-lg sm:rounded-xl overflow-hidden shadow-md"
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
              className="absolute top-[10%] left-[5%] w-20 sm:w-24 h-20 sm:h-24 bg-primary/30 rounded-full blur-3xl z-5"
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
              className="absolute bottom-[15%] right-[10%] w-24 sm:w-32 h-24 sm:h-32 bg-accent/25 rounded-full blur-3xl z-5"
            />
          </div>

          {/* Tutorial card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-20 w-full max-w-sm sm:max-w-md mx-2"
          >
            <div className="bg-card/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-border/50 overflow-hidden">
              {/* Close button in top-right corner */}
              <motion.button
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                onClick={handleClose}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110"
                aria-label="Fermer le tutoriel"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>

              {/* Header with logo */}
              <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 text-center border-b border-border/30">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="inline-flex items-center gap-2 mb-1 sm:mb-2"
                >
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-lg shadow-primary/25">
                    <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
                  </div>
                  <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-promo bg-clip-text text-transparent">
                    DJASSA
                  </span>
                </motion.div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Votre marketplace ivoirienne</p>
              </div>

              {/* Step content with slide animation */}
              <div className="p-4 sm:p-6 md:p-8 overflow-hidden">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={currentStep}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ 
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                      duration: 0.3
                    }}
                    className="text-center"
                  >
                    {/* Icon */}
                    <motion.div
                      initial={{ scale: 0, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
                      className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 mb-3 sm:mb-4"
                    >
                      {step.icon}
                    </motion.div>

                    {/* Title */}
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-2 sm:mb-3 px-2">
                      {step.title}
                    </h2>

                    {/* Message */}
                    <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed px-2">
                      {step.message}
                    </p>
                  </motion.div>
                </AnimatePresence>

                {/* Progress dots */}
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-4 sm:mt-6 mb-4 sm:mb-6">
                  {tutorialSteps.map((_, index) => (
                    <motion.div
                      key={index}
                      initial={false}
                      animate={{
                        scale: index === currentStep ? 1.3 : 1,
                        width: index === currentStep ? 20 : 8,
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className={`h-2 rounded-full transition-colors duration-300 ${
                        index === currentStep 
                          ? 'bg-primary' 
                          : index < currentStep 
                            ? 'bg-primary/50' 
                            : 'bg-muted'
                      }`}
                      style={{ width: index === currentStep ? 20 : 8 }}
                    />
                  ))}
                </div>

                {/* Navigation buttons */}
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Back button - only show if not first step */}
                  {!isFirstStep && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex-1"
                    >
                      <Button
                        variant="outline"
                        onClick={handlePrevious}
                        className="w-full h-11 sm:h-12 text-sm font-medium border-border/50 hover:bg-muted/50"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1 sm:mr-2" />
                        Retour
                      </Button>
                    </motion.div>
                  )}
                  
                  {/* Next/Start button */}
                  <motion.div 
                    className={isFirstStep ? "w-full" : "flex-1"}
                    layout
                  >
                    <Button
                      onClick={handleNext}
                      className="w-full h-11 sm:h-12 bg-gradient-to-r from-primary to-primary-hover hover:opacity-90 shadow-lg shadow-primary/25 font-semibold text-sm"
                    >
                      {isLastStep ? (
                        <>
                          Commencer
                          <Sparkles className="w-4 h-4 ml-1 sm:ml-2" />
                        </>
                      ) : (
                        <>
                          Suivant
                          <ChevronRight className="w-4 h-4 ml-1 sm:ml-2" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                </div>
              </div>

              {/* Step counter */}
              <div className="px-4 sm:px-6 pb-3 sm:pb-4 text-center">
                <span className="text-[10px] sm:text-xs text-muted-foreground">
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
