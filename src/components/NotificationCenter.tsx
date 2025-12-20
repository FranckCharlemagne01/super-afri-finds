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

  // Mobile: Bottom sheet
  // Desktop: Dropdown
  const panelContent = (
    <div 
      ref={containerRef}
      className={cn(
        "bg-background border border-border shadow-2xl overflow-hidden",
        isMobile 
          ? "fixed inset-x-0 bottom-0 rounded-t-3xl max-h-[85vh] z-[100]" 
          : "absolute right-0 top-full mt-2 w-96 rounded-xl z-[100]"
      )}
    >
      {/* Mobile drag handle */}
      {isMobile && (
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
        </div>
      )}

      {/* Header */}
      <div className={cn(
        "flex items-center justify-between px-5 border-b border-border",
        isMobile ? "py-4" : "p-4 bg-muted/30"
      )}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-lg">Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-9 px-3 rounded-full hover:bg-primary/10 hover:text-primary"
            >
              <CheckCheck className="w-4 h-4 mr-1.5" />
              Tout lire
            </Button>
          )}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-9 w-9 rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className={cn(
        isMobile ? "h-[calc(85vh-180px)]" : "h-96"
      )}>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Bell className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <p className="text-foreground font-semibold text-lg">Aucune notification</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-[250px]">
              Vous serez notifié des nouvelles commandes, messages et mises à jour
            </p>
          </div>
        ) : (
          <div className="py-2">
            {groupedNotifications.map((group, groupIndex) => (
              <div key={group.label}>
                {/* Group label */}
                <div className="sticky top-0 bg-background/95 backdrop-blur-sm px-5 py-2 z-10">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {group.label}
                  </p>
                </div>
                
                {/* Notifications */}
                <div className="space-y-1 px-3">
                  {group.notifications.map((notification, index) => {
                    const config = getNotificationConfig(notification.type);
                    
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (groupIndex * group.notifications.length + index) * 0.03 }}
                        className={cn(
                          "relative rounded-2xl cursor-pointer transition-all duration-200 group",
                          "active:scale-[0.98]",
                          !notification.is_read 
                            ? "bg-primary/5 hover:bg-primary/10" 
                            : "hover:bg-muted/60"
                        )}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className={cn(
                          "p-4 flex items-start gap-4",
                          isMobile && "py-4"
                        )}>
                          {/* Icon avec couleur selon le type */}
                          <div className={cn(
                            "flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center",
                            config.bgColor,
                            config.color
                          )}>
                            {config.icon}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0 pr-2">
                            {/* Type badge */}
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn(
                                "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                                config.bgColor,
                                config.color
                              )}>
                                {config.label}
                              </span>
                              {!notification.is_read && (
                                <span className="w-2 h-2 rounded-full bg-promo animate-pulse" />
                              )}
                            </div>
                            
                            {/* Title */}
                            <p className={cn(
                              "text-sm leading-tight",
                              !notification.is_read 
                                ? "font-bold text-foreground" 
                                : "font-medium text-foreground/90"
                            )}>
                              {notification.title}
                            </p>
                            
                            {/* Message */}
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                              {notification.message}
                            </p>
                            
                            {/* Time */}
                            <p className="text-[11px] text-muted-foreground/60 mt-2 font-medium">
                              {formatTime(notification.created_at)}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col items-center gap-2">
                            {notification.link && (
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
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
                                "h-8 w-8 rounded-full",
                                "opacity-0 group-hover:opacity-100",
                                isMobile && "opacity-60",
                                "hover:bg-destructive/10 hover:text-destructive"
                              )}
                            >
                              <Trash2 className="w-4 h-4" />
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
      {notifications.length > 0 && (
        <div className={cn(
          "border-t border-border bg-muted/20",
          isMobile ? "p-4 pb-8" : "p-3"
        )}>
          <Button
            variant="outline"
            className={cn(
              "w-full text-sm font-semibold rounded-xl",
              isMobile && "h-12"
            )}
            onClick={() => {
              navigate('/messages');
              onClose();
            }}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Voir tous les messages
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Mobile overlay */}
          {isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99]"
              onClick={onClose}
            />
          )}
          
          <motion.div
            initial={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.95, y: -10 }}
            animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
          >
            {panelContent}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
