import { useEffect } from 'react';
import { ArrowLeft, Package } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MyOrdersTabs } from "@/components/orders/MyOrdersTabs";

const MyOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      {/* Native Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border/40 safe-area-inset-top">
        <div className="px-4 py-3 flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="h-10 w-10 rounded-xl bg-muted/60 hover:bg-muted flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>

          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-foreground tracking-tight">Mes Commandes</h1>
            <p className="text-xs text-muted-foreground">Suivez vos achats et ventes</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-9 px-3 rounded-full bg-primary/10 flex items-center justify-center">
              <Package className="w-4 h-4 text-primary mr-1.5" />
              <span className="text-sm font-bold text-primary tabular-nums">•</span>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 max-w-lg mx-auto lg:max-w-2xl">
        <MyOrdersTabs initialTab="purchases" />
      </main>
    </div>
  );
};

export default MyOrders;

