import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Coins, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TokenTransaction {
  id: string;
  seller_id: string;
  transaction_type: 'purchase' | 'usage' | 'boost' | 'trial_bonus';
  tokens_amount: number;
  price_paid: number | null;
  paystack_reference: string | null;
  payment_method: string | null;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  profiles?: {
    email: string;
    full_name: string;
  };
}

export const TokenTransactionsSuperAdmin = () => {
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      // Get transactions (achats et bonus)
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('token_transactions')
        .select('*')
        .in('transaction_type', ['purchase', 'trial_bonus'])
        .order('created_at', { ascending: false })
        .limit(100);

      if (transactionsError) throw transactionsError;

      // Get seller profiles separately
      const sellerIds = [...new Set(transactionsData?.map(t => t.seller_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, email, full_name')
        .in('user_id', sellerIds);

      // Map profiles to transactions
      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
      
      const enrichedTransactions = transactionsData?.map(t => ({
        ...t,
        profiles: profilesMap.get(t.seller_id)
      })) || [];

      setTransactions(enrichedTransactions as TokenTransaction[]);
    } catch (error) {
      console.error('Error fetching token transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">✅ Complété</Badge>;
      case 'pending':
        return <Badge variant="secondary">⏳ En attente</Badge>;
      case 'failed':
        return <Badge variant="destructive">❌ Échoué</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTransactionTypeBadge = (type: string) => {
    switch (type) {
      case 'purchase':
        return <Badge className="bg-purple-500">💳 Achat</Badge>;
      case 'trial_bonus':
        return <Badge className="bg-blue-500">🎁 Bonus essai</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getPaymentMethodLabel = (method: string | null) => {
    if (!method) return '-';
    const labels: Record<string, string> = {
      'orange_money': 'Orange Money CI',
      'mtn_money': 'MTN MoMo CI',
      'moov_money': 'Moov Money CI',
      'wave_money': 'Wave CI',
      'card': 'Carte Bancaire',
    };
    return labels[method] || method;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Chargement des transactions...</span>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <Coins className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-20" />
        <p className="text-muted-foreground">Aucune transaction de jetons pour le moment</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Résumé rapide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
          <div className="text-sm font-medium text-green-700">Transactions réussies</div>
          <div className="text-2xl font-bold text-green-600">
            {transactions.filter(t => t.status === 'completed').length}
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-4 rounded-lg border border-amber-200">
          <div className="text-sm font-medium text-amber-700">En attente</div>
          <div className="text-2xl font-bold text-amber-600">
            {transactions.filter(t => t.status === 'pending').length}
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-rose-50 p-4 rounded-lg border border-red-200">
          <div className="text-sm font-medium text-red-700">Échouées</div>
          <div className="text-2xl font-bold text-red-600">
            {transactions.filter(t => t.status === 'failed').length}
          </div>
        </div>
      </div>

      {/* Table des transactions */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vendeur</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Montant</TableHead>
            <TableHead>Jetons</TableHead>
            <TableHead>Méthode</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Référence</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell className="font-medium">
                {(transaction.profiles as any)?.full_name || 'N/A'}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {(transaction.profiles as any)?.email || 'N/A'}
              </TableCell>
              <TableCell>
                {getTransactionTypeBadge(transaction.transaction_type)}
              </TableCell>
              <TableCell>
                {transaction.price_paid ? (
                  <span className="font-semibold text-green-600">
                    {transaction.price_paid.toLocaleString()} FCFA
                  </span>
                ) : (
                  <span className="text-blue-500 font-medium">Gratuit</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-amber-500" />
                  <span className="font-bold text-amber-600">
                    {transaction.tokens_amount}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-sm">
                {getPaymentMethodLabel(transaction.payment_method)}
              </TableCell>
              <TableCell>{getStatusBadge(transaction.status)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(transaction.created_at), 'PPp', { locale: fr })}
              </TableCell>
              <TableCell className="text-xs font-mono text-muted-foreground">
                {transaction.paystack_reference ? (
                  <span className="truncate max-w-[150px] inline-block">
                    {transaction.paystack_reference}
                  </span>
                ) : (
                  '-'
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
