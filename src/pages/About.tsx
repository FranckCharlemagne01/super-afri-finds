import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft, 
  ShoppingBag, 
  Store, 
  TrendingUp, 
  Shield, 
  Users, 
  Target,
  Zap,
  Award,
  Globe,
  Heart,
  Briefcase,
  CheckCircle2
} from "lucide-react";

const About = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>À propos de Djassa - Plateforme e-commerce Côte d'Ivoire & Afrique</title>
        <meta 
          name="description" 
          content="Djassa est la plateforme e-commerce de référence en Côte d'Ivoire et Afrique francophone. Achetez et vendez en ligne facilement. Essai gratuit 28 jours pour les vendeurs." 
        />
        <meta 
          name="keywords" 
          content="e-commerce Côte d'Ivoire, boutique en ligne Afrique, vendre en ligne, Djassa, marketplace ivoirienne, plateforme vente Abidjan, commerce électronique Afrique francophone, créer boutique en ligne, boost produits, Paystack paiement sécurisé" 
        />
        <meta property="og:title" content="À propos de Djassa - Marketplace e-commerce Côte d'Ivoire" />
        <meta property="og:description" content="Plateforme e-commerce innovante pour acheter et vendre en ligne en Côte d'Ivoire et en Afrique. Essai gratuit 28 jours." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://djassa.djassa.tech/about" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="min-w-[44px] min-h-[44px]"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl md:text-2xl font-bold gradient-text-primary">
                À propos de Djassa
              </h1>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="bg-gradient-accent py-12 md:py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 drop-shadow-lg">
                Bienvenue sur Djassa 🛍️
              </h2>
              <p className="text-lg md:text-xl text-white/95 leading-relaxed">
                La plateforme e-commerce qui rend l'achat et la vente en ligne plus <strong>simple</strong>, <strong>rapide</strong> et <strong>accessible</strong> en Côte d'Ivoire et en Afrique francophone.
              </p>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-12 max-w-6xl">
          
          {/* Mission Section */}
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-8 h-8 text-primary" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Notre Mission</h2>
            </div>
            <Card className="shadow-lg border-primary/20">
              <CardContent className="pt-6">
                <p className="text-base md:text-lg text-foreground/90 leading-relaxed">
                  Chez <strong>Djassa</strong>, notre mission est de démocratiser le commerce en ligne en Côte d'Ivoire et dans toute l'Afrique. Nous offrons une plateforme intuitive et sécurisée où vendeurs et acheteurs peuvent se rencontrer, échanger et prospérer ensemble. Nous croyons que chaque entrepreneur mérite une vitrine moderne pour faire grandir son activité, et que chaque client mérite une expérience d'achat fluide, rapide et fiable.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Vision Section */}
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="w-8 h-8 text-primary" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Notre Vision</h2>
            </div>
            <Card className="shadow-lg border-primary/20">
              <CardContent className="pt-6">
                <p className="text-base md:text-lg text-foreground/90 leading-relaxed">
                  Devenir la <strong>plateforme e-commerce de référence en Afrique francophone</strong>, reconnue pour son innovation, sa fiabilité et son impact positif sur l'économie locale. Nous voulons bâtir un écosystème digital où les petites entreprises, artisans et commerçants trouvent les outils pour se développer à l'échelle nationale et continentale.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* How It Works Section */}
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-8 h-8 text-primary" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Comment ça fonctionne ?</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="shadow-md hover:shadow-xl transition-shadow">
                <CardHeader>
                  <ShoppingBag className="w-10 h-10 text-primary mb-2" />
                  <CardTitle className="text-xl">Pour les Acheteurs</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-foreground/80">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Parcourez des milliers de produits dans toutes les catégories</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Profitez des <strong>offres spéciales</strong> et des <strong>produits boostés</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Paiement 100% sécurisé via <strong>Paystack</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Suivez vos commandes en temps réel</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Support client réactif et disponible</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="shadow-md hover:shadow-xl transition-shadow">
                <CardHeader>
                  <Store className="w-10 h-10 text-primary mb-2" />
                  <CardTitle className="text-xl">Pour les Vendeurs</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-foreground/80">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span><strong>28 jours d'essai gratuit</strong> avec 50 jetons offerts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Créez votre boutique personnalisée en quelques clics</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Publiez vos produits facilement (1 jeton = 1 publication)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span><strong>Boostez vos produits</strong> pour maximiser la visibilité</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Gérez vos ventes et commandes depuis un tableau de bord moderne</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Advantages Section */}
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <Award className="w-8 h-8 text-primary" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Pourquoi choisir Djassa ?</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="shadow-md hover:shadow-lg transition-shadow text-center">
                <CardHeader>
                  <Shield className="w-12 h-12 text-primary mx-auto mb-2" />
                  <CardTitle className="text-lg">Sécurité & Fiabilité</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground/80">
                    Tous les paiements sont sécurisés via <strong>Paystack</strong>, leader des solutions de paiement en Afrique. Vos données sont protégées.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-md hover:shadow-lg transition-shadow text-center">
                <CardHeader>
                  <TrendingUp className="w-12 h-12 text-primary mx-auto mb-2" />
                  <CardTitle className="text-lg">Visibilité Maximale</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground/80">
                    Avec le système de <strong>boost de produits</strong>, vos articles apparaissent en tête des résultats et dans les sections "Offres Spéciales".
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-md hover:shadow-lg transition-shadow text-center">
                <CardHeader>
                  <Heart className="w-12 h-12 text-primary mx-auto mb-2" />
                  <CardTitle className="text-lg">Simplicité d'utilisation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground/80">
                    Interface intuitive, navigation fluide, expérience mobile optimisée. Vendez et achetez en quelques clics.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-md hover:shadow-lg transition-shadow text-center">
                <CardHeader>
                  <Users className="w-12 h-12 text-primary mx-auto mb-2" />
                  <CardTitle className="text-lg">Communauté Locale</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground/80">
                    Djassa connecte acheteurs et vendeurs en <strong>Côte d'Ivoire</strong> et dans toute l'Afrique francophone.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-md hover:shadow-lg transition-shadow text-center">
                <CardHeader>
                  <Zap className="w-12 h-12 text-primary mx-auto mb-2" />
                  <CardTitle className="text-lg">Essai Gratuit Généreux</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground/80">
                    <strong>28 jours d'essai gratuit</strong> avec 50 jetons offerts pour tester toutes les fonctionnalités sans engagement.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-md hover:shadow-lg transition-shadow text-center">
                <CardHeader>
                  <Store className="w-12 h-12 text-primary mx-auto mb-2" />
                  <CardTitle className="text-lg">Boutique Personnalisée</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground/80">
                    Créez votre propre boutique avec nom, logo et lien unique. Gérez vos produits comme un professionnel.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Investors & Partners Section */}
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <Briefcase className="w-8 h-8 text-primary" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Investisseurs & Partenaires</h2>
            </div>
            <Card className="shadow-lg border-primary/20 bg-gradient-subtle">
              <CardHeader>
                <CardTitle className="text-xl md:text-2xl">Rejoignez l'aventure Djassa</CardTitle>
                <CardDescription className="text-base">
                  Opportunités de croissance et partenariat stratégique
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-base text-foreground/90 leading-relaxed">
                  <strong>Djassa</strong> représente une opportunité unique dans l'écosystème e-commerce africain. Avec une croissance rapide, une technologie moderne et une vision d'expansion à l'échelle continentale, nous recherchons des investisseurs et partenaires stratégiques pour accélérer notre développement.
                </p>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Croissance Rapide</h4>
                      <p className="text-sm text-foreground/80">
                        Marché e-commerce africain en forte expansion avec un potentiel de croissance de +25% par an.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Users className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Base Utilisateurs Engagée</h4>
                      <p className="text-sm text-foreground/80">
                        Communauté de vendeurs et acheteurs actifs en Côte d'Ivoire, avec une expansion prévue vers le Sénégal, le Mali, le Burkina Faso et la Guinée.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Shield className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Confiance & Sécurité</h4>
                      <p className="text-sm text-foreground/80">
                        Infrastructure solide avec Paystack pour les paiements, garantissant sécurité et conformité aux standards internationaux.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Globe className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Vision d'Expansion</h4>
                      <p className="text-sm text-foreground/80">
                        Objectif : devenir la marketplace de référence en Afrique francophone d'ici 3 ans, avec des millions d'utilisateurs actifs.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-6">
                  <p className="text-sm text-foreground/90 font-medium mb-2">
                    💼 Vous êtes investisseur, partenaire commercial ou institution financière ?
                  </p>
                  <p className="text-sm text-foreground/80">
                    Contactez-nous pour discuter des opportunités de collaboration et d'investissement. Ensemble, bâtissons l'avenir du commerce en ligne en Afrique.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* CTA Section */}
          <section className="text-center py-12 bg-gradient-accent rounded-xl shadow-2xl">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-4">
              Prêt à rejoindre Djassa ? 🚀
            </h2>
            <p className="text-white/90 mb-8 max-w-2xl mx-auto px-4">
              Que vous soyez acheteur ou vendeur, Djassa vous offre une expérience e-commerce moderne, sécurisée et accessible.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
              <Button 
                size="lg" 
                variant="default"
                onClick={() => navigate("/auth")}
                className="bg-white text-primary hover:bg-white/90 font-bold shadow-lg"
              >
                Créer mon compte
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate("/marketplace")}
                className="bg-transparent border-white text-white hover:bg-white/10 font-bold"
              >
                Explorer les produits
              </Button>
            </div>
          </section>

        </div>

        {/* Footer Note */}
        <footer className="border-t bg-muted/30 py-8 mt-16">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm text-muted-foreground">
              © 2025 Djassa. Tous droits réservés. Plateforme e-commerce ivoirienne et africaine.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Paiements sécurisés par <strong>Paystack</strong> · Support disponible 24/7
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default About;
