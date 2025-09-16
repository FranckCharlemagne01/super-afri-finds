import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import { useOrders, OrderData } from '@/hooks/useOrders';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface QuickOrderDialogProps {
  productId: string;
  productTitle: string;
  productPrice: number;
  sellerId: string;
  iconOnly?: boolean;
}

export const QuickOrderDialog = ({ 
  productId, 
  productTitle, 
  productPrice, 
  sellerId,
  iconOnly = false
}: QuickOrderDialogProps) => {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    deliveryLocation: ''
  });

  const { createOrder, loading } = useOrders();
  const { user } = useAuth();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleQuantityChange = (increment: boolean) => {
    if (increment) {
      setQuantity(prev => prev + 1);
    } else if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const totalAmount = productPrice * quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setOpen(false);
      // Store current URL for redirect after login
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
      window.location.href = '/auth';
      return;
    }
    
    if (!formData.customerName || !formData.customerPhone || !formData.deliveryLocation) {
      return;
    }

    const orderData: OrderData = {
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      deliveryLocation: formData.deliveryLocation,
      productId,
      productTitle,
      productPrice,
      quantity,
      sellerId
    };

    const result = await createOrder(orderData);
    
    if (result.success) {
      setOpen(false);
      setFormData({
        customerName: '',
        customerPhone: '',
        deliveryLocation: ''
      });
      setQuantity(1);
    }
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
      <DialogContent className="sm:max-w-md mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Commander</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customerName" className="text-sm font-medium">Nom complet *</Label>
            <Input
              id="customerName"
              value={formData.customerName}
              onChange={(e) => handleInputChange('customerName', e.target.value)}
              placeholder="Votre nom complet"
              className="min-h-[44px] text-base"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerPhone" className="text-sm font-medium">Numéro de téléphone *</Label>
            <Input
              id="customerPhone"
              value={formData.customerPhone}
              onChange={(e) => handleInputChange('customerPhone', e.target.value)}
              placeholder="Votre numéro de téléphone"
              className="min-h-[44px] text-base"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deliveryLocation" className="text-sm font-medium">Lieu de livraison *</Label>
            <Input
              id="deliveryLocation"
              value={formData.deliveryLocation}
              onChange={(e) => handleInputChange('deliveryLocation', e.target.value)}
              placeholder="Adresse de livraison"
              className="min-h-[44px] text-base"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Quantité</Label>
            <div className="flex items-center justify-center space-x-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-w-[44px] min-h-[44px]"
                onClick={() => handleQuantityChange(false)}
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="font-medium text-lg w-12 text-center">{quantity}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-w-[44px] min-h-[44px]"
                onClick={() => handleQuantityChange(true)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Prix unitaire:</span>
              <span>{productPrice.toLocaleString()} FCFA</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Quantité:</span>
              <span>{quantity}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>{totalAmount.toLocaleString()} FCFA</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="flex-1 min-h-[44px]"
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-1 min-h-[44px]"
            >
              {loading ? "En cours..." : "Valider la commande"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};