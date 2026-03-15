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
  Clock,
  RefreshCw,
  AlertTriangle,
  Zap,
  TrendingDown,
  Sparkles,
} from "lucide-react";
import { formatFCFA } from "@/utils/commissionCalculator";

const AnimatedSection = ({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <div
    className={`animate-fade-in ${className}`}
    style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
  >
    {children}
  </div>
);

const PricingCard = ({
  highlighted = false,
  icon: Icon,
  title,
  price,
  subtitle,
  features,
  badge,
  accentClass,
}: {
  highlighted?: boolean;
  icon: React.ElementType;
  title: string;
  price: string;
  subtitle?: string;
  features: string[];
  badge?: string;
  accentClass: string;
}) => (
  <Card
    className={`relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-xl group ${
      highlighted
        ? "border-primary ring-2 ring-primary/30 shadow-lg scale-[1.02]"
        : "border-border hover:border-primary/40"
    }`}
  >
    <div className={`h-1.5 ${accentClass}`} />
    {badge && (
      <div className="absolute top-4 right-4 z-10">
        <span className="text-[10px] font-bold uppercase bg-primary text-primary-foreground px-3 py-1 rounded-full shadow-md animate-pulse">
          {badge}
        </span>
      </div>
    )}
    <CardHeader className="text-center pb-3 pt-8">
      <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
        highlighted ? "bg-primary/15" : "bg-muted"
      }`}>
        <Icon className={`w-8 h-8 ${highlighted ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <CardTitle className="text-xl">{title}</CardTitle>
      <div className="mt-3">
        <p className="text-3xl font-extrabold text-foreground">{price}</p>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
    </CardHeader>
    <CardContent className="space-y-3 text-sm text-foreground/80 pb-8">
      {features.map((t) => (
        <div key={t} className="flex items-start gap-3">
          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
          </div>
          <span>{t}</span>
        </div>
      ))}
    </CardContent>
  </Card>
);

const Pricing = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Tarifs Djassa - Abonnements vendeurs et commissions</title>
        <meta name="description" content="Découvrez les tarifs de Djassa : comptes vendeurs Particulier, Pro et Premium. Commissions transparentes et système de Compte Djassa simple." />
        <meta property="og:title" content="Tarifs Djassa - Plans vendeurs et commissions" />
        <meta property="og:description" content="Comparez les plans vendeurs Djassa : Particulier (gratuit), Pro (10 000 FCFA/mois) et Premium (25 000 FCFA/mois)." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://djassa.djassa.tech/tarifs" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg shadow-sm border-b border-border">
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
        <section className="relative overflow-hidden bg-primary py-16 md:py-24">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-primary-foreground/20 blur-3xl" />
            <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-primary-foreground/10 blur-3xl" />
          </div>
          <div className="container mx-auto px-4 text-center max-w-3xl relative z-10">
            <AnimatedSection>
              <div className="inline-flex items-center gap-2 bg-primary-foreground/15 backdrop-blur-sm text-primary-foreground px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Commission uniquement après vente
              </div>
            </AnimatedSection>
            <AnimatedSection delay={100}>
              <h2 className="text-3xl md:text-5xl font-extrabold text-primary-foreground mb-6 leading-tight">
                Tarifs simples et transparents
              </h2>
            </AnimatedSection>
            <AnimatedSection delay={200}>
              <p className="text-lg md:text-xl text-primary-foreground/90 leading-relaxed mb-8">
                Trois formules vendeurs adaptées à chaque activité. Pas de frais cachés.
              </p>
            </AnimatedSection>
            <AnimatedSection delay={300}>
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  { icon: Zap, text: "Aucun frais pour commencer" },
                  { icon: TrendingDown, text: "80% à 95% de réduction" },
                  { icon: ShoppingBag, text: "Payez après chaque vente" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm text-primary-foreground text-sm px-4 py-2 rounded-full">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </section>

        <div className="container mx-auto px-4 py-12 md:py-16 max-w-5xl space-y-16 md:space-y-24">

          {/* Section 1: Types de comptes */}
          <AnimatedSection>
            <section>
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
                  <BarChart3 className="w-4 h-4" />
                  Comparer les plans
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Choisissez votre formule</h2>
                <p className="text-muted-foreground mt-2 max-w-lg mx-auto">Évoluez à tout moment selon votre activité</p>
              </div>
              <div className="grid md:grid-cols-3 gap-6 md:gap-5">
                <PricingCard
                  icon={User}
                  title="Particulier"
                  price="Gratuit"
                  features={[
                    "Vente occasionnelle",
                    "Jusqu'à 10 produits",
                    "Commission Djassa : 15 %",
                    "Abonnement : gratuit",
                  ]}
                  accentClass="bg-muted-foreground/30"
                />
                <PricingCard
                  highlighted
                  icon={Store}
                  title="Pro"
                  price="10 000"
                  subtitle="FCFA / mois"
                  badge="Populaire"
                  features={[
                    "Vendeurs réguliers & petites boutiques",
                    "Jusqu'à 100 produits",
                    "Commission Djassa : 10 %",
                    "Abonnement : 10 000 FCFA / mois",
                  ]}
                  accentClass="bg-primary"
                />
                <PricingCard
                  icon={Crown}
                  title="Premium"
                  price="25 000"
                  subtitle="FCFA / mois"
                  features={[
                    "Grandes boutiques & entreprises",
                    "Produits illimités",
                    "Commission Djassa : 5 %",
                    "Abonnement : 25 000 FCFA / mois",
                  ]}
                  accentClass="bg-accent"
                />
              </div>
            </section>
          </AnimatedSection>

          {/* Section 2: Compte Djassa */}
          <AnimatedSection delay={100}>
            <section>
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
                  <Wallet className="w-4 h-4" />
                  Portefeuille
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Le Compte Djassa</h2>
              </div>
              <Card className="border-primary/20 overflow-hidden">
                <CardContent className="pt-6 space-y-6 text-foreground/90 text-base leading-relaxed">
                  <p>
                    Chaque vendeur possède un <strong>Compte Djassa</strong> dans son tableau de bord. Ce portefeuille interne permet de gérer les commissions de manière transparente.
                  </p>

                  {/* Wallet preview */}
                  <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-6 border border-primary/15">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shadow-sm">
                        <Wallet className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">Compte Djassa</p>
                        <p className="text-xs text-muted-foreground">Exemple de solde</p>
                      </div>
                    </div>
                    <p className="text-4xl font-bold text-primary mb-4">{formatFCFA(15500)}</p>
                    <div className="flex gap-2">
                      <span className="text-xs bg-primary/15 text-primary px-4 py-2 rounded-full font-medium">💳 Recharger</span>
                      <span className="text-xs bg-muted text-muted-foreground px-4 py-2 rounded-full font-medium">📋 Historique</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground text-lg">Fonctionnement</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[
                        { icon: Eye, text: "Consultez votre solde disponible à tout moment." },
                        { icon: Coins, text: "Rechargez avec 5 000, 10 000, 20 000 ou 50 000 FCFA." },
                        { icon: ShoppingBag, text: "Commission prélevée après confirmation de commande." },
                        { icon: RefreshCw, text: "Annulation client = commission remboursée automatiquement." },
                        { icon: Clock, text: "Après 48h sans plainte, commission définitive." },
                      ].map(({ icon: Icon, text }, i) => (
                        <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border transition-all duration-200 hover:border-primary/30 hover:shadow-sm">
                          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <span className="text-sm leading-relaxed">{text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </AnimatedSection>

          {/* Section 3: Commission example */}
          <AnimatedSection delay={150}>
            <section>
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
                  <ClipboardList className="w-4 h-4" />
                  Simulation
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Exemple de commissions</h2>
                <p className="text-muted-foreground mt-2">20 casquettes à 900 FCFA = {formatFCFA(18000)}</p>
              </div>

              {/* Mobile cards view */}
              <div className="grid gap-4 md:hidden">
                {[
                  { type: "Particulier", rate: "15%", commission: formatFCFA(2700), gain: formatFCFA(15300), icon: User },
                  { type: "Pro", rate: "10%", commission: formatFCFA(1800), gain: formatFCFA(16200), icon: Store },
                  { type: "Premium", rate: "5%", commission: formatFCFA(900), gain: formatFCFA(17100), icon: Crown },
                ].map((row) => (
                  <Card key={row.type} className="border-border overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <row.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{row.type}</p>
                          <p className="text-xs text-primary font-semibold">Taux : {row.rate}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-amber-500/5 rounded-lg p-3 text-center">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Commission</p>
                          <p className="text-base font-bold text-amber-600">{row.commission}</p>
                        </div>
                        <div className="bg-emerald-500/5 rounded-lg p-3 text-center">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Gain vendeur</p>
                          <p className="text-base font-bold text-emerald-600">{row.gain}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop table view */}
              <Card className="border-primary/20 hidden md:block">
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-4 font-semibold text-foreground">Type vendeur</th>
                          <th className="text-left p-4 font-semibold text-foreground">Taux</th>
                          <th className="text-left p-4 font-semibold text-foreground">Commission</th>
                          <th className="text-left p-4 font-semibold text-foreground">Gain vendeur</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { type: "Particulier", rate: "15%", commission: formatFCFA(2700), gain: formatFCFA(15300) },
                          { type: "Pro", rate: "10%", commission: formatFCFA(1800), gain: formatFCFA(16200) },
                          { type: "Premium", rate: "5%", commission: formatFCFA(900), gain: formatFCFA(17100) },
                        ].map((row) => (
                          <tr key={row.type} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                            <td className="p-4 font-medium">{row.type}</td>
                            <td className="p-4">
                              <span className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-full text-xs">{row.rate}</span>
                            </td>
                            <td className="p-4 text-amber-600 font-semibold">{row.commission}</td>
                            <td className="p-4 text-emerald-600 font-semibold">{row.gain}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </section>
          </AnimatedSection>

          {/* Section 4: Commission statuses */}
          <AnimatedSection delay={200}>
            <section>
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
                  <Shield className="w-4 h-4" />
                  Statuts
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Statuts des commissions</h2>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { emoji: "🟠", label: "En attente", desc: "Commande confirmée, en attente de validation (48h)", colorClass: "border-amber-500/20 bg-amber-500/5", textClass: "text-amber-700" },
                  { emoji: "🟢", label: "Validée", desc: "48h écoulées sans litige, commission définitive", colorClass: "border-emerald-500/20 bg-emerald-500/5", textClass: "text-emerald-700" },
                  { emoji: "🔄", label: "Remboursée", desc: "Commande annulée, commission restituée", colorClass: "border-blue-500/20 bg-blue-500/5", textClass: "text-blue-700" },
                ].map(({ emoji, label, desc, colorClass, textClass }) => (
                  <Card key={label} className={`border ${colorClass} overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-1`}>
                    <CardContent className="p-5 text-center">
                      <span className="text-3xl block mb-3">{emoji}</span>
                      <p className={`font-bold ${textClass} text-base mb-2`}>{label}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </AnimatedSection>

          {/* Section 5: Sécurité */}
          <AnimatedSection delay={250}>
            <section>
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
                  <AlertTriangle className="w-4 h-4" />
                  Sécurité
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Sécurité et protection</h2>
              </div>
              <Card className="border-primary/20">
                <CardContent className="pt-6 space-y-3">
                  {[
                    "Limite de 3 annulations par client par semaine",
                    "Commission minimum de 200 FCFA par commande",
                    "Score de confiance basé sur les commandes confirmées et les avis",
                    "Validation automatique après 48h sans litige",
                    "Historique complet accessible depuis le tableau de bord",
                  ].map((text, i) => (
                    <div key={i} className="flex items-start gap-3 p-3.5 bg-muted/40 rounded-xl border border-border transition-all duration-200 hover:border-primary/20 hover:bg-muted/60">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm leading-relaxed">{text}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>
          </AnimatedSection>

          {/* Section 6: Transparence */}
          <AnimatedSection delay={300}>
            <section>
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
                  <Eye className="w-4 h-4" />
                  Transparence
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Transparence et suivi</h2>
              </div>
              <Card className="border-primary/20">
                <CardContent className="pt-6 space-y-5 text-foreground/90 text-base leading-relaxed">
                  <p>Le tableau de bord vendeur affiche clairement :</p>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { icon: ShoppingBag, label: "Produits publiés" },
                      { icon: ClipboardList, label: "Commandes reçues" },
                      { icon: BarChart3, label: "Commissions détaillées" },
                      { icon: Wallet, label: "Solde Compte Djassa" },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border transition-all duration-200 hover:border-primary/30 hover:shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-foreground">{label}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-muted-foreground text-sm">Pas de frais cachés, pas de surprises. Tout est visible dans votre espace vendeur.</p>
                </CardContent>
              </Card>
            </section>
          </AnimatedSection>

          {/* CTA */}
          <AnimatedSection delay={350}>
            <section className="relative overflow-hidden text-center py-16 bg-primary rounded-3xl">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-primary-foreground/20 blur-3xl" />
                <div className="absolute -bottom-10 -right-10 w-60 h-60 rounded-full bg-primary-foreground/10 blur-3xl" />
              </div>
              <div className="relative z-10">
                <h2 className="text-2xl md:text-3xl font-extrabold text-primary-foreground mb-4">
                  Prêt à vendre sur Djassa ? 🚀
                </h2>
                <p className="text-primary-foreground/90 mb-8 max-w-2xl mx-auto px-4">
                  Créez votre compte gratuitement et commencez à publier vos produits dès aujourd'hui.
                </p>
                <Button
                  size="lg"
                  onClick={() => navigate("/auth")}
                  className="bg-card text-primary hover:bg-card/90 font-bold shadow-lg text-base px-8 transition-all duration-300 hover:scale-105"
                >
                  Créer ma boutique gratuitement
                </Button>
              </div>
            </section>
          </AnimatedSection>
        </div>

        {/* Footer */}
        <footer className="border-t border-border bg-muted/30 py-8 mt-16">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm text-muted-foreground">© 2025 Djassa. Tous droits réservés.</p>
            <p className="text-xs text-muted-foreground mt-2">
              <button onClick={() => navigate("/about")} className="underline hover:text-foreground transition-colors">À propos</button>
              {" · "}
              <button onClick={() => navigate("/legal")} className="underline hover:text-foreground transition-colors">Mentions légales</button>
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Pricing;
