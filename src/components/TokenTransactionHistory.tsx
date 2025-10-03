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
    return type === 'purchase' ? (
      <ShoppingCart className="h-4 w-4 text-green-500" />
    ) : (
      <Coins className="h-4 w-4 text-orange-500" />
    );
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
          Historique des transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {getTransactionIcon(transaction.transaction_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">
                          {transaction.transaction_type === 'purchase'
                            ? `Achat de ${transaction.tokens_amount} jetons`
                            : 'Utilisation pour publication'}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(transaction.created_at), 'PPp', { locale: fr })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {getStatusBadge(transaction.status)}
                    {transaction.price_paid && (
                      <p className="text-sm font-semibold mt-1 text-primary">
                        {transaction.price_paid.toLocaleString()} FCFA
                      </p>
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
