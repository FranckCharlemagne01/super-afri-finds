import { useState } from "react";
import { MessageCircle, Phone, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const WHATSAPP_URL = "https://wa.me/2250788281222?text=" + encodeURIComponent("Bonjour, j'ai besoin d'aide sur Djassa.");

export const FloatingSupportButton = () => {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // On mobile, hide if bottom nav is visible (user can access via menu)
  if (isMobile) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-2 mb-2"
          >
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <Button className="bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full gap-2 shadow-lg h-11 px-5">
                <Phone className="w-4 h-4" /> WhatsApp
              </Button>
            </a>
            <Button
              onClick={() => { navigate("/support"); setOpen(false); }}
              className="rounded-full gap-2 shadow-lg h-11 px-5"
            >
              <Send className="w-4 h-4" /> Support
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={() => setOpen(!open)}
        className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-[hsl(16,100%,50%)] text-white shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200 border-2 border-white/20"
        size="icon"
        aria-label="Support Djassa"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>
    </div>
  );
};
