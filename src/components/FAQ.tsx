import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

const FAQ = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  const faqCategories = [
    {
      category: "Commandes",
      questions: [
        {
          question: "Comment passer une commande sur Djassa ?",
          answer: "Connectez-vous à votre compte, choisissez un produit, ajoutez-le au panier et suivez les étapes de paiement sécurisé."
        },
        {
          question: "Comment suivre ma commande ?",
          answer: "Rendez-vous dans votre espace 'Mes commandes' pour voir le statut (en attente, expédié, livré)."
        },
        {
          question: "Puis-je modifier ou annuler ma commande ?",
          answer: "Vous pouvez modifier votre commande avant la confirmation du paiement. Une fois expédiée, contactez le support pour toute modification."
        }
      ]
    },
    {
      category: "Paiement",
      questions: [
        {
          question: "Quels sont les modes de paiement acceptés ?",
          answer: "Nous acceptons le mobile money (Orange Money, MTN Mobile Money, Moov), les cartes bancaires, et bientôt PayPal."
        },
        {
          question: "Mes paiements sont-ils sécurisés ?",
          answer: "Oui, tous les paiements passent par un système sécurisé avec chiffrement SSL. Vos données financières sont protégées."
        },
        {
          question: "Que faire si mon paiement échoue ?",
          answer: "Vérifiez votre solde ou les informations de votre carte. Si le problème persiste, contactez notre support client."
        }
      ]
    },
    {
      category: "Livraison",
      questions: [
        {
          question: "Comment fonctionne la livraison ?",
          answer: "Les vendeurs choisissent le mode de livraison (livraison locale, envoi par transporteur). Vous voyez les frais avant de valider votre commande."
        },
        {
          question: "Quels sont les délais de livraison ?",
          answer: "Généralement 2-5 jours en Côte d'Ivoire, selon votre localisation et le mode de livraison choisi par le vendeur."
        },
        {
          question: "Puis-je changer l'adresse de livraison ?",
          answer: "Oui, avant expédition. Contactez le vendeur ou le support pour modifier l'adresse de livraison."
        }
      ]
    },
    {
      category: "Retours",
      questions: [
        {
          question: "Quelle est la politique de retour ?",
          answer: "Nous offrons une garantie 'Satisfait ou remboursé'. Les retours sont possibles sous certaines conditions définies par chaque vendeur."
        },
        {
          question: "Comment effectuer un retour ?",
          answer: "Contactez le vendeur directement via la messagerie ou notre support client pour initier un retour."
        }
      ]
    },
    {
      category: "Compte",
      questions: [
        {
          question: "Comment créer un compte ?",
          answer: "Cliquez sur 'S'inscrire', remplissez vos informations (nom, email, téléphone) puis validez. Un email ou SMS de confirmation vous sera envoyé."
        },
        {
          question: "L'inscription est-elle gratuite ?",
          answer: "Oui, l'inscription est gratuite et vous bénéficiez de 28 jours d'essai gratuit avant de choisir une formule premium."
        },
        {
          question: "Puis-je utiliser Djassa sans compte ?",
          answer: "Vous pouvez consulter les annonces, mais pour acheter ou vendre, vous devez créer un compte."
        }
      ]
    },
    {
      category: "Vendeurs",
      questions: [
        {
          question: "Comment publier un produit à vendre ?",
          answer: "Connectez-vous à votre compte vendeur, cliquez sur 'Ajouter un produit', téléchargez vos photos et renseignez les détails (prix, description)."
        },
        {
          question: "Y a-t-il des frais de vente ?",
          answer: "Djassa prélève une petite commission sur chaque vente (visible avant validation de la commande)."
        },
        {
          question: "Comment devenir vendeur premium ?",
          answer: "Allez dans 'Mon compte > Abonnement', choisissez votre formule premium et effectuez le paiement pour plus de visibilité."
        }
      ]
    },
    {
      category: "Sécurité",
      questions: [
        {
          question: "Comment éviter les arnaques ?",
          answer: "Ne validez jamais un paiement en dehors de la plateforme Djassa. Utilisez uniquement les moyens de paiement sécurisés intégrés."
        },
        {
          question: "Que faire en cas de problème avec un vendeur ?",
          answer: "Contactez le support via le bouton 'Assistance' dans votre espace client. Nous interviendrons pour résoudre le conflit."
        },
        {
          question: "Comment signaler un contenu inapproprié ?",
          answer: "Utilisez le bouton de signalement sur chaque produit ou contactez directement notre équipe de modération."
        }
      ]
    }
  ];

  return (
    <section className="py-8 sm:py-12 bg-background">
      <div className="container mx-auto px-3 sm:px-4">
        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
          className="max-w-6xl mx-auto"
        >
          <CollapsibleTrigger className="w-full group">
            <div className="flex items-center justify-between p-4 sm:p-6 bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 border border-primary/20 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md">
              <div className="text-left flex-1">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-1">
                  Questions Fréquemment Posées (FAQ)
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Trouvez rapidement des réponses à vos questions
                </p>
              </div>
              <ChevronDown className={`h-6 w-6 sm:h-7 sm:w-7 text-primary transition-transform duration-300 flex-shrink-0 ml-4 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="overflow-hidden transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
            <div className="pt-6">
              <Tabs defaultValue="Commandes" className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7 mb-8 h-auto p-1 bg-muted/50">
                  {faqCategories.map((category) => (
                    <TabsTrigger
                      key={category.category}
                      value={category.category}
                      className="text-xs sm:text-sm font-medium py-2 px-2 sm:px-4 data-[state=active]:bg-background data-[state=active]:text-foreground"
                    >
                      {category.category}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {faqCategories.map((category) => (
                  <TabsContent key={category.category} value={category.category} className="mt-0">
                    <Accordion type="single" collapsible className="space-y-3">
                      {category.questions.map((faq, index) => (
                        <AccordionItem
                          key={index}
                          value={`${category.category}-${index}`}
                          className="border rounded-lg bg-card hover:bg-accent/5 transition-colors"
                        >
                          <AccordionTrigger className="text-left font-medium hover:no-underline px-4 py-3">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground leading-relaxed px-4 pb-4">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </TabsContent>
                ))}
              </Tabs>

              <div className="text-center mt-8 pt-6 border-t">
                <p className="text-muted-foreground mb-4">
                  Vous ne trouvez pas la réponse à votre question ?
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a
                    href="mailto:support@djassa.ci"
                    className="inline-flex items-center justify-center px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Contacter le Support
                  </a>
                  <a
                    href="https://wa.me/225788281222?text=Bonjour%20%F0%9F%91%8B%2C%20je%20viens%20de%20Djassa%20et%20j%27aimerais%20parler%20avec%20le%20support."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-6 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
                  >
                    WhatsApp Support
                  </a>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </section>
  );
};

export default FAQ;