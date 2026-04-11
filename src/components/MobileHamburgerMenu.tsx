import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Menu, X, Home, ShoppingBag, Info, HelpCircle, CreditCard, Truck, LogIn, LogOut, User, Settings, Store } from "lucide-react";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "framer-motion";

export const MobileHamburgerMenu = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const menuItems = [
    { icon: Home, label: "Accueil", path: "/marketplace" },
    { icon: ShoppingBag, label: "Produits", path: "/categories" },
    { icon: CreditCard, label: "Tarifs", path: "/tarifs" },
    { icon: Truck, label: "Livraison", path: "/livraison" },
    { icon: Info, label: "À propos", path: "/about" },
    { icon: HelpCircle, label: "Support", path: "/support" },
  ];

  const userItems = user
    ? [
        { icon: User, label: "Mon compte", path: "/buyer-dashboard" },
        { icon: Store, label: "Ma boutique", path: "/seller-dashboard" },
        { icon: Settings, label: "Paramètres", path: "/buyer-dashboard" },
      ]
    : [{ icon: LogIn, label: "Se connecter", path: "/auth" }];

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="w-10 h-10 p-0 rounded-full"
        onClick={() => setOpen(true)}
      >
        <Menu className="w-5 h-5" />
      </Button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-[100]"
              onClick={() => setOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-background z-[101] shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-border/50">
                <span className="text-lg font-bold gradient-text-primary">Djassa</span>
                <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full" onClick={() => setOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto py-2">
                <div className="px-3 pb-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-3 py-2">Navigation</p>
                  {menuItems.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => go(item.path)}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted active:bg-muted/80 transition-colors touch-manipulation"
                    >
                      <item.icon className="w-4.5 h-4.5 text-muted-foreground" />
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="border-t border-border/50 mx-3 my-1" />

                <div className="px-3 pt-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-3 py-2">Compte</p>
                  {userItems.map((item) => (
                    <button
                      key={item.path + item.label}
                      onClick={() => go(item.path)}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted active:bg-muted/80 transition-colors touch-manipulation"
                    >
                      <item.icon className="w-4.5 h-4.5 text-muted-foreground" />
                      {item.label}
                    </button>
                  ))}

                  {user && (
                    <button
                      onClick={() => {
                        setOpen(false);
                        signOut();
                      }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 active:bg-destructive/20 transition-colors mt-1 touch-manipulation"
                    >
                      <LogOut className="w-4.5 h-4.5" />
                      Déconnexion
                    </button>
                  )}
                </div>
              </nav>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-border/50 text-center">
                <p className="text-[10px] text-muted-foreground">Djassa © 2025 — Marketplace Africaine</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
