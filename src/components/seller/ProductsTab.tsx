import { useState } from 'react';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ProductForm } from '@/components/ProductForm';
import { SellerProducts } from '@/components/SellerProducts';
import { ProductBoostDialog } from '@/components/ProductBoostDialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTokens } from '@/hooks/useTokens';
import { useIsMobile } from '@/hooks/use-mobile';

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
  openFormTrigger?: boolean;
  onFormOpenChange?: (open: boolean) => void;
}

export const ProductsTab = ({ 
  products, 
  loading, 
  shopId, 
  onRefresh, 
  openFormTrigger = false,
  onFormOpenChange 
}: ProductsTabProps) => {
  const { toast } = useToast();
  const { tokenBalance, refreshBalance } = useTokens();
  const isMobile = useIsMobile();
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [boostDialogOpen, setBoostDialogOpen] = useState(false);
  const [selectedProductForBoost, setSelectedProductForBoost] = useState<{ id: string; title: string } | null>(null);

  // Handle external trigger to open form
  React.useEffect(() => {
    if (openFormTrigger) {
      setShowProductForm(true);
      setEditingProduct(null);
      onFormOpenChange?.(false); // Reset trigger
    }
  }, [openFormTrigger, onFormOpenChange]);

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

  // Group products by category
  const productsByCategory = React.useMemo(() => {
    return products.reduce((acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = [];
      }
      acc[product.category].push(product);
      return acc;
    }, {} as Record<string, Product[]>);
  }, [products]);

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Mes Produits ({products.length})</CardTitle>
            <Button 
              onClick={() => setShowProductForm(true)} 
              size={isMobile ? "default" : "lg"} 
              className="gap-2"
            >
              <Plus className="h-5 w-5" />
              {!isMobile && "Ajouter un produit"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <SellerProducts
              products={products}
              loading={loading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onBoost={handleBoost}
            />
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Aucun produit pour le moment.</p>
              <p className="text-sm">Cliquez sur "Ajouter un produit" pour commencer.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(productsByCategory).map(([category, categoryProducts]) => (
                <div key={category} className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <h3 className="text-lg font-semibold capitalize">
                      {category.replace(/-/g, ' ')}
                    </h3>
                    <span className="text-sm text-muted-foreground">
                      ({categoryProducts.length} produit{categoryProducts.length > 1 ? 's' : ''})
                    </span>
                  </div>
                  <SellerProducts
                    products={categoryProducts}
                    loading={false}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onBoost={handleBoost}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulaire de produit - Sheet sur mobile/tablette, Card sur desktop */}
      {isMobile ? (
        <Sheet open={showProductForm} onOpenChange={setShowProductForm}>
          <SheetContent 
            side="bottom" 
            className="h-[95vh] overflow-y-auto rounded-t-xl"
          >
            <SheetHeader className="pb-4">
              <SheetTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                {editingProduct ? 'Modifier le produit' : 'Publier un nouveau produit'}
              </SheetTitle>
            </SheetHeader>
            <ProductForm
              product={editingProduct || undefined}
              onSave={handleProductSaved}
              onCancel={() => {
                setShowProductForm(false);
                setEditingProduct(null);
              }}
              shopId={shopId}
            />
          </SheetContent>
        </Sheet>
      ) : (
        showProductForm && (
          <Card className="border-0 shadow-lg animate-in fade-in-0 slide-in-from-top-4 duration-300">
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
        )
      )}

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
