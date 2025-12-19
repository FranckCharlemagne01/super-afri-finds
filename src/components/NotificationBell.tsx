import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationCenter } from './NotificationCenter';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export const NotificationBell = () => {
  const { unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const previousCount = useRef(unreadCount);
  const isMobile = useIsMobile();

  // Detect new notifications for animation
  useEffect(() => {
    if (unreadCount > previousCount.current) {
      setHasNewNotification(true);
      const timer = setTimeout(() => setHasNewNotification(false), 2000);
      return () => clearTimeout(timer);
    }
    previousCount.current = unreadCount;
  }, [unreadCount]);

  const handleToggle = () => {
    setIsOpen(prev => !prev);
    if (hasNewNotification) {
      setHasNewNotification(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Format badge count
  const displayCount = unreadCount > 99 ? '99+' : unreadCount > 9 ? '9+' : unreadCount;

  return (
    <div className="relative">
      <Button
        ref={bellRef}
        variant="ghost"
        size="icon"
        onClick={handleToggle}
        className={cn(
          "relative p-2 min-w-[44px] min-h-[44px] rounded-xl hover:bg-muted/80 transition-all duration-200",
          isOpen && "bg-muted",
          hasNewNotification && "animate-[wiggle_0.5s_ease-in-out]"
        )}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ''}`}
      >
        <Bell 
          className={cn(
            "w-5 h-5 lg:w-6 lg:h-6 transition-all duration-200",
            unreadCount > 0 && "text-primary",
            hasNewNotification && "text-promo"
          )} 
        />
        
        {/* Badge */}
        {unreadCount > 0 && (
          <span 
            className={cn(
              "absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1",
              "bg-promo text-white text-[10px] font-bold",
              "rounded-full flex items-center justify-center",
              "shadow-lg border-2 border-background",
              "transition-transform duration-200",
              hasNewNotification && "animate-bounce"
            )}
          >
            {displayCount}
          </span>
        )}
      </Button>

      {/* Notification Center */}
      <NotificationCenter 
        isOpen={isOpen} 
        onClose={handleClose}
        anchorRef={bellRef}
      />
    </div>
  );
};
