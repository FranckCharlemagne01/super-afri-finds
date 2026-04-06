import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
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
  Package, AlertCircle, CheckCircle2, User, ImagePlus, X
} from "lucide-react";

const WHATSAPP_NUMBER = "2250788281222";
const WHATSAPP_CLIENT_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Bonjour, j'ai besoin d'aide sur Djassa.")}`;
const WHATSAPP_SELLER_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Bonjour, je suis vendeur sur Djassa et j'ai besoin d'assistance pour ma boutique.")}`;

const faqItems = [
  { question: "Comment acheter un produit sur Djassa ?", answer: "Connectez-vous, choisissez un produit, ajoutez-le au panier et suivez les étapes de paiement sécurisé. Vous pouvez payer via Orange Money, MTN MoMo, Moov Money ou carte bancaire.", icon: <ShoppingCart className="w-4 h-4" /> },
  { question: "Comment vendre sur Djassa ?", answer: "Créez un compte vendeur, accédez à votre tableau de bord, puis publiez vos produits. Vous bénéficiez de 50 jetons gratuits et 28 jours d'essai pour démarrer.", icon: <Store className="w-4 h-4" /> },
  { question: "Comment payer avec Mobile Money ?", answer: "Lors du checkout, sélectionnez votre opérateur (Orange Money, MTN MoMo ou Moov Money). Validez le paiement depuis votre téléphone. La transaction est sécurisée par Paystack.", icon: <CreditCard className="w-4 h-4" /> },
  { question: "Comment fonctionne la livraison ?", answer: "Les vendeurs choisissent leur mode de livraison (locale, transporteur, remise en main propre). Vous voyez les frais avant de confirmer. Le suivi est disponible dans 'Mes commandes'.", icon: <Truck className="w-4 h-4" /> },
  { question: "Comment créer ma boutique ?", answer: "Dans votre tableau de bord vendeur, cliquez sur 'Créer ma boutique'. Personnalisez le nom, ajoutez un logo et une bannière. Vos produits seront visibles dans votre boutique et sur la marketplace.", icon: <Store className="w-4 h-4" /> },
  { question: "Que faire si j'ai un problème avec ma commande ?", answer: "Utilisez le formulaire ci-dessous pour nous contacter ou écrivez-nous directement sur WhatsApp. Notre équipe vous répondra rapidement pour résoudre tout problème.", icon: <Package className="w-4 h-4" /> },
  { question: "Mes paiements sont-ils sécurisés ?", answer: "Oui, toutes les transactions passent par Paystack avec un chiffrement SSL. Djassa ne conserve jamais vos informations bancaires. Ne payez jamais en dehors de la plateforme.", icon: <AlertCircle className="w-4 h-4" /> },
  { question: "Comment booster mes produits ?", answer: "Utilisez vos jetons pour mettre en avant vos produits sur la page d'accueil. Les produits boostés apparaissent dans les sections vedettes pour maximiser votre visibilité.", icon: <CheckCircle2 className="w-4 h-4" /> },
];

const categoryOptions = [
  { value: "commande", label: "Commande", icon: "📦" },
  { value: "produit", label: "Produit", icon: "🛍️" },
  { value: "paiement", label: "Paiement", icon: "💳" },
  { value: "livraison", label: "Livraison", icon: "🚚" },
  { value: "autre", label: "Autre", icon: "❓" },
];

type SupportMode = "choose" | "client" | "seller";

