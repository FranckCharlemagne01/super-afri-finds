import { ShieldCheck, Truck, Headset, BadgeCheck } from "lucide-react";

/**
 * Desktop-only trust strip. Builds credibility with 4 pillars.
 * Hidden on mobile to preserve the lean mobile UX.
 */
export const TrustBadgesSection = () => {
  const items = [
    {
      Icon: ShieldCheck,
      title: "Paiement sécurisé",
      desc: "Transactions chiffrées via Paystack",
      accent: "text-[hsl(134,61%,41%)] bg-[hsl(134,61%,41%)]/10",
    },
    {
      Icon: Truck,
      title: "Livraison Côte d'Ivoire",
      desc: "Partout à Abidjan et en région",
      accent: "text-primary bg-primary/10",
    },
    {
      Icon: Headset,
      title: "Support 7j/7",
      desc: "Équipe locale à votre écoute",
      accent: "text-[hsl(16,100%,55%)] bg-[hsl(16,100%,55%)]/10",
    },
    {
      Icon: BadgeCheck,
      title: "Vendeurs vérifiés",
      desc: "Boutiques contrôlées (KYC)",
      accent: "text-[hsl(235,55%,45%)] bg-[hsl(235,55%,45%)]/10",
    },
  ];

  return (
    <section
      aria-label="Pourquoi choisir Djassa"
      className="hidden lg:block mb-8 xl:mb-12"
    >
      <div className="container mx-auto max-w-[1600px] px-4 lg:px-8 xl:px-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-5">
          {items.map(({ Icon, title, desc, accent }) => (
            <div
              key={title}
              className="group flex items-center gap-4 p-5 rounded-2xl bg-card border border-border/60 shadow-sm hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}
              >
                <Icon className="w-6 h-6" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <div className="text-sm xl:text-base font-bold text-foreground leading-tight">
                  {title}
                </div>
                <div className="text-xs xl:text-sm text-muted-foreground mt-0.5">
                  {desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
