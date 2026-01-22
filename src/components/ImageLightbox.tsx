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
 * - Strictly contained within viewport (NO overflow)
 * - Smooth zoom with proper proportions
 * - Download with visible Djassa watermark
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

  // Lock body scroll when open - CRITICAL for preventing overflow
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      const originalWidth = document.body.style.width;
      const originalHeight = document.body.style.height;
      const originalTop = document.body.style.top;
      
      // Complete scroll lock
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      document.body.style.top = '0';
      
      // Also lock html element
      document.documentElement.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.width = originalWidth;
        document.body.style.height = originalHeight;
        document.body.style.top = originalTop;
        document.documentElement.style.overflow = '';
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
    if (isZoomed) return;
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
   * Download image with VISIBLE Djassa watermark
   * Watermark: small, dark orange, 8% opacity, bottom-right corner
   * TESTED: watermark IS rendered in final file
   */
  const handleDownload = useCallback(async () => {
    if (isDownloading) return;
    
    setIsDownloading(true);
    
    try {
      // Create a new canvas for watermarking
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');
      
      // Load the image with CORS
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        
        // Handle Supabase storage URLs - add timestamp to bypass cache
        const imageUrl = images[currentIndex];
        if (imageUrl.includes('supabase')) {
          img.src = `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
        } else {
          img.src = imageUrl;
        }
      });
      
      // Set canvas size to match image
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      
      // Draw the original image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // === BOTTOM-RIGHT WATERMARK - PROFESSIONAL SIGNATURE ===
      const watermarkText = 'Djassa';
      // Size: larger, proportional (10% of smallest dimension)
      const minDimension = Math.min(canvas.width, canvas.height);
      const fontSize = Math.max(Math.min(minDimension * 0.10, 100), 32);
      
      ctx.save();
      
      // Safe padding from edges (6% of dimensions, min 25px) - ensures never cut off
      const paddingX = Math.max(canvas.width * 0.06, 25);
      const paddingY = Math.max(canvas.height * 0.06, 25);
      
      // Position: bottom-right, safely inside the image bounds
      const posX = canvas.width - paddingX;
      const posY = canvas.height - paddingY;
      
      // Main watermark - darker orange, more visible
      ctx.globalAlpha = 0.11; // 11% opacity - clearly visible but elegant
      ctx.fillStyle = '#BF360C'; // Darker burnt orange - more contrast
      ctx.font = `bold ${fontSize}px "Segoe UI", Arial, sans-serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      
      // White outline for visibility on dark backgrounds
      ctx.shadowColor = 'rgba(255, 255, 255, 0.35)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      // Draw main text
      ctx.fillText(watermarkText, posX, posY);
      
      // Second layer with dark shadow for contrast on light backgrounds
      ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
      ctx.shadowBlur = 3;
      ctx.globalAlpha = 0.09;
      ctx.fillText(watermarkText, posX, posY);
      
      // Smaller domain text above main watermark
      ctx.globalAlpha = 0.08;
      ctx.font = `${Math.max(fontSize * 0.4, 16)}px "Segoe UI", Arial, sans-serif`;
      ctx.shadowBlur = 2;
      ctx.fillText('djassa.com', posX, posY - fontSize * 0.9);
      
      ctx.restore();
      
      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          toast({
            title: "Erreur",
            description: "Impossible de générer l'image",
            variant: "destructive",
          });
          setIsDownloading(false);
          return;
        }
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const safeTitle = productTitle.replace(/[^a-zA-Z0-9\s]/g, '').trim().substring(0, 30).replace(/\s+/g, '_') || 'produit';
        link.download = `djassa_${safeTitle}_${Date.now()}.jpg`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: "✅ Image téléchargée",
          description: "Avec filigrane Djassa discret",
        });
        
        setIsDownloading(false);
      }, 'image/jpeg', 0.92);
      
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Erreur de téléchargement",
        description: "Impossible de télécharger l'image. Réessayez.",
        variant: "destructive",
      });
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
          className="fixed inset-0 z-[9999]"
          style={{
            // CRITICAL: Force exact viewport dimensions
            width: '100vw',
            height: '100vh',
            maxWidth: '100vw',
            maxHeight: '100vh',
            overflow: 'hidden',
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Galerie d'images"
        >
          {/* Backdrop - full screen dark overlay */}
          <motion.div
            className="absolute inset-0 bg-black/95 backdrop-blur-sm"
            onClick={onClose}
            style={{ width: '100%', height: '100%' }}
          />

          {/* Content container - strictly bounded */}
          <div 
            className="absolute inset-0 flex flex-col"
            style={{
              width: '100vw',
              height: '100vh',
              maxWidth: '100vw',
              maxHeight: '100vh',
              overflow: 'hidden',
            }}
          >
            {/* Top controls bar - fixed height */}
            <div className="flex-shrink-0 w-full p-3 sm:p-4 flex items-center justify-between z-10">
              {/* Close button */}
              <motion.button
                onClick={onClose}
                className="p-2.5 sm:p-3 rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all backdrop-blur-sm"
                aria-label="Fermer"
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </motion.button>
              
              {/* Action buttons */}
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

            {/* Image container - takes remaining space, strictly contained */}
            <div 
              className="flex-1 relative flex items-center justify-center overflow-hidden"
              style={{
                minHeight: 0, // Critical for flexbox to allow shrinking
              }}
            >
              {/* Navigation arrows - desktop */}
              {images.length > 1 && (
                <>
                  <motion.button
                    onClick={goToPrevious}
                    className="absolute left-2 sm:left-4 z-10 p-2 sm:p-3 rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all backdrop-blur-sm hidden md:flex"
                    aria-label="Image précédente"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                  </motion.button>
                  <motion.button
                    onClick={goToNext}
                    className="absolute right-2 sm:right-4 z-10 p-2 sm:p-3 rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all backdrop-blur-sm hidden md:flex"
                    aria-label="Image suivante"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  </motion.button>
                </>
              )}

              {/* Loading spinner */}
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-12 h-12 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              )}
              
              {/* The image - STRICTLY CONTAINED */}
              <motion.div
                className="flex items-center justify-center p-4"
                style={{
                  width: '100%',
                  height: '100%',
                  maxWidth: '100%',
                  maxHeight: '100%',
                }}
                drag={images.length > 1 && !isZoomed ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={handleDragEnd}
              >
                <motion.img
                  key={currentIndex}
                  src={images[currentIndex]}
                  alt={`${alt} ${currentIndex + 1}/${images.length}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ 
                    opacity: imageLoaded ? 1 : 0, 
                    scale: isZoomed ? 1.5 : 1 
                  }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  onLoad={() => setImageLoaded(true)}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleZoom();
                  }}
                  draggable={false}
                  style={{
                    // CRITICAL: Force image to fit within container
                    maxWidth: '100%',
                    maxHeight: '100%',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain',
                    cursor: isZoomed ? 'zoom-out' : 'zoom-in',
                    borderRadius: '8px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                  }}
                />
              </motion.div>
            </div>

            {/* Bottom navigation - fixed height */}
            {images.length > 1 && (
              <div className="flex-shrink-0 w-full pb-4 sm:pb-6 pt-2">
                <div className="flex flex-col items-center gap-2">
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
                            ? "bg-white w-6" 
                            : "bg-white/40 hover:bg-white/60 w-2"
                        )}
                        aria-label={`Image ${index + 1}`}
                        whileTap={{ scale: 0.9 }}
                      />
                    ))}
                  </div>
                  
                  {/* Counter badge */}
                  <span className="text-white/80 text-xs font-medium bg-black/40 px-3 py-1 rounded-full">
                    {currentIndex + 1} / {images.length}
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImageLightbox;
