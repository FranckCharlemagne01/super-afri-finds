import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStableAuth } from './useStableAuth';

export interface WalletBalance {
  balance: number;
  pending_withdrawals: number;
  pending_escrow: number;
}

export interface WalletTransaction {
  id: string;
  transaction_type: string;
  amount: number;
  currency: string;
  description: string | null;
  reference: string | null;
  status: string;
  created_at: string;
}

export interface WithdrawalRequest {
  id: string;
  amount: number;
  withdrawal_method: string;
  destination_number: string;
  destination_name: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  processed_at: string | null;
}

export const useWallet = () => {
  const { userId } = useStableAuth();
  const [balance, setBalance] = useState<WalletBalance>({ balance: 0, pending_withdrawals: 0, pending_escrow: 0 });
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBalance = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase.rpc('get_wallet_balance', { _user_id: userId });
      if (!error && data) {
        setBalance(data as unknown as WalletBalance);
      }
    } catch (err) {
      console.error('Error fetching wallet balance:', err);
    }
  }, [userId]);

  const fetchTransactions = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (!error) setTransactions((data || []) as WalletTransaction[]);
    } catch (err) {
      console.error('Error fetching wallet transactions:', err);
    }
  }, [userId]);

  const fetchWithdrawals = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (!error) setWithdrawals((data || []) as WithdrawalRequest[]);
    } catch (err) {
      console.error('Error fetching withdrawals:', err);
    }
  }, [userId]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchBalance(), fetchTransactions(), fetchWithdrawals()]);
    setLoading(false);
  }, [fetchBalance, fetchTransactions, fetchWithdrawals]);

  useEffect(() => {
    if (userId) refreshAll();
  }, [userId]);

  const requestWithdrawal = useCallback(async (
    amount: number,
    method: string,
    destination: string,
    destinationName?: string
  ) => {
    if (!userId) return { success: false, error: 'Non connecté' };
    try {
      const { data, error } = await supabase.rpc('request_withdrawal', {
        _user_id: userId,
        _amount: amount,
        _method: method,
        _destination: destination,
        _destination_name: destinationName || null,
      });
      if (error) return { success: false, error: error.message };
      const result = data as any;
      if (result?.success) {
        await refreshAll();
      }
      return result;
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [userId, refreshAll]);

  return {
    balance,
    transactions,
    withdrawals,
    loading,
    refreshAll,
    requestWithdrawal,
  };
};
