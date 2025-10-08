import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Coins, 
  TrendingUp, 
  Clock, 
  ShoppingCart,
  Calendar,
  Zap
} from 'lucide-react';
import { TokenTransactionHistory } from '@/components/TokenTransactionHistory';
import { TokenPurchaseDialog } from '@/components/TokenPurchaseDialog';

interface Product {
  created_at: string;
  is_active?: boolean;
  is_boosted?: boolean;
  boosted_until?: string;
}

interface TrialStatus {
  isInTrial: boolean;
  trialEndDate: Date | null;
  isPremium: boolean;
}

interface TokensSubscriptionTabProps {
  tokenBalance: number;
  freeTokens: number;
  paidTokens: number;
  freeTokensExpiresAt: string | null;
  trialStatus: TrialStatus;
  products: Product[];
  onRefresh: () => void;
}

export const TokensSubscriptionTab = ({
  tokenBalance,
  freeTokens,
  paidTokens,
  freeTokensExpiresAt,
  trialStatus,
  products,
  onRefresh
}: TokensSubscriptionTabProps) => {
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);

  const thisMonthProducts = products.filter(p => {
    const createdAt = new Date(p.created_at);
    const now = new Date();
    return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
  }).length;

  const boostedProducts = products.filter(p => 
    p.is_boosted && p.boosted_until && new Date(p.boosted_until) > new Date()
  ).length;

  return (
    <div className="space-y-6">
      {/* Token Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Solde de Jetons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold text-primary">{tokenBalance}</span>
                  <span className="text-muted-foreground">jetons disponibles</span>
                </div>
                {tokenBalance === 0 && (
                  <Badge variant="destructive">Aucun jeton disponible</Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-card rounded-lg border">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Jetons Gratuits</p>
                  <p className="text-2xl font-bold text-green-600">{freeTokens}</p>
                  {freeTokensExpiresAt && freeTokens > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3 inline mr-1" />
                      Expire le {new Date(freeTokensExpiresAt).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Jetons Payants</p>
                  <p className="text-2xl font-bold text-purple-600">{paidTokens}</p>
                  <p className="text-xs text-muted-foreground mt-1">Sans expiration</p>
                </div>
              </div>

              <Button 
                onClick={() => setShowPurchaseDialog(true)}
                size="lg"
                className="w-full bg-gradient-to-r from-primary to-primary/80"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Acheter des jetons
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Utilisation des Jetons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Publications ce mois</span>
                </div>
                <Badge variant="secondary">{thisMonthProducts} produits</Badge>
              </div>

              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">Produits boostés</span>
                </div>
                <Badge className="bg-purple-500 text-white">{boostedProducts}</Badge>
              </div>

              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Produits actifs</span>
                </div>
                <Badge className="bg-green-500 text-white">
                  {products.filter(p => p.is_active).length}
                </Badge>
              </div>

              {trialStatus.isInTrial && trialStatus.trialEndDate && (
                <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-600">
                      Période d'essai
                    </span>
                  </div>
                  <Progress 
                    value={((new Date(trialStatus.trialEndDate).getTime() - new Date().getTime()) / (28 * 24 * 60 * 60 * 1000)) * 100}
                    className="h-2 mb-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    Expire le {new Date(trialStatus.trialEndDate).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Historique des Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TokenTransactionHistory />
        </CardContent>
      </Card>

      {/* Purchase Dialog */}
      <TokenPurchaseDialog
        open={showPurchaseDialog}
        onOpenChange={setShowPurchaseDialog}
        onPurchaseComplete={onRefresh}
      />
    </div>
  );
};
