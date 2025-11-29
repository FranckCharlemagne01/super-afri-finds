import { useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStableAuth } from '@/hooks/useStableAuth';
import { useStableRole } from '@/hooks/useStableRole';
import { Button } from '@/components/ui/button';
import { Store, ShoppingBag, CreditCard, TrendingUp, CheckCircle, Zap, ArrowRight, Sparkles, Shield, Users, Star } from 'lucide-react';
import showcaseImage from '@/assets/marketplace-showcase-clean.jpg';
import { EmbeddedDemo } from '@/components/EmbeddedDemo';
import { motion } from 'framer-motion';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const Landing = memo(() => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useStableAuth();
  const { role, loading: roleLoading } = useStableRole();

  const handleAuth = useCallback(() => navigate('/auth'), [navigate]);
  const handleSignup = useCallback(() => navigate('/auth?mode=signup'), [navigate]);
  const handleMarketplace = useCallback(() => navigate('/marketplace'), [navigate]);
  const handleAbout = useCallback(() => navigate('/about'), [navigate]);
  const handleLegal = useCallback(() => navigate('/legal'), [navigate]);
  const handleHome = useCallback(() => navigate('/'), [navigate]);

  useEffect(() => {
    if (!authLoading && !roleLoading && user && role) {
      if (role === 'seller') navigate('/seller-dashboard', { replace: true });
      else if (role === 'buyer') navigate('/buyer-dashboard', { replace: true });
      else if (role === 'superadmin') navigate('/superadmin', { replace: true });
    }
  }, [user, role, authLoading, roleLoading, navigate]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-success/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl"
      >
        <div className="w-full flex h-16 md:h-20 items-center justify-between px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 cursor-pointer" 
            onClick={handleHome}
          >
            <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-lg shadow-primary/25">
              <Store className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
            </div>
            <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary via-primary-hover to-promo bg-clip-text text-transparent">
              DJASSA
            </span>
          </motion.div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              onClick={handleAuth}
              className="h-9 md:h-10 px-3 md:px-5 text-sm font-medium hover:bg-primary/10"
            >
              Connexion
            </Button>
            <Button
              onClick={handleSignup}
              className="h-9 md:h-10 px-4 md:px-6 text-sm font-semibold bg-gradient-to-r from-primary to-primary-hover hover:opacity-90 shadow-lg shadow-primary/25 transition-all duration-300"
            >
              <span className="hidden sm:inline">Créer ma boutique</span>
              <span className="sm:hidden">Créer</span>
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section with Demo */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 md:pt-16 pb-12 md:pb-20 mx-auto max-w-7xl">
        <motion.div 
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center"
        >
          {/* Left Content */}
          <motion.div variants={fadeInUp} className="flex flex-col gap-5 md:gap-6 order-2 lg:order-1">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-full w-fit"
            >
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-sm font-medium text-foreground">La marketplace #1 en Côte d'Ivoire</span>
            </motion.div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
              Lance ta{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-primary via-primary-hover to-promo bg-clip-text text-transparent">
                  boutique en ligne
                </span>
                <motion.span 
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-primary to-promo rounded-full origin-left"
                />
              </span>{' '}
              en 5 minutes
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
              Crée, personnalise et gère ta boutique facilement. Accepte les paiements Mobile Money et commence à vendre aujourd'hui.
            </p>

            {/* Trial Badge */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-success/10 to-success/5 border border-success/20 rounded-2xl"
            >
              <div className="h-10 w-10 rounded-xl bg-success/20 flex items-center justify-center flex-shrink-0">
                <Zap className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">28 jours d'essai gratuit</p>
                <p className="text-xs text-muted-foreground">Sans engagement • Annule à tout moment</p>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                size="lg"
                onClick={handleSignup}
                className="h-12 md:h-14 px-6 md:px-8 text-base font-semibold bg-gradient-to-r from-primary to-primary-hover hover:opacity-90 shadow-xl shadow-primary/25 transition-all duration-300 group"
              >
                Commencer gratuitement
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleMarketplace}
                className="h-12 md:h-14 px-6 md:px-8 text-base font-medium border-2 hover:bg-muted/50"
              >
                Explorer le marché
              </Button>
            </div>

            {/* Trust Indicators */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap items-center gap-4 pt-4"
            >
              {[
                { icon: CheckCircle, text: '100% Gratuit' },
                { icon: Shield, text: 'Paiements sécurisés' },
                { icon: Users, text: '+500 vendeurs' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <item.icon className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium text-muted-foreground">{item.text}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Side - Demo */}
          <motion.div 
            variants={fadeInUp}
            className="relative order-1 lg:order-2"
          >
            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-success/20 to-primary/20 rounded-full blur-2xl" />
            
            {/* Demo Container */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-success/20 rounded-3xl blur-xl opacity-50 scale-105" />
              <EmbeddedDemo onSignup={handleSignup} autoPlay={true} />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 py-12 md:py-16 mx-auto max-w-7xl">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
        >
          {[
            { value: '500+', label: 'Boutiques actives', icon: Store },
            { value: '10K+', label: 'Produits en ligne', icon: ShoppingBag },
            { value: '98%', label: 'Satisfaction client', icon: Star },
            { value: '24/7', label: 'Support disponible', icon: Shield }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative p-4 md:p-6 text-center rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300">
                <stat.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 py-16 md:py-24 mx-auto max-w-7xl">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-12 md:mb-16"
        >
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4"
          >
            <Zap className="h-4 w-4" />
            Pourquoi Djassa ?
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
          >
            Tout ce qu'il te faut pour{' '}
            <span className="bg-gradient-to-r from-primary to-promo bg-clip-text text-transparent">réussir</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto"
          >
            Une plateforme complète pour lancer et développer ton business en ligne
          </motion.p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {[
            {
              icon: Store,
              title: 'Création instantanée',
              description: 'Ta boutique personnalisée est prête en quelques clics. Ajoute tes produits et commence à vendre immédiatement.',
              gradient: 'from-primary to-primary-hover',
              delay: 0
            },
            {
              icon: ShoppingBag,
              title: 'Gestion simplifiée',
              description: 'Un tableau de bord intuitif pour gérer produits, commandes et clients. Tout est centralisé pour gagner du temps.',
              gradient: 'from-success to-success/80',
              delay: 0.1
            },
            {
              icon: CreditCard,
              title: 'Paiements Mobile Money',
              description: 'Accepte Orange Money, MTN Money, Moov Money et cartes bancaires. Transactions sécurisées et instantanées.',
              gradient: 'from-accent to-accent/80',
              delay: 0.2
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: feature.delay, duration: 0.5 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative p-6 md:p-8 rounded-3xl border border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 h-full">
                <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Showcase Section */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 py-16 md:py-24 mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-2xl opacity-50" />
            <img
              src={showcaseImage}
              alt="Djassa Marketplace"
              className="relative rounded-3xl shadow-2xl border border-border/50 w-full"
              loading="lazy"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-success/10 text-success rounded-full text-sm font-medium">
              <TrendingUp className="h-4 w-4" />
              Croissance garantie
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
              Rejoins les vendeurs qui{' '}
              <span className="bg-gradient-to-r from-success to-success/70 bg-clip-text text-transparent">
                multiplient leurs ventes
              </span>
            </h2>
            <p className="text-muted-foreground text-base md:text-lg">
              Nos vendeurs constatent une augmentation moyenne de 300% de leurs ventes après 3 mois sur Djassa.
            </p>
            
            <div className="space-y-4 pt-4">
              {[
                'Visibilité auprès de milliers de clients',
                'Outils marketing intégrés',
                'Analytics détaillés de tes ventes',
                'Support dédié 24/7'
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="h-6 w-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-success" />
                  </div>
                  <span className="text-foreground font-medium">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 py-16 md:py-24 mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl"
        >
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-hover to-promo" />
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          </div>

          <div className="relative z-10 p-8 md:p-12 lg:p-16 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4"
            >
              Prêt à lancer ton business ?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-primary-foreground/80 text-base md:text-lg max-w-2xl mx-auto mb-8"
            >
              Rejoins plus de 500 vendeurs qui font confiance à Djassa. Commence ton essai gratuit de 28 jours aujourd'hui.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button
                size="lg"
                onClick={handleSignup}
                className="h-12 md:h-14 px-8 md:px-10 text-base md:text-lg font-semibold bg-white text-primary hover:bg-white/90 shadow-xl transition-all duration-300 group"
              >
                Créer ma boutique gratuitement
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleMarketplace}
                className="h-12 md:h-14 px-8 md:px-10 text-base md:text-lg font-medium bg-transparent border-2 border-white/30 text-primary-foreground hover:bg-white/10"
              >
                Voir les produits
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-border/40 bg-muted/30">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12 mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center">
                <Store className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">DJASSA</span>
            </div>
            
            <p className="text-sm text-muted-foreground text-center">
              © 2025 Djassa. Tous droits réservés.
            </p>
            
            <div className="flex items-center gap-4">
              <Button variant="link" onClick={handleAbout} className="text-sm text-muted-foreground hover:text-foreground">
                À propos
              </Button>
              <Button variant="link" onClick={handleLegal} className="text-sm text-muted-foreground hover:text-foreground">
                Mentions légales
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
});

Landing.displayName = 'Landing';

export default Landing;
