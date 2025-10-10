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
import { useOrders, OrderData } from '@/hooks/useOrders';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import type { CartItem } from '@/hooks/useCart';
import { toast } from '@/hooks/use-toast';


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
    
    if (!formData.customerName || !formData.customerPhone || !formData.deliveryLocation) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create orders for each cart item (grouped by seller if needed)
      const orderPromises = cartItems.map(async (item) => {
        const orderData: OrderData = {
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          deliveryLocation: formData.deliveryLocation,
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
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Order Summary */}
          <Card className="p-4 bg-muted/50">
            <h3 className="font-medium text-foreground mb-3">Résumé de votre commande</h3>
            <div className="space-y-2 text-sm">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span className="text-muted-foreground">
                    {item.product.title} (x{item.quantity})
                  </span>
                  <span className="font-medium">
                    {(item.product.price * item.quantity).toLocaleString()} FCFA
                  </span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-promo">{totalPrice.toLocaleString()} FCFA</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Customer Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Nom complet *</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                placeholder="Votre nom complet"
                className="min-h-[48px] text-base px-4"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone">Numéro de téléphone *</Label>
              <Input
                id="customerPhone"
                type="text"
                value={formData.customerPhone}
                onChange={(e) => {
                  const value = e.target.value;
                  // Accepter +, 00, chiffres et espaces
                  if (value === '' || /^(\+|0{0,2})[0-9\s]*$/.test(value)) {
                    handleInputChange('customerPhone', value);
                  }
                }}
                placeholder="+225 0707070707"
                className="min-h-[48px] text-base px-4"
                required
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground">Format: +225 0707070707, 00225 0707070707 ou 0707070707</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryLocation">Lieu de livraison *</Label>
              <Input
                id="deliveryLocation"
                value={formData.deliveryLocation}
                onChange={(e) => handleInputChange('deliveryLocation', e.target.value)}
                placeholder="Adresse de livraison complète"
                className="min-h-[48px] text-base px-4"
                required
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isProcessing}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? "Traitement en cours..." : "Confirmer la commande"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};