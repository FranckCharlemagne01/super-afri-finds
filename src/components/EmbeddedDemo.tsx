import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Store, User, Package, Zap, CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DemoStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  duration: number;
}

const demoSteps: DemoStep[] = [
  {
    id: 1,
    title: "Bienvenue sur Djassa",
    description: "La marketplace #1 en Côte d'Ivoire pour créer ta boutique en ligne facilement.",
    icon: <Store className="w-6 h-6 sm:w-8 sm:h-8" />,
    duration: 8,
  },
  {
    id: 2,
    title: "Inscription 100% Gratuite",
    description: "Crée ton compte en quelques secondes, directement depuis cette page. Aucun frais caché.",
    icon: <User className="w-6 h-6 sm:w-8 sm:h-8" />,
    duration: 10,
  },
  {
    id: 3,
    title: "Ta Boutique, Automatiquement Prête",
    description: "Dès que tu crées ton compte, ta boutique en ligne est créée automatiquement.",
    icon: <Zap className="w-6 h-6 sm:w-8 sm:h-8" />,
    duration: 12,
  },
  {
    id: 4,
    title: "Tout se fait en ligne",
    description: "Pas besoin de te déplacer. Gère tout depuis ton téléphone ou ton ordinateur.",
    icon: <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8" />,
    duration: 10,
  },
  {
    id: 5,
    title: "Publie et Vends",
    description: "Ajoute tes produits, fixe tes prix, et commence à vendre immédiatement.",
    icon: <Package className="w-6 h-6 sm:w-8 sm:h-8" />,
    duration: 10,
  },
  {
    id: 6,
    title: "Lance-toi Maintenant !",
    description: "Crée ton compte → Ta boutique est prête → Publie tes produits → Vends !",
    icon: <Store className="w-6 h-6 sm:w-8 sm:h-8" />,
    duration: 10,
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

  const totalDuration = demoSteps.reduce((acc, step) => acc + step.duration, 0);

  // Auto-play on mount for mobile/tablet/desktop compatibility
  useEffect(() => {
    if (autoPlay && !hasStarted) {
      // Small delay to ensure smooth page load
      const timer = setTimeout(() => {
        setHasStarted(true);
        setIsPlaying(true);
      }, 500);
      return () => clearTimeout(timer);
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
    if (!hasStarted) {
      setHasStarted(true);
    }
    setIsPlaying(true);
  }, [hasStarted]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

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
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary/10 via-background to-accent/10 border border-border/50">
        {/* Demo Container */}
        <div className="relative min-h-[320px] sm:min-h-[380px] md:min-h-[420px] flex flex-col">
          
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-primary blur-3xl" />
            <div className="absolute bottom-4 left-4 w-24 h-24 rounded-full bg-accent blur-3xl" />
          </div>

          {/* Content */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
            
            {/* Start Screen */}
            {!hasStarted && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center max-w-lg"
              >
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary text-primary-foreground shadow-xl mb-4 sm:mb-6"
                >
                  <Play className="w-7 h-7 sm:w-9 sm:h-9 ml-1" />
                </motion.div>
                
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2 sm:mb-3">
                  Découvre Djassa en 60 secondes
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
                  Vois comment créer ta boutique en ligne facilement
                </p>
                
                <Button 
                  onClick={handlePlay} 
                  size="lg" 
                  className="text-sm sm:text-base px-6 sm:px-8 py-5 sm:py-6 rounded-full shadow-lg hover:shadow-xl transition-all"
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Lancer la démo
                </Button>
              </motion.div>
            )}

            {/* Playing Content */}
            {hasStarted && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="text-center max-w-xl w-full"
                >
                  {/* Step Icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                    className="mb-3 sm:mb-4"
                  >
                    <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary text-primary-foreground shadow-lg">
                      {currentStepData?.icon}
                    </div>
                  </motion.div>

                  {/* Step Counter */}
                  <div className="mb-2 sm:mb-3">
                    <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium">
                      Étape {currentStep + 1} / {demoSteps.length}
                    </span>
                  </div>

                  {/* Title */}
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-2 sm:mb-3"
                  >
                    {currentStepData?.title}
                  </motion.h3>

                  {/* Description */}
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-sm sm:text-base text-muted-foreground leading-relaxed px-2"
                  >
                    {currentStepData?.description}
                  </motion.p>

                  {/* Final CTA */}
                  {isFinished && onSignup && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 }}
                      className="mt-4 sm:mt-6"
                    >
                      <Button 
                        onClick={onSignup}
                        size="lg"
                        className="text-sm sm:text-base px-6 sm:px-8 rounded-full shadow-lg"
                      >
                        Créer ma boutique maintenant
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* Progress Bar & Controls */}
          {hasStarted && (
            <div className="relative z-10 border-t border-border/30 bg-background/50 backdrop-blur-sm p-3 sm:p-4">
              {/* Progress Bar */}
              <div className="mb-3">
                <div className="h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>{Math.floor(progress)}s</span>
                  <span>{totalDuration}s</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex justify-center gap-2 sm:gap-3">
                {isPlaying ? (
                  <Button 
                    onClick={handlePause} 
                    variant="outline" 
                    size="sm"
                    className="text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4 rounded-full"
                  >
                    <Pause className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Pause
                  </Button>
                ) : (
                  <Button 
                    onClick={isFinished ? handleRestart : handlePlay} 
                    size="sm"
                    className="text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4 rounded-full"
                  >
                    <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    {isFinished ? "Revoir" : "Reprendre"}
                  </Button>
                )}
                <Button 
                  onClick={handleRestart} 
                  variant="outline" 
                  size="sm"
                  className="text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4 rounded-full"
                >
                  <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Recommencer
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
