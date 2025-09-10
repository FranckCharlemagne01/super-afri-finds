import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    id: string;
    title: string;
    price: number;
    images: string[];
  };
}

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCartItems = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          product_id,
          quantity,
          products (
            id,
            title,
            price,
            images
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      
      const transformedData = (data || []).map(item => ({
        ...item,
        product: item.products
      }));
      setCartItems(transformedData);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: string) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour ajouter des produits au panier",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .upsert(
          { 
            user_id: user.id, 
            product_id: productId, 
            quantity: 1 
          },
          { 
            onConflict: 'user_id,product_id',
            ignoreDuplicates: false 
          }
        );

      if (error) throw error;
      
      toast({
        title: "Produit ajouté",
        description: "Le produit a été ajouté à votre panier",
      });
      
      fetchCartItems();
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le produit au panier",
        variant: "destructive",
      });
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(cartItemId);
      return;
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', cartItemId);

      if (error) throw error;
      fetchCartItems();
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);

      if (error) throw error;
      fetchCartItems();
      
      toast({
        title: "Produit retiré",
        description: "Le produit a été retiré de votre panier",
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCartItems();
    } else {
      setCartItems([]);
    }
  }, [user]);

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return {
    cartItems,
    cartCount,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    fetchCartItems,
  };
}