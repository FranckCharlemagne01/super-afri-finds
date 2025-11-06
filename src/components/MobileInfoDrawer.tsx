import { Menu, HelpCircle, Shield, FileText, ShoppingBag, Mail, MessageCircle, MapPin, CreditCard, Truck } from "lucide-react";
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

export const MobileInfoDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

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
              {/* Support & Aide */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  Support & Aide
                </h3>
                <div className="space-y-2 pl-6">
                  <a href="/faq" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Questions Fréquemment Posées (FAQ)
                  </a>
                  <a href="/support" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Centre d'aide
                  </a>
                  <p className="text-sm text-muted-foreground">
                    Support 24/7
                  </p>
                </div>
              </div>

              <Separator />

              {/* Légal */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Légal
                </h3>
                <div className="space-y-2 pl-6">
                  <a href="/privacy" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Politique de confidentialité
                  </a>
                  <a href="/legal" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Mentions légales
                  </a>
                  <a href="/terms" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                    CGV
                  </a>
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
                  <ShoppingBag className="w-4 h-4" />
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
            </div>
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    </>
  );
};
