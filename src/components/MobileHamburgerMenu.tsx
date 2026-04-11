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

  if (!open) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="w-10 h-10 p-0 rounded-full"
        onClick={() => setOpen(true)}
        aria-label="Menu"
      >
        <Menu className="w-5 h-5" />
      </Button>
    );
  }

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

      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        style={{ zIndex: 10000 }}
        onClick={() => setOpen(false)}
      />

      {/* Drawer */}
      <div
        className="fixed top-0 left-0 shadow-2xl"
        style={{
          zIndex: 10001,
          width: "min(300px, 85vw)",
          height: "100vh",
          backgroundColor: "#ffffff",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid #f3f4f6",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 700, color: "hsl(var(--primary))" }}>Djassa</span>
          <button
            onClick={() => setOpen(false)}
            style={{
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              border: "none",
              background: "transparent",
              cursor: "pointer",
            }}
            aria-label="Fermer"
          >
            <X style={{ width: 20, height: 20, color: "#6b7280" }} />
          </button>
        </div>

        {/* Scrollable Menu Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
          {/* Assistance */}
          <button
            onClick={() => go("/support")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              padding: "14px 12px",
              borderRadius: 12,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <HelpCircle style={{ width: 20, height: 20, color: "hsl(var(--primary))" }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#1f2937" }}>Assistance</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>Centre d'aide & FAQ</div>
              </div>
            </div>
            <ChevronRight style={{ width: 16, height: 16, color: "#d1d5db" }} />
          </button>

          {/* Informations */}
          <button
            onClick={() => go("/about")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              padding: "14px 12px",
              borderRadius: 12,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Info style={{ width: 20, height: 20, color: "hsl(var(--primary))" }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#1f2937" }}>Informations</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>À propos & mentions légales</div>
              </div>
            </div>
            <ChevronRight style={{ width: 16, height: 16, color: "#d1d5db" }} />
          </button>

          {/* Contact */}
          <button
            onClick={() => go("/support")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              padding: "14px 12px",
              borderRadius: 12,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Phone style={{ width: 20, height: 20, color: "hsl(var(--primary))" }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#1f2937" }}>Contact</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>+225 07 88 28 12 22</div>
              </div>
            </div>
            <ChevronRight style={{ width: 16, height: 16, color: "#d1d5db" }} />
          </button>

          {/* Localisation */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 12px" }}>
            <MapPin style={{ width: 20, height: 20, color: "hsl(var(--primary))" }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#1f2937" }}>Abidjan, Côte d'Ivoire</div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>Zone de service</div>
            </div>
          </div>

          {/* Separator */}
          <div style={{ margin: "8px 12px", borderTop: "1px solid #f3f4f6" }} />

          {/* Paiement & Livraison */}
          <div style={{ padding: "14px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <CreditCard style={{ width: 20, height: 20, color: "hsl(var(--primary))" }} />
              <span style={{ fontSize: 14, fontWeight: 500, color: "#1f2937" }}>Paiement & Livraison</span>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#f9fafb", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "#4b5563" }}>
                <Smartphone style={{ width: 14, height: 14, color: "#f97316" }} />
                Orange Money
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#f9fafb", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "#4b5563" }}>
                <Smartphone style={{ width: 14, height: 14, color: "#eab308" }} />
                MTN MoMo
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#f9fafb", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "#4b5563" }}>
                <Smartphone style={{ width: 14, height: 14, color: "#3b82f6" }} />
                Moov Money
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#6b7280" }}>
              <Truck style={{ width: 16, height: 16, color: "#22c55e" }} />
              <span>Livraison 2-5 jours</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#6b7280", marginTop: 6 }}>
              <ShieldCheck style={{ width: 16, height: 16, color: "#22c55e" }} />
              <span>Paiement sécurisé SSL</span>
            </div>
          </div>

          {/* Separator */}
          <div style={{ margin: "8px 12px", borderTop: "1px solid #f3f4f6" }} />

          {/* WhatsApp */}
          <a
            href="https://wa.me/2250788281222?text=Bonjour%2C%20j%27ai%20besoin%20d%27aide%20sur%20Djassa."
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 12px",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 500,
              color: "#16a34a",
              textDecoration: "none",
            }}
          >
            <Mail style={{ width: 20, height: 20 }} />
            <span>Support WhatsApp</span>
          </a>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid #f3f4f6",
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          <p style={{ fontSize: 10, color: "#9ca3af" }}>
            Djassa © {new Date().getFullYear()} — Marketplace Africaine 🇨🇮
          </p>
        </div>
      </div>
    </>
  );
};
