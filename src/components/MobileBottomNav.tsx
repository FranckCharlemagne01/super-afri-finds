import { useNavigate, useLocation } from "react-router-dom";
import { Home, Grid3X3, MessageSquare, ShoppingCart, User } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { cartItems, unreadMessages } = useRealtimeNotifications();
  const { unreadCount: notificationUnreadCount } = useNotifications();

  // Ne s'affiche que sur mobile et tablette
  if (!isMobile) return null;

  // Badge combiné : messages non lus + notifications non lues liées aux commandes
  const messageBadgeCount = unreadMessages + notificationUnreadCount;

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const isOnMarketplace = location.pathname === "/marketplace" || location.pathname === "/";
    const isAtTop = window.scrollY < 100;
    
    if (isOnMarketplace) {
      if (isAtTop) {
        // Si déjà en haut, rafraîchir pour afficher les nouveaux produits
        window.location.reload();
        toast({
          title: "✅ Produits actualisés",
          description: "Affichage des derniers produits disponibles",
          duration: 2000,
        });
      } else {
        // Si en bas, remonter en haut avec animation fluide
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      // Rediriger vers la page publique
      navigate("/marketplace");
    }
  };

  const navItems = [
    { icon: Home, label: "Accueil", path: "/marketplace", onClick: handleHomeClick },
    { icon: Grid3X3, label: "Catégories", path: "/categories" },
    { icon: MessageSquare, label: "Messages", path: "/messages", badge: messageBadgeCount },
    { icon: ShoppingCart, label: "Panier", path: "/cart", badge: cartItems },
    { icon: User, label: "Compte", path: "/buyer-dashboard" },
  ];

  const isActive = (path: string) => {
    if (path === "/marketplace") {
      return location.pathname === "/" || location.pathname === "/marketplace";
    }
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/98 backdrop-blur-xl border-t border-border/40 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)]"
      style={{ 
        paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
      }}
    >
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map(({ icon: Icon, label, path, badge, onClick }) => {
          const active = isActive(path);
          
          return (
            <motion.button
              key={path}
              onClick={(e) => onClick ? onClick(e) : navigate(path)}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors duration-200 relative",
                "touch-manipulation select-none",
                active
                  ? "text-primary"
                  : "text-muted-foreground active:text-primary"
              )}
            >
              <div className="relative">
                <motion.div
                  initial={false}
                  animate={active ? { scale: 1.1, y: -2 } : { scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <Icon className={cn(
                    "transition-all duration-200",
                    active ? "w-6 h-6 stroke-[2.5px]" : "w-5 h-5 stroke-[1.8px]"
                  )} />
                </motion.div>
                
                <AnimatePresence>
                  {badge !== undefined && badge > 0 && (
                    <motion.span 
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute -top-1.5 -right-2 bg-promo text-white text-[9px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-md"
                    >
                      {badge > 99 ? "99+" : badge}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              
              <span className={cn(
                "text-[10px] font-medium tracking-tight transition-all duration-200",
                active ? "font-semibold" : ""
              )}>
                {label}
              </span>
              
              {/* Active indicator */}
              <AnimatePresence>
                {active && (
                  <motion.div
                    layoutId="activeTab"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute -top-0.5 w-8 h-1 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};
