import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Store, User, Package, Zap, CheckCircle2, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DemoStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  duration: number;
  gradient: string;
}

const demoSteps: DemoStep[] = [
  {
    id: 1,
    title: "Bienvenue sur Djassa",
    description: "La marketplace #1 en Côte d'Ivoire pour créer ta boutique en ligne facilement.",
    icon: <Store className="w-7 h-7 sm:w-8 sm:h-8" />,
    duration: 8,
    gradient: "from-primary to-primary-hover"
  },
  {
    id: 2,
    title: "Inscription 100% Gratuite",
    description: "Crée ton compte en quelques secondes. Aucun frais caché, aucune carte bancaire requise.",
    icon: <User className="w-7 h-7 sm:w-8 sm:h-8" />,
    duration: 10,
    gradient: "from-success to-success/80"
  },
  {
    id: 3,
    title: "Ta Boutique, Prête Instantanément",
    description: "Dès ton inscription, ta boutique professionnelle est créée automatiquement.",
    icon: <Zap className="w-7 h-7 sm:w-8 sm:h-8" />,
    duration: 12,
    gradient: "from-accent to-accent/80"
  },
  {
    id: 4,
    title: "Gère Tout en Ligne",
    description: "Depuis ton téléphone ou ordinateur, gère tes produits, commandes et clients facilement.",
    icon: <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" />,
    duration: 10,
    gradient: "from-promo to-promo/80"
  },
  {
    id: 5,
    title: "Publie et Vends",
    description: "Ajoute tes produits, fixe tes prix et commence à vendre immédiatement.",
    icon: <Package className="w-7 h-7 sm:w-8 sm:h-8" />,
    duration: 10,
    gradient: "from-primary to-success"
  },
  {
    id: 6,
    title: "Lance-toi Maintenant !",
    description: "Crée ton compte → Ta boutique est prête → Publie tes produits → Vends !",
    icon: <Sparkles className="w-7 h-7 sm:w-8 sm:h-8" />,
    duration: 10,
    gradient: "from-primary via-promo to-accent"
  }
];

interface EmbeddedDemoProps {
  onSignup?: () => void;
  autoPlay?: boolean;
}

