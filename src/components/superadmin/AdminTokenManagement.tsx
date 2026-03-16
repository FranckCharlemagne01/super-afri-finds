import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Coins, Search, Plus, Minus, Loader2, User, AlertCircle, Gift, Calendar, Wallet, Package } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface UserResult {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

interface TokenInfo {
  token_balance: number;
  free_tokens_count: number;
  paid_tokens_count: number;
  free_tokens_expires_at: string | null;
  wallet_balance_fcfa?: number;
}

interface Transaction {
  id: string;
  transaction_type: string;
  tokens_amount: number;
  status: string;
  payment_method: string | null;
  paystack_reference: string | null;
  created_at: string;
}

interface BonusInfo {
  id: string;
  bonus_type: string;
  is_active: boolean;
  starts_at: string;
  expires_at: string;
  max_products: number;
  used_products: number;
}

export const AdminTokenManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [users, setUsers] = useState<UserResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Bonus state
  const [bonusType, setBonusType] = useState<string>('publication_bonus');
  const [bonusReason, setBonusReason] = useState('');
  const [grantingBonus, setGrantingBonus] = useState(false);
  const [userBonuses, setUserBonuses] = useState<BonusInfo[]>([]);

  // Publication bonus fields
  const [bonusStartDate, setBonusStartDate] = useState('');
  const [bonusEndDate, setBonusEndDate] = useState('');
  const [bonusMaxProducts, setBonusMaxProducts] = useState('10');

  // Wallet credit
  const [walletCreditAmount, setWalletCreditAmount] = useState('');

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const { data, error } = await supabase.rpc('get_users_with_profiles');
      if (error) throw error;
      const q = searchQuery.toLowerCase().trim();
      const filtered = (data || []).filter((u: any) =>
        u.email?.toLowerCase().includes(q) ||
        u.full_name?.toLowerCase().includes(q) ||
        u.user_id?.toLowerCase().includes(q)
      ).slice(0, 10);
      setUsers(filtered);
      if (filtered.length === 0) toast.info('Aucun utilisateur trouvé');
    } catch (err: any) {
      toast.error('Erreur de recherche: ' + err.message);
    } finally {
      setSearching(false);
    }
  };

  const selectUser = async (user: UserResult) => {
    setSelectedUser(user);
    setUsers([]);
    setSearchQuery('');
    await Promise.all([loadTokenInfo(user.user_id), loadTransactions(user.user_id), loadUserBonuses(user.user_id)]);
  };

  const loadTokenInfo = async (userId: string) => {
    const { data } = await supabase
      .from('seller_tokens')
      .select('token_balance, free_tokens_count, paid_tokens_count, free_tokens_expires_at, wallet_balance_fcfa')
      .eq('seller_id', userId)
      .maybeSingle();
    setTokenInfo(data as TokenInfo | null);
  };

  const loadUserBonuses = async (userId: string) => {
    const { data } = await (supabase as any)
      .from('publication_bonus')
      .select('*')
      .eq('seller_id', userId)
      .order('created_at', { ascending: false });
    setUserBonuses((data || []) as BonusInfo[]);
  };

  const loadTransactions = async (userId: string) => {
    setLoadingHistory(true);
    try {
      const { data } = await supabase
        .from('token_transactions')
        .select('*')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      setTransactions((data || []) as Transaction[]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const adjustTokens = async (isCredit: boolean) => {
    if (!selectedUser || !amount) return;
    const numAmount = parseInt(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Montant invalide');
      return;
    }
    setAdjusting(true);
    try {
      const finalAmount = isCredit ? numAmount : -numAmount;
      const { data, error } = await supabase.rpc('admin_adjust_tokens', {
        p_seller: selectedUser.user_id,
        p_amount: finalAmount,
        p_reason: reason || (isCredit ? 'Crédit admin' : 'Débit admin'),
      });
      if (error) throw error;
      const result = (typeof data === 'string' ? JSON.parse(data) : data) as any;
      if (result?.success) {
        toast.success(`Ajusté ! Nouveau solde : ${result.new_balance}`);
        setAmount('');
        setReason('');
        await Promise.all([loadTokenInfo(selectedUser.user_id), loadTransactions(selectedUser.user_id)]);
      } else {
        toast.error(result?.error || 'Erreur inconnue');
      }
    } catch (err: any) {
      toast.error('Erreur: ' + err.message);
    } finally {
      setAdjusting(false);
    }
  };

  const grantBonus = async () => {
    if (!selectedUser) return;
    setGrantingBonus(true);
    try {
      if (bonusType === 'publication_bonus') {
        if (!bonusStartDate || !bonusEndDate || !bonusMaxProducts) {
          toast.error('Veuillez remplir tous les champs du bonus');
          setGrantingBonus(false);
          return;
        }
        const { data, error } = await (supabase.rpc as any)('admin_create_publication_bonus', {
          p_seller_id: selectedUser.user_id,
          p_starts_at: new Date(bonusStartDate).toISOString(),
          p_expires_at: new Date(bonusEndDate).toISOString(),
          p_max_products: parseInt(bonusMaxProducts),
          p_reason: bonusReason || 'Bonus admin',
        });
        if (error) throw error;
        const result = (typeof data === 'string' ? JSON.parse(data) : data) as any;
        if (result?.success) {
          toast.success(`✅ Bonus de ${result.max_products} publications accordé !`);
          setBonusStartDate('');
          setBonusEndDate('');
          setBonusMaxProducts('10');
          setBonusReason('');
          await loadUserBonuses(selectedUser.user_id);
        } else {
          toast.error(result?.error || 'Erreur');
        }
      } else if (bonusType === 'wallet_credit') {
        const numValue = parseInt(walletCreditAmount);
        if (isNaN(numValue) || numValue <= 0) {
          toast.error('Montant invalide');
          setGrantingBonus(false);
          return;
        }
        const { data, error } = await supabase.rpc('admin_grant_bonus', {
          p_seller_id: selectedUser.user_id,
          p_bonus_type: 'wallet_credit',
          p_value: numValue,
          p_reason: bonusReason || 'Bonus admin',
        });
        if (error) throw error;
        const result = (typeof data === 'string' ? JSON.parse(data) : data) as any;
        if (result?.success) {
          toast.success(`✅ ${numValue.toLocaleString()} FCFA crédités !`);
          setWalletCreditAmount('');
          setBonusReason('');
          await loadTokenInfo(selectedUser.user_id);
        } else {
          toast.error(result?.error || 'Erreur');
        }
      }
    } catch (err: any) {
      toast.error('Erreur: ' + err.message);
    } finally {
      setGrantingBonus(false);
    }
  };

  const getTxTypeBadge = (type: string) => {
    const map: Record<string, { label: string; className: string }> = {
      purchase: { label: '💳 Achat', className: 'bg-purple-500' },
      trial_bonus: { label: '🎁 Bonus', className: 'bg-blue-500' },
      usage: { label: '📦 Usage', className: 'bg-orange-500' },
      boost: { label: '🚀 Boost', className: 'bg-cyan-500' },
      admin_credit: { label: '➕ Crédit admin', className: 'bg-green-600' },
      admin_debit: { label: '➖ Débit admin', className: 'bg-red-600' },
    };
    const info = map[type] || { label: type, className: '' };
    return <Badge className={info.className}>{info.label}</Badge>;
  };

  const now = new Date();

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card className="p-5">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-primary" />
          Rechercher un utilisateur
        </h3>
        <div className="flex gap-2">
          <Input
            placeholder="Email, nom ou UUID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
            className="flex-1"
          />
          <Button onClick={searchUsers} disabled={searching}>
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>
        {users.length > 0 && (
          <div className="mt-3 border rounded-lg divide-y max-h-60 overflow-auto">
            {users.map((u) => (
              <button
                key={u.user_id}
                onClick={() => selectUser(u)}
                className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex items-center gap-3"
              >
                <User className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium truncate">{u.full_name || 'Sans nom'}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email} · {u.user_id.slice(0, 8)}...</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Selected user */}
      {selectedUser && (
        <Card className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">{selectedUser.full_name || 'Sans nom'}</h3>
              <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              <p className="text-xs font-mono text-muted-foreground mt-0.5">{selectedUser.user_id}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setSelectedUser(null); setTokenInfo(null); setTransactions([]); setUserBonuses([]); }}>
              ✕
            </Button>
          </div>

          {/* Balance display */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 text-center">
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Portefeuille</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-300">{tokenInfo?.wallet_balance_fcfa?.toLocaleString() ?? '—'} <span className="text-xs">FCFA</span></p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-950/30 dark:to-teal-950/30 p-3 rounded-lg border border-green-200 dark:border-green-800 text-center">
              <p className="text-xs font-medium text-green-700 dark:text-green-400">Bonus actifs</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-300">
                {userBonuses.filter(b => b.is_active && new Date(b.expires_at) > now && b.used_products < b.max_products).length}
              </p>
            </div>
          </div>

          {/* User's bonuses */}
          {userBonuses.length > 0 && (
            <div className="mb-5 space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Package className="w-4 h-4" /> Bonus de l'utilisateur
              </h4>
              {userBonuses.map(b => {
                const isExpired = new Date(b.expires_at) <= now || b.products_used >= b.max_products;
                return (
                  <div key={b.id} className={`p-3 rounded-lg border text-sm ${isExpired ? 'bg-muted/30 opacity-60' : 'bg-green-500/5 border-green-500/20'}`}>
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={isExpired ? 'secondary' : 'default'} className={isExpired ? '' : 'bg-green-500'}>
                          {b.bonus_type === 'trial' ? 'Essai' : 'Admin'}
                        </Badge>
                        <span className="text-xs">{b.products_used}/{b.max_products} utilisés</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {isExpired ? 'Expiré' : `Jusqu'au ${format(new Date(b.expires_at), 'dd MMM yyyy', { locale: fr })}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tokenInfo === null && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <AlertCircle className="w-4 h-4" />
              <span>Pas de compte vendeur initialisé.</span>
            </div>
          )}

          {/* Adjust wallet */}
          <div className="space-y-3 border-t pt-4">
            <Label>Montant portefeuille (FCFA)</Label>
            <Input
              type="number"
              min="1"
              placeholder="Ex: 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Label>Raison (optionnel)</Label>
            <Textarea
              placeholder="Ex: Compensation suite à un bug..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
            <div className="flex gap-3">
              <Button onClick={() => adjustTokens(true)} disabled={adjusting || !amount} className="flex-1 bg-green-600 hover:bg-green-700">
                {adjusting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Ajouter
              </Button>
              <Button onClick={() => adjustTokens(false)} disabled={adjusting || !amount} variant="destructive" className="flex-1">
                {adjusting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Minus className="w-4 h-4 mr-2" />}
                Retirer
              </Button>
            </div>
          </div>

          {/* Bonus Section */}
          <Separator className="my-5" />
          <div className="space-y-4">
            <h4 className="text-base font-semibold flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              Accorder un bonus
            </h4>

            <div className="space-y-3">
              <Label>Type de bonus</Label>
              <Select value={bonusType} onValueChange={setBonusType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="publication_bonus">
                    <span className="flex items-center gap-2">
                      <Package className="w-4 h-4" /> Bonus publication (produits + durée)
                    </span>
                  </SelectItem>
                  <SelectItem value="wallet_credit">
                    <span className="flex items-center gap-2">
                      <Wallet className="w-4 h-4" /> Crédit portefeuille (FCFA)
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>

              {bonusType === 'publication_bonus' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Date & heure de début</Label>
                      <Input
                        type="datetime-local"
                        value={bonusStartDate}
                        onChange={(e) => setBonusStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Date & heure d'expiration</Label>
                      <Input
                        type="datetime-local"
                        value={bonusEndDate}
                        onChange={(e) => setBonusEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Nombre max de produits</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="1"
                        placeholder="Ex: 10"
                        value={bonusMaxProducts}
                        onChange={(e) => setBonusMaxProducts(e.target.value)}
                        className="flex-1"
                      />
                      {[5, 10, 20, 50].map(v => (
                        <Button key={v} variant="outline" size="sm" onClick={() => setBonusMaxProducts(String(v))} className="shrink-0">
                          {v}
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {bonusType === 'wallet_credit' && (
                <div>
                  <Label>Montant (FCFA)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="1"
                      placeholder="Ex: 5000"
                      value={walletCreditAmount}
                      onChange={(e) => setWalletCreditAmount(e.target.value)}
                      className="flex-1"
                    />
                    {[5000, 10000, 20000].map(v => (
                      <Button key={v} variant="outline" size="sm" onClick={() => setWalletCreditAmount(String(v))} className="shrink-0">
                        {(v / 1000)}k
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <Label>Raison (optionnel)</Label>
              <Textarea
                placeholder="Ex: Récompense fidélité..."
                value={bonusReason}
                onChange={(e) => setBonusReason(e.target.value)}
                rows={2}
              />

              <Button onClick={grantBonus} disabled={grantingBonus} className="w-full">
                {grantingBonus ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Gift className="w-4 h-4 mr-2" />}
                Accorder le bonus
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Transaction history */}
      {selectedUser && (
        <Card className="p-5">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-500" />
            Historique des transactions
          </h3>
          {loadingHistory ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Aucune transaction</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Note/Réf</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{getTxTypeBadge(tx.transaction_type)}</TableCell>
                      <TableCell className="font-bold">{tx.tokens_amount}</TableCell>
                      <TableCell>
                        <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'}>
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {tx.paystack_reference || tx.payment_method || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(tx.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
