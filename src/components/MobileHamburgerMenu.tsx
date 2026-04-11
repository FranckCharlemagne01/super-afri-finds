import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, HelpCircle, Info, Phone, MapPin, CreditCard } from "lucide-react";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "framer-motion";

export const MobileHamburgerMenu = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const menuItems = [
    { icon: HelpCircle, label: "Assistance", path: "/support" },
    { icon: Info, label: "Informations", path: "/about" },
    { icon: Phone, label: "Contact", path: "/support" },
    { icon: MapPin, label: "Abidjan, Côte d'Ivoire", path: "/categories" },
    { icon: CreditCard, label: "Paiement & Livraison", path: "/tarifs" },
  ];

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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-[100]"
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-background z-[101] shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-border/50">
                <span className="text-lg font-bold gradient-text-primary">Djassa</span>
                <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full" onClick={() => setOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <nav className="flex-1 overflow-y-auto py-4 px-3">
                {menuItems.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => go(item.path)}
                    className="flex items-center gap-3.5 w-full px-3 py-3.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted active:bg-muted/80 transition-colors touch-manipulation"
                  >
                    <item.icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    {item.label}
                  </button>
                ))}
              </nav>

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
