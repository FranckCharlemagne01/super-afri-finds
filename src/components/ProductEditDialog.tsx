import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  category: string;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  seller_id: string;
}

interface ProductEditDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductUpdated: (updatedProduct: Product) => void;
}

const categories = [
  'Électronique',
  'Mode',
  'Maison',
  'Auto',
  'Beauté',
  'Téléphones',
  'Épicerie'
];

export const ProductEditDialog = ({ product, open, onOpenChange, onProductUpdated }: ProductEditDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    category: '',
    stock_quantity: 0
  });

  useEffect(() => {
    if (product && open) {
      setFormData({
        title: product.title,
        description: product.description || '',
        price: product.price,
        category: product.category,
        stock_quantity: product.stock_quantity || 0
      });
    }
  }, [product, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          title: formData.title,
          description: formData.description,
          price: formData.price,
          category: formData.category,
          stock_quantity: formData.stock_quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id)
        .select()
        .single();

      if (error) throw error;

      const updatedProduct = { ...product, ...formData };
      onProductUpdated(updatedProduct);
      onOpenChange(false);

      toast({
        title: "Produit modifié",
        description: "Les informations du produit ont été mises à jour avec succès.",
      });
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le produit.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modifier le produit</DialogTitle>
          <DialogDescription>
            Modifiez les informations du produit sélectionné.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Titre du produit"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Description du produit"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Prix (FCFA) *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="100"
                value={formData.price}
                onChange={(e) => handleChange('price', Number(e.target.value))}
                placeholder="0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock_quantity}
                onChange={(e) => handleChange('stock_quantity', Number(e.target.value))}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Catégorie *</Label>
            <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sauvegarder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};