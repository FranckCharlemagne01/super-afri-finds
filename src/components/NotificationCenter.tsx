import { useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  MessageSquare, 
  Package, 
  Truck, 
  CheckCircle, 
  Bell,
  Trash2,
  CheckCheck,
  X,
  Store,
  CreditCard,
  AlertCircle,
  Gift,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement>;
}

// Configuration des types de notifications avec labels et styles
const notificationConfig: Record<string, { 
  icon: React.ReactNode; 
  label: string; 
  color: string;
  bgColor: string;
}> = {
  new_order: {
    icon: <ShoppingCart className="w-5 h-5" />,
    label: 'Nouvelle commande',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30'
  },
  order_status: {
    icon: <Package className="w-5 h-5" />,
    label: 'Commande',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30'
  },
  order_shipped: {
    icon: <Truck className="w-5 h-5" />,
    label: 'Expédition',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30'
  },
  order_delivered: {
    icon: <CheckCircle className="w-5 h-5" />,
    label: 'Livraison',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30'
  },
  new_message: {
    icon: <MessageSquare className="w-5 h-5" />,
    label: 'Message',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30'
  },
  payment: {
    icon: <CreditCard className="w-5 h-5" />,
    label: 'Paiement',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30'
  },
  shop: {
    icon: <Store className="w-5 h-5" />,
    label: 'Boutique',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30'
  },
  promo: {
    icon: <Gift className="w-5 h-5" />,
    label: 'Promotion',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30'
  },
  alert: {
    icon: <AlertCircle className="w-5 h-5" />,
    label: 'Alerte',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30'
  },
  default: {
    icon: <Bell className="w-5 h-5" />,
    label: 'Notification',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted'
  }
};

const getNotificationConfig = (type: string) => {
  return notificationConfig[type] || notificationConfig.default;
};

export const NotificationCenter = ({ isOpen, onClose, anchorRef }: NotificationCenterProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();

  // Grouper les notifications par date
  const groupedNotifications = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const groups: { label: string; notifications: typeof notifications }[] = [
      { label: "Aujourd'hui", notifications: [] },
      { label: "Hier", notifications: [] },
      { label: "Plus ancien", notifications: [] }
    ];
    
    notifications.forEach(notif => {
      const notifDate = new Date(notif.created_at);
      notifDate.setHours(0, 0, 0, 0);
      
      if (notifDate.getTime() === today.getTime()) {
        groups[0].notifications.push(notif);
      } else if (notifDate.getTime() === yesterday.getTime()) {
        groups[1].notifications.push(notif);
      } else {
        groups[2].notifications.push(notif);
      }
    });
    
    return groups.filter(g => g.notifications.length > 0);
  }, [notifications]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current && 
        !containerRef.current.contains(target) &&
        anchorRef.current &&
        !anchorRef.current.contains(target)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
      onClose();
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: fr 
      });
    } catch {
      return '';
    }
  };

  const panelContent = (
    <motion.div 
      ref={containerRef}
      initial={isMobile ? { x: '100%' } : { opacity: 0, scale: 0.95, y: -10 }}
      animate={isMobile ? { x: 0 } : { opacity: 1, scale: 1, y: 0 }}
      exit={isMobile ? { x: '100%' } : { opacity: 0, scale: 0.95, y: -10 }}
      transition={{ type: 'spring', damping: 30, stiffness: 400 }}
      className={cn(
        "bg-background overflow-hidden flex flex-col",
        isMobile 
          ? "fixed top-0 right-0 bottom-0 w-[78vw] max-w-[340px] z-[100] shadow-[-8px_0_30px_-10px_rgba(0,0,0,0.15)] border-l border-border" 
          : "absolute right-0 top-full mt-2 w-96 max-h-[80vh] rounded-xl z-[100] border border-border shadow-2xl"
      )}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between px-4 border-b border-border shrink-0",
        isMobile ? "py-3 pt-[max(env(safe-area-inset-top),12px)]" : "p-4 bg-muted/30"
      )}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Bell className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-base">Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-[11px] text-muted-foreground">
                {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-[11px] h-8 px-2 rounded-full hover:bg-primary/10 hover:text-primary"
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1" />
              Tout lire
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content - scrollable */}
      <ScrollArea className="flex-1 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center px-5">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
              <Bell className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <p className="text-foreground font-semibold text-base">Aucune notification</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
              Vous serez notifié des nouvelles commandes, messages et mises à jour
            </p>
          </div>
        ) : (
          <div className="py-1">
            {groupedNotifications.map((group, groupIndex) => (
              <div key={group.label}>
                <div className="sticky top-0 bg-background/95 backdrop-blur-sm px-4 py-1.5 z-10">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {group.label}
                  </p>
                </div>
                
                <div className="space-y-0.5 px-2">
                  {group.notifications.map((notification, index) => {
                    const config = getNotificationConfig(notification.type);
                    
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (groupIndex * group.notifications.length + index) * 0.03 }}
                        className={cn(
                          "relative rounded-xl cursor-pointer transition-all duration-200 group",
                          "active:scale-[0.98]",
                          !notification.is_read 
                            ? "bg-primary/5 hover:bg-primary/10" 
                            : "hover:bg-muted/60"
                        )}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="p-3 flex items-start gap-3">
                          <div className={cn(
                            "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
                            config.bgColor,
                            config.color
                          )}>
                            {config.icon}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className={cn(
                                "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full",
                                config.bgColor,
                                config.color
                              )}>
                                {config.label}
                              </span>
                              {!notification.is_read && (
                                <span className="w-1.5 h-1.5 rounded-full bg-promo animate-pulse" />
                              )}
                            </div>
                            
                            <p className={cn(
                              "text-[13px] leading-tight",
                              !notification.is_read 
                                ? "font-bold text-foreground" 
                                : "font-medium text-foreground/90"
                            )}>
                              {notification.title}
                            </p>
                            
                            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                              {notification.message}
                            </p>
                            
                            <p className="text-[10px] text-muted-foreground/60 mt-1 font-medium">
                              {formatTime(notification.created_at)}
                            </p>
                          </div>

                          <div className="flex flex-col items-center gap-1 shrink-0">
                            {notification.link && (
                              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                                <ChevronRight className="w-3 h-3 text-muted-foreground" />
                              </div>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className={cn(
                                "h-6 w-6 rounded-full",
                                "opacity-0 group-hover:opacity-100",
                                isMobile && "opacity-50",
                                "hover:bg-destructive/10 hover:text-destructive"
                              )}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className={cn(
        "border-t border-border bg-muted/20 shrink-0",
        isMobile ? "p-3 pb-[max(env(safe-area-inset-bottom),12px)] space-y-1.5" : "p-3 space-y-2"
      )}>
        {notifications.length > 0 && (
          <Button
            variant="default"
            className="w-full text-xs font-semibold rounded-xl h-10"
            onClick={() => {
              navigate('/messages');
              onClose();
            }}
          >
            <Bell className="w-3.5 h-3.5 mr-1.5" />
            Toutes les notifications
          </Button>
        )}
        <Button
          variant="outline"
          className="w-full text-xs font-semibold rounded-xl h-10"
          onClick={() => {
            navigate('/messages');
            onClose();
          }}
        >
          <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
          Mes messages privés
        </Button>
      </div>
    </motion.div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "fixed inset-0 z-[99]",
              isMobile ? "bg-black/40" : "bg-transparent"
            )}
            onClick={onClose}
          />
          
          {panelContent}
        </>
      )}
    </AnimatePresence>
  );
};
