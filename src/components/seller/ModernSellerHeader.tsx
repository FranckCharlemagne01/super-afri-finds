import { memo, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Store, ExternalLink, LogOut, Coins, Clock, CheckCircle2, ArrowLeft, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from '@/hooks/use-toast';

interface Shop {
  id: string;
  shop_name: string;
  shop_slug: string;
  shop_description: string | null;
  logo_url: string | null;
  is_active: boolean;
  subscription_active: boolean;
}

interface TrialStatus {
  isInTrial: boolean;
  trialEndDate: Date | null;
  canPublish: boolean;
  isPremium: boolean;
  loading: boolean;
}

interface ModernSellerHeaderProps {
  shop: Shop | null;
  onSignOut: () => void;
  trialStatus: TrialStatus;
  tokenBalance: number;
  freeTokens: number;
  freeTokensExpiresAt: string | null;
  onPublishProduct?: () => void;
}

export const ModernSellerHeader = memo(({
  shop,
  onSignOut,
  trialStatus,
  tokenBalance,
  freeTokens,
  freeTokensExpiresAt,
  onPublishProduct
}: ModernSellerHeaderProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // ✅ Memoize calculations
  const { daysRemaining, trialProgress } = useMemo(() => {
    if (!trialStatus.trialEndDate) return { daysRemaining: 0, trialProgress: 100 };
    const diff = new Date(trialStatus.trialEndDate).getTime() - new Date().getTime();
    const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    return {
      daysRemaining: days,
      trialProgress: trialStatus.isInTrial ? ((28 - days) / 28) * 100 : 100
    };
  }, [trialStatus.trialEndDate, trialStatus.isInTrial]);

  const handleNavigateToMarketplace = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate('/marketplace');
    toast({
      title: "Retour à la boutique publique",
      description: "Vous êtes maintenant sur la page principale.",
      duration: 2000,
    });
  }, [navigate]);

  return (
    <Card className="mb-3 md:mb-4 border-0 shadow-lg bg-gradient-to-br from-primary/10 via-primary/5 to-background overflow-hidden rounded-2xl">
      <CardContent className="p-3 md:p-5">
        <div className="flex flex-col gap-3 md:gap-4">
          {/* Top Row: Shop Logo & Info */}
          <div className="flex items-center gap-3 flex-1">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden bg-card border-2 border-background shadow-lg flex-shrink-0">
              {shop?.logo_url ? (
                <img src={shop.logo_url} alt={shop.shop_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-primary/10">
                  <Store className="h-7 w-7 md:h-8 md:w-8 text-primary" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                <h1 className="text-base md:text-xl font-bold truncate">
                  {shop?.shop_name || 'Ma Boutique'}
                </h1>
                {shop?.is_active ? (
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 text-[10px] md:text-xs h-5 px-2">
                    <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] md:text-xs h-5 px-2">Suspendue</Badge>
                )}
                {shop?.subscription_active && (
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-[10px] md:text-xs h-5 px-2">
                    Premium
                  </Badge>
                )}
              </div>
              <p className="text-xs md:text-sm text-muted-foreground line-clamp-1">
                {shop?.shop_description || 'Bienvenue dans votre espace boutique'}
              </p>
            </div>
          </div>

          {/* Trial Status */}
          {trialStatus.isInTrial && (
            <div className="flex items-center gap-2 bg-orange-500/10 rounded-lg p-2 md:p-2.5">
              <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-orange-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-xs md:text-sm text-orange-600 dark:text-orange-400 font-medium">
                  {daysRemaining} jours d'essai restants
                </span>
                <Progress value={trialProgress} className="h-1.5 mt-1" />
              </div>
            </div>
          )}

          {/* Bottom Row: Token Balance & Actions */}
          <div className="flex flex-col sm:flex-row items-stretch gap-2 md:gap-3">
            {/* Token Balance - Compact */}
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 rounded-xl flex-1 sm:flex-none">
              <CardContent className="p-2.5 md:p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Coins className="h-4 w-4 md:h-4.5 md:w-4.5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] md:text-xs text-muted-foreground">Jetons</p>
                    <p className="text-lg md:text-xl font-bold text-primary tabular-nums">{tokenBalance}</p>
                    {freeTokens > 0 && freeTokensExpiresAt && (
                      <p className="text-[10px] text-muted-foreground truncate">
                        {freeTokens} gratuits
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons - Mobile Optimized */}
            <div className="flex gap-1.5 md:gap-2 flex-1">
              <Button
                variant="outline"
                onClick={handleNavigateToMarketplace}
                className="bg-card hover:bg-primary/10 border-primary/30 flex-1 text-xs md:text-sm transition-all hover:scale-[1.02] touch-manipulation active:scale-95 h-auto py-2.5 rounded-xl"
                type="button"
              >
                <ArrowLeft className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                <span className="truncate">Accueil</span>
              </Button>
              
              {shop && (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/boutique/${shop.shop_slug}`)}
                  className="bg-card hover:bg-primary/10 border-primary/30 flex-1 text-xs md:text-sm h-auto py-2.5 rounded-xl"
                >
                  <ExternalLink className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                  <span className="truncate hidden sm:inline">Ma boutique</span>
                  <span className="truncate sm:hidden">Boutique</span>
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={onSignOut}
                className="hover:bg-destructive/10 hover:text-destructive text-xs md:text-sm h-auto py-2.5 rounded-xl px-3"
              >
                <LogOut className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ModernSellerHeader.displayName = 'ModernSellerHeader';
