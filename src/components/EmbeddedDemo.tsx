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
    icon: <Store className="w-8 h-8 sm:w-10 sm:h-10" />,
    duration: 8,
    gradient: "from-primary to-primary-hover"
  },
  {
    id: 2,
    title: "Inscription Gratuite",
    description: "Crée ton compte en 30 secondes. Zéro frais, zéro engagement.",
    icon: <User className="w-8 h-8 sm:w-10 sm:h-10" />,
    duration: 8,
    gradient: "from-success to-success/80"
  },
  {
    id: 3,
    title: "Boutique Instantanée",
    description: "Ta boutique professionnelle est créée automatiquement dès ton inscription.",
    icon: <Zap className="w-8 h-8 sm:w-10 sm:h-10" />,
    duration: 8,
    gradient: "from-accent to-accent/80"
  },
  {
    id: 4,
    title: "Gestion 100% en Ligne",
    description: "Gère produits, commandes et clients depuis ton mobile ou ton ordinateur.",
    icon: <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />,
    duration: 8,
    gradient: "from-promo to-promo/80"
  },
  {
    id: 5,
    title: "Publie & Vends",
    description: "Ajoute tes produits en quelques clics et commence à vendre immédiatement.",
    icon: <Package className="w-8 h-8 sm:w-10 sm:h-10" />,
    duration: 8,
    gradient: "from-primary to-success"
  },
  {
    id: 6,
    title: "Lance-toi Maintenant !",
    description: "Inscris-toi → Boutique prête → Publie → Vends → Réussis !",
    icon: <Sparkles className="w-8 h-8 sm:w-10 sm:h-10" />,
    duration: 8,
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
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              rotate: { duration: 40, repeat: Infinity, ease: "linear" },
              scale: { duration: 8, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-primary/20 via-transparent to-transparent rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ 
              rotate: [360, 0],
              scale: [1, 1.3, 1]
            }}
            transition={{ 
              rotate: { duration: 35, repeat: Infinity, ease: "linear" },
              scale: { duration: 10, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-accent/20 via-transparent to-transparent rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ 
              x: [-100, 100, -100],
              y: [-50, 50, -50],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-1/4 left-1/4 w-64 h-64 bg-promo/10 rounded-full blur-2xl"
          />
        </div>

        {/* Content Container */}
        <div className="relative min-h-[360px] sm:min-h-[400px] md:min-h-[440px] lg:min-h-[500px] flex flex-col">
          
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
                className="text-center max-w-xl px-3 sm:px-4"
              >
                {/* Animated Play Button */}
                <motion.button
                  onClick={handlePlay}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  className="relative inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-primary via-promo to-accent shadow-2xl shadow-primary/50 mb-5 sm:mb-6 md:mb-8 group cursor-pointer"
                >
                  <motion.div
                    animate={{ 
                      scale: [1, 1.3, 1],
                      opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-primary/40 blur-2xl"
                  />
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-2 rounded-full border-2 border-primary-foreground/20"
                  />
                  <Play className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-primary-foreground ml-1 relative z-10 group-hover:scale-125 transition-transform" />
                </motion.button>
                
                <motion.h3 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-3 sm:mb-4"
                >
                  Découvre Djassa en{' '}
                  <span className="bg-gradient-to-r from-primary via-promo to-accent bg-clip-text text-transparent">
                    60 secondes
                  </span>
                </motion.h3>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm sm:text-base md:text-lg text-muted-foreground mb-6 sm:mb-7 md:mb-8 font-medium"
                >
                  ✨ Vois comment créer ta boutique en ligne facilement
                </motion.p>
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    onClick={handlePlay} 
                    size="lg" 
                    className="h-12 sm:h-14 md:h-16 px-6 sm:px-8 md:px-10 text-base sm:text-lg md:text-xl rounded-full shadow-2xl bg-gradient-to-r from-primary via-promo to-accent hover:shadow-primary/50 group w-full sm:w-auto font-bold"
                  >
                    <Play className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                    🚀 Lancer la démo
                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 ml-1 group-hover:translate-x-2 transition-transform" />
                  </Button>
                </motion.div>
              </motion.div>
            )}

            {/* Playing Content */}
            {hasStarted && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  exit={{ opacity: 0, scale: 0.8, rotateY: 15 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="text-center max-w-2xl w-full px-3 sm:px-4"
                >
                  {/* Step Icon with Gradient */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180, y: -30 }}
                    animate={{ 
                      scale: 1, 
                      rotate: 0, 
                      y: 0,
                    }}
                    transition={{ 
                      delay: 0.1, 
                      type: "spring", 
                      stiffness: 250, 
                      damping: 20 
                    }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="mb-4 sm:mb-5 md:mb-6"
                  >
                    <motion.div 
                      animate={{ 
                        boxShadow: [
                          "0 10px 40px -10px rgba(var(--primary), 0.3)",
                          "0 10px 50px -10px rgba(var(--primary), 0.5)",
                          "0 10px 40px -10px rgba(var(--primary), 0.3)"
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={`inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl sm:rounded-3xl bg-gradient-to-br ${currentStepData?.gradient}`}
                    >
                      <motion.div 
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="text-primary-foreground"
                      >
                        {currentStepData?.icon}
                      </motion.div>
                    </motion.div>
                  </motion.div>

                  {/* Step Indicator Pills */}
                  <div className="flex justify-center gap-1.5 sm:gap-2 md:gap-2.5 mb-4 sm:mb-5">
                    {demoSteps.map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ 
                          scale: i === currentStep ? 1.3 : 1,
                          opacity: 1,
                          backgroundColor: i === currentStep 
                            ? 'hsl(var(--primary))' 
                            : i < currentStep 
                            ? 'hsl(var(--success))' 
                            : 'hsl(var(--muted))',
                          boxShadow: i === currentStep 
                            ? '0 4px 15px -2px hsl(var(--primary) / 0.5)'
                            : 'none'
                        }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className={`h-2 sm:h-2.5 rounded-full ${
                          i === currentStep ? 'w-8 sm:w-10 md:w-12' : 'w-2 sm:w-2.5'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Step Counter */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="mb-3 sm:mb-4"
                  >
                    <motion.span 
                      animate={{ 
                        boxShadow: [
                          "0 0 0 0 rgba(var(--primary), 0)",
                          "0 0 0 8px rgba(var(--primary), 0.1)",
                          "0 0 0 0 rgba(var(--primary), 0)"
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="inline-block px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 text-primary text-xs sm:text-sm md:text-base font-bold border border-primary/20"
                    >
                      ✨ Étape {currentStep + 1}/{demoSteps.length}
                    </motion.span>
                  </motion.div>

                  {/* Title */}
                  <motion.h3
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                    className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-extrabold mb-3 sm:mb-4"
                  >
                    <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                      {currentStepData?.title}
                    </span>
                  </motion.h3>

                  {/* Description */}
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto font-medium"
                  >
                    {currentStepData?.description}
                  </motion.p>

                  {/* Final CTA */}
                  {isFinished && onSignup && (
                    <motion.div
                      initial={{ opacity: 0, y: 30, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                      className="mt-6 sm:mt-8 md:mt-10"
                    >
                      <motion.div
                        animate={{ 
                          boxShadow: [
                            "0 10px 40px -10px rgba(var(--primary), 0.3)",
                            "0 15px 50px -10px rgba(var(--primary), 0.5)",
                            "0 10px 40px -10px rgba(var(--primary), 0.3)"
                          ]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Button 
                          onClick={onSignup}
                          size="lg"
                          className="h-12 sm:h-14 md:h-16 px-6 sm:px-8 md:px-10 text-base sm:text-lg md:text-xl rounded-full bg-gradient-to-r from-primary via-promo to-accent hover:scale-105 transition-transform group w-full sm:w-auto font-bold"
                        >
                          🚀 Créer ma boutique maintenant
                          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 ml-2 group-hover:translate-x-2 transition-transform" />
                        </Button>
                      </motion.div>
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
                <div className="h-2 sm:h-2.5 md:h-3 bg-muted/50 rounded-full overflow-hidden backdrop-blur-sm">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary via-promo to-accent rounded-full relative"
                    style={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 0.1 }}
                  >
                    <motion.div
                      animate={{
                        x: ['-100%', '100%']
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    />
                  </motion.div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex justify-center gap-2 sm:gap-3 md:gap-4">
                {isPlaying ? (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      onClick={handlePause} 
                      variant="outline" 
                      size="sm"
                      className="h-10 sm:h-11 md:h-12 px-4 sm:px-5 md:px-6 rounded-full text-sm sm:text-base font-semibold border-2 hover:bg-primary/10"
                    >
                      <Pause className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      <span className="hidden xs:inline">Pause</span>
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      onClick={isFinished ? handleRestart : handlePlay} 
                      size="sm"
                      className="h-10 sm:h-11 md:h-12 px-4 sm:px-5 md:px-6 rounded-full text-sm sm:text-base font-semibold bg-gradient-to-r from-primary to-promo shadow-lg"
                    >
                      <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      {isFinished ? "🔄 Revoir" : "▶️ Reprendre"}
                    </Button>
                  </motion.div>
                )}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    onClick={handleRestart} 
                    variant="outline" 
                    size="sm"
                    className="h-10 sm:h-11 md:h-12 px-4 sm:px-5 md:px-6 rounded-full text-sm sm:text-base font-semibold border-2 hover:bg-accent/10"
                  >
                    <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    <span className="hidden xs:inline">Recommencer</span>
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
