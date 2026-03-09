import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  ShoppingBag,
  Store,
  Shield,
  Users,
  Zap,
  Globe,
  Heart,
  CheckCircle2,
  MessageCircle,
  ClipboardList,
  LayoutDashboard,
  UserPlus,
  Wallet,
  BarChart3,
  Crown,
  Briefcase,
  User,
} from "lucide-react";

const About = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>À propos de Djassa - Plateforme e-commerce Côte d'Ivoire & Afrique</title>
        <meta
          name="description"
          content="Djassa est la plateforme e-commerce de référence en Côte d'Ivoire et Afrique francophone. Achetez et vendez en ligne facilement. Découvrez nos plans vendeurs et notre système de commission transparent."
        />
        <meta property="og:title" content="À propos de Djassa - Marketplace e-commerce Côte d'Ivoire" />
        <meta property="og:description" content="Plateforme e-commerce innovante pour acheter et vendre en ligne en Côte d'Ivoire et en Afrique." />
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
              Bienvenue sur Djassa 🛍️
            </h2>
            <p className="text-lg md:text-xl text-primary-foreground/90 leading-relaxed">
              La marketplace locale qui connecte vendeurs et acheteurs en Côte d'Ivoire et en Afrique francophone. Simple, transparent et fiable.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-12 max-w-5xl space-y-20">

          {/* --- Section 1: Djassa et le marché local --- */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Globe className="w-8 h-8 text-primary flex-shrink-0" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Djassa et le marché local</h2>
            </div>
            <Card className="border-primary/20">
              <CardContent className="pt-6 space-y-4 text-foreground/90 text-base md:text-lg leading-relaxed">
                <p>
                  <strong>Djassa</strong> est une marketplace conçue pour le commerce local. Elle permet aux vendeurs — particuliers, petites boutiques ou entreprises — de publier leurs produits en ligne et d'atteindre plus de clients dans leur ville et leur région.
                </p>
                <p>
                  L'objectif est simple : faciliter la mise en relation entre vendeurs et acheteurs, offrir une vitrine moderne à chaque commerçant et rendre l'achat en ligne accessible à tous.
                </p>
                <div className="grid sm:grid-cols-3 gap-4 pt-4">
                  {[
                    { icon: Users, label: "Particuliers" },
                    { icon: Store, label: "Petites boutiques" },
                    { icon: Briefcase, label: "Entreprises locales" },
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

          {/* --- Section 2: Comment vendre sur Djassa --- */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <ShoppingBag className="w-8 h-8 text-primary flex-shrink-0" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Comment vendre sur Djassa</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { icon: UserPlus, title: "1. Créer un compte", desc: "Inscrivez-vous gratuitement en quelques secondes." },
                { icon: Zap, title: "2. Publier vos produits", desc: "Ajoutez vos articles avec photos, prix et description." },
                { icon: MessageCircle, title: "3. Discuter avec les clients", desc: "Utilisez le chat intégré pour répondre aux questions." },
                { icon: ClipboardList, title: "4. Confirmer les commandes", desc: "Validez les commandes reçues depuis votre espace." },
                { icon: LayoutDashboard, title: "5. Gérer vos ventes", desc: "Suivez tout depuis votre tableau de bord vendeur." },
              ].map(({ icon: Icon, title, desc }) => (
                <Card key={title} className="text-center border-border hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 pb-4 flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground text-sm">{title}</h3>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* --- Section 3: Types de comptes vendeurs --- */}
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

          {/* --- Section 4: Système de paiement et commissions --- */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Wallet className="w-8 h-8 text-primary flex-shrink-0" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Le système de paiement et les commissions</h2>
            </div>
            <Card className="border-primary/20">
              <CardContent className="pt-6 space-y-5 text-foreground/90 text-base leading-relaxed">
                <p>
                  Djassa utilise un système simple appelé <strong>Compte Djassa</strong>. Chaque vendeur possède un solde dans son Compte Djassa, utilisé pour payer les commissions de la plateforme.
                </p>
                <div className="bg-muted/50 rounded-xl p-5 space-y-4">
                  <h3 className="font-semibold text-foreground">Comment ça fonctionne :</h3>
                  <div className="space-y-3">
                    {[
                      "Le vendeur recharge son Compte Djassa depuis son tableau de bord.",
                      "Lorsqu'un produit est publié, la commission est calculée selon le prix du produit.",
                      "La commission est automatiquement déduite du Compte Djassa du vendeur.",
                      "Le vendeur peut suivre son solde et ses transactions en temps réel.",
                    ].map((t, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span className="text-sm md:text-base">{t}</span>
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

          {/* --- Section 5: Transparence et confiance --- */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-8 h-8 text-primary flex-shrink-0" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Transparence et confiance</h2>
            </div>
            <Card className="border-primary/20">
              <CardContent className="pt-6 space-y-4 text-foreground/90 text-base leading-relaxed">
                <p>
                  Djassa a pour ambition de créer une marketplace locale fiable, où chaque vendeur peut suivre en toute clarté l'ensemble de son activité :
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { icon: ShoppingBag, label: "Leurs produits publiés" },
                    { icon: ClipboardList, label: "Leurs commandes reçues" },
                    { icon: Heart, label: "Leurs commissions détaillées" },
                    { icon: Wallet, label: "Leur solde Compte Djassa" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Icon className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-sm font-medium text-foreground">{label}</span>
                    </div>
                  ))}
                </div>
                <p>
                  Tout est visible dans le tableau de bord vendeur : pas de frais cachés, pas de surprises. Notre objectif est de bâtir une relation de confiance durable avec chaque utilisateur.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* --- CTA --- */}
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
              Créer un compte et commencer à vendre
            </Button>
          </section>
        </div>

        {/* Footer */}
        <footer className="border-t border-border bg-muted/30 py-8 mt-16">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm text-muted-foreground">© 2025 Djassa. Tous droits réservés.</p>
            <p className="text-xs text-muted-foreground mt-2">Paiements sécurisés · Support disponible 24/7</p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default About;
