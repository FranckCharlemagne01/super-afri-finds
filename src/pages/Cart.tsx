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
    <div className="min-h-screen bg-background page-transition">
      {/* Header - Style mobile native */}
      <header className="native-header">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/')}
              className="rounded-xl h-11 w-11 active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Mon Panier</h1>
            <Badge className="bg-primary text-primary-foreground rounded-full px-3 py-1">
              {cartCount}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/my-orders')}
              className="ml-auto flex items-center gap-1.5 rounded-xl h-10 px-3 active:scale-95 transition-transform"
            >
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Mes commandes</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 pb-24">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
            <p className="mt-3 text-muted-foreground">Chargement...</p>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto bg-muted/50 rounded-full flex items-center justify-center mb-4">
              <ShoppingCart className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Votre panier est vide</h2>
            <p className="text-muted-foreground mb-6 max-w-xs mx-auto">Découvrez nos produits et ajoutez-les à votre panier</p>
            <Button onClick={() => navigate('/')} className="rounded-xl h-12 px-6 font-semibold active:scale-95 transition-transform">
              Continuer les achats
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Cart Items - Style carte mobile native */}
            <div className="lg:col-span-2 space-y-3">
              {cartItems.map((item) => (
                <Card key={item.id} className="native-card p-4">
                  <div className="flex gap-4">
                    <div 
                      className="w-24 h-24 bg-muted rounded-xl overflow-hidden cursor-pointer active:scale-95 transition-transform flex-shrink-0"
                      onClick={() => navigate(`/product/${item.product.id}`)}
                    >
                      <img
                        src={item.product.images?.[0] || '/placeholder.svg'}
                        alt={item.product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-2">
                      <h3 
                        className="font-semibold text-foreground line-clamp-2 cursor-pointer active:opacity-70 transition-opacity"
                        onClick={() => navigate(`/product/${item.product.id}`)}
                      >
                        {item.product.title}
                      </h3>
                      <p className="text-lg font-bold text-primary">
                        {item.product.price.toLocaleString()} FCFA
                      </p>
                      
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="flex items-center bg-muted/50 rounded-xl overflow-hidden">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-none hover:bg-muted active:scale-95 transition-transform"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="text-sm font-bold w-8 text-center tabular-nums">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-none hover:bg-muted active:scale-95 transition-transform"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                          className="text-destructive hover:text-destructive rounded-xl h-9 px-3 active:scale-95 transition-transform"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Order Summary - Style mobile native */}
            <div className="lg:col-span-1">
              <Card className="native-card p-5 sticky top-20">
                <h3 className="text-lg font-bold text-foreground mb-4">Résumé</h3>
                
                <div className="space-y-3 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sous-total ({cartCount} article{cartCount > 1 ? 's' : ''})</span>
                    <span className="font-semibold tabular-nums">{totalPrice.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Livraison</span>
                    <span className="font-semibold text-success">Gratuite</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-foreground">Total</span>
                      <span className="font-bold text-xl text-primary tabular-nums">{totalPrice.toLocaleString()} FCFA</span>
                    </div>
                  </div>
                </div>
                
                <Button 
                  className="w-full h-14 text-base font-bold rounded-xl shadow-lg active:scale-[0.98] transition-transform" 
                  onClick={handleCheckout}
                >
                  {user ? 'Procéder au paiement' : 'Se connecter'}
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full mt-3 h-12 rounded-xl font-medium active:scale-[0.98] transition-transform" 
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