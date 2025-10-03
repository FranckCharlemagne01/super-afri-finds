import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface TokenBalance {
  id: string;
  seller_id: string;
  token_balance: number;
  created_at: string;
  updated_at: string;
}

export interface TokenTransaction {
  id: string;
  seller_id: string;
  transaction_type: 'purchase' | 'usage';
  tokens_amount: number;
  price_paid: number | null;
  paystack_reference: string | null;
  status: 'pending' | 'completed' | 'failed';
  product_id: string | null;
  created_at: string;
}

export const useTokens = () => {
  const { user } = useAuth();
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);

  useEffect(() => {
    const fetchTokenBalance = async () => {
      if (!user) {
        setTokenBalance(0);
        setLoading(false);
        return;
      }

      try {
        // Initialiser les jetons si nécessaire
        await supabase.rpc('initialize_seller_tokens', { _seller_id: user.id });

        const { data, error } = await supabase
          .from('seller_tokens')
          .select('token_balance')
          .eq('seller_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching token balance:', error);
          setTokenBalance(0);
        } else {
          setTokenBalance(data?.token_balance || 0);
        }
      } catch (error) {
        console.error('Error fetching token balance:', error);
        setTokenBalance(0);
      } finally {
        setLoading(false);
      }
    };

    fetchTokenBalance();
  }, [user]);

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('token_transactions')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error);
      } else {
        setTransactions((data || []) as TokenTransaction[]);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const refreshBalance = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('seller_tokens')
        .select('token_balance')
        .eq('seller_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error refreshing token balance:', error);
      } else {
        setTokenBalance(data?.token_balance || 0);
      }
    } catch (error) {
      console.error('Error refreshing token balance:', error);
    }
  };

  return {
    tokenBalance,
    loading,
    transactions,
    fetchTransactions,
    refreshBalance,
  };
};
