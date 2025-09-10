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

interface QuickOrderDialogProps {
  productId: string;
  productTitle: string;
  productPrice: number;
  sellerId: string;
}

export const QuickOrderDialog = ({ 
  productId, 
  productTitle, 
  productPrice, 
  sellerId 
}: QuickOrderDialogProps) => {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    deliveryLocation: ''
  });

  const { createOrder, loading } = useOrders();

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
        <Button variant="default" className="w-full">
          <ShoppingCart className="w-4 h-4 mr-2" />
          Passer la commande
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Commander directement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">Nom complet *</Label>
            <Input
              id="customerName"
              value={formData.customerName}
              onChange={(e) => handleInputChange('customerName', e.target.value)}
              placeholder="Votre nom complet"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerPhone">Numéro de téléphone *</Label>
            <Input
              id="customerPhone"
              value={formData.customerPhone}
              onChange={(e) => handleInputChange('customerPhone', e.target.value)}
              placeholder="Votre numéro de téléphone"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deliveryLocation">Lieu de livraison *</Label>
            <Input
              id="deliveryLocation"
              value={formData.deliveryLocation}
              onChange={(e) => handleInputChange('deliveryLocation', e.target.value)}
              placeholder="Adresse de livraison"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Quantité</Label>
            <div className="flex items-center space-x-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(false)}
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="font-medium w-8 text-center">{quantity}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(true)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span>Prix unitaire:</span>
              <span>{productPrice.toLocaleString()} FCFA</span>
            </div>
            <div className="flex justify-between">
              <span>Quantité:</span>
              <span>{quantity}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>{totalAmount.toLocaleString()} FCFA</span>
            </div>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-1"
            >
              {loading ? "En cours..." : "Valider la commande"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};