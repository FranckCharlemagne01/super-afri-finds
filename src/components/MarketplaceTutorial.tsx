import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { ChevronRight, ChevronLeft, X, ShoppingBag, Search, Heart, ShoppingCart, Truck, Sparkles, Store } from 'lucide-react';

// localStorage keys
const TUTORIAL_SHOWN_COUNT_KEY = 'tutorial_shown_count';
const TUTORIAL_LAST_SHOWN_KEY = 'tutorial_last_shown_at';
const TUTORIAL_COMPLETED_KEY = 'tutorial_completed';

const MAX_APPEARANCES = 4;
const COOLDOWN_MINUTES = 5;

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
    title: "Bienvenue sur Djassa",
    message: "La marketplace qui connecte acheteurs et vendeurs. Rejoignez une communauté dynamique et découvrez des opportunités uniques."
  },
  {
    id: 2,
    icon: <Search className="h-8 w-8 text-primary" />,
    title: "Trouvez l'exceptionnel",
    message: "Recherche intelligente, catégories claires. Accédez instantanément à des milliers de produits sélectionnés pour vous."
  },
  {
    id: 3,
    icon: <ShoppingCart className="h-8 w-8 text-success" />,
    title: "Achetez en toute sécurité",
    message: "Paiement sécurisé, transaction protégée. Commandez en quelques clics avec une confiance totale."
  },
  {
    id: 4,
    icon: <Store className="h-8 w-8 text-accent" />,
    title: "Lancez votre boutique",
    message: "Créez votre e-commerce en 2 minutes. 28 jours gratuits pour tester, zéro risque, potentiel illimité."
  },
  {
    id: 5,
    icon: <Truck className="h-8 w-8 text-promo" />,
    title: "Gérez tout, simplement",
    message: "Tableau de bord intuitif, suivi en temps réel. Gardez le contrôle de vos achats et ventes depuis n'importe où."
  }
];

interface ProductImage {
  url: string;
  id: string;
}

const shouldShowTutorial = (): boolean => {
  // Check if tutorial was fully completed
  const completed = localStorage.getItem(TUTORIAL_COMPLETED_KEY);
  if (completed === 'true') return false;

  // Check number of appearances
  const shownCount = parseInt(localStorage.getItem(TUTORIAL_SHOWN_COUNT_KEY) || '0', 10);
  if (shownCount >= MAX_APPEARANCES) return false;

  // Check cooldown (5 minutes minimum between appearances)
  const lastShown = localStorage.getItem(TUTORIAL_LAST_SHOWN_KEY);
  if (lastShown) {
    const lastShownTime = new Date(lastShown).getTime();
    const now = Date.now();
    const minutesSinceLastShown = (now - lastShownTime) / (1000 * 60);
    if (minutesSinceLastShown < COOLDOWN_MINUTES) return false;
  }

  return true;
};

const recordTutorialAppearance = () => {
  const currentCount = parseInt(localStorage.getItem(TUTORIAL_SHOWN_COUNT_KEY) || '0', 10);
  localStorage.setItem(TUTORIAL_SHOWN_COUNT_KEY, (currentCount + 1).toString());
  localStorage.setItem(TUTORIAL_LAST_SHOWN_KEY, new Date().toISOString());
};

const markTutorialCompleted = () => {
  localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
};

