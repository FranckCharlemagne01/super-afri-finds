import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Plus, Minus, User, Phone, MapPin, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useOrders, OrderData, PaymentMethod } from '@/hooks/useOrders';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { validateOrderCustomer } from '@/utils/orderValidation';
import { supabase } from '@/integrations/supabase/client';
import { PaymentMethodStep } from '@/components/PaymentMethodStep';
import { usePaystackCheckout } from '@/hooks/usePaystackCheckout';

interface QuickOrderDialogProps {
  productId: string;
  productTitle: string;
  productPrice: number;
  sellerId: string;
  iconOnly?: boolean;
}

type Step = 'form' | 'payment';

export const QuickOrderDialog = ({
  productId,
  productTitle,
  productPrice,
  sellerId,
  iconOnly = false
}: QuickOrderDialogProps) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('form');
  const [quantity, setQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    deliveryLocation: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { createOrder, confirmOnlinePayment } = useOrders();
  const { user } = useAuth();
  const { payOrder } = usePaystackCheckout();

  const totalAmount = productPrice * quantity;

  useEffect(() => {
    if (open) setStep('form');
  }, [open]);

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
      setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setOpen(false);
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/') && !currentPath.startsWith('//')) {
        sessionStorage.setItem('redirectAfterLogin', currentPath);
      }
      window.location.href = '/auth';
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

    setStep('payment');
  };

  const handlePaymentSelected = async (method: PaymentMethod) => {
    if (!user) return;
    const validation = validateOrderCustomer(formData);
    if (!validation.success) return;
    const validatedData = validation.data;

    setIsProcessing(true);

    const orderData: OrderData = {
      customerName: validatedData.customerName,
      customerPhone: validatedData.customerPhone,
      deliveryLocation: validatedData.deliveryLocation,
      productId,
      productTitle,
      productPrice,
      quantity,
      sellerId,
      paymentMethod: method,
    };

    const result = await createOrder(orderData);
    if (!result.success || !result.orderId) {
      setIsProcessing(false);
      return;
    }

    if (method === 'COD') {
      setOpen(false);
      setFormData({ customerName: '', customerPhone: '', deliveryLocation: '' });
      setQuantity(1);
      setIsProcessing(false);
      return;
    }

    // ONLINE — lancer Paystack
    await payOrder({
      orderId: result.orderId,
      email: user.email || '',
      amountFcfa: result.totalAmount || totalAmount,
      customerName: validatedData.customerName,
      customerPhone: validatedData.customerPhone,
      onSuccess: async (reference) => {
        await confirmOnlinePayment({
          orderId: result.orderId!,
          paystackReference: reference,
          sellerId,
          customerName: validatedData.customerName,
          productTitle,
          totalAmount: result.totalAmount || totalAmount,
        });
        setOpen(false);
        setFormData({ customerName: '', customerPhone: '', deliveryLocation: '' });
        setQuantity(1);
        setIsProcessing(false);
      },
      onCancel: () => setIsProcessing(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={iconOnly ? "p-2 min-w-[44px] min-h-[44px] flex-1" : "w-full min-h-[44px]"}
          size="sm"
        >
          <ShoppingCart className="w-4 h-4" />
          {!iconOnly && <span className="ml-2">Commander</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-full sm:max-w-md h-[100dvh] sm:h-auto sm:max-h-[90vh] flex flex-col p-0 gap-0 rounded-none sm:rounded-2xl overflow-hidden border-0 sm:border">
        {step === 'payment' ? (
          <PaymentMethodStep
            totalAmount={totalAmount}
            onBack={() => setStep('form')}
            onSelect={handlePaymentSelected}
            isProcessing={isProcessing}
          />
        ) : (
          <>
            <div className="flex-shrink-0 bg-primary px-4 py-3 flex items-center gap-3 safe-area-inset-top">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="h-10 w-10 rounded-full hover:bg-white/20 text-primary-foreground"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-base font-bold text-primary-foreground">Commander</h2>
                <p className="text-xs text-primary-foreground/70 truncate max-w-[200px]">{productTitle}</p>
              </div>
            </div>

            <form onSubmit={handleContinue} className="flex-1 flex flex-col overflow-y-auto">
              <div className="flex-1 px-4 py-4 space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border/50">
                  <span className="text-sm font-medium text-foreground">Quantité</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => quantity > 1 && setQuantity(q => q - 1)}
                      disabled={quantity <= 1}
                      className="w-9 h-9 rounded-full bg-card border border-border/50 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-lg w-8 text-center">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(q => q + 1)}
                      className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center active:scale-95 transition-transform"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
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
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
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
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                    {errors.customerPhone && <p className="text-xs text-destructive mt-1 ml-1">{errors.customerPhone}</p>}
                  </div>

                  <div>
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-colors ${errors.deliveryLocation ? 'border-destructive bg-destructive/5' : 'border-border/50 bg-muted/20 focus-within:border-primary/50 focus-within:bg-background'}`}>
                      <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <input
                        type="text"
                        placeholder="Lieu de livraison"
                        value={formData.deliveryLocation}
                        onChange={(e) => handleInputChange('deliveryLocation', e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none text-[15px] text-foreground placeholder:text-muted-foreground/50"
                        required
                        autoComplete="address-line1"
                      />
                      {formData.deliveryLocation.length >= 5 && !errors.deliveryLocation && (
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                    {errors.deliveryLocation && <p className="text-xs text-destructive mt-1 ml-1">{errors.deliveryLocation}</p>}
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 p-4 bg-card border-t border-border/50 safe-area-inset-bottom">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-xl font-bold text-primary">{totalAmount.toLocaleString('fr-FR')} FCFA</span>
                </div>
                <Button
                  type="submit"
                  className="w-full min-h-[52px] rounded-xl font-bold text-base shadow-lg transition-all active:scale-[0.98]"
                >
                  Continuer vers le paiement
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
