import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send,
  Truck,
  ShieldCheck,
  CreditCard,
  Smartphone
} from "lucide-react";

export const MarketplaceFooter = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: integrate newsletter
    setEmail("");
  };

  return (
    <footer className="hidden sm:block bg-[hsl(235,20%,11%)] text-white mt-8 lg:mt-16">
      {/* Newsletter bar */}
      <div className="bg-gradient-to-r from-primary to-[hsl(16,100%,50%)]">
        <div className="container mx-auto max-w-[1600px] px-4 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h4 className="text-white font-bold text-base sm:text-lg">
                📬 Restez informé des meilleures offres
              </h4>
              <p className="text-white/80 text-xs sm:text-sm mt-1">
                Recevez nos promotions exclusives directement dans votre boîte mail
              </p>
            </div>
            <form onSubmit={handleNewsletter} className="flex gap-2 w-full sm:w-auto">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre email..."
                className="bg-white/20 border-white/30 text-white placeholder:text-white/60 rounded-full h-10 sm:h-11 min-w-[200px] sm:min-w-[260px]"
                required
              />
              <Button
                type="submit"
                className="bg-white text-primary hover:bg-white/90 rounded-full h-10 sm:h-11 px-5 font-semibold"
              >
                <Send className="w-4 h-4 sm:mr-1.5" />
                <span className="hidden sm:inline">S'abonner</span>
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="container mx-auto max-w-[1600px] px-4 lg:px-8 py-10 lg:py-14">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-10">
          {/* Assistance */}
          <div>
            <h4 className="font-semibold mb-4 text-sm lg:text-base text-white">Assistance</h4>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={() => navigate("/support")}
                  className="text-sm text-white/60 hover:text-primary transition-colors"
                >
                  Centre d'aide
                </button>
              </li>
              <li>
                <a
                  href="https://wa.me/2250788281222?text=Bonjour%2C%20j%27ai%20besoin%20d%27aide%20sur%20Djassa."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white/60 hover:text-primary transition-colors"
                >
                  Support WhatsApp
                </a>
              </li>
              <li>
                <button 
                  onClick={() => navigate("/support")}
                  className="text-sm text-white/60 hover:text-primary transition-colors"
                >
                  FAQ
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate("/tarifs")}
                  className="text-sm text-white/60 hover:text-primary transition-colors"
                >
                  Tarifs
                </button>
              </li>
            </ul>
          </div>

          {/* Informations */}
          <div>
            <h4 className="font-semibold mb-4 text-sm lg:text-base text-white">Informations</h4>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={() => navigate("/about")}
                  className="text-sm text-white/60 hover:text-primary transition-colors"
                >
                  À propos de Djassa
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate("/legal")}
                  className="text-sm text-white/60 hover:text-primary transition-colors"
                >
                  Politique de confidentialité
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate("/legal")}
                  className="text-sm text-white/60 hover:text-primary transition-colors"
                >
                  Mentions légales
                </button>
              </li>
              <li>
                <button className="text-sm text-white/60 hover:text-primary transition-colors">
                  CGV
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-sm lg:text-base text-white">Contact</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:djassa@djassa.tech"
                  className="text-sm text-white/60 hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  djassa@djassa.tech
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/2250788281222"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white/60 hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  +225 07 88 28 12 22
                </a>
              </li>
              <li className="text-sm text-white/60 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Abidjan, Côte d'Ivoire
              </li>
            </ul>
          </div>

          {/* Paiement & Livraison */}
          <div>
            <h4 className="font-semibold mb-4 text-sm lg:text-base text-white">Paiement & Livraison</h4>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-1.5 text-xs text-white/80">
                  <Smartphone className="w-3.5 h-3.5 text-[hsl(24,100%,50%)]" />
                  Orange Money
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-1.5 text-xs text-white/80">
                  <Smartphone className="w-3.5 h-3.5 text-[hsl(51,100%,50%)]" />
                  MTN MoMo
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-1.5 text-xs text-white/80">
                  <Smartphone className="w-3.5 h-3.5 text-[hsl(210,100%,50%)]" />
                  Moov Money
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-1.5 text-xs text-white/80">
                  <CreditCard className="w-3.5 h-3.5" />
                  Carte bancaire
                </span>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Truck className="w-4 h-4 text-[hsl(var(--success))]" />
                <span className="text-xs text-white/60">Livraison 2-5 jours</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[hsl(var(--success))]" />
                <span className="text-xs text-white/60">Paiement sécurisé SSL</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-white/50">
            © {new Date().getFullYear()} Djassa - Votre marketplace de confiance
          </p>
          <p className="text-xs text-white/40">
            Fait avec ❤️ en Côte d'Ivoire 🇨🇮
          </p>
        </div>
      </div>
    </footer>
  );
};
