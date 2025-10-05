import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Coins, TrendingUp, Users, Gift } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TokenStats {
  totalFreeTokensDistributed: number;
  totalPaidTokensDistributed: number;
  activeTokenHolders: number;
  expiredTokens: number;
}

interface SellerTokenInfo {
  seller_id: string;
  full_name: string;
  email: string;
  total_tokens: number;
  free_tokens: number;
  paid_tokens: number;
  expires_at: string | null;
  status: 'active' | 'expired' | 'low';
}

export const TokenStatsSuperAdmin = () => {
  const [stats, setStats] = useState<TokenStats>({
    totalFreeTokensDistributed: 0,
    totalPaidTokensDistributed: 0,
    activeTokenHolders: 0,
    expiredTokens: 0,
  });
  const [sellers, setSellers] = useState<SellerTokenInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTokenStats();
  }, []);

  const fetchTokenStats = async () => {
    try {
      setLoading(true);

      // Récupérer tous les vendeurs avec leurs jetons
      const { data: tokensData, error: tokensError } = await supabase
        .from('seller_tokens')
        .select(`
          seller_id,
          token_balance,
          free_tokens_count,
          paid_tokens_count,
          free_tokens_expires_at
        `);

      if (tokensError) throw tokensError;

      // Récupérer les profils des vendeurs
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', tokensData?.map(t => t.seller_id) || []);

      if (profilesError) throw profilesError;

      // Calculer les statistiques
      const now = new Date();
      let totalFree = 0;
      let totalPaid = 0;
      let activeHolders = 0;
      let expiredTokens = 0;

      const sellersInfo: SellerTokenInfo[] = (tokensData || []).map(token => {
        const profile = profilesData?.find(p => p.user_id === token.seller_id);
        const isExpired = token.free_tokens_expires_at 
          ? new Date(token.free_tokens_expires_at) < now 
          : false;

        totalFree += token.free_tokens_count || 0;
        totalPaid += token.paid_tokens_count || 0;

        if (token.token_balance > 0) {
          activeHolders++;
        }
        if (isExpired && token.free_tokens_count > 0) {
          expiredTokens += token.free_tokens_count;
        }

        let status: 'active' | 'expired' | 'low' = 'active';
        if (isExpired) status = 'expired';
        else if (token.token_balance < 5) status = 'low';

        return {
          seller_id: token.seller_id,
          full_name: profile?.full_name || 'N/A',
          email: profile?.email || 'N/A',
          total_tokens: token.token_balance,
          free_tokens: token.free_tokens_count || 0,
          paid_tokens: token.paid_tokens_count || 0,
          expires_at: token.free_tokens_expires_at,
          status,
        };
      });

      setStats({
        totalFreeTokensDistributed: totalFree,
        totalPaidTokensDistributed: totalPaid,
        activeTokenHolders: activeHolders,
        expiredTokens: expiredTokens,
      });

      setSellers(sellersInfo.sort((a, b) => b.total_tokens - a.total_tokens));
    } catch (error) {
      console.error('Error fetching token stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
      case 'low':
        return <Badge className="bg-orange-100 text-orange-800">Jetons Faibles</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expiré</Badge>;
      default:
        return <Badge variant="secondary">Inconnu</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Chargement des statistiques...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jetons Gratuits Distribués</CardTitle>
            <Gift className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.totalFreeTokensDistributed.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jetons Achetés</CardTitle>
            <Coins className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalPaidTokensDistributed.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendeurs Actifs</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTokenHolders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jetons Expirés</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.expiredTokens.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table des vendeurs */}
      <Card>
        <CardHeader>
          <CardTitle>Détails des Jetons par Vendeur</CardTitle>
          <CardDescription>
            Vue d'ensemble de tous les vendeurs et leur solde de jetons
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendeur</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Gratuits</TableHead>
                  <TableHead className="text-right">Achetés</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sellers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Aucun vendeur trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  sellers.map((seller) => (
                    <TableRow key={seller.seller_id}>
                      <TableCell className="font-medium">{seller.full_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {seller.email}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {seller.total_tokens}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {seller.free_tokens}
                      </TableCell>
                      <TableCell className="text-right text-blue-600">
                        {seller.paid_tokens}
                      </TableCell>
                      <TableCell className="text-sm">
                        {seller.expires_at && seller.free_tokens > 0 ? (
                          <span className={
                            new Date(seller.expires_at) < new Date() 
                              ? 'text-red-600' 
                              : 'text-muted-foreground'
                          }>
                            {formatDistanceToNow(new Date(seller.expires_at), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(seller.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
