import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Store, 
  Package, 
  Plus, 
  CreditCard, 
  DollarSign, 
  Settings,
  TrendingUp,
  Calendar,
  Coins,
  Clock
} from 'lucide-react';
import { SellerProducts } from '@/components/SellerProducts';
import { ProductForm } from '@/components/ProductForm';
import { TokenTransactionHistory } from '@/components/TokenTransactionHistory';
import { useTokens } from '@/hooks/useTokens';

interface Shop {
  id: string;
  shop_name: string;
  shop_slug: string;
  shop_description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  seller_id: string;
  created_at: string;
  subscription_active: boolean;
}

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

interface SellerShopDashboardProps {
  shop: Shop;
  products: Product[];
  loading: boolean;
  onProductsUpdate: () => void;
}

export const SellerShopDashboard = ({ shop, products, loading, onProductsUpdate }: SellerShopDashboardProps) => {
  const [activeTab, setActiveTab] = useState('products');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { tokenBalance, freeTokens, paidTokens, freeTokensExpiresAt } = useTokens();

  const handleProductEdit = (product: Product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleProductDelete = async (productId: string) => {
    // Implement delete logic
    onProductsUpdate();
  };

  const handleProductSubmit = () => {
    setShowProductForm(false);
    setEditingProduct(null);
    onProductsUpdate();
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Dashboard Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {/* Shop Logo */}
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted border-4 border-background shadow-lg flex-shrink-0">
              {shop.logo_url ? (
                <img src={shop.logo_url} alt={shop.shop_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                  <Store className="h-10 w-10 text-primary" />
                </div>
              )}
            </div>

            {/* Shop Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold">{shop.shop_name}</h2>
                {shop.subscription_active && (
                  <Badge variant="secondary" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                    Premium
                  </Badge>
                )}
              </div>
              {shop.shop_description && (
                <p className="text-muted-foreground mb-2">{shop.shop_description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Depuis {new Date(shop.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  <span>{products.length} produit{products.length > 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <Button
              onClick={() => {
                setEditingProduct(null);
                setShowProductForm(true);
                setActiveTab('products');
              }}
              size="lg"
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg w-full md:w-auto"
            >
              <Plus className="w-5 h-5 mr-2" />
              Publier un produit
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
          <TabsTrigger value="products" className="gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Mes produits</span>
            <span className="sm:hidden">Produits</span>
          </TabsTrigger>
          <TabsTrigger value="credits" className="gap-2">
            <Coins className="h-4 w-4" />
            <span className="hidden sm:inline">Crédits</span>
            <span className="sm:hidden">Crédits</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Transactions</span>
            <span className="sm:hidden">Ventes</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Paramètres</span>
            <span className="sm:hidden">Config</span>
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          {showProductForm ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  {editingProduct ? 'Modifier le produit' : 'Publier un nouveau produit'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProductForm
                  product={editingProduct || undefined}
                  onSave={handleProductSubmit}
                  onCancel={() => {
                    setShowProductForm(false);
                    setEditingProduct(null);
                  }}
                  shopId={shop.id}
                />
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Mes produits</h3>
                <Button onClick={() => setShowProductForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un produit
                </Button>
              </div>
              <SellerProducts
                products={products}
                loading={loading}
                onEdit={handleProductEdit}
                onDelete={handleProductDelete}
                emptyMessage="Vous n'avez pas encore de produits dans votre boutique."
              />
            </>
          )}
        </TabsContent>

        {/* Credits Tab */}
        <TabsContent value="credits" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  Solde de jetons
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-3xl font-bold text-primary">{tokenBalance}</span>
                    <Badge variant="secondary">jetons disponibles</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Gratuits:</span>
                      <p className="font-semibold">{freeTokens}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Payants:</span>
                      <p className="font-semibold">{paidTokens}</p>
                    </div>
                  </div>
                  {freeTokensExpiresAt && freeTokens > 0 && (
                    <div className="text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 inline mr-1" />
                      Expiration: {new Date(freeTokensExpiresAt).toLocaleDateString('fr-FR')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Résumé des dépenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Publications ce mois</span>
                    <span className="font-semibold">
                      {products.filter(p => {
                        const createdAt = new Date(p.created_at);
                        const now = new Date();
                        return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
                      }).length} produits
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total produits actifs</span>
                    <span className="font-semibold">{products.filter(p => p.is_active).length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Produits boostés</span>
                    <span className="font-semibold text-purple-600">
                      {products.filter(p => p.is_boosted && p.boosted_until && new Date(p.boosted_until) > new Date()).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Historique des crédits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TokenTransactionHistory />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Mes transactions Paystack
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Section en cours de développement. Vous pourrez bientôt voir l'historique de vos ventes.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Paramètres de la boutique
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Les paramètres de votre boutique seront bientôt disponibles ici.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
