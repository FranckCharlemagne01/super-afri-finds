import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SEOHead from "@/components/SEOHead";
import { MarketplaceFooter } from "@/components/MarketplaceFooter";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  MessageCircle, Phone, Mail, ArrowLeft, Send, 
  HelpCircle, ShoppingCart, CreditCard, Truck, Store, 
  Package, AlertCircle, CheckCircle2
} from "lucide-react";

const WHATSAPP_NUMBER = "2250788281222";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Bonjour, j'ai besoin d'aide sur Djassa.")}`;

const faqItems = [
  {
    question: "Comment acheter un produit sur Djassa ?",
    answer: "Connectez-vous, choisissez un produit, ajoutez-le au panier et suivez les étapes de paiement sécurisé. Vous pouvez payer via Orange Money, MTN MoMo, Moov Money ou carte bancaire.",
    icon: <ShoppingCart className="w-4 h-4" />,
  },
  {
    question: "Comment vendre sur Djassa ?",
    answer: "Créez un compte vendeur, accédez à votre tableau de bord, puis publiez vos produits. Vous bénéficiez de 50 jetons gratuits et 28 jours d'essai pour démarrer.",
    icon: <Store className="w-4 h-4" />,
  },
  {
    question: "Comment payer avec Mobile Money ?",
    answer: "Lors du checkout, sélectionnez votre opérateur (Orange Money, MTN MoMo ou Moov Money). Validez le paiement depuis votre téléphone. La transaction est sécurisée par Paystack.",
    icon: <CreditCard className="w-4 h-4" />,
  },
  {
    question: "Comment fonctionne la livraison ?",
    answer: "Les vendeurs choisissent leur mode de livraison (locale, transporteur, remise en main propre). Vous voyez les frais avant de confirmer. Le suivi est disponible dans 'Mes commandes'.",
    icon: <Truck className="w-4 h-4" />,
  },
  {
    question: "Comment créer ma boutique ?",
    answer: "Dans votre tableau de bord vendeur, cliquez sur 'Créer ma boutique'. Personnalisez le nom, ajoutez un logo et une bannière. Vos produits seront visibles dans votre boutique et sur la marketplace.",
    icon: <Store className="w-4 h-4" />,
  },
  {
    question: "Que faire si j'ai un problème avec ma commande ?",
    answer: "Utilisez le formulaire ci-dessous pour nous contacter ou écrivez-nous directement sur WhatsApp. Notre équipe vous répondra rapidement pour résoudre tout problème.",
    icon: <Package className="w-4 h-4" />,
  },
  {
    question: "Mes paiements sont-ils sécurisés ?",
    answer: "Oui, toutes les transactions passent par Paystack avec un chiffrement SSL. Djassa ne conserve jamais vos informations bancaires. Ne payez jamais en dehors de la plateforme.",
    icon: <AlertCircle className="w-4 h-4" />,
  },
  {
    question: "Comment booster mes produits ?",
    answer: "Utilisez vos jetons pour mettre en avant vos produits sur la page d'accueil. Les produits boostés apparaissent dans les sections vedettes pour maximiser votre visibilité.",
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
];

const subjectOptions = [
  { value: "commande", label: "Problème de commande", icon: "📦" },
  { value: "produit", label: "Problème de produit", icon: "🛍️" },
  { value: "paiement", label: "Problème de paiement", icon: "💳" },
  { value: "vendeur", label: "Support vendeur", icon: "🏪" },
  { value: "publication", label: "Problème de publication", icon: "📝" },
  { value: "commission", label: "Paiement / Commission", icon: "💰" },
  { value: "boutique", label: "Gestion boutique", icon: "🏬" },
  { value: "autre", label: "Autre demande", icon: "❓" },
];

const Support = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: user?.email || "",
    phone: "",
    subject: "",
    category: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.subject || !form.message || !form.category) {
      toast({ title: "Champs requis manquants", description: "Veuillez remplir tous les champs obligatoires.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      if (user) {
        const { error } = await supabase.from("support_tickets" as any).insert({
          user_id: user.id,
          name: form.name.trim(),
          email: form.email?.trim() || null,
          phone: form.phone?.trim() || null,
          subject: form.subject.trim(),
          category: form.category,
          message: form.message.trim(),
        } as any);
        if (error) throw error;
      }
      setSubmitted(true);
      toast({ title: "✅ Message envoyé", description: "Notre équipe vous répondra dans les plus brefs délais." });
    } catch (err) {
      console.error("Support ticket error:", err);
      toast({ title: "Erreur", description: "Impossible d'envoyer votre message. Essayez via WhatsApp.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEOHead title="Support & Aide - Djassa" description="Besoin d'aide ? Contactez le support Djassa par formulaire ou WhatsApp. FAQ, aide commandes, paiements et vendeurs." />
      
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-[hsl(16,100%,50%)] text-white">
          <div className="container mx-auto max-w-4xl px-4 py-6 sm:py-10">
            <div className="flex items-center gap-3 mb-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white hover:bg-white/20 rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">💬 Support Djassa</h1>
                <p className="text-white/80 text-sm mt-1">Comment pouvons-nous vous aider ?</p>
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2 mt-4">
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <Button className="bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full gap-2 h-10 px-4 text-sm font-semibold shadow-lg">
                  <Phone className="w-4 h-4" /> WhatsApp
                </Button>
              </a>
              <a href="mailto:djassa@djassa.tech">
                <Button variant="outline" className="bg-white/15 border-white/30 text-white hover:bg-white/25 rounded-full gap-2 h-10 px-4 text-sm">
                  <Mail className="w-4 h-4" /> Email
                </Button>
              </a>
              <a href={`tel:+${WHATSAPP_NUMBER}`}>
                <Button variant="outline" className="bg-white/15 border-white/30 text-white hover:bg-white/25 rounded-full gap-2 h-10 px-4 text-sm">
                  <Phone className="w-4 h-4" /> Appeler
                </Button>
              </a>
            </div>
          </div>
        </div>

        <div className="container mx-auto max-w-4xl px-4 py-6 sm:py-10 space-y-8 pb-28 sm:pb-10">
          
          {/* WhatsApp CTA */}
          <Card className="border-[#25D366]/30 bg-[#25D366]/5">
            <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
                <Phone className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-bold text-foreground text-base">Contactez-nous via WhatsApp</h3>
                <p className="text-sm text-muted-foreground mt-1">Réponse rapide • Disponible 7j/7 • Support en français</p>
              </div>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full gap-2 font-semibold">
                  <MessageCircle className="w-4 h-4" /> Ouvrir WhatsApp
                </Button>
              </a>
            </CardContent>
          </Card>

          {/* FAQ */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Questions fréquentes</h2>
            </div>
            <Card>
              <CardContent className="p-0">
                <Accordion type="single" collapsible className="w-full">
                  {faqItems.map((item, idx) => (
                    <AccordionItem key={idx} value={`faq-${idx}`} className="border-border/50">
                      <AccordionTrigger className="px-4 text-left text-sm hover:no-underline gap-2">
                        <span className="flex items-center gap-2">
                          {item.icon}
                          {item.question}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 text-sm text-muted-foreground leading-relaxed">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </section>

          {/* Contact Form */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Send className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Envoyer un message</h2>
            </div>

            {submitted ? (
              <Card className="border-green-500/30 bg-green-50 dark:bg-green-950/20">
                <CardContent className="p-6 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                  <h3 className="font-bold text-foreground text-lg">Message envoyé !</h3>
                  <p className="text-sm text-muted-foreground">Notre équipe vous répondra dans les plus brefs délais. Pour une réponse plus rapide, contactez-nous sur WhatsApp.</p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                    <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                      <Button className="bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full gap-2 w-full">
                        <MessageCircle className="w-4 h-4" /> WhatsApp
                      </Button>
                    </a>
                    <Button variant="outline" onClick={() => { setSubmitted(false); setForm(f => ({ ...f, subject: "", category: "", message: "" })); }} className="rounded-full">
                      Nouveau message
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-foreground mb-1.5 block">Nom *</label>
                        <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Votre nom" required maxLength={100} />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-foreground mb-1.5 block">Email</label>
                        <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Votre email" maxLength={255} />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-foreground mb-1.5 block">Téléphone</label>
                      <Input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+225 07 XX XX XX XX" maxLength={20} />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-foreground mb-1.5 block">Catégorie *</label>
                      <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                        <SelectTrigger><SelectValue placeholder="Choisir une catégorie" /></SelectTrigger>
                        <SelectContent>
                          {subjectOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.icon} {opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-foreground mb-1.5 block">Sujet *</label>
                      <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Décrivez brièvement votre problème" required maxLength={200} />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-foreground mb-1.5 block">Message *</label>
                      <Textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Décrivez votre problème en détail..." required className="min-h-[120px]" maxLength={2000} />
                    </div>

                    <Button type="submit" disabled={isSubmitting} className="w-full rounded-full h-12 font-semibold text-base gap-2">
                      {isSubmitting ? "Envoi en cours..." : <><Send className="w-4 h-4" /> Envoyer le message</>}
                    </Button>

                    {!user && (
                      <p className="text-xs text-muted-foreground text-center">
                        <button onClick={() => navigate("/auth")} className="text-primary underline">Connectez-vous</button> pour enregistrer votre demande et suivre son statut.
                      </p>
                    )}
                  </form>
                </CardContent>
              </Card>
            )}
          </section>

          {/* Contact info */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="text-center">
              <CardContent className="p-4 space-y-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">Email</p>
                <a href="mailto:djassa@djassa.tech" className="text-xs text-primary">djassa@djassa.tech</a>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4 space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center mx-auto">
                  <Phone className="w-5 h-5 text-[#25D366]" />
                </div>
                <p className="text-sm font-semibold text-foreground">WhatsApp</p>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-xs text-primary">+225 07 88 28 12 22</a>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4 space-y-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">Chat</p>
                <p className="text-xs text-muted-foreground">Disponible 7j/7</p>
              </CardContent>
            </Card>
          </section>
        </div>

        <MarketplaceFooter />
        {isMobile && <MobileBottomNav />}
      </div>
    </>
  );
};

export default Support;
