import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Coins, ShoppingCart, History } from 'lucide-react';
import { useTokens } from '@/hooks/useTokens';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const TokenTransactionHistory = () => {
  const { transactions, fetchTransactions } = useTokens();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Complété</Badge>;
      case 'pending':
        return <Badge variant="secondary">En attente</Badge>;
      case 'failed':
        return <Badge variant="destructive">Échoué</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTransactionIcon = (type: string) => {
    if (type === 'purchase') {
      return <ShoppingCart className="h-4 w-4 text-green-500" />;
    } else if (type === 'boost') {
      return <Coins className="h-4 w-4 text-purple-500" />;
    } else {
      return <Coins className="h-4 w-4 text-orange-500" />;
    }
  };

  const getPaymentMethodLabel = (method: string | null) => {
    if (!method) return '';
    const labels: Record<string, string> = {
      'orange_money': 'Orange Money CI',
      'mtn_money': 'MTN MoMo CI',
      'moov_money': 'Moov Money CI',
      'wave_money': 'Wave CI',
      'card': 'Carte Bancaire',
    };
    return labels[method] || method;
  };

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique des transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Aucune transaction pour le moment</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Mes Transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[450px] pr-4">
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="border-2 rounded-xl p-4 hover:bg-accent/50 transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="mt-1 flex-shrink-0">
                      {getTransactionIcon(transaction.transaction_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold text-sm">
                          {transaction.transaction_type === 'purchase'
                            ? `Achat de ${transaction.tokens_amount} jetons`
                            : transaction.transaction_type === 'boost'
                            ? `Boost de produit`
                            : `Publication de produit`}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <span>📅</span>
                          {format(new Date(transaction.created_at), 'PPp', { locale: fr })}
                        </p>
                        
                        {transaction.payment_method && transaction.transaction_type === 'purchase' && (
                          <p className="text-xs font-medium text-primary flex items-center gap-1">
                            <span>💳</span>
                            {getPaymentMethodLabel(transaction.payment_method)}
                          </p>
                        )}
                        
                        {transaction.transaction_type !== 'purchase' && (
                          <p className="text-xs text-muted-foreground">
                            {transaction.transaction_type === 'boost' 
                              ? `${Math.abs(transaction.tokens_amount)} jetons utilisés`
                              : `${Math.abs(transaction.tokens_amount)} jeton utilisé`
                            }
                          </p>
                        )}
                        
                        {transaction.transaction_type === 'purchase' && (
                          <p className="text-xs font-semibold text-green-600 flex items-center gap-1">
                            <span>✅</span>
                            +{transaction.tokens_amount} jetons reçus
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right flex-shrink-0">
                    <div className="mb-2">
                      {getStatusBadge(transaction.status)}
                    </div>
                    {transaction.price_paid && (
                      <div className="bg-primary/10 px-3 py-1 rounded-lg">
                        <p className="text-sm font-bold text-primary">
                          {transaction.price_paid.toLocaleString()} FCFA
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
