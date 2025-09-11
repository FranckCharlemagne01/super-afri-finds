import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    title: string;
    price: number;
    seller_id: string;
    images: string[];
  };
}

interface LocalCartItem {
  product_id: string;
  quantity: number;
}

export const useCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const getLocalCart = (): LocalCartItem[] => {
    try {
      const stored = localStorage.getItem('djassa_cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const setLocalCart = (items: LocalCartItem[]) => {
    localStorage.setItem('djassa_cart', JSON.stringify(items));
  };

  const fetchCartItems = async () => {
    setLoading(true);
    try {
      if (!user) {
        // Handle unauthenticated users with localStorage
        const localCartItems = getLocalCart();
        
        if (localCartItems.length === 0) {
          setCartItems([]);
          setLoading(false);
          return;
        }

        // Fetch product details for local cart items
        const productIds = localCartItems.map(item => item.product_id);
        const { data: products, error } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds)
          .eq('is_active', true);

        if (error) throw error;

        // Map to CartItem format
        const mappedItems: CartItem[] = localCartItems
          .map(localItem => {
            const product = products?.find(p => p.id === localItem.product_id);
            if (!product) return null;

            return {
              id: `local-${localItem.product_id}`,
              quantity: localItem.quantity,
              product: {
                id: product.id,
                title: product.title,
                price: product.price,
                seller_id: product.seller_id,
                images: product.images || []
              }
            };
          })
          .filter(Boolean) as CartItem[];

        setCartItems(mappedItems);
      } else {
        // Handle authenticated users with Supabase
        const { data, error } = await supabase
          .from('cart_items')
          .select(`
            id,
            quantity,
            product_id,
            products!inner (
              id,
              title,
              price,
              seller_id,
              images,
              is_active
            )
          `)
          .eq('user_id', user.id)
          .eq('products.is_active', true);

        if (error) throw error;

        const mappedItems: CartItem[] = data?.map(item => ({
          id: item.id,
          quantity: item.quantity,
          product: {
            id: item.products.id,
            title: item.products.title,
            price: item.products.price,
            seller_id: item.products.seller_id,
            images: item.products.images || []
          }
        })) || [];

        setCartItems(mappedItems);
      }
    } catch (error) {
      console.error('Error fetching cart items:', error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: string) => {
    if (!user) {
      // For unauthenticated users, store in localStorage
      const localCart = getLocalCart();
      const existingItem = localCart.find(item => item.product_id === productId);
      
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        localCart.push({ product_id: productId, quantity: 1 });
      }
      
      setLocalCart(localCart);
      await fetchCartItems();
      return;
    }

    try {
      // Check if item already exists in cart
      const { data: existingItems } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle();

      if (existingItems) {
        // Update existing item quantity
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existingItems.quantity + 1 })
          .eq('id', existingItems.id);
        
        if (error) throw error;
      } else {
        // Insert new cart item
        const { error } = await supabase
          .from('cart_items')
          .insert({ 
            user_id: user.id, 
            product_id: productId, 
            quantity: 1 
          });
        
        if (error) throw error;
      }
      
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

    if (!user) {
      // Handle local cart
      const localCart = getLocalCart();
      const productId = cartItemId.replace('local-', '');
      const item = localCart.find(item => item.product_id === productId);
      if (item) {
        item.quantity = quantity;
        setLocalCart(localCart);
        fetchCartItems();
      }
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
    if (!user) {
      // Handle local cart
      const localCart = getLocalCart();
      const productId = cartItemId.replace('local-', '');
      const updatedCart = localCart.filter(item => item.product_id !== productId);
      setLocalCart(updatedCart);
      fetchCartItems();
      return;
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);

      if (error) throw error;
      fetchCartItems();
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const clearCart = async () => {
    if (!user) {
      setLocalCart([]);
      await fetchCartItems();
      return;
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchCartItems();
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  useEffect(() => {
    // Clear old incorrect localStorage data immediately on load
    const currentCart = localStorage.getItem('djassa_cart');
    if (currentCart) {
      try {
        const cartData = JSON.parse(currentCart);
        const hasOldIds = cartData.some((item: any) => item.product_id && item.product_id.startsWith('prod-'));
        if (hasOldIds) {
          console.log('🧹 Clearing old cart data with incorrect IDs');
          localStorage.removeItem('djassa_cart');
        }
      } catch (e) {
        localStorage.removeItem('djassa_cart');
      }
    }
    
    fetchCartItems();
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
    clearCart,
  };
};