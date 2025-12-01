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
    <div className="space-y-4 md:space-y-6 animate-in fade-in-0 duration-500">
      {/* Token Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/10 via-primary/5 to-background overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Coins className="h-5 w-5 text-primary" />
              </div>
              <span className="break-words">Solde de Jetons</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-4">
              <div className="relative">
                <div className="flex items-baseline gap-2 mb-2 flex-wrap">
                  <span className="text-4xl md:text-5xl font-bold text-primary tabular-nums">{tokenBalance}</span>
                  <span className="text-sm md:text-base text-muted-foreground break-words">jetons disponibles</span>
                </div>
                {tokenBalance === 0 && (
                  <Badge variant="destructive" className="animate-pulse">Aucun jeton disponible</Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4 p-3 md:p-4 bg-card rounded-xl border border-border/50 shadow-sm">
                <div className="space-y-2">
                  <p className="text-xs md:text-sm text-muted-foreground font-medium truncate">Jetons Gratuits</p>
                  <p className="text-2xl md:text-3xl font-bold text-green-600 tabular-nums">{freeTokens}</p>
                  {freeTokensExpiresAt && freeTokens > 0 && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">Expire le {new Date(freeTokensExpiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                    </p>
                  )}
                  {/* Mini progress indicator */}
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500" style={{ width: `${Math.min((freeTokens / 100) * 100, 100)}%` }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs md:text-sm text-muted-foreground font-medium truncate">Jetons Payants</p>
                  <p className="text-2xl md:text-3xl font-bold text-purple-600 tabular-nums">{paidTokens}</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">Sans expiration</p>
                  {/* Mini progress indicator */}
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500" style={{ width: `${Math.min((paidTokens / 100) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => setShowPurchaseDialog(true)}
                size="lg"
                className="w-full bg-gradient-to-r from-primary via-primary to-primary/80 hover:shadow-lg transition-all hover:scale-105 active:scale-95 touch-manipulation"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                <span className="break-words">Acheter des jetons</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <span className="break-words">Utilisation des Jetons</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-3 md:space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-3 bg-muted/30 hover:bg-muted/50 rounded-xl border border-border/50 transition-all hover:shadow-md group/item">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-4 w-4 text-blue-500" />
                  </div>
                  <span className="text-sm font-medium truncate">Publications ce mois</span>
                </div>
                <Badge variant="secondary" className="group-hover/item:scale-105 transition-transform tabular-nums">{thisMonthProducts} produits</Badge>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-3 bg-muted/30 hover:bg-muted/50 rounded-xl border border-border/50 transition-all hover:shadow-md group/item">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <Zap className="h-4 w-4 text-purple-500" />
                  </div>
                  <span className="text-sm font-medium truncate">Produits boostés</span>
                </div>
                <Badge className="bg-purple-500 text-white group-hover/item:scale-105 transition-transform tabular-nums">{boostedProducts}</Badge>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-3 bg-muted/30 hover:bg-muted/50 rounded-xl border border-border/50 transition-all hover:shadow-md group/item">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <Coins className="h-4 w-4 text-green-500" />
                  </div>
                  <span className="text-sm font-medium truncate">Produits actifs</span>
                </div>
                <Badge className="bg-green-500 text-white group-hover/item:scale-105 transition-transform tabular-nums">
                  {products.filter(p => p.is_active).length}
                </Badge>
              </div>

              {trialStatus.isInTrial && trialStatus.trialEndDate && (
                <div className="p-3 md:p-4 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-xl animate-pulse">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-orange-600" />
                    </div>
                    <span className="text-sm font-medium text-orange-600 truncate">
                      Période d'essai
                    </span>
                  </div>
                  <Progress 
                    value={((new Date(trialStatus.trialEndDate).getTime() - new Date().getTime()) / (28 * 24 * 60 * 60 * 1000)) * 100}
                    className="h-2 mb-2"
                  />
                  <p className="text-xs text-muted-foreground truncate">
                    Expire le {new Date(trialStatus.trialEndDate).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card className="border-0 shadow-lg overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Coins className="h-5 w-5 text-primary" />
            </div>
            <span className="break-words">Historique des Transactions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
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
