import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id?: string;
  title: string;
  description?: string;
  price: number;
  original_price?: number;
  discount_percentage?: number;
  category: string;
  images?: string[];
  badge?: string;
  stock_quantity?: number;
  is_active?: boolean;
  is_flash_sale?: boolean;
}

interface ProductFormProps {
  product?: Product | null;
  onSave: () => void;
  onCancel: () => void;
}

const categories = [
  'Électronique',
  'Mode & Vêtements',
  'Maison & Jardin',
  'Beauté & Santé',
  'Sports & Loisirs',
  'Auto & Moto',
  'Livres & Médias',
  'Jouets & Enfants',
];

export const ProductForm = ({ product, onSave, onCancel }: ProductFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: product?.title || '',
    description: product?.description || '',
    price: product?.price || 0,
    original_price: product?.original_price || 0,
    category: product?.category || '',
    stock_quantity: product?.stock_quantity || 0,
    is_active: product?.is_active ?? true,
    is_flash_sale: product?.is_flash_sale || false,
    badge: product?.badge || '',
    images: product?.images?.[0] || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      // Calculate discount percentage
      const discount_percentage = formData.original_price > 0 
        ? Math.round(((formData.original_price - formData.price) / formData.original_price) * 100)
        : 0;

      const productData = {
        title: formData.title,
        description: formData.description,
        price: formData.price,
        original_price: formData.original_price || null,
        discount_percentage: discount_percentage || null,
        category: formData.category,
        stock_quantity: formData.stock_quantity,
        is_active: formData.is_active,
        is_flash_sale: formData.is_flash_sale,
        badge: formData.badge || null,
        images: formData.images ? [formData.images] : [],
        seller_id: user.id,
      };

      let error;

      if (product?.id) {
        // Update existing product
        const { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id);
        error = updateError;
      } else {
        // Create new product
        const { error: insertError } = await supabase
          .from('products')
          .insert([productData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: product?.id ? "Produit modifié" : "Produit créé",
        description: product?.id 
          ? "Le produit a été modifié avec succès"
          : "Le produit a été créé avec succès",
      });

      onSave();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le produit",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="title">Titre du produit *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Nom de votre produit"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Catégorie *</Label>
          <Select 
            value={formData.category} 
            onValueChange={(value) => handleInputChange('category', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez une catégorie" />
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

        <div className="space-y-2">
          <Label htmlFor="price">Prix (FCFA) *</Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) => handleInputChange('price', Number(e.target.value))}
            placeholder="0"
            required
            min="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="original_price">Prix original (FCFA)</Label>
          <Input
            id="original_price"
            type="number"
            value={formData.original_price}
            onChange={(e) => handleInputChange('original_price', Number(e.target.value))}
            placeholder="0"
            min="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock_quantity">Quantité en stock</Label>
          <Input
            id="stock_quantity"
            type="number"
            value={formData.stock_quantity}
            onChange={(e) => handleInputChange('stock_quantity', Number(e.target.value))}
            placeholder="0"
            min="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="badge">Badge (optionnel)</Label>
          <Input
            id="badge"
            value={formData.badge}
            onChange={(e) => handleInputChange('badge', e.target.value)}
            placeholder="Nouveau, Populaire, etc."
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Décrivez votre produit en détail..."
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="images">URL de l'image</Label>
        <Input
          id="images"
          value={formData.images}
          onChange={(e) => handleInputChange('images', e.target.value)}
          placeholder="https://exemple.com/image.jpg"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange('is_active', checked)}
            />
            <Label htmlFor="is_active">Produit actif</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_flash_sale"
              checked={formData.is_flash_sale}
              onCheckedChange={(checked) => handleInputChange('is_flash_sale', checked)}
            />
            <Label htmlFor="is_flash_sale">Vente flash</Label>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Sauvegarde...' : (product?.id ? 'Modifier' : 'Créer')}
        </Button>
      </div>
    </form>
  );
};