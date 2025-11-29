import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Store, User, Package, Zap, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import marketplaceShowcase from "@/assets/marketplace-showcase-clean.jpg";

interface DemoStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  duration: number; // in seconds
  highlight?: string;
}

const demoSteps: DemoStep[] = [
  {
    id: 1,
    title: "Bienvenue sur Djassa",
    description: "La marketplace #1 en Côte d'Ivoire pour créer ta boutique en ligne facilement.",
    icon: <Store className="w-8 h-8" />,
    duration: 8,
    highlight: "hero"
  },
  {
    id: 2,
    title: "Inscription 100% Gratuite",
    description: "Crée ton compte en quelques secondes, directement depuis cette page. Aucun frais caché.",
    icon: <User className="w-8 h-8" />,
    duration: 10,
    highlight: "cta"
  },
  {
    id: 3,
    title: "Ta Boutique, Automatiquement Prête",
    description: "Dès que tu crées ton compte, ta boutique en ligne est créée automatiquement. Pas besoin de configuration compliquée.",
    icon: <Zap className="w-8 h-8" />,
    duration: 12,
    highlight: "features"
  },
  {
    id: 4,
    title: "Tout se fait en ligne",
    description: "Pas besoin de te déplacer. Gère tout depuis ton téléphone ou ton ordinateur, où que tu sois.",
    icon: <CheckCircle2 className="w-8 h-8" />,
    duration: 10,
    highlight: "benefits"
  },
  {
    id: 5,
    title: "Publie et Vends",
    description: "Ajoute tes produits, fixe tes prix, et commence à vendre immédiatement à des milliers de clients.",
    icon: <Package className="w-8 h-8" />,
    duration: 10,
    highlight: "products"
  },
  {
    id: 6,
    title: "Lance-toi Maintenant !",
    description: "Crée ton compte → Ta boutique est prête → Publie tes produits → Commence à vendre !",
    icon: <Store className="w-8 h-8" />,
    duration: 10,
    highlight: "final"
  }
];

const DemoVideo = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  const totalDuration = demoSteps.reduce((acc, step) => acc + step.duration, 0);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 0.1;
        
        // Calculate which step we should be on
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

  const handlePlay = () => {
    if (!hasStarted) {
      setHasStarted(true);
    }
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleRestart = () => {
    setProgress(0);
    setCurrentStep(0);
    setIsPlaying(true);
  };

  const currentStepData = demoSteps[currentStep];
  const progressPercentage = (progress / totalDuration) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden">
      {/* Video Container */}
      <div className="relative w-full h-screen">
        {/* Background - Landing Page Preview */}
        <div className="absolute inset-0">
          <div className="relative w-full h-full">
            {/* Simulated Landing Page Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10">
              <img 
                src={marketplaceShowcase} 
                alt="Djassa Marketplace" 
                className="w-full h-full object-cover opacity-30"
              />
            </div>

            {/* Animated Highlight Areas */}
            <AnimatePresence mode="wait">
              {hasStarted && (
                <motion.div
                  key={currentStepData?.highlight}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0"
                >
                  {currentStepData?.highlight === "hero" && (
                    <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-primary/20 to-transparent animate-pulse" />
                  )}
                  {currentStepData?.highlight === "cta" && (
                    <div className="absolute top-1/4 left-1/4 right-1/4 h-32 rounded-2xl border-4 border-accent animate-pulse bg-accent/10" />
                  )}
                  {currentStepData?.highlight === "features" && (
                    <div className="absolute top-1/3 left-0 right-0 h-1/3 bg-gradient-to-b from-transparent via-primary/15 to-transparent animate-pulse" />
                  )}
                  {currentStepData?.highlight === "benefits" && (
                    <div className="absolute bottom-1/3 left-0 right-0 h-1/4 bg-gradient-to-t from-accent/20 to-transparent animate-pulse" />
                  )}
                  {currentStepData?.highlight === "products" && (
                    <div className="absolute bottom-1/4 left-10 right-10 h-40 rounded-2xl border-4 border-primary animate-pulse bg-primary/10" />
                  )}
                  {currentStepData?.highlight === "final" && (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/20 animate-pulse" />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
          {/* Start Screen */}
          {!hasStarted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center bg-background/90 backdrop-blur-md p-8 md:p-12 rounded-3xl shadow-2xl max-w-2xl mx-4"
            >
              <div className="mb-8">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary text-primary-foreground shadow-2xl"
                >
                  <Store className="w-12 h-12" />
                </motion.div>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
                Djassa
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-lg mx-auto">
                Découvre comment créer ta boutique en ligne en 60 secondes
              </p>
              <Button 
                onClick={handlePlay} 
                size="lg" 
                className="text-lg px-8 py-6 rounded-full shadow-xl hover:shadow-2xl transition-all"
              >
                <Play className="w-6 h-6 mr-2" />
                Lancer la démo
              </Button>
            </motion.div>
          )}

          {/* Playing Content */}
          {hasStarted && (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.95 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="text-center max-w-3xl mx-auto bg-background/90 backdrop-blur-md p-8 md:p-12 rounded-3xl shadow-2xl"
              >
                {/* Step Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="mb-6"
                >
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary text-primary-foreground shadow-2xl">
                    {currentStepData?.icon}
                  </div>
                </motion.div>

                {/* Step Number */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="mb-4"
                >
                  <span className="inline-block px-4 py-1 rounded-full bg-accent/20 text-accent-foreground text-sm font-medium">
                    {currentStep + 1} / {demoSteps.length}
                  </span>
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl md:text-5xl font-bold text-foreground mb-6 drop-shadow-lg"
                >
                  {currentStepData?.title}
                </motion.h2>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl md:text-2xl text-muted-foreground leading-relaxed px-4"
                >
                  {currentStepData?.description}
                </motion.p>

                {/* Final CTA */}
                {currentStep === demoSteps.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-8"
                  >
                    <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-accent-foreground font-bold text-lg shadow-xl">
                      <Zap className="w-5 h-5" />
                      Rejoins Djassa maintenant !
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Progress Bar & Controls */}
        {hasStarted && (
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-background/95 to-transparent p-6">
            {/* Progress Bar */}
            <div className="max-w-2xl mx-auto mb-4">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                <span>{Math.floor(progress)}s</span>
                <span>{totalDuration}s</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4">
              {isPlaying ? (
                <Button onClick={handlePause} variant="outline" size="lg" className="rounded-full">
                  <Pause className="w-5 h-5 mr-2" />
                  Pause
                </Button>
              ) : (
                <Button onClick={handlePlay} size="lg" className="rounded-full">
                  <Play className="w-5 h-5 mr-2" />
                  {progress >= totalDuration ? "Terminé" : "Reprendre"}
                </Button>
              )}
              <Button onClick={handleRestart} variant="outline" size="lg" className="rounded-full">
                <RotateCcw className="w-5 h-5 mr-2" />
                Recommencer
              </Button>
            </div>
          </div>
        )}

        {/* Djassa Branding */}
        <div className="absolute top-6 left-6 z-20">
          <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
            <Store className="w-6 h-6 text-primary" />
            <span className="font-bold text-foreground">Djassa</span>
          </div>
        </div>

        {/* Timer Badge */}
        {hasStarted && (
          <div className="absolute top-6 right-6 z-20">
            <div className="bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
              <span className="font-mono text-foreground">
                {Math.floor(progress).toString().padStart(2, "0")}:{((progress % 1) * 10).toFixed(0).padStart(1, "0")}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DemoVideo;
