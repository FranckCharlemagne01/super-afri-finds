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
} from "lucide-react";
import { formatFCFA } from "@/utils/commissionCalculator";

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
              Djassa propose trois types de comptes vendeurs avec des commissions adaptées à chaque activité.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-12 max-w-5xl space-y-20">

          {/* Section 1: Types de comptes */}
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
                  <span className="text-[10px] font-bold uppercase bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Populaire</span>
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

          {/* Section 2: Compte Djassa */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Wallet className="w-8 h-8 text-primary flex-shrink-0" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Le Compte Djassa</h2>
            </div>
            <Card className="border-primary/20">
              <CardContent className="pt-6 space-y-5 text-foreground/90 text-base leading-relaxed">
                <p>
                  Chaque vendeur possède un <strong>Compte Djassa</strong> dans son tableau de bord. Ce portefeuille interne permet de gérer les commissions de manière transparente.
                </p>

                {/* Example display */}
                <div className="bg-muted/50 rounded-xl p-5 border border-border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">Compte Djassa</p>
                      <p className="text-xs text-muted-foreground">Exemple de solde</p>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-primary mb-3">{formatFCFA(15500)}</p>
                  <div className="flex gap-2">
                    <span className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium">💳 Recharger</span>
                    <span className="text-xs bg-muted text-muted-foreground px-3 py-1.5 rounded-full font-medium">📋 Voir historique</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Fonctionnement :</h3>
                  <div className="space-y-3">
                    {[
                      { icon: Eye, text: "Consultez votre solde disponible à tout moment." },
                      { icon: Coins, text: "Rechargez votre Compte Djassa avec des montants de 5 000, 10 000, 20 000 ou 50 000 FCFA." },
                      { icon: ShoppingBag, text: "La commission est prélevée après confirmation d'une commande." },
                      { icon: RefreshCw, text: "En cas d'annulation par le client, la commission est automatiquement remboursée." },
                      { icon: Clock, text: "Après 48h sans plainte, la commission devient définitive." },
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
              </CardContent>
            </Card>
          </section>

          {/* Section 3: Commission example */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <ClipboardList className="w-8 h-8 text-primary flex-shrink-0" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Exemple de commissions</h2>
            </div>
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">
                  Exemple : 20 casquettes à 900 FCFA = {formatFCFA(18000)}
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 font-semibold text-foreground">Type vendeur</th>
                        <th className="text-left p-3 font-semibold text-foreground">Taux</th>
                        <th className="text-left p-3 font-semibold text-foreground">Commission</th>
                        <th className="text-left p-3 font-semibold text-foreground">Gain vendeur</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { type: 'Particulier', rate: '15%', commission: formatFCFA(2700), gain: formatFCFA(15300) },
                        { type: 'Pro', rate: '10%', commission: formatFCFA(1800), gain: formatFCFA(16200) },
                        { type: 'Premium', rate: '5%', commission: formatFCFA(900), gain: formatFCFA(17100) },
                      ].map((row) => (
                        <tr key={row.type} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-medium">{row.type}</td>
                          <td className="p-3 text-primary font-bold">{row.rate}</td>
                          <td className="p-3 text-amber-600 dark:text-amber-400 font-semibold">{row.commission}</td>
                          <td className="p-3 text-emerald-600 dark:text-emerald-400 font-semibold">{row.gain}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Section 4: Commission statuses */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-8 h-8 text-primary flex-shrink-0" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Statuts des commissions</h2>
            </div>
            <Card className="border-primary/20">
              <CardContent className="pt-6 space-y-4">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-center">
                    <span className="text-2xl">🟠</span>
                    <p className="font-bold text-amber-700 dark:text-amber-400 mt-2">En attente</p>
                    <p className="text-xs text-muted-foreground mt-1">Commande confirmée, en attente de validation (48h)</p>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center">
                    <span className="text-2xl">🟢</span>
                    <p className="font-bold text-emerald-700 dark:text-emerald-400 mt-2">Validée</p>
                    <p className="text-xs text-muted-foreground mt-1">48h écoulées sans litige, commission définitive</p>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 text-center">
                    <span className="text-2xl">🔄</span>
                    <p className="font-bold text-blue-700 dark:text-blue-400 mt-2">Remboursée</p>
                    <p className="text-xs text-muted-foreground mt-1">Commande annulée, commission restituée</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Section 5: Sécurité */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-8 h-8 text-primary flex-shrink-0" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Sécurité et protection</h2>
            </div>
            <Card className="border-primary/20">
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-3">
                  {[
                    "Limite de 3 annulations par client par semaine",
                    "Commission minimum de 200 FCFA par commande",
                    "Score de confiance basé sur les commandes confirmées et les avis",
                    "Validation automatique après 48h sans litige",
                    "Historique complet accessible depuis le tableau de bord",
                  ].map((text, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                      <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{text}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Section 6: Transparence */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Eye className="w-8 h-8 text-primary flex-shrink-0" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Transparence et suivi</h2>
            </div>
            <Card className="border-primary/20">
              <CardContent className="pt-6 space-y-4 text-foreground/90 text-base leading-relaxed">
                <p>Le tableau de bord vendeur affiche clairement :</p>
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
                <p>Pas de frais cachés, pas de surprises. Tout est visible dans votre espace vendeur.</p>
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
            <Button size="lg" onClick={() => navigate("/auth")} className="bg-card text-primary hover:bg-card/90 font-bold shadow-lg text-base px-8">
              Commencer à vendre sur Djassa
            </Button>
          </section>
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
