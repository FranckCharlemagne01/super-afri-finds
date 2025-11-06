import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export const SplashScreen = ({ onComplete, duration = 5000 }: SplashScreenProps) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onComplete, 300); // Wait for fade animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 transition-opacity duration-300",
        fadeOut ? "opacity-0" : "opacity-100"
      )}
    >
      <div className="text-center animate-fade-in">
        <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent animate-scale-in">
          🛍️ DJASSA 🛒
        </h1>
        <div className="mt-8 flex justify-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse [animation-delay:0.2s]" />
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse [animation-delay:0.4s]" />
        </div>
      </div>
    </div>
  );
};
