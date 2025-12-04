import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useStableAuth } from "@/hooks/useStableAuth";
import { useStableRole } from "@/hooks/useStableRole";
import { ChevronLeft, ChevronRight, Briefcase, Gift } from "lucide-react";

interface Announcement {
  id: string;
  icon: React.ReactNode;
  emoji: string;
  message: string;
  action: () => void;
  gradient: string;
}

export const NativeAnnouncementSlider = () => {
  const navigate = useNavigate();
  const { user } = useStableAuth();
  const { isSeller } = useStableRole();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const handleSellerClick = () => {
    if (user) {
      if (isSeller) {
        navigate('/seller-dashboard');
      } else {
        navigate('/');
        setTimeout(() => {
          const sellerSection = document.querySelector('[data-seller-upgrade]');
          if (sellerSection) {
            sellerSection.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    } else {
      navigate('/auth?mode=signup&role=seller');
    }
  };

  const handleShopClick = () => {
    if (user) {
      if (isSeller) {
        navigate('/seller-dashboard');
      } else {
        navigate('/auth?mode=signup&role=seller');
      }
    } else {
      navigate('/auth?mode=signup&role=seller');
    }
  };

  const announcements: Announcement[] = [
    {
      id: "seller",
      icon: <Briefcase className="w-5 h-5 sm:w-6 sm:h-6" />,
      emoji: "💼",
      message: "Devenez vendeur sur Djassa - 28 jours d'essai gratuit pour créer votre boutique !",
      action: handleSellerClick,
      gradient: "from-orange-500 via-orange-600 to-amber-500"
    },
    {
      id: "shop",
      icon: <Gift className="w-5 h-5 sm:w-6 sm:h-6" />,
      emoji: "🎁",
      message: "Créez une boutique dès aujourd'hui sur Djassa et profitez de l'offre gratuite pendant 28 jours !",
      action: handleShopClick,
      gradient: "from-primary via-orange-500 to-amber-500"
    }
  ];

  // Auto-slide every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isDragging) {
        setCurrentIndex((prev) => (prev + 1) % announcements.length);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isDragging, announcements.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  };

  // Touch/Mouse drag handlers
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const pageX = 'touches' in e ? e.touches[0].pageX : e.pageX;
    startX.current = pageX;
  };

  const handleDragEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const pageX = 'changedTouches' in e ? e.changedTouches[0].pageX : e.pageX;
    const diff = startX.current - pageX;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }
  };

  return (
    <div className="w-full px-2 sm:px-4 py-2">
      <div className="relative max-w-4xl mx-auto">
        {/* Navigation arrows - Desktop only */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={goToPrevious}
          className="hidden sm:flex absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center rounded-full bg-background/90 shadow-lg border border-border/50 text-foreground hover:bg-background transition-colors"
          aria-label="Annonce précédente"
        >
          <ChevronLeft className="w-4 h-4" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={goToNext}
          className="hidden sm:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center rounded-full bg-background/90 shadow-lg border border-border/50 text-foreground hover:bg-background transition-colors"
          aria-label="Annonce suivante"
        >
          <ChevronRight className="w-4 h-4" />
        </motion.button>

        {/* Slider container */}
        <div
          ref={sliderRef}
          className="overflow-hidden rounded-2xl"
          onMouseDown={handleDragStart}
          onMouseUp={handleDragEnd}
          onMouseLeave={() => isDragging && setIsDragging(false)}
          onTouchStart={handleDragStart}
          onTouchEnd={handleDragEnd}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={`bg-gradient-to-r ${announcements[currentIndex].gradient} p-4 sm:p-5 cursor-pointer select-none`}
              onClick={announcements[currentIndex].action}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  announcements[currentIndex].action();
                }
              }}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                {/* Icon container */}
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner"
                >
                  <span className="text-white">
                    {announcements[currentIndex].icon}
                  </span>
                </motion.div>

                {/* Message */}
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.3 }}
                  className="flex-1 text-sm sm:text-base md:text-lg font-semibold text-white leading-snug"
                >
                  {announcements[currentIndex].message}
                </motion.p>

                {/* Arrow indicator */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="flex-shrink-0 hidden sm:flex"
                >
                  <ChevronRight className="w-5 h-5 text-white/80" />
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Pagination dots */}
        <div className="flex justify-center gap-2 mt-3">
          {announcements.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => goToSlide(index)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              className={`transition-all duration-300 rounded-full ${
                index === currentIndex 
                  ? "w-6 h-2 bg-primary" 
                  : "w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`Aller à l'annonce ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
