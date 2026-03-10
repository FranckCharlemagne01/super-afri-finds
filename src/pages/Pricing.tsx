import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Store,
  Shield,
  CheckCircle2,
  Wallet,
  Crown,
  User,
  ShoppingBag,
  ClipboardList,
  BarChart3,
  Eye,
  Coins,
} from "lucide-react";

const Pricing = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Tarifs Djassa - Abonnements vendeurs et commissions</title>
        <meta
          name="description"
          content="Découvrez les tarifs de Djassa : comptes vendeurs Particulier, Pro et Premium. Commissions transparentes et système de Compte Djassa simple."
        />
        <meta property="og:title" content="Tarifs Djassa - Plans vendeurs et commissions" />
        <meta property="og:description" content="Comparez les plans vendeurs Djassa : Particulier (gratuit), Pro (10 000 FCFA/mois) et Premium (25 000 FCFA/mois)." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://djassa.djassa.tech/tarifs" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-card shadow-sm border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="min-w-[44px] min-h-[44px]">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl md:text-2xl font-bold text-primary">Tarifs Djassa</h1>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="bg-primary py-14 md:py-20">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h2 className="text-3xl md:text-5xl font-extrabold text-primary-foreground mb-6">
              Tarifs et fonctionnement 💰
            </h2>
            <p className="text-lg md:text-xl text-primary-foreground/90 leading-relaxed">
              Djassa propose plusieurs types de comptes vendeurs pour s'adapter aux besoins des particuliers, des commerçants et des entreprises.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-12 max-w-5xl space-y-20">

          {/* Section 1 : Types de comptes */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="w-8 h-8 text-primary flex-shrink-0" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Types de comptes vendeurs</h2>
            </div>
            <p className="text-muted-foreground mb-8">
              Choisissez le plan qui correspond à votre activité. Vous pouvez évoluer à tout moment.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Particulier */}
              <Card className="border-border relative overflow-hidden">
                <div className="h-1.5 bg-muted-foreground/30" />
                <CardHeader className="text-center pb-2">
                  <User className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <CardTitle className="text-xl">Particulier</CardTitle>
                  <p className="text-2xl font-extrabold text-foreground mt-2">Gratuit</p>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-foreground/80">
                  {[
                    "Vente occasionnelle",
                    "Jusqu'à 10 produits",
                    "Commission Djassa : 15 %",
                    "Abonnement : gratuit",
                  ].map((t) => (
                    <div key={t} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{t}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Pro */}
              <Card className="border-primary relative overflow-hidden shadow-lg ring-2 ring-primary/20">
                <div className="h-1.5 bg-primary" />
                <div className="absolute top-4 right-4">
                  <span className="text-[10px] font-bold uppercase bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    Populaire
                  </span>
                </div>
                <CardHeader className="text-center pb-2">
                  <Store className="w-10 h-10 text-primary mx-auto mb-2" />
                  <CardTitle className="text-xl">Pro</CardTitle>
                  <p className="text-2xl font-extrabold text-foreground mt-2">
                    10 000 <span className="text-sm font-normal text-muted-foreground">FCFA/mois</span>
                  </p>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-foreground/80">
                  {[
                    "Vendeurs réguliers & petites boutiques",
                    "Jusqu'à 100 produits",
                    "Commission Djassa : 10 %",
                    "Abonnement : 10 000 FCFA / mois",
                  ].map((t) => (
                    <div key={t} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{t}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Premium */}
              <Card className="border-border relative overflow-hidden">
                <div className="h-1.5 bg-accent" />
                <CardHeader className="text-center pb-2">
                  <Crown className="w-10 h-10 text-accent-foreground mx-auto mb-2" />
                  <CardTitle className="text-xl">Premium</CardTitle>
                  <p className="text-2xl font-extrabold text-foreground mt-2">
                    25 000 <span className="text-sm font-normal text-muted-foreground">FCFA/mois</span>
                  </p>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-foreground/80">
                  {[
                    "Grandes boutiques & entreprises",
                    "Produits illimités",
                    "Commission Djassa : 5 %",
                    "Abonnement : 25 000 FCFA / mois",
                  ].map((t) => (
                    <div key={t} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{t}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Section 2 : Compte Djassa */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Wallet className="w-8 h-8 text-primary flex-shrink-0" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Le Compte Djassa</h2>
            </div>
            <Card className="border-primary/20">
              <CardContent className="pt-6 space-y-5 text-foreground/90 text-base leading-relaxed">
                <p>
                  Chaque vendeur possède un <strong>Compte Djassa</strong> dans son tableau de bord. Ce compte permet de gérer facilement les commissions de la plateforme.
                </p>
                <div className="bg-muted/50 rounded-xl p-5 space-y-4">
                  <h3 className="font-semibold text-foreground">Fonctionnement :</h3>
                  <div className="space-y-3">
                    {[
                      { icon: Eye, text: "Consultez votre solde disponible à tout moment." },
                      { icon: Coins, text: "Rechargez votre compte depuis votre tableau de bord." },
                      { icon: ShoppingBag, text: "Lorsqu'un produit est publié ou vendu, la commission est calculée selon le prix." },
                      { icon: Wallet, text: "La commission est automatiquement déduite de votre Compte Djassa." },
                    ].map(({ icon: Icon, text }, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm md:text-base">{text}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ce système garantit un fonctionnement transparent et prévisible pour tous les utilisateurs de la plateforme.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Section 3 : Transparence */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-8 h-8 text-primary flex-shrink-0" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Transparence et suivi</h2>
            </div>
            <Card className="border-primary/20">
              <CardContent className="pt-6 space-y-4 text-foreground/90 text-base leading-relaxed">
                <p>
                  Djassa met à disposition un tableau de bord complet permettant aux vendeurs de suivre clairement toute leur activité :
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { icon: ShoppingBag, label: "Produits publiés" },
                    { icon: ClipboardList, label: "Commandes reçues" },
                    { icon: BarChart3, label: "Commissions détaillées" },
                    { icon: Wallet, label: "Solde Compte Djassa" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Icon className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-sm font-medium text-foreground">{label}</span>
                    </div>
                  ))}
                </div>
                <p>
                  Pas de frais cachés, pas de surprises. Tout est visible dans votre espace vendeur pour une gestion sereine et transparente.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* CTA */}
          <section className="text-center py-14 bg-primary rounded-2xl">
            <h2 className="text-2xl md:text-3xl font-extrabold text-primary-foreground mb-4">
              Prêt à vendre sur Djassa ? 🚀
            </h2>
            <p className="text-primary-foreground/90 mb-8 max-w-2xl mx-auto px-4">
              Créez votre compte gratuitement et commencez à publier vos produits dès aujourd'hui.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="bg-card text-primary hover:bg-card/90 font-bold shadow-lg text-base px-8"
            >
              Commencer à vendre sur Djassa
            </Button>
          </section>
        </div>

        {/* Footer */}
        <footer className="border-t border-border bg-muted/30 py-8 mt-16">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm text-muted-foreground">© 2025 Djassa. Tous droits réservés.</p>
            <p className="text-xs text-muted-foreground mt-2">
              <button onClick={() => navigate("/about")} className="underline hover:text-foreground transition-colors">
                À propos
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

export default Pricing;
