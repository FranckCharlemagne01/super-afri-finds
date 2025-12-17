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
import { ChevronDown, HelpCircle, Mail, MessageCircle } from "lucide-react";

const FAQ = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  const faqCategories = [
    {
      category: "Commandes",
      icon: "🛒",
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
      icon: "💳",
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
      icon: "🚚",
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
      icon: "↩️",
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
      icon: "👤",
      questions: [
        {
          question: "Comment créer un compte ?",
          answer: "Cliquez sur 'S'inscrire', remplissez vos informations (nom, email, téléphone) puis validez. Un email ou SMS de confirmation vous sera envoyé."
        },
        {
          question: "L'inscription est-elle gratuite ?",
          answer: "Oui, l'inscription est 100% gratuite. Les nouveaux utilisateurs reçoivent 100 jetons offerts, valables pendant 28 jours durant la phase de test de Djassa."
        },
        {
          question: "Que sont les jetons Djassa et comment fonctionnent-ils ?",
          answer: "Les jetons Djassa permettent de publier des produits et de booster leur visibilité. Les nouveaux utilisateurs reçoivent 100 jetons gratuits lors de leur inscription, valables pendant 28 jours. Ces jetons permettent de tester les fonctionnalités premium de la marketplace, notamment la mise en avant de produits."
        },
        {
          question: "Puis-je utiliser Djassa sans compte ?",
          answer: "Vous pouvez consulter les annonces, mais pour acheter ou vendre, vous devez créer un compte."
        }
      ]
    },
    {
      category: "Vendeurs",
      icon: "🏪",
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
      icon: "🔒",
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
    <section className="py-10 sm:py-16 lg:py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
          className="max-w-5xl mx-auto"
        >
          {/* Header modernisé */}
          <CollapsibleTrigger className="w-full group">
            <div className="flex items-center justify-between p-5 sm:p-6 lg:p-8 bg-card border border-border/50 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg hover:border-primary/30 group-hover:bg-accent/5">
              <div className="text-left flex-1 flex items-center gap-4 lg:gap-6">
                <div className="hidden sm:flex w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-primary/10 items-center justify-center flex-shrink-0">
                  <HelpCircle className="w-6 h-6 lg:w-7 lg:h-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-1 lg:mb-2">
                    Questions Fréquemment Posées
                  </h2>
                  <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
                    Trouvez rapidement des réponses à vos questions
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden lg:inline-block text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  {isOpen ? "Réduire" : "Voir les questions"}
                </span>
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <ChevronDown className={`h-5 w-5 lg:h-6 lg:w-6 text-primary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="overflow-hidden transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
            <div className="pt-8 lg:pt-10">
              <Tabs defaultValue="Commandes" className="w-full">
                {/* Tabs modernisés pour desktop */}
                <div className="mb-8 lg:mb-10">
                  <TabsList className="flex flex-wrap justify-center gap-2 lg:gap-3 h-auto p-2 lg:p-3 bg-card border border-border/50 rounded-2xl shadow-sm">
                    {faqCategories.map((category) => (
                      <TabsTrigger
                        key={category.category}
                        value={category.category}
                        className="text-xs sm:text-sm lg:text-base font-medium py-2.5 px-3 sm:px-4 lg:px-6 rounded-xl transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:hover:bg-muted/50 whitespace-nowrap"
                      >
                        <span className="mr-1.5 lg:mr-2">{category.icon}</span>
                        {category.category}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
                
                {faqCategories.map((category) => (
                  <TabsContent key={category.category} value={category.category} className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                    {/* Grille desktop à 2 colonnes pour les questions */}
                    <div className="lg:grid lg:grid-cols-2 lg:gap-6">
                      <Accordion type="single" collapsible className="space-y-3 lg:space-y-4">
                        {category.questions.slice(0, Math.ceil(category.questions.length / 2)).map((faq, index) => (
                          <AccordionItem
                            key={index}
                            value={`${category.category}-${index}`}
                            className="border border-border/50 rounded-xl bg-card hover:bg-accent/5 transition-all duration-200 hover:shadow-md hover:border-primary/20 overflow-hidden"
                          >
                            <AccordionTrigger className="text-left font-semibold hover:no-underline px-5 lg:px-6 py-4 lg:py-5 text-sm lg:text-base [&[data-state=open]]:bg-primary/5">
                              <span className="pr-4">{faq.question}</span>
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground leading-relaxed px-5 lg:px-6 pb-5 lg:pb-6 text-sm lg:text-base">
                              {faq.answer}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                      
                      {/* Deuxième colonne sur desktop */}
                      <Accordion type="single" collapsible className="space-y-3 lg:space-y-4 mt-3 lg:mt-0">
                        {category.questions.slice(Math.ceil(category.questions.length / 2)).map((faq, index) => (
                          <AccordionItem
                            key={index}
                            value={`${category.category}-col2-${index}`}
                            className="border border-border/50 rounded-xl bg-card hover:bg-accent/5 transition-all duration-200 hover:shadow-md hover:border-primary/20 overflow-hidden"
                          >
                            <AccordionTrigger className="text-left font-semibold hover:no-underline px-5 lg:px-6 py-4 lg:py-5 text-sm lg:text-base [&[data-state=open]]:bg-primary/5">
                              <span className="pr-4">{faq.question}</span>
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground leading-relaxed px-5 lg:px-6 pb-5 lg:pb-6 text-sm lg:text-base">
                              {faq.answer}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>

              {/* Section contact modernisée */}
              <div className="mt-10 lg:mt-14 pt-8 lg:pt-10 border-t border-border/50">
                <div className="text-center max-w-2xl mx-auto">
                  <div className="w-14 h-14 lg:w-16 lg:h-16 mx-auto mb-4 lg:mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <MessageCircle className="w-7 h-7 lg:w-8 lg:h-8 text-primary" />
                  </div>
                  <h3 className="text-lg lg:text-xl font-semibold text-foreground mb-2 lg:mb-3">
                    Besoin d'aide supplémentaire ?
                  </h3>
                  <p className="text-muted-foreground mb-6 lg:mb-8 text-sm lg:text-base">
                    Notre équipe support est disponible pour répondre à toutes vos questions
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 justify-center">
                    <a
                      href="mailto:support@djassa.ci"
                      className="inline-flex items-center justify-center gap-2.5 px-6 lg:px-8 py-3 lg:py-3.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-md font-medium text-sm lg:text-base"
                    >
                      <Mail className="w-4 h-4 lg:w-5 lg:h-5" />
                      Contacter par Email
                    </a>
                    <a
                      href="https://wa.me/225788281222?text=Bonjour%20%F0%9F%91%8B%2C%20je%20viens%20de%20Djassa%20et%20j%27aimerais%20parler%20avec%20le%20support."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2.5 px-6 lg:px-8 py-3 lg:py-3.5 bg-[#25D366] text-white rounded-xl hover:bg-[#22c55e] transition-all duration-200 shadow-sm hover:shadow-md font-medium text-sm lg:text-base"
                    >
                      <svg className="w-4 h-4 lg:w-5 lg:h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      WhatsApp Support
                    </a>
                  </div>
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
