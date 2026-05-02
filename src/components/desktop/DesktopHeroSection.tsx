import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useStableAuth } from "@/hooks/useStableAuth";
import { useStableRole } from "@/hooks/useStableRole";
import { ShoppingBag, Store, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";

interface DesktopHeroSectionProps {
  onShowSellerUpgrade?: () => void;
}

/**
 * Desktop-only premium hero section.
 * Hidden on mobile to preserve the existing mobile-first UX.
 */
export const DesktopHeroSection = ({ onShowSellerUpgrade }: DesktopHeroSectionProps) => {
  const navigate = useNavigate();
  const { user } = useStableAuth();
  const { isSeller } = useStableRole();

  const handleStartSelling = () => {
    if (user) {
      if (isSeller) {
        navigate("/seller-dashboard");
      } else {
        onShowSellerUpgrade?.();
      }
    } else {
      navigate("/auth?mode=signup&role=seller");
    }
  };

  const handleStartShopping = () => {
    const el = document.querySelector("[data-section='flash-sales']");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate("/categories");
    }
  };

  return (
    <section
      aria-label="Présentation Djassa"
      className="hidden lg:block mb-8 xl:mb-10"
    >
      <div className="container mx-auto max-w-[1600px] px-4 lg:px-8 xl:px-12 pt-6">
        <div className="relative overflow-hidden rounded-3xl border border-border/50 shadow-md bg-card">
          {/* Background image with gradient overlay */}
          <div className="absolute inset-0">
            <img
              src={heroBanner}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[hsl(235,20%,11%)]/95 via-[hsl(235,20%,11%)]/80 to-[hsl(235,20%,11%)]/40" />
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 via-transparent to-[hsl(134,61%,41%)]/20" />
          </div>

          {/* Content */}
          <div className="relative grid lg:grid-cols-12 gap-8 px-8 xl:px-14 py-12 xl:py-16">
            {/* Left: copy + CTAs */}
            <div className="lg:col-span-7 xl:col-span-7 text-white">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-semibold mb-5">
                <Sparkles className="w-3.5 h-3.5 text-[hsl(45,100%,65%)]" />
                Marketplace #1 en Côte d'Ivoire
              </div>

              <h1 className="text-3xl xl:text-5xl 2xl:text-6xl font-extrabold leading-[1.05] mb-5 tracking-tight">
                Achetez local.{" "}
                <span className="bg-gradient-to-r from-[hsl(45,100%,65%)] to-[hsl(16,100%,65%)] bg-clip-text text-transparent">
                  Vendez gratuitement.
                </span>
              </h1>

              <p className="text-base xl:text-lg text-white/85 max-w-2xl mb-7 leading-relaxed">
                Des milliers de produits près de chez vous. Créez votre boutique
                en 2 minutes — <span className="font-semibold text-white">publication 100% gratuite</span>,
                commission uniquement après chaque vente.
              </p>

              <div className="flex flex-wrap items-center gap-3 mb-7">
                <Button
                  size="lg"
                  onClick={handleStartSelling}
                  className="h-12 px-6 text-sm xl:text-base font-bold rounded-xl bg-white text-primary hover:bg-white/95 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all"
                >
                  <Store className="w-5 h-5 mr-2" />
                  Commencer à vendre
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleStartShopping}
                  className="h-12 px-6 text-sm xl:text-base font-semibold rounded-xl bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Découvrir les offres
                </Button>
              </div>

              {/* Trust micro-row */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs xl:text-sm text-white/80">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[hsl(134,61%,55%)]" />
                  Paiement sécurisé Paystack
                </span>
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[hsl(45,100%,65%)]" />
                  0 frais de publication
                </span>
                <span className="flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-[hsl(16,100%,65%)]" />
                  Boutique automatique
                </span>
              </div>
            </div>

            {/* Right: stat cards */}
            <div className="hidden lg:flex lg:col-span-5 xl:col-span-5 flex-col justify-center gap-3">
              <StatCard value="10 000+" label="Produits actifs" accent="from-[hsl(45,100%,55%)] to-[hsl(16,100%,55%)]" />
              <StatCard value="500+" label="Vendeurs vérifiés" accent="from-primary to-[hsl(16,100%,55%)]" />
              <StatCard value="24/48h" label="Livraison Côte d'Ivoire" accent="from-[hsl(134,61%,41%)] to-[hsl(134,61%,55%)]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const StatCard = ({
  value,
  label,
  accent,
}: {
  value: string;
  label: string;
  accent: string;
}) => (
  <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 px-5 py-4 flex items-center gap-4 hover:bg-white/15 transition-colors">
    <div
      className={`w-1.5 h-12 rounded-full bg-gradient-to-b ${accent} flex-shrink-0`}
    />
    <div>
      <div className="text-2xl xl:text-3xl font-extrabold text-white leading-tight">
        {value}
      </div>
      <div className="text-xs xl:text-sm text-white/75 font-medium">
        {label}
      </div>
    </div>
  </div>
);
