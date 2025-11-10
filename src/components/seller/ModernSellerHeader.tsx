import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Store, ExternalLink, LogOut, Coins, Clock, CheckCircle2, ArrowLeft, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

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

export const ModernSellerHeader = ({
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

  const getDaysRemaining = () => {
    if (!trialStatus.trialEndDate) return 0;
    const diff = new Date(trialStatus.trialEndDate).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const daysRemaining = getDaysRemaining();
  const trialProgress = trialStatus.isInTrial ? ((28 - daysRemaining) / 28) * 100 : 100;

  return (
    <Card className="mb-4 md:mb-6 border-0 shadow-lg bg-gradient-to-r from-primary/10 via-primary/5 to-background overflow-hidden">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 md:gap-6">
          {/* Shop Logo & Info */}
          <div className="flex items-center gap-3 md:gap-4 flex-1">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden bg-card border-2 md:border-4 border-background shadow-xl flex-shrink-0">
              {shop?.logo_url ? (
                <img src={shop.logo_url} alt={shop.shop_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-primary/10">
                  <Store className="h-10 w-10 text-primary" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold truncate">
                  {shop?.shop_name || 'Ma Boutique'}
                </h1>
                {shop?.is_active ? (
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary">Suspendue</Badge>
                )}
                {shop?.subscription_active && (
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                    Premium
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {shop?.shop_description || 'Bienvenue dans votre espace boutique'}
              </p>
              
              {/* Trial/Token Status */}
              {trialStatus.isInTrial && (
                <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 md:h-4 md:w-4 text-orange-500" />
                    <span className="text-xs md:text-sm text-orange-600 dark:text-orange-400 font-medium">
                      {daysRemaining} jours d'essai restants
                    </span>
                  </div>
                  <div className="flex-1 w-full sm:w-auto sm:max-w-[200px]">
                    <Progress value={trialProgress} className="h-2" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats & Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            {/* Token Balance */}
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Coins className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Jetons disponibles</p>
                    <p className="text-xl md:text-2xl font-bold text-primary">{tokenBalance}</p>
                    {freeTokens > 0 && freeTokensExpiresAt && (
                      <p className="text-xs text-muted-foreground">
                        {freeTokens} gratuits
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => navigate('/marketplace')}
                className="bg-card hover:bg-primary/10 border-primary/30 flex-1 sm:flex-none text-sm md:text-base transition-all duration-300 hover:scale-105"
                size="sm"
              >
                <ArrowLeft className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Accueil</span>
                <span className="sm:hidden">Accueil</span>
              </Button>
              
              {shop && (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/boutique/${shop.shop_slug}`)}
                  className="bg-card hover:bg-primary/10 border-primary/30 flex-1 sm:flex-none text-sm md:text-base"
                  size="sm"
                >
                  <ExternalLink className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  <span className="hidden md:inline">Voir ma boutique</span>
                  <span className="md:hidden">Boutique</span>
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={onSignOut}
                className="hover:bg-destructive/10 hover:text-destructive text-sm md:text-base"
                size="sm"
              >
                <LogOut className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Quitter</span>
                <span className="sm:hidden">Quitter</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
