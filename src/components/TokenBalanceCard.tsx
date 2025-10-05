import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Coins, Clock, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface TokenBalanceCardProps {
  totalTokens: number;
  freeTokens: number;
  paidTokens: number;
  expiresAt: string | null;
}

export const TokenBalanceCard = ({
  totalTokens,
  freeTokens,
  paidTokens,
  expiresAt,
}: TokenBalanceCardProps) => {
  const freeTokensPercentage = totalTokens > 0 ? (freeTokens / totalTokens) * 100 : 0;
  
  // Calculer les jours restants avant expiration
  const daysUntilExpiration = expiresAt 
    ? Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const showLowTokensAlert = totalTokens < 5;
  const showExpirationAlert = daysUntilExpiration !== null && daysUntilExpiration <= 3 && freeTokens > 0;

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Mes Jetons</h3>
        </div>
        <div className="text-3xl font-bold text-primary">{totalTokens}</div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Jetons gratuits</span>
          <span className="font-medium text-green-600">{freeTokens}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Jetons achetés</span>
          <span className="font-medium text-blue-600">{paidTokens}</span>
        </div>
      </div>

      {totalTokens > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progression des jetons gratuits</span>
            <span>{Math.round(freeTokensPercentage)}%</span>
          </div>
          <Progress value={freeTokensPercentage} className="h-2" />
        </div>
      )}

      {expiresAt && freeTokens > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            Expire {formatDistanceToNow(new Date(expiresAt), { 
              addSuffix: true,
              locale: fr 
            })}
          </span>
        </div>
      )}

      {showLowTokensAlert && (
        <Alert variant="destructive" className="py-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            ⚠️ Il vous reste moins de 5 jetons ! Rechargez maintenant.
          </AlertDescription>
        </Alert>
      )}

      {showExpirationAlert && (
        <Alert className="py-2 border-orange-500 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-sm text-orange-800">
            ⏰ Vos jetons gratuits expirent dans {daysUntilExpiration} jour{daysUntilExpiration > 1 ? 's' : ''} !
          </AlertDescription>
        </Alert>
      )}
    </Card>
  );
};
