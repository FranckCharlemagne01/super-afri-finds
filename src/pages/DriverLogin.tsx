import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Truck, Mail, Lock, ArrowRight, Bike } from "lucide-react";

const DriverLogin = () => {
  const navigate = useNavigate();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone || !password) {
      toast({ title: "Veuillez remplir tous les champs", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const isEmail = emailOrPhone.includes("@");
      const { error } = await supabase.auth.signInWithPassword({
        email: isEmail ? emailOrPhone : undefined,
        phone: !isEmail ? emailOrPhone : undefined,
        password,
      });

      if (error) {
        toast({
          title: "Erreur de connexion",
          description: error.message === "Invalid login credentials"
            ? "Email/téléphone ou mot de passe incorrect."
            : error.message,
          variant: "destructive",
        });
        return;
      }

      toast({ title: "✅ Connexion réussie", description: "Bienvenue sur votre espace livreur !" });
      navigate("/driver-dashboard");
    } catch (err) {
      console.error("Driver login error:", err);
      toast({ title: "Erreur inattendue", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <SEOHead
        title="Connexion Livreur | Djassa"
        description="Connectez-vous à votre espace livreur Djassa pour gérer vos missions et livraisons."
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Truck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Espace Livreur</h1>
          <p className="text-muted-foreground mt-1">Connectez-vous pour accéder à vos missions</p>
        </div>

        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle className="text-lg text-center">Connexion</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  <Mail className="w-4 h-4 inline mr-1.5 text-primary" />
                  Email ou téléphone
                </Label>
                <Input
                  placeholder="email@exemple.com ou +225 07..."
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  <Lock className="w-4 h-4 inline mr-1.5 text-primary" />
                  Mot de passe
                </Label>
                <Input
                  type="password"
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full rounded-xl text-base font-semibold"
                size="lg"
                disabled={loading}
              >
                {loading ? "Connexion en cours..." : "Se connecter"}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Pas encore inscrit ?{" "}
                <Link to="/livraison" className="text-primary font-semibold hover:underline">
                  Devenir livreur
                </Link>
              </p>
              <p className="text-sm text-muted-foreground">
                <Link to="/auth/reset-password" className="text-primary hover:underline">
                  Mot de passe oublié ?
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default DriverLogin;
