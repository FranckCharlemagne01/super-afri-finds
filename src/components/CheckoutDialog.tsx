import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Loader2, ShoppingBag, User, Phone, MapPin, ChevronDown, ChevronUp, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useOrders, OrderData } from '@/hooks/useOrders';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import type { CartItem } from '@/hooks/useCart';
import { toast } from '@/hooks/use-toast';
import { validateOrderCustomer } from '@/utils/orderValidation';
import { supabase } from '@/integrations/supabase/client';

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartItems: CartItem[];
  totalPrice: number;
}

export const CheckoutDialog = ({ 
  open, 
  onOpenChange, 
  cartItems, 
  totalPrice 
}: CheckoutDialogProps) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    deliveryLocation: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { createOrder } = useOrders();
  const { user } = useAuth();
  const { clearCart } = useCart();

  // Auto-fill from profile
  useEffect(() => {
    if (!user || !open) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, phone, address, city, commune')
        .eq('user_id', user.id)
        .single();
      if (data) {
        setFormData(prev => ({
          customerName: prev.customerName || data.full_name || '',
          customerPhone: prev.customerPhone || data.phone || '',
          deliveryLocation: prev.deliveryLocation || [data.commune, data.city].filter(Boolean).join(', ') || data.address || '',
        }));
      }
    };
    fetchProfile();
  }, [user, open]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => { const n = {...prev}; delete n[field]; return n; });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({ title: "Connexion requise", description: "Vous devez être connecté pour passer une commande", variant: "destructive" });
      return;
    }
    
    const validation = validateOrderCustomer(formData);
    
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach(err => {
        const field = err.path[0] as string;
        if (field) fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsProcessing(true);

    try {
      const validatedData = validation.data;
      const orderPromises = cartItems.map(async (item) => {
        const orderData: OrderData = {
          customerName: validatedData.customerName,
          customerPhone: validatedData.customerPhone,
          deliveryLocation: validatedData.deliveryLocation,
          productId: item.product.id,
          productTitle: item.product.title,
          productPrice: item.product.price,
          quantity: item.quantity,
          sellerId: item.product.seller_id
        };
        return createOrder(orderData);
      });

      const results = await Promise.all(orderPromises);
      const failedOrders = results.filter(result => !result.success);
      
      if (failedOrders.length === 0) {
        toast({
          title: "✅ Commande confirmée !",
          description: `${cartItems.length} article${cartItems.length > 1 ? 's' : ''} commandé${cartItems.length > 1 ? 's' : ''}`,
        });
        setFormData({ customerName: '', customerPhone: '', deliveryLocation: '' });
        onOpenChange(false);
        await clearCart();
      } else {
        toast({
          title: "Erreur partielle",
          description: `${failedOrders.length} commande${failedOrders.length > 1 ? 's' : ''} échouée${failedOrders.length > 1 ? 's' : ''}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating orders:', error);
      toast({ title: "Erreur", description: "Une erreur est survenue", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full sm:max-w-md h-[100dvh] sm:h-auto sm:max-h-[90vh] flex flex-col p-0 gap-0 rounded-none sm:rounded-2xl overflow-hidden border-0 sm:border">
        {/* Header mobile natif */}
        <div className="flex-shrink-0 bg-primary px-4 py-3 flex items-center gap-3 safe-area-inset-top">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-10 w-10 rounded-full hover:bg-white/20 text-primary-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <ShoppingBag className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-base font-bold text-primary-foreground">Commander</h2>
              <p className="text-xs text-primary-foreground/70">{cartItems.length} article{cartItems.length > 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-y-auto">
          <div className="flex-1 px-4 py-4 space-y-4">
            {/* Résumé compact */}
            <button
              type="button"
              onClick={() => setShowSummary(!showSummary)}
              className="w-full flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border/50 active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">{cartItems.length} article{cartItems.length > 1 ? 's' : ''}</p>
                  <p className="text-xs text-muted-foreground">Voir le détail</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-primary">{totalPrice.toLocaleString('fr-FR')} F</span>
                {showSummary ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </div>
            </button>

            {showSummary && (
              <div className="space-y-2 px-1 animate-in slide-in-from-top-2 duration-200">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm py-1.5">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{item.product.title}</p>
                      <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                    </div>
                    <p className="font-semibold text-foreground ml-3 whitespace-nowrap">
                      {(item.product.price * item.quantity).toLocaleString('fr-FR')} F
                    </p>
                  </div>
                ))}
              </div>
            )}

            <Separator />

            {/* Champs du formulaire */}
            <div className="space-y-3.5">
              <div>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-colors ${errors.customerName ? 'border-destructive bg-destructive/5' : 'border-border/50 bg-muted/20 focus-within:border-primary/50 focus-within:bg-background'}`}>
                  <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Votre nom complet"
                    value={formData.customerName}
                    onChange={(e) => handleInputChange('customerName', e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-[15px] text-foreground placeholder:text-muted-foreground/50"
                    required
                    autoComplete="name"
                  />
                  {formData.customerName.length >= 2 && !errors.customerName && (
                    <CheckCircle2 className="h-4.5 w-4.5 text-green-500 flex-shrink-0" />
                  )}
                </div>
                {errors.customerName && <p className="text-xs text-destructive mt-1 ml-1">{errors.customerName}</p>}
              </div>

              <div>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-colors ${errors.customerPhone ? 'border-destructive bg-destructive/5' : 'border-border/50 bg-muted/20 focus-within:border-primary/50 focus-within:bg-background'}`}>
                  <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <input
                    type="tel"
                    placeholder="+225 07 XX XX XX XX"
                    value={formData.customerPhone}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^(\+|0{0,2})[0-9\s]*$/.test(value)) {
                        handleInputChange('customerPhone', value);
                      }
                    }}
                    className="flex-1 bg-transparent border-none outline-none text-[15px] text-foreground placeholder:text-muted-foreground/50"
                    required
                    maxLength={20}
                    autoComplete="tel"
                  />
                  {formData.customerPhone.length >= 8 && !errors.customerPhone && (
                    <CheckCircle2 className="h-4.5 w-4.5 text-green-500 flex-shrink-0" />
                  )}
                </div>
                {errors.customerPhone && <p className="text-xs text-destructive mt-1 ml-1">{errors.customerPhone}</p>}
              </div>

              <div>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-colors ${errors.deliveryLocation ? 'border-destructive bg-destructive/5' : 'border-border/50 bg-muted/20 focus-within:border-primary/50 focus-within:bg-background'}`}>
                  <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Lieu de livraison (Cocody, Yopougon...)"
                    value={formData.deliveryLocation}
                    onChange={(e) => handleInputChange('deliveryLocation', e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-[15px] text-foreground placeholder:text-muted-foreground/50"
                    required
                    autoComplete="address-line1"
                  />
                  {formData.deliveryLocation.length >= 5 && !errors.deliveryLocation && (
                    <CheckCircle2 className="h-4.5 w-4.5 text-green-500 flex-shrink-0" />
                  )}
                </div>
                {errors.deliveryLocation && <p className="text-xs text-destructive mt-1 ml-1">{errors.deliveryLocation}</p>}
              </div>
            </div>
          </div>

          {/* Bouton fixe en bas */}
          <div className="flex-shrink-0 p-4 bg-card border-t border-border/50 safe-area-inset-bottom">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Total à payer</span>
              <span className="text-xl font-bold text-primary">{totalPrice.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <Button
              type="submit"
              disabled={isProcessing}
              className="w-full min-h-[52px] rounded-xl font-bold text-base shadow-lg transition-all active:scale-[0.98]"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Traitement...
                </span>
              ) : (
                "Confirmer la commande"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};