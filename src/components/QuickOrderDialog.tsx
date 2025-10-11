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
import { TextInput } from '@/components/ui/validated-input';
import { Label } from '@/components/ui/label';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import { useOrders, OrderData } from '@/hooks/useOrders';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { validateOrderCustomer } from '@/utils/orderValidation';

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
      // SECURITY: Validate redirect URL is safe (relative path only)
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/') && !currentPath.startsWith('//')) {
        sessionStorage.setItem('redirectAfterLogin', currentPath);
      }
      window.location.href = '/auth';
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

    const validatedData = validation.data;

    const orderData: OrderData = {
      customerName: validatedData.customerName,
      customerPhone: validatedData.customerPhone,
      deliveryLocation: validatedData.deliveryLocation,
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
      <DialogContent className="sm:max-w-md w-[calc(100vw-2rem)] mx-auto max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Commander</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customerName" className="text-sm font-medium">Nom complet *</Label>
            <TextInput
              id="customerName"
              value={formData.customerName}
              onChange={(value) => handleInputChange('customerName', value)}
              placeholder="Votre nom complet"
              className="min-h-[48px] text-base px-4"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerPhone" className="text-sm font-medium">Numéro de téléphone *</Label>
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
            <Label htmlFor="deliveryLocation" className="text-sm font-medium">Lieu de livraison *</Label>
            <TextInput
              id="deliveryLocation"
              value={formData.deliveryLocation}
              onChange={(value) => handleInputChange('deliveryLocation', value)}
              placeholder="Adresse de livraison"
              allowNumbers={true}
              className="min-h-[48px] text-base px-4"
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