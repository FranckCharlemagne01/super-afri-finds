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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

export const MobileFooterMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Données FAQ structurées par catégorie
  const faqCategories = [
    {
      category: "Compte",
      questions: [
        {
          question: "Comment créer un compte sur Djassa ?",
          answer: "Cliquez sur 'S'inscrire', remplissez vos informations (nom, email, téléphone), puis validez. Vous recevrez un email ou SMS de confirmation pour activer votre compte."
        },
        {
          question: "Est-ce que l'inscription est gratuite ?",
          answer: "Oui, l'inscription est 100 % gratuite, et vous bénéficiez de 28 jours d'essai gratuit avec 50 jetons offerts pour publier vos produits."
        },
        {
          question: "Puis-je utiliser Djassa sans compte ?",
          answer: "Vous pouvez consulter les produits librement, mais pour acheter, vendre ou créer une boutique, il faut avoir un compte utilisateur."
        }
      ]
    },
    {
      category: "Achat",
      questions: [
        {
          question: "Comment acheter un produit sur Djassa ?",
          answer: "Connectez-vous, choisissez un produit, ajoutez-le au panier et suivez les étapes de paiement sécurisé."
        },
        {
          question: "Quels sont les modes de paiement disponibles ?",
          answer: "Orange Money, MTN Mobile Money, Moov Money, carte bancaire, et bientôt PayPal. Tous les paiements passent par Paystack (test ou live)."
        },
        {
          question: "Comment suivre ma commande ?",
          answer: "Allez dans 'Mes commandes' pour voir l'état de votre achat (en attente, expédié, livré)."
        }
      ]
    },
    {
      category: "Vente",
      questions: [
        {
          question: "Comment vendre sur Djassa ?",
          answer: "Créez un compte vendeur et accédez à votre tableau de bord vendeur. Vous pouvez alors ajouter vos produits et gérer vos ventes depuis un espace professionnel."
        },
        {
          question: "Est-ce que je peux créer ma propre boutique ?",
          answer: "Oui ! Avec Djassa, chaque vendeur peut créer sa boutique personnalisée avec un nom, une catégorie principale et un lien unique vers sa boutique."
        },
        {
          question: "Comment obtenir plus de jetons ?",
          answer: "Vous pouvez acheter des jetons depuis votre tableau de bord via Paystack. Après paiement, vos jetons sont crédités automatiquement."
        }
      ]
    },
    {
      category: "Livraison",
      questions: [
        {
          question: "Comment se passe la livraison ?",
          answer: "Les vendeurs choisissent leur mode de livraison (locale, transporteur, remise en main propre). L'acheteur voit les frais de livraison avant de confirmer sa commande."
        },
        {
          question: "Quels sont les délais de livraison ?",
          answer: "Généralement 2-5 jours en Côte d'Ivoire, selon votre localisation et le mode de livraison choisi par le vendeur."
        }
      ]
    },
    {
      category: "Sécurité",
      questions: [
        {
          question: "Mes paiements sont-ils sécurisés ?",
          answer: "Oui, toutes les transactions passent par Paystack avec un chiffrement SSL. Djassa ne conserve jamais vos informations bancaires."
        },
        {
          question: "Comment éviter les arnaques ?",
          answer: "Ne payez jamais en dehors de la plateforme. Djassa garantit la sécurité des paiements et la transparence entre vendeurs et acheteurs."
        }
      ]
    }
  ];

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
            {/* FAQ - Questions Fréquemment Posées */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b">
                <HelpCircle className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-lg">FAQ</h3>
              </div>
              <Accordion type="single" collapsible className="pl-2 space-y-2">
                {faqCategories.map((category, catIndex) => (
                  <div key={catIndex} className="space-y-2">
                    <h4 className="font-medium text-sm text-foreground pt-2">{category.category}</h4>
                    {category.questions.map((faq, qIndex) => (
                      <AccordionItem
                        key={`${catIndex}-${qIndex}`}
                        value={`faq-${catIndex}-${qIndex}`}
                        className="border-none"
                      >
                        <AccordionTrigger className="text-sm text-muted-foreground hover:text-primary py-2 hover:no-underline">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground pb-2">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </div>
                ))}
              </Accordion>
            </section>

            {/* Assistance */}
            <section className="space-y-3">
              <h3 className="font-semibold text-lg pb-2 border-b">Assistance</h3>
              <div className="space-y-2 pl-2">
                <button className="text-sm text-muted-foreground hover:text-primary transition-colors block w-full text-left py-2">
                  Centre d'aide
                </button>
                <button className="text-sm text-muted-foreground hover:text-primary transition-colors block w-full text-left py-2">
                  Support 24/7
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
