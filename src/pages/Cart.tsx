import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Minus, Trash2, ShoppingCart, Package } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { CheckoutDialog } from "@/components/CheckoutDialog";

const Cart = () => {
  const { cartItems, cartCount, loading, updateQuantity, removeFromCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCheckout, setShowCheckout] = useState(false);

  const totalPrice = cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);

  const handleCheckout = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setShowCheckout(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-lg border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Mon Panier</h1>
            <Badge className="bg-primary text-primary-foreground">
              {cartCount} article{cartCount > 1 ? 's' : ''}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/my-orders')}
              className="ml-auto flex items-center gap-1"
            >
              <Package className="w-4 h-4" />
              Mes commandes
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Chargement...</p>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Votre panier est vide</h2>
            <p className="text-muted-foreground mb-6">Découvrez nos produits et ajoutez-les à votre panier</p>
            <Button onClick={() => navigate('/')}>
              Continuer les achats
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden">
                      <img
                        src={item.product.images?.[0] || '/placeholder.svg'}
                        alt={item.product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <h3 className="font-medium text-foreground line-clamp-2">{item.product.title}</h3>
                      <p className="text-lg font-bold text-promo">
                        {item.product.price.toLocaleString()} FCFA
                      </p>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-24">
                <h3 className="text-lg font-semibold text-foreground mb-4">Résumé de la commande</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sous-total ({cartCount} article{cartCount > 1 ? 's' : ''})</span>
                    <span className="font-medium">{totalPrice.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Livraison</span>
                    <span className="font-medium text-success">Gratuite</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold text-foreground">Total</span>
                      <span className="font-bold text-lg text-promo">{totalPrice.toLocaleString()} FCFA</span>
                    </div>
                  </div>
                </div>
                
                <Button className="w-full" size="lg" onClick={handleCheckout}>
                  {user ? 'Procéder au paiement' : 'Se connecter pour commander'}
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full mt-3" 
                  onClick={() => navigate('/')}
                >
                  Continuer les achats
                </Button>
              </Card>
            </div>
          </div>
        )}
      </main>
      
      <CheckoutDialog
        open={showCheckout}
        onOpenChange={setShowCheckout}
        cartItems={cartItems}
        totalPrice={totalPrice}
      />
    </div>
  );
};

export default Cart;