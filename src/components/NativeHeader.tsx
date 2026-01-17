import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NativeHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightElement?: ReactNode;
  transparent?: boolean;
  centerTitle?: boolean;
  className?: string;
}

/**
 * Native app-style header with back navigation
 * Designed for iOS/Android native app feel
 */
export const NativeHeader = ({
  title,
  showBack = true,
  onBack,
  rightElement,
  transparent = false,
  centerTitle = true,
  className
}: NativeHeaderProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "sticky top-0 z-40 flex items-center justify-between h-14 px-2",
        transparent 
          ? "bg-transparent" 
          : "bg-background/95 backdrop-blur-xl border-b border-border/30",
        className
      )}
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)'
      }}
    >
      {/* Left section */}
      <div className="flex items-center min-w-[60px]">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="rounded-full w-10 h-10 active:scale-95 transition-transform touch-manipulation"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Title */}
      {title && (
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className={cn(
            "text-base font-semibold text-foreground truncate",
            centerTitle ? "flex-1 text-center" : "flex-1 text-left pl-2"
          )}
        >
          {title}
        </motion.h1>
      )}

      {/* Right section */}
      <div className="flex items-center min-w-[60px] justify-end">
        {rightElement}
      </div>
    </motion.header>
  );
};

/**
 * Large title header for main screens (iOS-style)
 */
export const LargeTitleHeader = ({
  title,
  subtitle,
  rightElement,
  className
}: {
  title: string;
  subtitle?: string;
  rightElement?: ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("px-4 pt-4 pb-2", className)}>
      <div className="flex items-start justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold text-foreground"
          >
            {title}
          </motion.h1>
          {subtitle && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-sm text-muted-foreground mt-0.5"
            >
              {subtitle}
            </motion.p>
          )}
        </div>
        {rightElement && (
          <div className="flex items-center gap-2">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
};
