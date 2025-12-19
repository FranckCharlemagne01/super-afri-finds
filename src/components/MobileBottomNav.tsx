import { useNavigate, useLocation } from "react-router-dom";
import { Home, Search, Bell, ShoppingCart, User } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { NotificationCenter } from "@/components/NotificationCenter";
import { useRef } from "react";

export const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { cartItems } = useRealtimeNotifications();
  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);

  // Ne s'affiche que sur mobile et tablette
  if (!isMobile) return null;

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
        // Si en bas, remonter en haut
        window.scrollTo({ top: 0, behavior: 'smooth' });
        toast({
          title: "Retour en haut",
          description: "Retour au début de la page",
          duration: 1500,
        });
      }
    } else {
      // Rediriger vers la page publique
      navigate("/marketplace");
      toast({
        title: "Retour à l'accueil",
        description: "Bienvenue sur la boutique publique",
        duration: 2000,
      });
    }
  };

  const handleNotificationClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowNotifications(prev => !prev);
  };

  const navItems = [
    { icon: Home, label: "Accueil", path: "/marketplace", onClick: handleHomeClick },
    { icon: Search, label: "Catégories", path: "/categories" },
    { icon: Bell, label: "Alertes", path: "/notifications", badge: unreadCount, onClick: handleNotificationClick, ref: bellRef },
    { icon: ShoppingCart, label: "Panier", path: "/cart", badge: cartItems },
    { icon: User, label: "Mon Djassa", path: "/buyer-dashboard" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border shadow-lg md:hidden">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map(({ icon: Icon, label, path, badge, onClick, ref }) => (
            <button
              key={path}
              ref={ref as any}
              onClick={(e) => onClick ? onClick(e) : navigate(path)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1.5 transition-all duration-200 relative active:scale-95 touch-manipulation",
                isActive(path)
                  ? "text-primary drop-shadow-md"
                  : "text-foreground/70 hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn(
                  "transition-all duration-200",
                  isActive(path) ? "w-7 h-7" : "w-6 h-6"
                )} />
                {badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-promo text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow-lg animate-pulse-slow">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[11px] font-extrabold tracking-tight",
                isActive(path) && "drop-shadow-sm"
              )}>{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Notification Center for mobile */}
      <NotificationCenter 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)}
        anchorRef={bellRef}
      />
    </>
  );
};
