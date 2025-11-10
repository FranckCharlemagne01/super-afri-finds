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
      <section className="container px-4 md:px-8 py-16 md:py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <div className="flex flex-col gap-6 md:gap-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-success/10 text-success rounded-full text-sm font-semibold w-fit border border-success/20">
              <span>🎉 28 jours d'essai gratuit — Sans engagement</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight tracking-tight">
              Lancez votre boutique en ligne{' '}
              <span className="gradient-text-primary">gratuitement</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
              Créez votre boutique personnalisée en quelques minutes et commencez à vendre dès aujourd'hui.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Button
                size="lg"
                onClick={() => navigate('/auth')}
                className="h-14 px-8 text-base font-semibold bg-primary hover:bg-primary-hover shadow-lg hover:shadow-xl transition-all duration-300"
              >
                🚀 Créer ma boutique
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/marketplace')}
                className="h-14 px-8 text-base font-medium border-2"
              >
                Découvrir le marché
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap items-center gap-6 md:gap-8 pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <span className="text-sm font-medium text-foreground">Gratuit</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <span className="text-sm font-medium text-foreground">Simple</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <span className="text-sm font-medium text-foreground">Sécurisé</span>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative animate-fade-in order-first lg:order-last" style={{ animationDelay: '0.2s' }}>
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-3xl blur-3xl opacity-40" />
            <img
              src={showcaseImage}
              alt="Djassa - Plateforme e-commerce moderne"
              className="relative rounded-2xl lg:rounded-3xl shadow-2xl border border-border/50 w-full transition-transform duration-500 hover:scale-[1.02]"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container px-4 md:px-8 py-16 md:py-24 bg-muted/30">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Tout pour réussir en ligne
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Des outils simples et puissants pour développer votre business
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 max-w-6xl mx-auto">
          {/* Feature 1 */}
          <div className="flex flex-col items-start text-left gap-4 p-8 rounded-2xl bg-background border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-300">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <Store className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold">🛍️ Création instantanée</h3>
            <p className="text-muted-foreground leading-relaxed">
              Lance ta boutique personnalisée en quelques clics, ajoute tes produits et vends directement.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col items-start text-left gap-4 p-8 rounded-2xl bg-background border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-300">
            <div className="h-14 w-14 rounded-xl bg-success/10 flex items-center justify-center">
              <ShoppingBag className="h-7 w-7 text-success" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold">📦 Gestion simplifiée</h3>
            <p className="text-muted-foreground leading-relaxed">
              Tableau de bord clair pour gérer commandes, clients et inventaire sans complications.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col items-start text-left gap-4 p-8 rounded-2xl bg-background border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-300">
            <div className="h-14 w-14 rounded-xl bg-accent/10 flex items-center justify-center">
              <CreditCard className="h-7 w-7 text-accent-foreground" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold">💳 Paiements sécurisés</h3>
            <p className="text-muted-foreground leading-relaxed">
              Mobile Money (Orange, MTN, Wave) + cartes bancaires avec sécurité Paystack intégrée.
            </p>
          </div>
        </div>
      </section>

      {/* Community & Trust Section */}
      <section className="container px-4 md:px-8 py-16 md:py-24">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Rejoignez une communauté de vendeurs{' '}
            <span className="gradient-text-primary">en pleine croissance</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
            Des centaines de commerçants font déjà confiance à Djassa pour développer leur activité
          </p>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-16">
            <div className="flex flex-col items-center gap-2 p-6 rounded-xl bg-card border border-border/50">
              <div className="text-4xl md:text-5xl font-bold gradient-text-primary">+500</div>
              <div className="text-sm md:text-base text-muted-foreground">Boutiques actives</div>
            </div>
            <div className="flex flex-col items-center gap-2 p-6 rounded-xl bg-card border border-border/50">
              <div className="text-4xl md:text-5xl font-bold gradient-text-primary">300%</div>
              <div className="text-sm md:text-base text-muted-foreground">Croissance moyenne</div>
            </div>
            <div className="flex flex-col items-center gap-2 p-6 rounded-xl bg-card border border-border/50">
              <div className="text-4xl md:text-5xl font-bold gradient-text-primary">24/7</div>
              <div className="text-sm md:text-base text-muted-foreground">Support disponible</div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <div className="p-6 rounded-xl bg-background border border-border/50 text-left">
              <p className="text-muted-foreground italic mb-4">
                "J'ai lancé ma boutique en 10 minutes. Mes clients paient facilement par Mobile Money. Simple et efficace !"
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-bold">AM</span>
                </div>
                <div>
                  <div className="font-semibold text-sm">Aminata M.</div>
                  <div className="text-xs text-muted-foreground">Boutique Mode & Accessoires</div>
                </div>
              </div>
            </div>
            <div className="p-6 rounded-xl bg-background border border-border/50 text-left">
              <p className="text-muted-foreground italic mb-4">
                "Avant Djassa, je vendais uniquement sur WhatsApp. Maintenant j'ai ma vraie boutique et mes ventes ont triplé."
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
                  <span className="text-sm font-bold">IK</span>
                </div>
                <div>
                  <div className="font-semibold text-sm">Ibrahim K.</div>
                  <div className="text-xs text-muted-foreground">Électronique & Téléphones</div>
                </div>
              </div>
            </div>
            <div className="p-6 rounded-xl bg-background border border-border/50 text-left">
              <p className="text-muted-foreground italic mb-4">
                "Le tableau de bord est super clair. Je gère tout facilement : produits, commandes, clients. Parfait pour moi !"
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <span className="text-sm font-bold">FD</span>
                </div>
                <div>
                  <div className="font-semibold text-sm">Fatou D.</div>
                  <div className="text-xs text-muted-foreground">Beauté & Cosmétiques</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="container px-4 md:px-8 py-16 md:py-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-hover to-accent p-1">
          <div className="relative bg-background rounded-3xl p-10 md:p-16 text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Prêt à lancer votre business ? 🚀
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Créez votre boutique en ligne dès maintenant. Aucune carte bancaire requise.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => navigate('/auth')}
                className="h-14 px-10 text-base font-semibold bg-primary hover:bg-primary-hover shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Créer ma boutique
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/marketplace')}
                className="h-14 px-10 text-base font-medium border-2"
              >
                Voir tous les produits
              </Button>
            </div>
          </div>
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
