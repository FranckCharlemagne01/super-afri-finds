import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { useOrders, OrderData } from '@/hooks/useOrders';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import type { CartItem } from '@/hooks/useCart';
import { toast } from '@/hooks/use-toast';
import { validateOrderCustomer } from '@/utils/orderValidation';


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

  const { createOrder } = useOrders();
  const { user } = useAuth();
  const { fetchCartItems, clearCart } = useCart();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour passer une commande",
        variant: "destructive",
      });
      return;
    }
    
    // SECURITY: Validate customer data against schema to prevent injection attacks
    const validation = validateOrderCustomer(formData);
    
    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || 'Données invalides';
      toast({
        title: "Validation échouée",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Use validated data
      const validatedData = validation.data;
      
      // Create orders for each cart item (grouped by seller if needed)
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
      
      // Check if all orders were successful
      const failedOrders = results.filter(result => !result.success);
      
      if (failedOrders.length === 0) {
        toast({
          title: "Commandes créées avec succès!",
          description: `${cartItems.length} commande${cartItems.length > 1 ? 's' : ''} envoyée${cartItems.length > 1 ? 's' : ''} aux vendeurs.`,
        });
        
        // Clear the form and close dialog
        setFormData({
          customerName: '',
          customerPhone: '',
          deliveryLocation: ''
        });
        onOpenChange(false);
        
        // Clear cart after successful orders
        await clearCart();
      } else {
        toast({
          title: "Erreur partielle",
          description: `${failedOrders.length} commande${failedOrders.length > 1 ? 's' : ''} n'${failedOrders.length > 1 ? 'ont' : 'a'} pas pu être créée${failedOrders.length > 1 ? 's' : ''}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating orders:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création des commandes",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[calc(100vw-2rem)] mx-auto max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Finaliser votre commande</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Summary */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-foreground">Résumé de la commande</h3>
            <Card className="p-4 shadow-sm border-2 bg-muted/30">
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-start text-sm">
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{item.product.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">Quantité: x{item.quantity}</p>
                    </div>
                    <p className="font-bold text-foreground whitespace-nowrap ml-2">
                      {(item.product.price * item.quantity).toLocaleString('fr-FR')} FCFA
                    </p>
                  </div>
                ))}
                <Separator className="my-3" />
                <div className="flex justify-between items-center text-base font-bold">
                  <span className="text-foreground">Total</span>
                  <span className="gradient-text-primary text-lg">{totalPrice.toLocaleString('fr-FR')} FCFA</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Customer Information */}
          <div className="space-y-5">
            <h3 className="text-base font-semibold text-foreground">Vos informations</h3>
            
            <div className="space-y-2">
              <Label htmlFor="customerName">Nom complet *</Label>
              <Input
                id="customerName"
                placeholder="Votre nom et prénom"
                value={formData.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone">Téléphone *</Label>
              <Input
                id="customerPhone"
                type="text"
                placeholder="+225 07 XX XX XX XX"
                value={formData.customerPhone}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^(\+|0{0,2})[0-9\s]*$/.test(value)) {
                    handleInputChange('customerPhone', value);
                  }
                }}
                required
                className="w-full"
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground mt-1.5">Format: +225 0707070707, 00225 0707070707 ou 0707070707</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryLocation">Lieu de livraison *</Label>
              <Input
                id="deliveryLocation"
                placeholder="Adresse de livraison (ex: Cocody Angré, Yopougon 2, Zone 4C)"
                value={formData.deliveryLocation}
                onChange={(e) => handleInputChange('deliveryLocation', e.target.value)}
                required
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1.5">Précisez le quartier ou la commune</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
              className="flex-1 min-h-[48px] rounded-xl font-semibold transition-all hover:scale-[1.02]"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isProcessing}
              className="flex-1 min-h-[48px] rounded-xl font-semibold gradient-primary transition-all hover:scale-[1.02] shadow-md"
            >
              {isProcessing ? "Traitement en cours..." : "Confirmer la commande"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};