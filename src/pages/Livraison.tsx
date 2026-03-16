import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useStableAuth } from "@/hooks/useStableAuth";
import { NativeHeader } from "@/components/NativeHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Package,
  Truck,
  MapPin,
  Phone,
  CheckCircle2,
  Clock,
  ArrowRight,
  Bike,
  Car,
  Upload,
  User,
  CircleDollarSign,
  Shield,
  Zap,
} from "lucide-react";
import deliveryHero from "@/assets/delivery-hero.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

const Livraison = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useStableAuth();

  // Quick delivery form
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [packageType, setPackageType] = useState("");
  const [phone, setPhone] = useState("");

  // Driver signup form
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [driverCity, setDriverCity] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [driverEmail, setDriverEmail] = useState("");
  const [driverPassword, setDriverPassword] = useState("");
  const [submittingDriver, setSubmittingDriver] = useState(false);

  const handleQuickDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup || !destination || !packageType || !phone) {
      toast({ title: "Veuillez remplir tous les champs", variant: "destructive" });
      return;
    }
    toast({
      title: "✅ Demande enregistrée",
      description: "Un livreur sera bientôt assigné à votre demande.",
    });
  };

  const handleDriverSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName || !driverPhone || !driverCity || !vehicleType || !driverEmail || !driverPassword) {
      toast({ title: "Veuillez remplir tous les champs", variant: "destructive" });
      return;
    }

    if (driverPassword.length < 6) {
      toast({ title: "Le mot de passe doit contenir au moins 6 caractères", variant: "destructive" });
      return;
    }

    setSubmittingDriver(true);
    try {
      // 1. Create Supabase auth account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: driverEmail.trim(),
        password: driverPassword,
        options: {
          data: {
            full_name: driverName.trim(),
            phone: driverPhone.trim(),
            user_role: 'driver',
          },
        },
      });

      if (signUpError) {
        const msg = signUpError.message.toLowerCase();
        if (msg.includes('already registered') || msg.includes('already been registered')) {
          toast({ title: "Cet email est déjà utilisé", description: "Connectez-vous ou utilisez un autre email.", variant: "destructive" });
        } else {
          toast({ title: "Erreur d'inscription", description: signUpError.message, variant: "destructive" });
        }
        return;
      }

      const userId = signUpData.user?.id;
      if (!userId) {
        toast({ title: "Erreur lors de la création du compte", variant: "destructive" });
        return;
      }

      // 2. Create driver profile
      const { error: profileError } = await supabase
        .from('driver_profiles')
        .upsert({
          user_id: userId,
          full_name: driverName.trim(),
          phone: driverPhone.trim(),
          city: driverCity.trim(),
          vehicle_type: vehicleType,
          driver_status: 'pending',
        }, { onConflict: 'user_id' });

      if (profileError) console.warn('Driver profile creation warning:', profileError);

      // 3. Assign driver role
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: 'driver' as any,
        }, { onConflict: 'user_id,role' });

      if (roleError) console.warn('Role assignment warning:', roleError);

      toast({
        title: "✅ Inscription réussie !",
        description: "Votre compte livreur a été créé. Bienvenue sur Djassa !",
      });

      navigate('/driver-dashboard');
    } catch (err) {
      console.error('Driver signup error:', err);
      toast({ title: "Erreur lors de l'inscription", variant: "destructive" });
    } finally {
      setSubmittingDriver(false);
    }
  };

  const steps = [
    {
      icon: MapPin,
      title: "Entrez les informations",
      description: "Indiquez les adresses de récupération et de destination.",
    },
    {
      icon: CheckCircle2,
      title: "Un livreur accepte",
      description: "Un livreur disponible prend en charge votre demande.",
    },
    {
      icon: Truck,
      title: "Livraison rapide",
      description: "Votre colis est livré rapidement au destinataire.",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <SEOHead
        title="Livraison rapide avec Djassa | Service de livraison"
        description="Trouvez un livreur en quelques minutes ou devenez livreur sur Djassa. Service de livraison rapide et fiable en Côte d'Ivoire."
      />

      {isMobile && <NativeHeader title="Livraison" />}

      {/* ============ SECTION 1: HERO ============ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={deliveryHero}
            alt="Service de livraison Djassa"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/60 to-transparent" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-28">
          <motion.div
            initial="hidden"
            animate="visible"
            className="max-w-xl space-y-6"
          >
            <motion.div variants={fadeUp} custom={0}>
              <Badge className="bg-primary/90 text-primary-foreground text-sm px-4 py-1.5 rounded-full">
                <Zap className="w-4 h-4 mr-1.5" />
                Nouveau sur Djassa
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-3xl md:text-5xl font-extrabold text-white leading-tight"
            >
              Livraison rapide
              <br />
              avec <span className="text-primary">Djassa</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-lg text-white/80 max-w-md"
            >
              Trouvez un livreur en quelques minutes ou devenez livreur sur Djassa.
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="rounded-xl text-base font-semibold shadow-lg"
                onClick={() =>
                  document.getElementById("quick-delivery")?.scrollIntoView({ behavior: "smooth" })
                }
              >
                <Package className="w-5 h-5 mr-2" />
                Trouver un livreur
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-xl text-base font-semibold bg-white/10 border-white/30 text-white hover:bg-white/20"
                onClick={() =>
                  document.getElementById("driver-signup")?.scrollIntoView({ behavior: "smooth" })
                }
              >
                <Bike className="w-5 h-5 mr-2" />
                Devenir livreur
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ============ SECTION 2: COMMENT ÇA MARCHE ============ */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="text-center mb-12"
        >
          <motion.h2
            variants={fadeUp}
            custom={0}
            className="text-2xl md:text-3xl font-bold text-foreground"
          >
            Comment ça marche ?
          </motion.h2>
          <motion.p
            variants={fadeUp}
            custom={1}
            className="text-muted-foreground mt-2 max-w-md mx-auto"
          >
            Un processus simple en 3 étapes pour envoyer ou recevoir vos colis.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={idx}
              variants={fadeUp}
            >
              <Card className="border-none shadow-md hover:shadow-lg transition-shadow h-full text-center">
                <CardContent className="pt-8 pb-6 px-6 flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============ SECTION 3: DEMANDE RAPIDE ============ */}
      <section id="quick-delivery" className="bg-muted/50 py-16">
        <div className="max-w-2xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="text-2xl md:text-3xl font-bold text-foreground text-center"
            >
              Demande rapide de livraison
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="text-muted-foreground text-center mt-2 mb-8"
            >
              Remplissez le formulaire pour trouver un livreur rapidement.
            </motion.p>

            <motion.div variants={fadeUp} custom={2}>
              <Card className="shadow-lg border-none">
                <CardContent className="pt-6 space-y-4">
                  <form onSubmit={handleQuickDelivery} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="pickup" className="text-sm font-medium">
                        <MapPin className="w-4 h-4 inline mr-1.5 text-primary" />
                        Adresse de récupération
                      </Label>
                      <Input
                        id="pickup"
                        placeholder="Ex: Cocody Angré, Abidjan"
                        value={pickup}
                        onChange={(e) => setPickup(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="destination" className="text-sm font-medium">
                        <MapPin className="w-4 h-4 inline mr-1.5 text-destructive" />
                        Adresse de destination
                      </Label>
                      <Input
                        id="destination"
                        placeholder="Ex: Plateau, Abidjan"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        <Package className="w-4 h-4 inline mr-1.5 text-primary" />
                        Type de colis
                      </Label>
                      <Select value={packageType} onValueChange={setPackageType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez le type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="petit">Petit colis (enveloppe, document)</SelectItem>
                          <SelectItem value="moyen">Moyen colis (sac, boîte)</SelectItem>
                          <SelectItem value="grand">Grand colis (carton, meuble)</SelectItem>
                          <SelectItem value="nourriture">Nourriture / Repas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium">
                        <Phone className="w-4 h-4 inline mr-1.5 text-primary" />
                        Numéro de téléphone
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+225 07 00 00 00 00"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>

                    <Button type="submit" className="w-full rounded-xl text-base font-semibold" size="lg">
                      Continuer
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ============ SECTION 4: INSCRIPTION LIVREUR ============ */}
      <section id="driver-signup" className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            {/* Left: benefits */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="space-y-6"
            >
              <motion.div variants={fadeUp} custom={0}>
                <Badge className="bg-success/10 text-success text-sm px-4 py-1.5 rounded-full border-success/20">
                  <CircleDollarSign className="w-4 h-4 mr-1.5" />
                  Opportunité
                </Badge>
              </motion.div>

              <motion.h2
                variants={fadeUp}
                custom={1}
                className="text-2xl md:text-3xl font-bold text-foreground"
              >
                Gagnez de l'argent
                <br />
                avec <span className="text-primary">Djassa</span>
              </motion.h2>

              <motion.p
                variants={fadeUp}
                custom={2}
                className="text-muted-foreground text-base max-w-md"
              >
                Devenez livreur et recevez des missions de livraison directement depuis Djassa.
                Travaillez à votre rythme et gagnez un revenu complémentaire.
              </motion.p>

              <motion.div variants={fadeUp} custom={3} className="space-y-4">
                {[
                  { icon: Clock, text: "Travaillez à votre rythme" },
                  { icon: CircleDollarSign, text: "Paiements rapides et sécurisés" },
                  { icon: Shield, text: "Assurance et support dédiés" },
                  { icon: Zap, text: "Recevez des missions instantanément" },
                ].map(({ icon: Icon, text }, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-foreground font-medium">{text}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right: form */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={2}
            >
              <Card className="shadow-lg border-none">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-center">
                    S'inscrire comme livreur
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleDriverSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        <User className="w-4 h-4 inline mr-1.5 text-primary" />
                        Nom complet
                      </Label>
                      <Input
                        placeholder="Votre nom complet"
                        value={driverName}
                        onChange={(e) => setDriverName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        <Phone className="w-4 h-4 inline mr-1.5 text-primary" />
                        Numéro de téléphone
                      </Label>
                      <Input
                        type="tel"
                        placeholder="+225 07 00 00 00 00"
                        value={driverPhone}
                        onChange={(e) => setDriverPhone(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        <MapPin className="w-4 h-4 inline mr-1.5 text-primary" />
                        Ville
                      </Label>
                      <Input
                        placeholder="Ex: Abidjan"
                        value={driverCity}
                        onChange={(e) => setDriverCity(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        <Truck className="w-4 h-4 inline mr-1.5 text-primary" />
                        Type de véhicule
                      </Label>
                      <Select value={vehicleType} onValueChange={setVehicleType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisissez votre véhicule" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="moto">🏍️ Moto</SelectItem>
                          <SelectItem value="voiture">🚗 Voiture</SelectItem>
                          <SelectItem value="velo">🚲 Vélo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        <Lock className="w-4 h-4 inline mr-1.5 text-primary" />
                        Mot de passe
                      </Label>
                      <Input
                        type="password"
                        placeholder="Minimum 6 caractères"
                        value={driverPassword}
                        onChange={(e) => setDriverPassword(e.target.value)}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full rounded-xl text-base font-semibold"
                      size="lg"
                      disabled={submittingDriver}
                    >
                      {submittingDriver ? "Inscription en cours..." : "S'inscrire comme livreur"}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>

                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Déjà inscrit ?{" "}
                      <a href="/driver-login" className="text-primary font-semibold hover:underline">
                        Se connecter
                      </a>
                    </p>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Livraison;
