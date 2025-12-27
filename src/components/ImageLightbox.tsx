import React, { useEffect, useCallback, useState } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  alt?: string;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  alt = 'Image produit'
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsZoomed(false);
    }
  }, [isOpen, initialIndex]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
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
    }
  }, [images.length]);

  const goToPrevious = useCallback(() => {
    if (images.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
      setIsZoomed(false);
    }
  }, [images.length]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
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

  if (!images.length) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Galerie d'images"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-[110] p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Zoom button */}
          <button
            onClick={toggleZoom}
            className="absolute top-4 right-16 z-[110] p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            aria-label={isZoomed ? "Dézoomer" : "Zoomer"}
          >
            {isZoomed ? <ZoomOut className="w-6 h-6" /> : <ZoomIn className="w-6 h-6" />}
          </button>

          {/* Navigation arrows - desktop only */}
          {images.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 z-[110] p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors hidden md:flex"
                aria-label="Image précédente"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 z-[110] p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors hidden md:flex"
                aria-label="Image suivante"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Image container */}
          <motion.div
            className="relative z-[105] w-full h-full flex items-center justify-center p-4 md:p-8"
            drag={images.length > 1 && !isZoomed ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
          >
            <motion.img
              key={currentIndex}
              src={images[currentIndex]}
              alt={`${alt} ${currentIndex + 1}/${images.length}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ 
                opacity: 1, 
                scale: isZoomed ? 1.5 : 1 
              }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "max-w-full max-h-full object-contain select-none",
                isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"
              )}
              onClick={(e) => {
                e.stopPropagation();
                toggleZoom();
              }}
              draggable={false}
            />
          </motion.div>

          {/* Image counter and dots */}
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[110] flex flex-col items-center gap-3">
              {/* Dots indicator */}
              <div className="flex gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentIndex(index);
                      setIsZoomed(false);
                    }}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      index === currentIndex 
                        ? "bg-white w-6" 
                        : "bg-white/50 hover:bg-white/70"
                    )}
                    aria-label={`Image ${index + 1}`}
                  />
                ))}
              </div>
              {/* Counter */}
              <span className="text-white/80 text-sm font-medium bg-black/40 px-3 py-1 rounded-full">
                {currentIndex + 1} / {images.length}
              </span>
            </div>
          )}

          {/* Swipe hint on mobile */}
          {images.length > 1 && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[110] md:hidden">
              <span className="text-white/50 text-xs">
                ← Glisser pour naviguer →
              </span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImageLightbox;
