import { useState, useEffect } from "react";
import { Menu, Mail, Phone, MapPin, CreditCard, Truck, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

export const MobileFooterMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Afficher uniquement sur mobile/tablette
  if (!isMobile) return null;

  // Vérifier si c'est la première ouverture
  useEffect(() => {
    if (isOpen) {
      const hasSeenWelcome = sessionStorage.getItem("djassa_footer_welcome_seen");
      if (!hasSeenWelcome) {
        setShowWelcome(true);
        sessionStorage.setItem("djassa_footer_welcome_seen", "true");
        
        // Masquer le message après 3 secondes
        setTimeout(() => setShowWelcome(false), 3000);
      }
    }
  }, [isOpen]);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 text-primary hover:text-primary/90 px-2"
      >
        <Menu className="w-5 h-5" />
        <span className="text-sm font-medium">Menu</span>
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent 
          side="bottom" 
          className="h-[85vh] overflow-y-auto rounded-t-3xl"
        >
          <SheetHeader className="pb-4">
            <SheetTitle className="text-2xl font-bold text-primary">
              Menu Djassa
            </SheetTitle>
            <SheetDescription>
              Toutes les informations et liens utiles
            </SheetDescription>
          </SheetHeader>

          {/* Message de bienvenue animé */}
          {showWelcome && (
            <div className="mb-4 p-4 bg-primary/10 rounded-lg border border-primary/20 animate-fade-in">
              <p className="text-center text-primary font-medium">
                👋 Bienvenue sur Djassa !
              </p>
            </div>
          )}

          <div className="space-y-6 pb-6">
            {/* Questions Fréquemment Posées */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b">
                <HelpCircle className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-lg">Questions Fréquemment Posées</h3>
              </div>
              <div className="space-y-2 pl-2">
                <button className="text-sm text-muted-foreground hover:text-primary transition-colors block w-full text-left py-2">
                  Centre d'aide
                </button>
                <button className="text-sm text-muted-foreground hover:text-primary transition-colors block w-full text-left py-2">
                  Support 24/7
                </button>
                <button className="text-sm text-muted-foreground hover:text-primary transition-colors block w-full text-left py-2">
                  FAQ
                </button>
              </div>
            </section>

            {/* Informations */}
            <section className="space-y-3">
              <h3 className="font-semibold text-lg pb-2 border-b">Informations</h3>
              <div className="space-y-2 pl-2">
                <button
                  onClick={() => {
                    navigate("/legal");
                    setIsOpen(false);
                  }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors block w-full text-left py-2"
                >
                  Politique de confidentialité
                </button>
                <button
                  onClick={() => {
                    navigate("/legal");
                    setIsOpen(false);
                  }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors block w-full text-left py-2"
                >
                  Mentions légales
                </button>
                <button className="text-sm text-muted-foreground hover:text-primary transition-colors block w-full text-left py-2">
                  CGV
                </button>
              </div>
            </section>

            {/* Contact */}
            <section className="space-y-3">
              <h3 className="font-semibold text-lg pb-2 border-b">Contact</h3>
              <div className="space-y-3 pl-2">
                <a
                  href="mailto:djassa@djassa.tech"
                  className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors py-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>djassa@djassa.tech</span>
                </a>
                <a
                  href="https://wa.me/2250788281222"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors py-2"
                >
                  <Phone className="w-4 h-4" />
                  <span>+225 07 88 28 12 22</span>
                </a>
                <div className="flex items-center gap-3 text-sm text-muted-foreground py-2">
                  <MapPin className="w-4 h-4" />
                  <span>Abidjan, Côte d'Ivoire</span>
                </div>
              </div>
            </section>

            {/* Paiement & Livraison */}
            <section className="space-y-3">
              <h3 className="font-semibold text-lg pb-2 border-b">Paiement & Livraison</h3>
              <div className="space-y-3 pl-2">
                <div className="flex items-center gap-3 text-sm text-muted-foreground py-2">
                  <CreditCard className="w-4 h-4" />
                  <div className="space-y-1">
                    <div>Orange Money</div>
                    <div>MTN Mobile Money</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground py-2">
                  <Truck className="w-4 h-4" />
                  <span>Livraison 2-5 jours</span>
                </div>
              </div>
            </section>

            {/* Copyright */}
            <div className="pt-4 border-t text-center">
              <p className="text-xs text-muted-foreground">
                © 2025 Djassa. Tous droits réservés.
                <br />
                Plateforme de commerce en ligne en Côte d'Ivoire.
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