export const MarketplaceTutorial = () => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    if (shouldShowTutorial()) {
      setShowTutorial(true);
      recordTutorialAppearance();
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
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleClose = () => {
    // User clicked X - just close, don't mark as completed (will show again up to 4 times)
    setShowTutorial(false);
  };

  const handleComplete = () => {
    // User finished tutorial - mark as completed permanently
    markTutorialCompleted();
    setShowTutorial(false);
  };

  if (isLoading || !showTutorial) return null;

  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;
  const isFirstStep = currentStep === 0;

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 80 : -80,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 80 : -80,
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
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Backdrop with blurred products */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-background/70 backdrop-blur-sm z-10" />
            
            {/* Product images grid */}
            <div className="absolute inset-0 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 p-2 opacity-70">
              {productImages.map((img, index) => (
                <motion.div
                  key={`${img.id}-${index}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.02, duration: 0.3 }}
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

            {/* Animated background accents */}
            <motion.div
              animate={{ 
                y: [0, -20, 0],
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[8%] left-[8%] w-24 h-24 bg-primary/20 rounded-full blur-3xl z-5"
            />
            <motion.div
              animate={{ 
                y: [0, 20, 0],
                opacity: [0.15, 0.35, 0.15]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-[12%] right-[8%] w-32 h-32 bg-accent/20 rounded-full blur-3xl z-5"
            />
          </div>

          {/* Tutorial card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-20 w-full max-w-[340px] sm:max-w-md mx-auto"
          >
            <div className="bg-card/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/40 overflow-hidden">
              {/* Close button - X icon top right */}
              <motion.button
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                onClick={handleClose}
                className="absolute top-3 right-3 z-30 w-9 h-9 flex items-center justify-center rounded-full bg-muted/90 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all duration-200 active:scale-95"
                aria-label="Fermer le tutoriel"
              >
                <X className="w-5 h-5" />
              </motion.button>

              {/* Header */}
              <div className="px-5 pt-5 pb-3 text-center border-b border-border/20">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.15, type: "spring" }}
                  className="inline-flex items-center gap-2 mb-1"
                >
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-lg shadow-primary/30">
                    <ShoppingBag className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-primary to-promo bg-clip-text text-transparent">
                    DJASSA
                  </span>
                </motion.div>
                <p className="text-xs text-muted-foreground">Achetez. Vendez. Prospérez.</p>
              </div>

              {/* Step content */}
              <div className="p-5 sm:p-6 overflow-hidden min-h-[220px] flex flex-col justify-center">
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
                      stiffness: 350,
                      damping: 30,
                    }}
                    className="text-center"
                  >
                    {/* Icon */}
                    <motion.div
                      initial={{ scale: 0, rotate: -15 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
                      className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 mb-4 shadow-inner"
                    >
                      {step.icon}
                    </motion.div>

                    {/* Title */}
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                      {step.title}
                    </h2>

                    {/* Message */}
                    <p className="text-sm text-muted-foreground leading-relaxed px-2">
                      {step.message}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Progress dots */}
              <div className="flex items-center justify-center gap-2 pb-4">
                {tutorialSteps.map((_, index) => (
                  <motion.div
                    key={index}
                    initial={false}
                    animate={{
                      scale: index === currentStep ? 1.2 : 1,
                      width: index === currentStep ? 24 : 8,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className={`h-2 rounded-full transition-colors duration-300 ${
                      index === currentStep 
                        ? 'bg-primary' 
                        : index < currentStep 
                          ? 'bg-primary/50' 
                          : 'bg-muted-foreground/30'
                    }`}
                    style={{ width: index === currentStep ? 24 : 8 }}
                  />
                ))}
              </div>

              {/* Navigation buttons */}
              <div className="px-5 pb-5">
                <div className="flex items-center gap-3">
                  {/* Back button */}
                  <AnimatePresence>
                    {!isFirstStep && (
                      <motion.div
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="flex-1"
                      >
                        <Button
                          variant="outline"
                          onClick={handlePrevious}
                          className="w-full h-12 text-sm font-medium border-border/50 hover:bg-muted/50 rounded-xl"
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" />
                          Retour
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Next/Complete button */}
                  <motion.div 
                    className={isFirstStep ? "w-full" : "flex-1"}
                    layout
                  >
                    <Button
                      onClick={handleNext}
                      className="w-full h-12 bg-gradient-to-r from-primary to-primary-hover hover:opacity-90 shadow-lg shadow-primary/30 font-semibold text-sm rounded-xl transition-all active:scale-[0.98]"
                    >
                      {isLastStep ? (
                        <>
                          C'est parti !
                          <Sparkles className="w-4 h-4 ml-2" />
                        </>
                      ) : (
                        <>
                          Suivant
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                </div>
              </div>

              {/* Step counter */}
              <div className="pb-4 text-center">
                <span className="text-xs text-muted-foreground">
                  {currentStep + 1} / {tutorialSteps.length}
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
