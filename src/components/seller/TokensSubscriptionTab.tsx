import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Wallet, 
  TrendingUp, 
  Clock, 
  ShoppingCart,
  Calendar,
  Zap,
  Coins,
  History,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Percent
} from 'lucide-react';
import { TokenTransactionHistory } from '@/components/TokenTransactionHistory';
import { TokenPurchaseDialog } from '@/components/TokenPurchaseDialog';
import { useStableAuth } from '@/hooks/useStableAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatFCFA, getSellerTiers, type SellerType } from '@/utils/commissionCalculator';

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
  const { user } = useStableAuth();
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [sellerType, setSellerType] = useState<SellerType>('particulier');

  useEffect(() => {
    if (!user?.id) return;
    const fetchWallet = async () => {
      const [walletRes, profileRes] = await Promise.all([
        supabase.from('seller_tokens').select('wallet_balance_fcfa').eq('seller_id', user.id).maybeSingle(),
        supabase.from('profiles').select('seller_type').eq('user_id', user.id).maybeSingle(),
      ]);
      if (walletRes.data) setWalletBalance(walletRes.data.wallet_balance_fcfa || 0);
      if (profileRes.data?.seller_type) setSellerType(profileRes.data.seller_type as SellerType);
    };
    fetchWallet();
  }, [user?.id]);

  const sellerTier = getSellerTiers().find(t => t.type === sellerType);

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
      {/* Compte Djassa Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/10 via-primary/5 to-background overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <span className="break-words">Compte Djassa</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-4">
              {/* FCFA Balance */}
              <div className="relative">
                <p className="text-xs text-muted-foreground mb-1">Solde disponible</p>
                <div className="flex items-baseline gap-2 mb-2 flex-wrap">
                  <span className="text-3xl md:text-4xl font-bold text-primary tabular-nums">
                    {formatFCFA(walletBalance)}
                  </span>
                </div>
                {walletBalance === 0 && (
                  <Badge variant="destructive" className="animate-pulse">Solde insuffisant</Badge>
                )}
              </div>

              {/* Seller type info */}
              <div className="p-3 bg-card rounded-xl border border-border/50 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Type de compte</p>
                    <p className="text-lg font-bold capitalize">{sellerTier?.label}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground font-medium">Commission</p>
                    <p className="text-lg font-bold text-primary">{sellerTier?.rate}%</p>
                  </div>
                </div>
              </div>

              {/* Token balance (secondary info) */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-card rounded-xl border border-border/50 shadow-sm">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium truncate">Jetons gratuits</p>
                  <p className="text-xl font-bold text-green-600 tabular-nums">{freeTokens}</p>
                  {freeTokensExpiresAt && freeTokens > 0 && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">Expire le {new Date(freeTokensExpiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium truncate">Jetons payants</p>
                  <p className="text-xl font-bold text-purple-600 tabular-nums">{paidTokens}</p>
                  <p className="text-[10px] text-muted-foreground truncate">Sans expiration</p>
                </div>
              </div>

              {/* Recharge button */}
              <Button 
                onClick={() => setShowPurchaseDialog(true)}
                size="lg"
                className="w-full bg-gradient-to-r from-primary via-primary to-primary/80 hover:shadow-lg transition-all hover:scale-105 active:scale-95 touch-manipulation"
              >
                <Wallet className="h-5 w-5 mr-2" />
                <span>Recharger mon Compte Djassa</span>
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
              <span className="break-words">Activité</span>
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
                    <span className="text-sm font-medium text-orange-600 truncate">Période d'essai</span>
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

      {/* Commission info card */}
      <Card className="border-0 shadow-lg overflow-hidden rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <Percent className="h-4 w-4 text-amber-600" />
            </div>
            <span>Comment fonctionne la commission ?</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-5 pt-0">
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold">1.</span>
              <span>La commission ({sellerTier?.rate}%) est calculée sur le total de la commande</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold">2.</span>
              <span>Elle est prélevée du Compte Djassa <strong>après confirmation</strong> de la commande</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold">3.</span>
              <span>Si le client annule → commission <strong>automatiquement remboursée</strong></span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold">4.</span>
              <span>Après 48h sans plainte → commission <strong>définitivement validée</strong></span>
            </div>
          </div>
          <div className="mt-3 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              ⚠️ Commission minimum : 200 FCFA par commande
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="border-0 shadow-lg overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <History className="h-5 w-5 text-primary" />
            </div>
            <span className="break-words">Historique des transactions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <TokenTransactionHistory />
        </CardContent>
      </Card>

      {/* Purchase/Recharge Dialog */}
      <TokenPurchaseDialog
        open={showPurchaseDialog}
        onOpenChange={setShowPurchaseDialog}
        onPurchaseComplete={onRefresh}
      />
    </div>
  );
};
