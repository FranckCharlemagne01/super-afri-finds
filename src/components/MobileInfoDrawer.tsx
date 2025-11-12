import { Menu, HelpCircle, Shield, Mail, MessageCircle, MapPin, CreditCard, Truck, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";

export const MobileInfoDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // Afficher uniquement sur mobile/tablette
  if (!isMobile) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 text-primary hover:text-primary/90 px-2"
      >
        <Menu className="w-5 h-5" />
      </Button>
      
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent className="h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>Menu</DrawerTitle>
            <DrawerDescription>
              Informations et support Djassa
            </DrawerDescription>
          </DrawerHeader>
          
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-6 pb-6">
              {/* Assistance & Informations */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Assistance & Informations
                </h3>
                <div className="space-y-2 pl-6">
                  <button 
                    onClick={() => {
                      setIsOpen(false);
                      navigate("/about");
                    }}
                    className="block text-sm text-muted-foreground hover:text-foreground transition-colors text-left w-full"
                  >
                    À propos de Djassa
                  </button>
                  <button 
                    onClick={() => {
                      setIsOpen(false);
                      // FAQ sera visible une fois le drawer fermé sur mobile
                    }}
                    className="block text-sm text-muted-foreground hover:text-foreground transition-colors text-left w-full"
                  >
                    Questions Fréquemment Posées (FAQ)
                  </button>
                  <button className="block text-sm text-muted-foreground hover:text-foreground transition-colors text-left w-full">
                    Centre d'aide
                  </button>
                  <p className="text-sm text-muted-foreground">
                    Support 24/7
                  </p>
                </div>
              </div>

              <Separator />

              {/* Informations légales */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Informations légales
                </h3>
                <div className="space-y-2 pl-6">
                  <button 
                    onClick={() => {
                      setIsOpen(false);
                      navigate("/legal");
                    }}
                    className="block text-sm text-muted-foreground hover:text-foreground transition-colors text-left w-full"
                  >
                    Politique de confidentialité
                  </button>
                  <button 
                    onClick={() => {
                      setIsOpen(false);
                      navigate("/legal");
                    }}
                    className="block text-sm text-muted-foreground hover:text-foreground transition-colors text-left w-full"
                  >
                    Mentions légales
                  </button>
                  <button className="block text-sm text-muted-foreground hover:text-foreground transition-colors text-left w-full">
                    CGV
                  </button>
                </div>
              </div>

              <Separator />

              {/* Contact */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Contact
                </h3>
                <div className="space-y-2 pl-6">
                  <a 
                    href="mailto:djassa@djassa.tech" 
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    djassa@djassa.tech
                  </a>
                  <a 
                    href="https://wa.me/2250788281222" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    +225 07 88 28 12 22
                  </a>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" />
                    Abidjan, Côte d'Ivoire
                  </p>
                </div>
              </div>

              <Separator />

              {/* Paiement & Livraison */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Paiement & Livraison
                </h3>
                <div className="space-y-2 pl-6">
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CreditCard className="w-3.5 h-3.5" />
                    Orange Money
                  </p>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CreditCard className="w-3.5 h-3.5" />
                    MTN Mobile Money
                  </p>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Truck className="w-3.5 h-3.5" />
                    Livraison 2-5 jours
                  </p>
                </div>
              </div>

              <Separator />

              {/* Copyright */}
              <div className="pt-2 text-center">
                <p className="text-xs text-muted-foreground">
                  © 2025 Djassa. Tous droits réservés.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Plateforme de commerce en ligne en Côte d'Ivoire.
                </p>
              </div>
            </div>
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    </>
  );
};