export const EmbeddedDemo = ({ onSignup, autoPlay = true }: EmbeddedDemoProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  const totalDuration = useMemo(() => 
    demoSteps.reduce((acc, step) => acc + step.duration, 0), 
  []);

  // Auto-play with intro animation
  useEffect(() => {
    if (autoPlay && !hasStarted) {
      // Show intro for 2.5 seconds, then start demo
      const introTimer = setTimeout(() => {
        setShowIntro(false);
      }, 2500);
      
      const startTimer = setTimeout(() => {
        setHasStarted(true);
        setIsPlaying(true);
      }, 3000);
      
      return () => {
        clearTimeout(introTimer);
        clearTimeout(startTimer);
      };
    }
  }, [autoPlay, hasStarted]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 0.1;
        
        let accumulatedTime = 0;
        for (let i = 0; i < demoSteps.length; i++) {
          accumulatedTime += demoSteps[i].duration;
          if (newProgress < accumulatedTime) {
            if (currentStep !== i) {
              setCurrentStep(i);
            }
            break;
          }
        }

        if (newProgress >= totalDuration) {
          setIsPlaying(false);
          return totalDuration;
        }
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, currentStep, totalDuration]);

  const handlePlay = useCallback(() => {
    if (!hasStarted) setHasStarted(true);
    setIsPlaying(true);
  }, [hasStarted]);

  const handlePause = useCallback(() => setIsPlaying(false), []);

  const handleRestart = useCallback(() => {
    setProgress(0);
    setCurrentStep(0);
    setIsPlaying(true);
  }, []);

  const currentStepData = demoSteps[currentStep];
  const progressPercentage = (progress / totalDuration) * 100;
  const isFinished = progress >= totalDuration;

  return (
    <div className="w-full">
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl border border-border/50 bg-gradient-to-br from-card via-card to-muted/30 shadow-2xl shadow-primary/10">
        {/* Animated Background Patterns */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 30, repeat: Infinity, ease: "linear" },
              scale: { duration: 10, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-transparent rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ 
              rotate: [360, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              rotate: { duration: 25, repeat: Infinity, ease: "linear" },
              scale: { duration: 8, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-accent/10 via-transparent to-transparent rounded-full blur-3xl"
          />
        </div>

        {/* Content Container */}
        <div className="relative min-h-[320px] sm:min-h-[360px] md:min-h-[400px] lg:min-h-[440px] flex flex-col">
          
          {/* Main Content Area */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-5 md:p-6 lg:p-8">
            
            {/* Intro Animation */}
            {showIntro && !hasStarted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.1, y: -20 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="text-center max-w-2xl px-4"
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.05, 1],
                    rotate: [0, 2, -2, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="inline-block mb-4 sm:mb-6"
                >
                  <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-primary mx-auto" />
                </motion.div>
                
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4"
                >
                  <span className="bg-gradient-to-r from-primary via-promo to-accent bg-clip-text text-transparent">
                    Découvre Djassa
                  </span>
                </motion.h2>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="text-lg sm:text-xl md:text-2xl text-muted-foreground font-medium"
                >
                  en 60 secondes
                </motion.p>
                
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.8, duration: 1.5, ease: "easeInOut" }}
                  className="h-1 bg-gradient-to-r from-primary via-promo to-accent rounded-full mx-auto mt-6 max-w-xs"
                />
              </motion.div>
            )}
            
            {/* Start Screen (manual start option) */}
            {!showIntro && !hasStarted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center max-w-lg px-3 sm:px-4"
              >
                {/* Animated Play Button */}
                <motion.button
                  onClick={handlePlay}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-primary to-primary-hover shadow-2xl shadow-primary/40 mb-4 sm:mb-5 md:mb-6 group cursor-pointer"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-primary/30 blur-xl"
                  />
                  <Play className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-primary-foreground ml-0.5 sm:ml-1 relative z-10 group-hover:scale-110 transition-transform" />
                </motion.button>
                
                <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-2 sm:mb-3">
                  Découvre Djassa en{' '}
                  <span className="bg-gradient-to-r from-primary to-promo bg-clip-text text-transparent">60 secondes</span>
                </h3>
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground mb-4 sm:mb-5 md:mb-6">
                  Vois comment créer ta boutique en ligne facilement
                </p>
                
                <Button 
                  onClick={handlePlay} 
                  size="lg" 
                  className="h-11 sm:h-12 md:h-14 px-5 sm:px-6 md:px-8 text-sm sm:text-base rounded-full shadow-lg bg-gradient-to-r from-primary to-primary-hover hover:opacity-90 group w-full sm:w-auto"
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                  Lancer la démo
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5 sm:ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            )}

            {/* Playing Content */}
            {hasStarted && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 60, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -60, scale: 0.95 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="text-center max-w-xl w-full px-3 sm:px-4"
                >
                  {/* Step Icon with Gradient */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
                    className="mb-3 sm:mb-4 md:mb-5"
                  >
                    <div className={`inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br ${currentStepData?.gradient} shadow-xl shadow-primary/25`}>
                      <div className="text-primary-foreground">
                        {currentStepData?.icon}
                      </div>
                    </div>
                  </motion.div>

                  {/* Step Indicator Pills */}
                  <div className="flex justify-center gap-1 sm:gap-1.5 md:gap-2 mb-3 sm:mb-4">
                    {demoSteps.map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0.8 }}
                        animate={{ 
                          scale: i === currentStep ? 1.2 : 1,
                          backgroundColor: i === currentStep ? 'hsl(var(--primary))' : i < currentStep ? 'hsl(var(--primary) / 0.5)' : 'hsl(var(--muted))'
                        }}
                        className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                          i === currentStep ? 'w-5 sm:w-6 md:w-8' : 'w-1.5 sm:w-2'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Step Counter */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="mb-2 sm:mb-3"
                  >
                    <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-primary/10 text-primary text-[10px] sm:text-xs md:text-sm font-semibold">
                      Étape {currentStep + 1} sur {demoSteps.length}
                    </span>
                  </motion.div>

                  {/* Title */}
                  <motion.h3
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-foreground mb-2 sm:mb-3"
                  >
                    {currentStepData?.title}
                  </motion.h3>

                  {/* Description */}
                  <motion.p
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground leading-relaxed"
                  >
                    {currentStepData?.description}
                  </motion.p>

                  {/* Final CTA */}
                  {isFinished && onSignup && (
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.3, type: "spring" }}
                      className="mt-4 sm:mt-5 md:mt-6"
                    >
                      <Button 
                        onClick={onSignup}
                        size="lg"
                        className="h-11 sm:h-12 md:h-14 px-5 sm:px-6 md:px-8 text-sm sm:text-base rounded-full shadow-xl bg-gradient-to-r from-primary to-primary-hover hover:opacity-90 group w-full sm:w-auto"
                      >
                        Créer ma boutique maintenant
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1.5 sm:ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* Progress Bar & Controls */}
          {hasStarted && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative z-10 border-t border-border/30 bg-background/60 backdrop-blur-xl p-3 sm:p-4 md:p-5"
            >
              {/* Progress Bar (no timer display) */}
              <div className="mb-3 sm:mb-4">
                <div className="h-1.5 sm:h-2 md:h-2.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary via-primary-hover to-promo rounded-full"
                    style={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="flex justify-center gap-2 sm:gap-3">
                {isPlaying ? (
                  <Button 
                    onClick={handlePause} 
                    variant="outline" 
                    size="sm"
                    className="h-9 sm:h-10 px-3 sm:px-4 md:px-5 rounded-full text-xs sm:text-sm font-medium border-2"
                  >
                    <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    <span className="hidden xs:inline">Pause</span>
                  </Button>
                ) : (
                  <Button 
                    onClick={isFinished ? handleRestart : handlePlay} 
                    size="sm"
                    className="h-9 sm:h-10 px-3 sm:px-4 md:px-5 rounded-full text-xs sm:text-sm font-medium bg-gradient-to-r from-primary to-primary-hover"
                  >
                    <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    {isFinished ? "Revoir" : "Reprendre"}
                  </Button>
                )}
                <Button 
                  onClick={handleRestart} 
                  variant="outline" 
                  size="sm"
                  className="h-9 sm:h-10 px-3 sm:px-4 md:px-5 rounded-full text-xs sm:text-sm font-medium border-2"
                >
                  <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  <span className="hidden xs:inline">Recommencer</span>
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