const Support = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<SupportMode>("choose");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: user?.email || "",
    phone: "",
    category: "",
    message: "",
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Fichier trop volumineux", description: "L'image ne doit pas dépasser 5 Mo.", variant: "destructive" });
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user) return null;
    try {
      const ext = imageFile.name.split(".").pop();
      const path = `support/${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("support-attachments").upload(path, imageFile);
      if (error) throw error;
      const { data } = supabase.storage.from("support-attachments").getPublicUrl(path);
      return data.publicUrl;
    } catch {
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.category || !form.message) {
      toast({ title: "Champs requis manquants", description: "Veuillez remplir tous les champs obligatoires.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile && user) {
        imageUrl = await uploadImage();
      }

      if (user) {
        const ticketData: Record<string, unknown> = {
          user_id: user.id,
          name: form.name.trim(),
          email: form.email?.trim() || null,
          phone: form.phone?.trim() || null,
          subject: `[${form.category.toUpperCase()}] ${form.message.substring(0, 80)}`,
          category: form.category,
          message: imageUrl ? `${form.message.trim()}\n\n📎 Image jointe: ${imageUrl}` : form.message.trim(),
        };
        const { error } = await supabase.from("support_tickets" as any).insert(ticketData as any);
        if (error) throw error;
      }

      setSubmitted(true);
      toast({ title: "✅ Demande envoyée", description: "Notre équipe vous répondra dans les plus brefs délais." });
    } catch (err) {
      console.error("Support ticket error:", err);
      toast({ title: "Erreur", description: "Impossible d'envoyer votre message. Essayez via WhatsApp.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    removeImage();
    setForm(f => ({ ...f, category: "", message: "" }));
  };

  return (
    <>
      <SEOHead title="Support & Aide - Djassa" description="Besoin d'aide ? Contactez le support Djassa par formulaire ou WhatsApp. FAQ, aide commandes, paiements et vendeurs." />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-[hsl(16,100%,50%)] text-white">
          <div className="container mx-auto max-w-4xl px-4 py-6 sm:py-10">
            <div className="flex items-center gap-3 mb-2">
              <Button variant="ghost" size="icon" onClick={() => mode !== "choose" ? setMode("choose") : navigate(-1)} className="text-white hover:bg-white/20 rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">💬 Support Djassa</h1>
                <p className="text-white/80 text-sm mt-0.5">Comment pouvons-nous vous aider ?</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto max-w-4xl px-4 py-6 sm:py-10 space-y-8 pb-28 sm:pb-10">

          {/* === CHOOSE MODE === */}
          {mode === "choose" && (
            <>
              <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Client card */}
                <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary/50 group" onClick={() => setMode("client")}>
                  <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <User className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-bold text-foreground text-lg">👤 Client / Utilisateur</h3>
                    <p className="text-sm text-muted-foreground">Problème de commande, produit, paiement ou livraison</p>
                    <Button className="mt-2 rounded-full gap-2 w-full">
                      <Send className="w-4 h-4" /> Envoyer une demande
                    </Button>
                  </CardContent>
                </Card>

                {/* Seller card */}
                <a href={WHATSAPP_SELLER_URL} target="_blank" rel="noopener noreferrer" className="block">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-[#25D366]/50 group h-full">
                    <CardContent className="p-6 flex flex-col items-center text-center gap-3 h-full">
                      <div className="w-16 h-16 rounded-full bg-[#25D366]/10 flex items-center justify-center group-hover:bg-[#25D366]/20 transition-colors">
                        <Store className="w-8 h-8 text-[#25D366]" />
                      </div>
                      <h3 className="font-bold text-foreground text-lg">🏪 Vendeur</h3>
                      <p className="text-sm text-muted-foreground">Publication, commission, gestion boutique</p>
                      <Button className="mt-2 rounded-full gap-2 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white">
                        <Phone className="w-4 h-4" /> Contacter via WhatsApp
                      </Button>
                    </CardContent>
                  </Card>
                </a>
              </section>

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
                            <span className="flex items-center gap-2">{item.icon}{item.question}</span>
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
                    <a href={WHATSAPP_CLIENT_URL} target="_blank" rel="noopener noreferrer" className="text-xs text-primary">+225 07 88 28 12 22</a>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="p-4 space-y-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <MessageCircle className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">Support</p>
                    <p className="text-xs text-muted-foreground">Disponible 7j/7</p>
                  </CardContent>
                </Card>
              </section>
            </>
          )}

          {/* === CLIENT FORM === */}
          {mode === "client" && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Send className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Envoyer une demande</h2>
              </div>

              {submitted ? (
                <Card className="border-green-500/30 bg-green-50 dark:bg-green-950/20">
                  <CardContent className="p-6 text-center space-y-3">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                    <h3 className="font-bold text-foreground text-lg">Demande envoyée avec succès !</h3>
                    <p className="text-sm text-muted-foreground">Votre demande a été envoyée avec succès. Nous vous répondrons rapidement.</p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                      <a href={WHATSAPP_CLIENT_URL} target="_blank" rel="noopener noreferrer">
                        <Button className="bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full gap-2 w-full">
                          <MessageCircle className="w-4 h-4" /> WhatsApp
                        </Button>
                      </a>
                      <Button variant="outline" onClick={resetForm} className="rounded-full">
                        Nouvelle demande
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
                            {categoryOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.icon} {opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-foreground mb-1.5 block">Message *</label>
                        <Textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Décrivez votre problème en détail..." required className="min-h-[120px]" maxLength={2000} />
                      </div>

                      {/* Image upload */}
                      <div>
                        <label className="text-sm font-semibold text-foreground mb-1.5 block">Image (optionnel)</label>
                        {imagePreview ? (
                          <div className="relative inline-block">
                            <img src={imagePreview} alt="Aperçu" className="w-24 h-24 object-cover rounded-lg border border-border" />
                            <button type="button" onClick={removeImage} className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                          >
                            <ImagePlus className="w-6 h-6" />
                            <span className="text-sm">Ajouter une capture d'écran</span>
                            <span className="text-xs">Max 5 Mo • JPG, PNG</span>
                          </button>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageChange} />
                      </div>

                      <Button type="submit" disabled={isSubmitting} className="w-full rounded-full h-12 font-semibold text-base gap-2">
                        {isSubmitting ? "Envoi en cours..." : <><Send className="w-4 h-4" /> Envoyer ma demande</>}
                      </Button>

                      {!user && (
                        <p className="text-xs text-muted-foreground text-center">
                          <button type="button" onClick={() => navigate("/auth")} className="text-primary underline">Connectez-vous</button> pour enregistrer votre demande et suivre son statut.
                        </p>
                      )}
                    </form>
                  </CardContent>
                </Card>
              )}
            </section>
          )}

          {/* === SELLER MODE (fallback, normally redirects to WhatsApp) === */}
          {mode === "seller" && (
            <section className="text-center space-y-4">
              <Store className="w-16 h-16 text-[#25D366] mx-auto" />
              <h2 className="text-lg font-bold text-foreground">Support Vendeur</h2>
              <p className="text-muted-foreground text-sm">Contactez directement notre équipe support vendeur via WhatsApp pour une réponse rapide.</p>
              <a href={WHATSAPP_SELLER_URL} target="_blank" rel="noopener noreferrer">
                <Button className="bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full gap-2 h-12 px-8 font-semibold text-base">
                  <Phone className="w-5 h-5" /> Contacter le support vendeur
                </Button>
              </a>
            </section>
          )}
        </div>

        <MarketplaceFooter />
        {isMobile && <MobileBottomNav />}
      </div>
    </>
  );
};

export default Support;
