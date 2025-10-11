import { useNavigate, useLocation } from "react-router-dom";
import { Home, Search, MessageSquare, ShoppingCart, User } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { cn } from "@/lib/utils";

export const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { unreadMessages, cartItems } = useRealtimeNotifications();

  // Ne s'affiche que sur mobile et tablette
  if (!isMobile) return null;

  const handleHomeClick = () => {
    if (location.pathname === "/") {
      // Si déjà sur la page d'accueil, scroll en haut et refresh
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } else {
      navigate("/");
    }
  };

  const navItems = [
    { icon: Home, label: "Accueil", path: "/", onClick: handleHomeClick },
    { icon: Search, label: "Catégories", path: "/categories" },
    { icon: MessageSquare, label: "Messagerie", path: "/messages", badge: unreadMessages },
    { icon: ShoppingCart, label: "Panier", path: "/cart", badge: cartItems },
    { icon: User, label: "Mon Djassa", path: "/buyer-dashboard" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border shadow-lg md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ icon: Icon, label, path, badge, onClick }) => (
          <button
            key={path}
            onClick={() => onClick ? onClick() : navigate(path)}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors relative",
              isActive(path)
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="relative">
              <Icon className="w-6 h-6" />
              {badge > 0 && (
                <span className="absolute -top-2 -right-2 bg-promo text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </div>
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};
