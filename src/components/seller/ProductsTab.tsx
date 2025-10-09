import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ProductForm } from '@/components/ProductForm';
import { SellerProducts } from '@/components/SellerProducts';
import { ProductBoostDialog } from '@/components/ProductBoostDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTokens } from '@/hooks/useTokens';

interface Product {
  id: string;
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
  is_boosted?: boolean;
  boosted_until?: string;
  rating?: number;
  reviews_count?: number;
  created_at: string;
}

interface ProductsTabProps {
  products: Product[];
  loading: boolean;
  shopId?: string;
  onRefresh: () => void;
}

export const ProductsTab = ({ products, loading, shopId, onRefresh }: ProductsTabProps) => {
  const { toast } = useToast();
  const { tokenBalance, refreshBalance } = useTokens();
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [boostDialogOpen, setBoostDialogOpen] = useState(false);
  const [selectedProductForBoost, setSelectedProductForBoost] = useState<{ id: string; title: string } | null>(null);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleDelete = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "✅ Produit supprimé",
        description: "Le produit a été supprimé avec succès",
      });
      
      onRefresh();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le produit",
        variant: "destructive",
      });
    }
  };

  const handleProductSaved = () => {
    setShowProductForm(false);
    setEditingProduct(null);
    onRefresh();
  };

  const handleBoost = (productId: string, productTitle: string) => {
    setSelectedProductForBoost({ id: productId, title: productTitle });
    setBoostDialogOpen(true);
  };

  const handleBoostComplete = () => {
    onRefresh();
    refreshBalance();
  };

  if (showProductForm) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {editingProduct ? 'Modifier le produit' : 'Publier un nouveau produit'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm
            product={editingProduct || undefined}
            onSave={handleProductSaved}
            onCancel={() => {
              setShowProductForm(false);
              setEditingProduct(null);
            }}
            shopId={shopId}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Mes Produits ({products.length})</CardTitle>
            <Button onClick={() => setShowProductForm(true)} size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Ajouter un produit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <SellerProducts
            products={products}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onBoost={handleBoost}
          />
        </CardContent>
      </Card>

      {/* Boost Dialog */}
      {selectedProductForBoost && (
        <ProductBoostDialog
          open={boostDialogOpen}
          onOpenChange={setBoostDialogOpen}
          productId={selectedProductForBoost.id}
          productTitle={selectedProductForBoost.title}
          currentTokens={tokenBalance}
          onBoostComplete={handleBoostComplete}
        />
      )}
    </div>
  );
};
