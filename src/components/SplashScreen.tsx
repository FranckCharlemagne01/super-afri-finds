import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export const SplashScreen = ({ onComplete, duration = 2500 }: SplashScreenProps) => {
  const [isExiting, setIsExiting] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    console.log('[SplashScreen] Mounted, will complete in', duration, 'ms');
    
    // Start exit animation after duration
    const exitTimer = setTimeout(() => {
      console.log('[SplashScreen] Starting exit');
      setIsExiting(true);
    }, duration);

    // Guarantee onComplete is called (exit animation = 400ms)
    const completeTimer = setTimeout(() => {
      console.log('[SplashScreen] Calling onComplete');
      onCompleteRef.current();
    }, duration + 450);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [duration]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden",
        "bg-gradient-to-br from-primary/10 via-background to-accent/10",
        isExiting && "pointer-events-none"
      )}
    >
      {/* Animated background circles */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1.2, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full bg-accent/10 blur-2xl"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.8 }}
        transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
      />

      {/* Main content container */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6">
        {/* Logo container with glow effect */}
        <motion.div
          className="relative"
          initial={{ scale: 0.5, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.6, 
            ease: [0.16, 1, 0.3, 1],
            delay: 0.1 
          }}
        >
          {/* Glow effect behind logo */}
          <div className="absolute inset-0 blur-2xl bg-primary/30 rounded-full scale-150" />
          
          {/* Main logo text */}
          <motion.h1
            className="relative text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight"
            initial={{ letterSpacing: "0.3em", opacity: 0 }}
            animate={{ letterSpacing: "-0.02em", opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent drop-shadow-lg">
              DJASSA
            </span>
          </motion.h1>
        </motion.div>

        {/* Tagline */}
        <motion.p
          className="mt-4 text-sm sm:text-base text-muted-foreground font-medium tracking-wide"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
        >
          Votre marketplace
        </motion.p>

        {/* Modern loading indicator */}
        <motion.div
          className="mt-8 flex items-center gap-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.3 }}
        >
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="w-2 h-2 rounded-full bg-primary"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.7,
                repeat: Infinity,
                delay: index * 0.12,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background/50 to-transparent" />
    </motion.div>
  );
};
