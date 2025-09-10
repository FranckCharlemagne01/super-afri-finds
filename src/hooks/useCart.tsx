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

interface LocalCartItem {
  product_id: string;
  quantity: number;
}

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Local storage functions
  const getLocalCart = (): LocalCartItem[] => {
    try {
      const localCart = localStorage.getItem('djassa_cart');
      return localCart ? JSON.parse(localCart) : [];
    } catch {
      return [];
    }
  };

  const setLocalCart = (items: LocalCartItem[]) => {
    localStorage.setItem('djassa_cart', JSON.stringify(items));
  };

  const fetchCartItems = async () => {
    if (!user) {
      // Load from localStorage for non-authenticated users
      const localItems = getLocalCart();
      if (localItems.length > 0) {
        try {
          // Import products locally to avoid Supabase call
          const { products } = await import('@/data/products');
          
          const cartData: CartItem[] = localItems.map(localItem => {
            const product = products.find(p => p.id === localItem.product_id);
            if (!product) return null;
            
            return {
              id: `local-${localItem.product_id}`,
              product_id: localItem.product_id,
              quantity: localItem.quantity,
              product: {
                id: product.id,
                title: product.title,
                price: product.salePrice,
                images: [product.image]
              }
            };
          }).filter(Boolean) as CartItem[];

          setCartItems(cartData);
        } catch (error) {
          console.error('Error loading local cart products:', error);
          setCartItems([]);
        }
      } else {
        setCartItems([]);
      }
      return;
    }
    
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
      // Handle local cart for non-authenticated users
      const localCart = getLocalCart();
      const existingItem = localCart.find(item => item.product_id === productId);
      
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        localCart.push({ product_id: productId, quantity: 1 });
      }
      
      setLocalCart(localCart);
      
      // Immediately refresh cart display
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

  useEffect(() => {
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
  };
}