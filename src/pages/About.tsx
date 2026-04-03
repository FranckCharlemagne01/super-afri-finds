import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Store,
  Users,
  Globe,
  Heart,
  Target,
  Eye,
  MapPin,
  Handshake,
  Truck,
  Cpu,
  Briefcase,
  ShoppingBag,
} from "lucide-react";

const About = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>À propos de Djassa - Marketplace e-commerce locale</title>
        <meta
          name="description"
          content="Djassa est la marketplace dédiée au commerce local en Côte d'Ivoire et en Afrique. Découvrez notre mission, notre vision et nos partenariats."
        />
        <meta property="og:title" content="À propos de Djassa - Commerce local en ligne" />
        <meta property="og:description" content="Marketplace locale pour acheter et vendre en ligne en Côte d'Ivoire et en Afrique." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://djassa.djassa.tech/about" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-card shadow-sm border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="min-w-[44px] min-h-[44px]">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl md:text-2xl font-bold text-primary">À propos de Djassa</h1>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="bg-primary py-14 md:py-20">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h2 className="text-3xl md:text-5xl font-extrabold text-primary-foreground mb-6">
              Djassa — Le commerce africain, simplifié 🌍
            </h2>
            <p className="text-lg md:text-xl text-primary-foreground/90 leading-relaxed">
              La marketplace qui donne à chaque commerçant africain une boutique en ligne gratuite pour vendre localement et au-delà.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-12 max-w-5xl space-y-20">

          {/* Section 1 : Qu'est-ce que Djassa */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Globe className="w-8 h-8 text-primary flex-shrink-0" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Qu'est-ce que Djassa ?</h2>
            </div>
            <Card className="border-primary/20">
              <CardContent className="pt-6 space-y-4 text-foreground/90 text-base md:text-lg leading-relaxed">
                <p>
                  <strong>Djassa</strong> est une marketplace locale et internationale dédiée au commerce en Afrique. Elle permet aux commerçants de vendre leurs produits dans leur ville, leur région ou leur pays, tout en leur offrant une visibilité bien au-delà de leur zone habituelle.
                </p>
                <p>
                  Que vous soyez un vendeur de prêt-à-porter à Abidjan, un artisan à Dakar ou un grossiste à Douala, Djassa vous connecte directement avec vos clients — là où ils se trouvent.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Section 2 : Boutique gratuite */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Store className="w-8 h-8 text-primary flex-shrink-0" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Une boutique en ligne gratuite, dès l'inscription</h2>
            </div>
            <Card className="border-primary/20">
              <CardContent className="pt-6 space-y-4 text-foreground/90 text-base md:text-lg leading-relaxed">
                <p>
                  Dès que vous créez votre compte vendeur sur Djassa, <strong>une boutique en ligne professionnelle est automatiquement créée pour vous</strong> — gratuitement et prête à l'emploi.
                </p>
                <p>
                  Pas besoin de connaissances techniques. Ajoutez vos produits, personnalisez votre vitrine et commencez à vendre en quelques minutes. C'est aussi simple que ça.
                </p>
                <div className="grid sm:grid-cols-3 gap-4 pt-4">
                  {[
                    { icon: Users, label: "Inscription gratuite" },
                    { icon: Store, label: "Boutique automatique" },
                    { icon: ShoppingBag, label: "Vente immédiate" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 text-center">
                      <Icon className="w-8 h-8 text-primary" />
                      <span className="font-medium text-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Section 3 : Mission */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-8 h-8 text-primary flex-shrink-0" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Notre mission</h2>
            </div>
            <Card className="border-primary/20">
              <CardContent className="pt-6 space-y-4 text-foreground/90 text-base md:text-lg leading-relaxed">
                <p>
                  La mission de Djassa est simple : <strong>faciliter le commerce local en ligne en Afrique</strong>. Nous aidons les entrepreneurs à gérer facilement leurs produits, suivre leurs ventes en temps réel et développer leur activité — sans complexité technique, sans frais cachés.
                </p>
                <p>
                  Nous croyons que chaque commerçant, qu'il soit à ses débuts ou déjà établi, mérite des outils modernes et accessibles pour prospérer dans l'économie numérique.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Section 4 : À qui s'adresse Djassa */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <MapPin className="w-8 h-8 text-primary flex-shrink-0" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">À qui s'adresse Djassa ?</h2>
            </div>
            <Card className="border-primary/20">
              <CardContent className="pt-6 space-y-4 text-foreground/90 text-base md:text-lg leading-relaxed">
                <p>
                  Djassa est conçu pour <strong>tous les commerçants locaux africains</strong> — petits ou moyens — qui souhaitent digitaliser leur commerce et toucher plus de clients dans leur zone géographique.
                </p>
                <p>
                  Boutiques de quartier, vendeurs sur les marchés, artisans, revendeurs, créateurs de mode, commerçants de produits alimentaires… Si vous vendez un produit, Djassa est fait pour vous.
                </p>
                <div className="grid sm:grid-cols-2 gap-4 pt-4">
                  {[
                    { icon: Store, label: "Commerçants locaux", desc: "Vendez dans votre ville et votre région" },
                    { icon: Briefcase, label: "PME & entrepreneurs", desc: "Gérez votre activité avec des outils pro" },
                    { icon: Heart, label: "Artisans & créateurs", desc: "Montrez vos créations au monde entier" },
                    { icon: Users, label: "Revendeurs & grossistes", desc: "Touchez plus de clients, plus facilement" },
                  ].map(({ icon: Icon, label, desc }) => (
                    <div key={label} className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                      <Icon className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-foreground">{label}</span>
                        <p className="text-sm text-muted-foreground mt-1">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Section 5 : Partenariats */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Handshake className="w-8 h-8 text-primary flex-shrink-0" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Partenariats</h2>
            </div>
            <Card className="border-primary/20">
              <CardContent className="pt-6 space-y-4 text-foreground/90 text-base md:text-lg leading-relaxed">
                <p>
                  Djassa est ouvert aux partenariats pour renforcer l'écosystème du commerce local. Nous collaborons avec des acteurs variés pour offrir la meilleure expérience à nos utilisateurs.
                </p>
                <div className="grid sm:grid-cols-2 gap-4 pt-4">
                  {[
                    { icon: Store, label: "Commerçants", desc: "Vendez vos produits sur une plateforme moderne" },
                    { icon: Briefcase, label: "Entreprises locales", desc: "Développez votre présence en ligne" },
                    { icon: Truck, label: "Services de livraison", desc: "Devenez partenaire logistique de Djassa" },
                    { icon: Cpu, label: "Partenaires technologiques", desc: "Intégrez vos solutions à notre écosystème" },
                  ].map(({ icon: Icon, label, desc }) => (
                    <div key={label} className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                      <Icon className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-foreground">{label}</span>
                        <p className="text-sm text-muted-foreground mt-1">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-muted-foreground text-sm pt-2">
                  Vous souhaitez collaborer avec Djassa ? Contactez-nous pour explorer les opportunités de partenariat.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* CTA */}
          <section className="text-center py-14 bg-primary rounded-2xl">
            <Heart className="w-10 h-10 text-primary-foreground mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-extrabold text-primary-foreground mb-4">
              Rejoignez Djassa dès aujourd'hui
            </h2>
            <p className="text-primary-foreground/90 mb-8 max-w-2xl mx-auto px-4">
              Créez votre compte gratuitement ou devenez partenaire pour développer le commerce local ensemble.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="bg-card text-primary hover:bg-card/90 font-bold shadow-lg text-base px-8"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                Créer un compte
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/tarifs")}
                className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 font-bold text-base px-8"
              >
                <Eye className="w-5 h-5 mr-2" />
                Voir les tarifs
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/partner-dashboard")}
                className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 font-bold text-base px-8"
              >
                <Handshake className="w-5 h-5 mr-2" />
                Devenir partenaire
              </Button>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="border-t border-border bg-muted/30 py-8 mt-16">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm text-muted-foreground">© 2025 Djassa. Tous droits réservés.</p>
            <p className="text-xs text-muted-foreground mt-2">
              <button onClick={() => navigate("/tarifs")} className="underline hover:text-foreground transition-colors">
                Voir nos tarifs
              </button>
              {" · "}
              <button onClick={() => navigate("/legal")} className="underline hover:text-foreground transition-colors">
                Mentions légales
              </button>
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default About;
