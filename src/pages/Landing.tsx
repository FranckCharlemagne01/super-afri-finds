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
    // Redirect authenticated users to their dashboard (silently in background)
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

  // Always show the landing page immediately - redirection happens in background if authenticated

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 animate-fade-in scroll-smooth-mobile overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 md:backdrop-blur md:supports-[backdrop-filter]:bg-background/60 transition-all duration-300 will-change-transform">
        <div className="w-full flex h-14 sm:h-16 md:h-20 items-center justify-between px-4 sm:px-6 md:px-8 mx-auto" style={{ maxWidth: '100vw' }}>
          <div 
            className="flex items-center gap-1.5 sm:gap-2 cursor-pointer touch-manipulation active:scale-95 transition-transform flex-shrink-0" 
            onClick={() => navigate('/')}
          >
            <Store className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary" />
            <span className="text-lg sm:text-xl md:text-3xl font-bold gradient-text-primary whitespace-nowrap">
              DJASSA
            </span>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => navigate('/auth')}
              className="h-8 sm:h-9 md:h-11 px-2 sm:px-3 md:px-6 text-xs sm:text-sm md:text-base font-medium touch-manipulation active:scale-95 transition-all whitespace-nowrap"
            >
              <span className="hidden xs:inline">Se connecter</span>
              <span className="xs:hidden">Connexion</span>
            </Button>
            <Button
              onClick={() => navigate('/auth?mode=signup')}
              className="h-8 sm:h-9 md:h-11 px-2 sm:px-3 md:px-6 text-xs sm:text-sm md:text-base font-semibold bg-primary hover:bg-primary-hover touch-manipulation active:scale-95 transition-all shadow-sm hover:shadow-md whitespace-nowrap"
            >
              <span className="hidden sm:inline">Créer ma boutique</span>
              <span className="sm:hidden">Créer</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-20 lg:py-28 mx-auto" style={{ maxWidth: 'min(100vw, 1280px)' }}>
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center w-full">
          {/* Left Content */}
          <div className="flex flex-col gap-4 sm:gap-6 md:gap-8 animate-fade-in max-w-full stable-scroll">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs sm:text-sm font-medium w-fit touch-manipulation">
              <Zap className="h-3 w-3 sm:h-4 sm:w-4 animate-pulse flex-shrink-0" />
              <span className="whitespace-nowrap">Lancez votre business en ligne</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight break-words">
              Crée ta boutique en ligne{' '}
              <span className="gradient-text-primary">en quelques minutes</span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
              Vends facilement. Encaisse simplement. Multiplie tes clients.
            </p>

            <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-success/10 border border-success/20 rounded-xl max-w-full">
              <p className="text-xs sm:text-sm md:text-base text-foreground font-medium break-words">
                🎁 Profite de <strong>28 jours d'essai gratuit</strong>. Sans engagement. Commence et teste la vente immédiatement.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4 w-full">
              <Button
                size="lg"
                onClick={() => navigate('/auth?mode=signup')}
                className="h-11 sm:h-12 md:h-14 px-4 sm:px-6 md:px-8 text-sm sm:text-base md:text-lg font-semibold bg-primary hover:bg-primary-hover shadow-lg hover:shadow-xl transition-all duration-300 touch-manipulation active:scale-95 w-full sm:w-auto"
              >
                <Store className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="whitespace-nowrap">Commencer maintenant</span>
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/marketplace')}
                className="h-11 sm:h-12 md:h-14 px-4 sm:px-6 md:px-8 text-sm sm:text-base md:text-lg font-medium touch-manipulation active:scale-95 transition-all w-full sm:w-auto"
              >
                <span className="whitespace-nowrap">Découvrir le marché</span>
              </Button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 md:gap-6 pt-2 sm:pt-4">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-success flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium whitespace-nowrap">100% Gratuit</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-success flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Setup en 5 min</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-success flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Paiements sécurisés</span>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative animate-fade-in mt-8 lg:mt-0 stable-scroll" style={{ animationDelay: '0.2s' }}>
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-2xl sm:rounded-3xl blur-3xl opacity-50" />
            <img
              src={showcaseImage}
              alt="Djassa Marketplace - Plateforme de vente en ligne moderne"
              className="relative rounded-2xl sm:rounded-3xl shadow-2xl border border-border/50 w-full md:hover:scale-105 transition-transform duration-500 touch-manipulation"
              loading="lazy"
              width="800"
              height="600"
            />
          </div>
        </div>
      </section>

      {/* Early Adopters Section */}
      <section className="w-full px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16 animate-fade-in mx-auto stable-scroll" style={{ maxWidth: 'min(100vw, 1280px)' }}>
        <div className="max-w-4xl mx-auto text-center w-full">
          <div className="px-4 sm:px-6 py-6 sm:py-8 bg-gradient-to-br from-primary/5 via-background to-accent/5 rounded-xl sm:rounded-2xl border border-border/50 hover:border-primary/30 transition-all duration-300">
            <p className="text-sm sm:text-base md:text-lg text-foreground leading-relaxed break-words">
              🚀 Les premiers vendeurs inscrits bénéficient de <span className="font-bold text-primary">28 jours d'essai gratuit</span> pour lancer leur boutique, tester leurs produits et commencer à encaisser sans frais. C'est le bon moment pour profiter de la visibilité.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full px-4 sm:px-6 md:px-8 py-12 sm:py-16 md:py-24 animate-fade-in mx-auto stable-scroll" style={{ maxWidth: 'min(100vw, 1280px)' }}>
        <div className="text-center mb-8 sm:mb-12 md:mb-16 w-full">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 break-words">
            Pourquoi choisir <span className="gradient-text-primary">Djassa</span> ?
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Tout ce dont tu as besoin pour lancer et développer ton business en ligne
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {/* Feature 1 */}
          <div className="flex flex-col items-center text-center gap-3 sm:gap-4 p-4 sm:p-6 rounded-xl bg-card border border-border/50 md:hover:border-primary/50 md:hover:shadow-lg transition-all duration-300 md:hover:-translate-y-1 touch-manipulation stable-scroll">
            <div className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Store className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
            </div>
            <h3 className="text-base sm:text-lg md:text-xl font-bold break-words">Création instantanée</h3>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
              Crée ta boutique personnalisée en quelques clics. Ajoute tes produits, personnalise ton espace et commence à vendre immédiatement.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col items-center text-center gap-3 sm:gap-4 p-4 sm:p-6 rounded-xl bg-card border border-border/50 md:hover:border-primary/50 md:hover:shadow-lg transition-all duration-300 md:hover:-translate-y-1 touch-manipulation stable-scroll">
            <div className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-success" />
            </div>
            <h3 className="text-base sm:text-lg md:text-xl font-bold break-words">Gestion simplifiée</h3>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
              Gère facilement tes produits, commandes et clients depuis un tableau de bord intuitif. Tout est centralisé pour gagner du temps.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col items-center text-center gap-3 sm:gap-4 p-4 sm:p-6 rounded-xl bg-card border border-border/50 md:hover:border-primary/50 md:hover:shadow-lg transition-all duration-300 md:hover:-translate-y-1 touch-manipulation sm:col-span-2 md:col-span-1 stable-scroll">
            <div className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
              <CreditCard className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-accent-foreground" />
            </div>
            <h3 className="text-base sm:text-lg md:text-xl font-bold break-words">Paiements sécurisés</h3>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
              Accepte tous les modes de paiement populaires : Mobile Money (Orange Money, MTN Money, Moov Money) et cartes bancaires. Transactions sécurisées et rapides, adaptées aux réalités locales.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full px-4 sm:px-6 md:px-8 py-12 sm:py-16 md:py-24 animate-fade-in mx-auto stable-scroll" style={{ maxWidth: 'min(100vw, 1280px)' }}>
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary via-primary-hover to-promo p-0.5 sm:p-1 w-full">
          <div className="relative bg-background rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 lg:p-16">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8">
              <div className="flex-1 text-center lg:text-left max-w-full">
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 break-words">
                  Prêt à lancer ton business ?
                </h2>
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-4 sm:mb-6 break-words">
                  Ne rate pas ton essai gratuit de 28 jours. Commence aujourd'hui, vends dès demain.
                </p>
                <div className="flex items-center justify-center lg:justify-start gap-2 sm:gap-3 flex-wrap">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-success flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Croissance moyenne de 300%</span>
                  <span className="text-muted-foreground hidden sm:inline">•</span>
                  <span className="text-xs sm:text-sm font-medium whitespace-nowrap">+500 boutiques actives</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full lg:w-auto">
                <Button
                  size="lg"
                  onClick={() => navigate('/auth?mode=signup')}
                  className="h-11 sm:h-12 md:h-14 px-6 sm:px-8 text-sm sm:text-base md:text-lg font-semibold bg-primary hover:bg-primary-hover shadow-lg hover:shadow-xl transition-all duration-300 touch-manipulation active:scale-95 w-full sm:w-auto whitespace-nowrap"
                >
                  Créer ma boutique
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Market Preview Section */}
      <section id="market" className="w-full px-4 sm:px-6 md:px-8 py-12 sm:py-16 md:py-24 animate-fade-in mx-auto stable-scroll" style={{ maxWidth: 'min(100vw, 1280px)' }}>
        <div className="text-center mb-8 sm:mb-12 w-full">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 break-words">
            Explore le marché
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-6 sm:mb-8 break-words">
            Découvre les produits des vendeurs de notre communauté
          </p>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/marketplace')}
            className="h-10 sm:h-11 md:h-12 px-6 sm:px-8 text-sm sm:text-base font-medium touch-manipulation active:scale-95 transition-all whitespace-nowrap"
          >
            Voir tous les produits
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/30 animate-fade-in stable-scroll w-full">
        <div className="w-full px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-12 mx-auto" style={{ maxWidth: 'min(100vw, 1280px)' }}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-1.5 sm:gap-2 touch-manipulation flex-shrink-0">
              <Store className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <span className="text-base sm:text-lg md:text-xl font-bold whitespace-nowrap">DJASSA</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground text-center md:text-left">
              © 2025 Djassa. Tous droits réservés.
            </p>
            <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
              <Button
                variant="link"
                onClick={() => navigate('/about')}
                className="text-xs sm:text-sm text-muted-foreground hover:text-foreground touch-manipulation active:scale-95 transition-all whitespace-nowrap"
              >
                À propos
              </Button>
              <Button
                variant="link"
                onClick={() => navigate('/legal')}
                className="text-xs sm:text-sm text-muted-foreground hover:text-foreground touch-manipulation active:scale-95 transition-all whitespace-nowrap"
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
