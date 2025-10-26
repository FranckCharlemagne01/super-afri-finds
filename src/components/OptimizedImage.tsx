import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
  priority?: boolean;
  onLoad?: () => void;
}

export const OptimizedImage = ({
  src,
  alt,
  className,
  aspectRatio = "1/1",
  priority = false,
  onLoad,
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "100px",
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  return (
    <div
      ref={imgRef}
      className={cn("relative overflow-hidden bg-muted", className)}
      style={{ aspectRatio }}
    >
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-pulse" />
      )}
      
      {isInView && (
        <motion.img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onLoad={handleLoad}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: isLoaded ? 1 : 0, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={cn(
            "w-full h-full object-cover",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          style={{
            contentVisibility: "auto",
            willChange: "opacity, transform",
          }}
        />
      )}
    </div>
  );
};
