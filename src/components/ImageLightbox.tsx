import React, { useEffect, useCallback, useState, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  alt?: string;
  productTitle?: string;
}

/**
 * Premium Image Lightbox - Amazon/Jumia quality experience
 * - Fluid, centered, responsive without overflow
 * - Smooth zoom with proper proportions
 * - Download with subtle Djassa watermark
 */
const ImageLightbox: React.FC<ImageLightboxProps> = ({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  alt = 'Image produit',
  productTitle = 'Produit Djassa'
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsZoomed(false);
      setImageLoaded(false);
    }
  }, [isOpen, initialIndex]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Prevent iOS Safari bounce
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      return () => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
      };
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);

  const goToNext = useCallback(() => {
    if (images.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % images.length);
      setIsZoomed(false);
      setImageLoaded(false);
    }
  }, [images.length]);

  const goToPrevious = useCallback(() => {
    if (images.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
      setIsZoomed(false);
      setImageLoaded(false);
    }
  }, [images.length]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isZoomed) return; // Don't navigate when zoomed
    const threshold = 50;
    if (info.offset.x > threshold) {
      goToPrevious();
    } else if (info.offset.x < -threshold) {
      goToNext();
    }
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  /**
   * Download image with subtle Djassa watermark
   * Watermark: small, dark orange, 5-10% opacity, bottom-right
   */
  const handleDownload = useCallback(async () => {
    if (isDownloading) return;
    
    setIsDownloading(true);
    
    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not available');
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');
      
      // Load the image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = images[currentIndex];
      });
      
      // Set canvas size to match image
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      // Draw the original image
      ctx.drawImage(img, 0, 0);
      
      // Add subtle Djassa watermark
      const watermarkText = 'Djassa';
      const fontSize = Math.max(img.naturalWidth * 0.025, 14); // 2.5% of width, min 14px
      
      ctx.save();
      
      // Watermark settings: dark orange, very low opacity (7%)
      ctx.globalAlpha = 0.07;
      ctx.fillStyle = '#E65100'; // Dark orange (Djassa brand)
      ctx.font = `bold ${fontSize}px 'Inter', 'Segoe UI', system-ui, sans-serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      
      // Position: bottom-right with padding
      const padding = fontSize * 1.5;
      const x = canvas.width - padding;
      const y = canvas.height - padding;
      
      // Add subtle shadow for visibility on light backgrounds
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      
      // Draw the watermark text
      ctx.fillText(watermarkText, x, y);
      
      // Optional: Add small diagonal watermark pattern for extra subtlety
      ctx.globalAlpha = 0.03;
      ctx.font = `${fontSize * 0.6}px 'Inter', system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0;
      
      // Subtle diagonal signature
      const diagX = canvas.width - padding * 3;
      const diagY = canvas.height - padding * 2;
      ctx.save();
      ctx.translate(diagX, diagY);
      ctx.rotate(-0.15); // Slight diagonal angle
      ctx.fillText('djassa.com', 0, 0);
      ctx.restore();
      
      ctx.restore();
      
      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to create image blob');
        }
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const safeTitle = productTitle.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
        link.download = `djassa_${safeTitle}_${Date.now()}.jpg`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Image téléchargée",
          description: "L'image a été enregistrée avec succès",
        });
      }, 'image/jpeg', 0.95);
      
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Erreur de téléchargement",
        description: "Impossible de télécharger l'image. Réessayez.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  }, [currentIndex, images, productTitle, toast, isDownloading]);

  if (!images.length) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Galerie d'images"
        >
          {/* Backdrop - premium dark overlay */}
          <motion.div
            className="absolute inset-0 bg-black/95 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Top controls bar */}
          <div className="absolute top-0 left-0 right-0 z-[10010] p-3 sm:p-4 flex items-center justify-between safe-area-top">
            {/* Left: Close button */}
            <motion.button
              onClick={onClose}
              className="p-2.5 sm:p-3 rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all backdrop-blur-sm"
              aria-label="Fermer"
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </motion.button>
            
            {/* Right: Action buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Download button */}
              <motion.button
                onClick={handleDownload}
                disabled={isDownloading}
                className={cn(
                  "p-2.5 sm:p-3 rounded-full text-white transition-all backdrop-blur-sm",
                  isDownloading 
                    ? "bg-white/5 cursor-wait" 
                    : "bg-white/10 hover:bg-white/20 active:scale-95"
                )}
                aria-label="Télécharger l'image"
                whileTap={{ scale: isDownloading ? 1 : 0.9 }}
              >
                {isDownloading ? (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Download className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </motion.button>
              
              {/* Zoom button */}
              <motion.button
                onClick={toggleZoom}
                className="p-2.5 sm:p-3 rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all backdrop-blur-sm"
                aria-label={isZoomed ? "Dézoomer" : "Zoomer"}
                whileTap={{ scale: 0.9 }}
              >
                {isZoomed ? (
                  <ZoomOut className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <ZoomIn className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </motion.button>
            </div>
          </div>

          {/* Navigation arrows - desktop only */}
          {images.length > 1 && (
            <>
              <motion.button
                onClick={goToPrevious}
                className="absolute left-2 sm:left-4 z-[10010] p-3 sm:p-4 rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all backdrop-blur-sm hidden md:flex"
                aria-label="Image précédente"
                whileHover={{ scale: 1.05, x: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
              </motion.button>
              <motion.button
                onClick={goToNext}
                className="absolute right-2 sm:right-4 z-[10010] p-3 sm:p-4 rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all backdrop-blur-sm hidden md:flex"
                aria-label="Image suivante"
                whileHover={{ scale: 1.05, x: 2 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
              </motion.button>
            </>
          )}

          {/* Image container - perfectly centered, no overflow */}
          <motion.div
            className="relative z-[10005] w-full h-full flex items-center justify-center p-4 sm:p-6 md:p-12"
            drag={images.length > 1 && !isZoomed ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
          >
            {/* Loading skeleton */}
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 border-3 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            )}
            
            <motion.img
              key={currentIndex}
              src={images[currentIndex]}
              alt={`${alt} ${currentIndex + 1}/${images.length}`}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ 
                opacity: imageLoaded ? 1 : 0, 
                scale: isZoomed ? 1.8 : 1 
              }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ 
                duration: 0.25, 
                ease: [0.25, 0.1, 0.25, 1] 
              }}
              onLoad={() => setImageLoaded(true)}
              className={cn(
                // Perfect responsive sizing - never overflow
                "max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-3rem)] md:max-w-[calc(100vw-6rem)]",
                "max-h-[calc(100vh-8rem)] sm:max-h-[calc(100vh-6rem)] md:max-h-[calc(100vh-8rem)]",
                "w-auto h-auto",
                "object-contain select-none",
                "rounded-lg sm:rounded-xl",
                // Shadow for depth
                "shadow-2xl shadow-black/50",
                // Cursor based on zoom state
                isZoomed ? "cursor-zoom-out" : "cursor-zoom-in",
                // Smooth zoom transition
                "transition-transform duration-300 ease-out"
              )}
              onClick={(e) => {
                e.stopPropagation();
                toggleZoom();
              }}
              draggable={false}
            />
          </motion.div>

          {/* Bottom navigation - dots and counter */}
          {images.length > 1 && (
            <motion.div 
              className="absolute bottom-0 left-0 right-0 z-[10010] pb-6 sm:pb-8 pt-4 safe-area-bottom"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex flex-col items-center gap-3">
                {/* Dots indicator */}
                <div className="flex gap-2 px-4">
                  {images.map((_, index) => (
                    <motion.button
                      key={index}
                      onClick={() => {
                        setCurrentIndex(index);
                        setIsZoomed(false);
                        setImageLoaded(false);
                      }}
                      className={cn(
                        "h-2 rounded-full transition-all duration-300",
                        index === currentIndex 
                          ? "bg-white w-8" 
                          : "bg-white/40 hover:bg-white/60 w-2"
                      )}
                      aria-label={`Image ${index + 1}`}
                      whileTap={{ scale: 0.9 }}
                    />
                  ))}
                </div>
                
                {/* Counter badge */}
                <span className="text-white/90 text-sm font-medium bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-sm">
                  {currentIndex + 1} / {images.length}
                </span>
              </div>
            </motion.div>
          )}

          {/* Mobile swipe hint - only shown initially */}
          {images.length > 1 && (
            <motion.div 
              className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[10010] md:hidden pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.5 }}
            >
              <motion.span 
                className="text-white/50 text-xs bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm"
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ repeat: 2, duration: 1.5 }}
              >
                ← Glisser pour naviguer →
              </motion.span>
            </motion.div>
          )}
          
          {/* Hidden canvas for watermark generation */}
          <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImageLightbox;
