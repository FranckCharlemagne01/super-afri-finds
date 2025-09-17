import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const LegalNotice = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </Button>
          <h1 className="text-3xl font-bold text-foreground">
            Mentions légales et Politique de confidentialité
          </h1>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Mentions légales */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6 pb-2 border-b">
            Mentions légales
          </h2>
          
          <div className="space-y-4 text-muted-foreground">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Nom du site</h3>
              <p>Djassa – Marketplace africaine</p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Éditeur du site</h3>
              <p>Djassa SARL</p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Adresse du siège social</h3>
              <p>Abidjan, Côte d'Ivoire</p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Téléphone</h3>
              <p>+225 07 88281222</p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Email</h3>
              <p>support@djassa.com</p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Directeur de publication</h3>
              <p>Boza Franck</p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Hébergeur</h3>
              <p>LWS (Ligne Web Services) – Adresse : Paris, France</p>
            </div>
          </div>
        </section>

        {/* Politique de confidentialité */}
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-6 pb-2 border-b">
            Politique de confidentialité
          </h2>
          
          <div className="space-y-6 text-muted-foreground">
            <div>
              <h3 className="font-semibold text-foreground mb-3">Données collectées</h3>
              <p>
                Nous collectons les données suivantes : nom, email, téléphone, adresse, 
                données de paiement (non stockées directement sur nos serveurs), cookies 
                et données de navigation.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Finalités du traitement</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Gestion des comptes utilisateurs</li>
                <li>Traitement des commandes et des paiements</li>
                <li>Organisation des livraisons</li>
                <li>Support client et assistance</li>
                <li>Personnalisation de l'expérience utilisateur</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Base légale</h3>
              <p>
                Le traitement de vos données se base sur : l'exécution du contrat, 
                votre consentement et notre intérêt légitime à améliorer nos services.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Durée de conservation</h3>
              <p>
                Vos données sont conservées pendant toute la durée d'utilisation de votre compte 
                et jusqu'à 3 ans après la dernière activité, conformément aux obligations légales.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Destinataires des données</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Vendeurs partenaires (pour les commandes)</li>
                <li>Prestataires de paiement (Paystack, Mobile Money, cartes bancaires)</li>
                <li>Partenaires de livraison et de logistique</li>
                <li>Prestataires techniques pour la maintenance du site</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Vos droits</h3>
              <p className="mb-3">
                Conformément à la réglementation en vigueur, vous disposez des droits suivants :
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Droit d'accès à vos données personnelles</li>
                <li>Droit de rectification des données inexactes</li>
                <li>Droit de suppression de vos données</li>
                <li>Droit d'opposition au traitement</li>
                <li>Droit de retrait du consentement</li>
              </ul>
              <p className="mt-3">
                Pour exercer ces droits, contactez-nous à : support@djassa.com
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Sécurité des données</h3>
              <p>
                Nous mettons en place des mesures de sécurité appropriées : cryptage des données sensibles, 
                authentification renforcée, protection contre la fraude et surveillance continue de nos systèmes.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Cookies</h3>
              <p>
                Notre site utilise des cookies pour améliorer la navigation, analyser l'audience 
                et personnaliser le contenu. Vous pouvez désactiver les cookies via les paramètres 
                de votre navigateur, mais cela peut affecter certaines fonctionnalités du site.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Responsable du traitement</h3>
              <div className="space-y-1">
                <p><strong>Djassa SARL</strong></p>
                <p>Email : support@djassa.com</p>
                <p>Téléphone : +225 07 88281222</p>
              </div>
            </div>

            <div className="mt-8 p-4 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>Dernière mise à jour :</strong> Janvier 2025
              </p>
              <p className="text-sm mt-2">
                Cette politique de confidentialité peut être modifiée à tout moment. 
                Les utilisateurs seront informés de toute modification substantielle.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LegalNotice;