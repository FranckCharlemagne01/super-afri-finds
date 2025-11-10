import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStableAuth } from '@/hooks/useStableAuth';
import { useStableRole } from '@/hooks/useStableRole';
import { Button } from '@/components/ui/button';
import { Store, ShoppingBag, CreditCard, TrendingUp, CheckCircle, Zap } from 'lucide-react';
import showcaseImage from '@/assets/marketplace-showcase-clean.jpg';

const Landing = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useStableAuth();
  const { role, loading: roleLoading } = useStableRole();

  useEffect(() => {
    // Redirect authenticated users to their dashboard
    if (!authLoading && !roleLoading && user && role) {
      if (role === 'seller') {
        navigate('/seller-dashboard', { replace: true });
      } else if (role === 'buyer') {
        navigate('/buyer-dashboard', { replace: true });
      } else if (role === 'superadmin') {
        navigate('/superadmin', { replace: true });
      }
    }
  }, [user, role, authLoading, roleLoading, navigate]);

  // Show nothing while checking auth
  if (authLoading || roleLoading) {
    return null;
  }

  // Don't show landing page to authenticated users
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 md:h-20 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <Store className="h-7 w-7 md:h-8 md:w-8 text-primary" />
            <span className="text-2xl md:text-3xl font-bold gradient-text-primary">
              DJASSA
            </span>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/auth')}
              className="h-10 md:h-11 px-4 md:px-6 text-sm md:text-base font-medium"
            >
              Se connecter
            </Button>
            <Button
              onClick={() => navigate('/auth')}
              className="h-10 md:h-11 px-4 md:px-6 text-sm md:text-base font-semibold bg-primary hover:bg-primary-hover"
            >
              Créer ma boutique
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container px-4 md:px-8 py-12 md:py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="flex flex-col gap-6 md:gap-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium w-fit">
              <Zap className="h-4 w-4" />
              <span>Lancez votre business en ligne</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
              Crée ta boutique en ligne{' '}
              <span className="gradient-text-primary">en quelques minutes</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Vends facilement. Encaisse simplement. Multiplie tes clients.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                size="lg"
                onClick={() => navigate('/auth')}
                className="h-14 px-8 text-lg font-semibold bg-primary hover:bg-primary-hover shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Store className="mr-2 h-5 w-5" />
                Commencer maintenant
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/marketplace')}
                className="h-14 px-8 text-lg font-medium"
              >
                Découvrir le marché
              </Button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-6 md:gap-8 pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <span className="text-sm font-medium">100% Gratuit</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <span className="text-sm font-medium">Setup en 5 min</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <span className="text-sm font-medium">Paiements sécurisés</span>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-3xl blur-3xl opacity-50" />
            <img
              src={showcaseImage}
              alt="Djassa Marketplace"
              className="relative rounded-3xl shadow-2xl border border-border/50 w-full hover:scale-105 transition-transform duration-500"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container px-4 md:px-8 py-16 md:py-24">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Pourquoi choisir <span className="gradient-text-primary">Djassa</span> ?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tout ce dont tu as besoin pour lancer et développer ton business en ligne
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {/* Feature 1 */}
          <div className="flex flex-col items-center text-center gap-4 p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-2">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Store className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold">Création instantanée</h3>
            <p className="text-muted-foreground leading-relaxed">
              Crée ta boutique personnalisée en quelques clics. Ajoute tes produits, personnalise ton espace et commence à vendre immédiatement.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col items-center text-center gap-4 p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-2">
            <div className="h-16 w-16 rounded-2xl bg-success/10 flex items-center justify-center">
              <ShoppingBag className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold">Gestion simplifiée</h3>
            <p className="text-muted-foreground leading-relaxed">
              Gère facilement tes produits, commandes et clients depuis un tableau de bord intuitif. Tout est centralisé pour gagner du temps.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col items-center text-center gap-4 p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-2">
            <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center">
              <CreditCard className="h-8 w-8 text-accent-foreground" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold">Paiements sécurisés</h3>
            <p className="text-muted-foreground leading-relaxed">
              Accepte tous les modes de paiement populaires : Mobile Money, cartes bancaires. Transactions 100% sécurisées avec Paystack.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container px-4 md:px-8 py-16 md:py-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-hover to-promo p-1">
          <div className="relative bg-background rounded-3xl p-8 md:p-12 lg:p-16">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="flex-1 text-center lg:text-left">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                  Prêt à lancer ton business ?
                </h2>
                <p className="text-lg md:text-xl text-muted-foreground mb-6">
                  Rejoins des centaines de vendeurs qui font déjà confiance à Djassa
                </p>
                <div className="flex items-center justify-center lg:justify-start gap-4 flex-wrap">
                  <TrendingUp className="h-5 w-5 text-success" />
                  <span className="text-sm font-medium">Croissance moyenne de 300%</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-sm font-medium">+500 boutiques actives</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={() => navigate('/auth')}
                  className="h-14 px-8 text-lg font-semibold bg-primary hover:bg-primary-hover shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Créer ma boutique
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Market Preview Section */}
      <section id="market" className="container px-4 md:px-8 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Explore le marché
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Découvre les produits des vendeurs de notre communauté
          </p>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/marketplace')}
            className="h-12 px-8 text-base font-medium"
          >
            Voir tous les produits
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/30">
        <div className="container px-4 md:px-8 py-8 md:py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Store className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">DJASSA</span>
            </div>
            <p className="text-sm text-muted-foreground text-center md:text-left">
              © 2025 Djassa. Tous droits réservés.
            </p>
            <div className="flex items-center gap-4">
              <Button
                variant="link"
                onClick={() => navigate('/legal')}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Mentions légales
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
