import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Menu, X, HelpCircle, Info, Phone, MapPin, CreditCard, 
  ChevronRight, Truck, ShieldCheck, Mail, Smartphone
} from "lucide-react";
import { Button } from "./ui/button";

export const MobileHamburgerMenu = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="w-10 h-10 p-0 rounded-full"
        onClick={() => setOpen(true)}
        aria-label="Menu"
      >
        <Menu className="w-5 h-5" />
      </Button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-[9998]"
            onClick={() => setOpen(false)}
          />

          {/* Drawer */}
          <div
            className="fixed top-0 left-0 bottom-0 w-[300px] bg-white z-[9999] shadow-2xl flex flex-col overflow-hidden"
            style={{ maxWidth: "85vw" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="text-lg font-bold text-primary">Djassa</span>
              <button
                onClick={() => setOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
                aria-label="Fermer"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto">
              <nav className="py-3 px-3">
                {/* Assistance */}
                <button
                  onClick={() => go("/support")}
                  className="flex items-center justify-between w-full px-4 py-4 rounded-xl text-sm font-medium text-gray-800 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <span className="block">Assistance</span>
                      <span className="text-xs text-gray-400">Centre d'aide & FAQ</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>

                {/* Informations */}
                <button
                  onClick={() => go("/about")}
                  className="flex items-center justify-between w-full px-4 py-4 rounded-xl text-sm font-medium text-gray-800 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Info className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <span className="block">Informations</span>
                      <span className="text-xs text-gray-400">À propos & mentions légales</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>

                {/* Contact */}
                <button
                  onClick={() => go("/support")}
                  className="flex items-center justify-between w-full px-4 py-4 rounded-xl text-sm font-medium text-gray-800 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <span className="block">Contact</span>
                      <span className="text-xs text-gray-400">+225 07 88 28 12 22</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>

                {/* Localisation */}
                <div className="flex items-center gap-3 px-4 py-4 rounded-xl">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <span className="block text-sm font-medium text-gray-800">Abidjan, Côte d'Ivoire</span>
                    <span className="text-xs text-gray-400">Zone de service</span>
                  </div>
                </div>

                {/* Separator */}
                <div className="mx-4 my-2 border-t border-gray-100" />

                {/* Paiement & Livraison */}
                <div className="px-4 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium text-gray-800">Paiement & Livraison</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-1.5 text-xs text-gray-600">
                      <Smartphone className="w-3.5 h-3.5 text-orange-500" />
                      Orange Money
                    </span>
                    <span className="inline-flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-1.5 text-xs text-gray-600">
                      <Smartphone className="w-3.5 h-3.5 text-yellow-500" />
                      MTN MoMo
                    </span>
                    <span className="inline-flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-1.5 text-xs text-gray-600">
                      <Smartphone className="w-3.5 h-3.5 text-blue-500" />
                      Moov Money
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Truck className="w-4 h-4 text-green-500" />
                    <span>Livraison 2-5 jours</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1.5">
                    <ShieldCheck className="w-4 h-4 text-green-500" />
                    <span>Paiement sécurisé SSL</span>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="mx-4 my-2 border-t border-gray-100" />
                <a
                  href="https://wa.me/2250788281222?text=Bonjour%2C%20j%27ai%20besoin%20d%27aide%20sur%20Djassa."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-4 rounded-xl text-sm font-medium text-green-600 hover:bg-green-50 active:bg-green-100 transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <Mail className="w-5 h-5" />
                  <span>Support WhatsApp</span>
                </a>
              </nav>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-100 text-center">
              <p className="text-[10px] text-gray-400">Djassa © {new Date().getFullYear()} — Marketplace Africaine 🇨🇮</p>
            </div>
          </div>
        </>
      )}
    </>
  );
};
