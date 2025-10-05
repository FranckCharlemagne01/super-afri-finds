import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface TokenBalance {
  id: string;
  seller_id: string;
  token_balance: number;
  free_tokens_count: number;
  paid_tokens_count: number;
  free_tokens_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TokenTransaction {
  id: string;
  seller_id: string;
  transaction_type: 'purchase' | 'usage' | 'boost' | 'trial_bonus';
  tokens_amount: number;
  price_paid: number | null;
  paystack_reference: string | null;
  payment_method: string | null;
  status: 'pending' | 'completed' | 'failed';
  product_id: string | null;
  created_at: string;
}

interface TrialBonusResult {
  success: boolean;
  message?: string;
  error?: string;
  new_balance?: number;
}

export const useTokens = () => {
  const { user } = useAuth();
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [freeTokens, setFreeTokens] = useState<number>(0);
  const [paidTokens, setPaidTokens] = useState<number>(0);
  const [freeTokensExpiresAt, setFreeTokensExpiresAt] = useState<string | null>(null);
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
      // Initialiser les jetons si nécessaire (les nouveaux vendeurs reçoivent 20 jetons à l'inscription)
      await supabase.rpc('initialize_seller_tokens', { _seller_id: user.id });

        const { data, error } = await supabase
          .from('seller_tokens')
          .select('token_balance, free_tokens_count, paid_tokens_count, free_tokens_expires_at')
          .eq('seller_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching token balance:', error);
          setTokenBalance(0);
          setFreeTokens(0);
          setPaidTokens(0);
          setFreeTokensExpiresAt(null);
        } else {
          setTokenBalance(data?.token_balance || 0);
          setFreeTokens(data?.free_tokens_count || 0);
          setPaidTokens(data?.paid_tokens_count || 0);
          setFreeTokensExpiresAt(data?.free_tokens_expires_at || null);
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
      console.log('🔄 Rafraîchissement du solde de jetons...');
      
      // Initialiser les jetons si nécessaire
      await supabase.rpc('initialize_seller_tokens', { _seller_id: user.id });
      
      const { data, error } = await supabase
        .from('seller_tokens')
        .select('token_balance, free_tokens_count, paid_tokens_count, free_tokens_expires_at')
        .eq('seller_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error refreshing token balance:', error);
      } else {
        const newBalance = data?.token_balance || 0;
        const newFreeTokens = data?.free_tokens_count || 0;
        const newPaidTokens = data?.paid_tokens_count || 0;
        const newExpiresAt = data?.free_tokens_expires_at || null;
        console.log('✅ Nouveau solde de jetons:', newBalance);
        setTokenBalance(newBalance);
        setFreeTokens(newFreeTokens);
        setPaidTokens(newPaidTokens);
        setFreeTokensExpiresAt(newExpiresAt);
      }
    } catch (error) {
      console.error('Error refreshing token balance:', error);
    }
  };

  return {
    tokenBalance,
    freeTokens,
    paidTokens,
    freeTokensExpiresAt,
    loading,
    transactions,
    fetchTransactions,
    refreshBalance,
  };
};
