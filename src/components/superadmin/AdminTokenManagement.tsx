import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Coins, Search, Plus, Minus, Loader2, User, AlertCircle, Gift, Calendar, Wallet } from 'lucide-react';
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
  const [bonusType, setBonusType] = useState<string>('free_publish_days');
  const [bonusValue, setBonusValue] = useState('');
  const [bonusReason, setBonusReason] = useState('');
  const [grantingBonus, setGrantingBonus] = useState(false);
  const [profileInfo, setProfileInfo] = useState<{ trial_end_date: string | null; free_publish_until: string | null } | null>(null);

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
      if (filtered.length === 0) {
        toast.info('Aucun utilisateur trouvé');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Erreur de recherche: ' + err.message);
    } finally {
      setSearching(false);
    }
  };

  const selectUser = async (user: UserResult) => {
    setSelectedUser(user);
    setUsers([]);
    setSearchQuery('');
    await Promise.all([loadTokenInfo(user.user_id), loadTransactions(user.user_id), loadProfileInfo(user.user_id)]);
  };

  const loadTokenInfo = async (userId: string) => {
    const { data } = await supabase
      .from('seller_tokens')
      .select('token_balance, free_tokens_count, paid_tokens_count, free_tokens_expires_at, wallet_balance_fcfa')
      .eq('seller_id', userId)
      .maybeSingle();
    setTokenInfo(data as TokenInfo | null);
  };

  const loadProfileInfo = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('trial_end_date, free_publish_until')
      .eq('user_id', userId)
      .maybeSingle();
    setProfileInfo(data);
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
        toast.success(`Jetons ajustés ! Nouveau solde : ${result.new_balance}`);
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
    if (!selectedUser || !bonusValue) return;
    const numValue = parseInt(bonusValue);
    if (isNaN(numValue) || numValue <= 0) {
      toast.error('Valeur invalide');
      return;
    }

    setGrantingBonus(true);
    try {
      const { data, error } = await supabase.rpc('admin_grant_bonus', {
        p_seller_id: selectedUser.user_id,
        p_bonus_type: bonusType,
        p_value: numValue,
        p_reason: bonusReason || 'Bonus admin',
      });

      if (error) throw error;

      const result = (typeof data === 'string' ? JSON.parse(data) : data) as any;
      if (result?.success) {
        const messages: Record<string, string> = {
          free_publish_days: `✅ ${result.days} jours de publication gratuite accordés jusqu'au ${result.until ? format(new Date(result.until), 'dd MMM yyyy', { locale: fr }) : ''}`,
          wallet_credit: `✅ ${result.amount?.toLocaleString()} FCFA crédités au portefeuille`,
          trial_extension: `✅ Essai étendu de ${result.days} jours jusqu'au ${result.until ? format(new Date(result.until), 'dd MMM yyyy', { locale: fr }) : ''}`,
        };
        toast.success(messages[bonusType] || 'Bonus accordé !');
        setBonusValue('');
        setBonusReason('');
        await Promise.all([
          loadTokenInfo(selectedUser.user_id),
          loadTransactions(selectedUser.user_id),
          loadProfileInfo(selectedUser.user_id),
        ]);
      } else {
        toast.error(result?.error || 'Erreur inconnue');
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

  const bonusPresets: Record<string, { label: string; values: number[] }> = {
    free_publish_days: { label: 'Jours', values: [7, 14, 30] },
    wallet_credit: { label: 'FCFA', values: [5000, 10000, 20000] },
    trial_extension: { label: 'Jours', values: [7, 14, 30] },
  };

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

      {/* Selected user + adjust */}
      {selectedUser && (
        <Card className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">{selectedUser.full_name || 'Sans nom'}</h3>
              <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              <p className="text-xs font-mono text-muted-foreground mt-0.5">{selectedUser.user_id}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setSelectedUser(null); setTokenInfo(null); setTransactions([]); setProfileInfo(null); }}>
              ✕
            </Button>
          </div>

          {/* Token & wallet balance display */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-800 text-center">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Jetons</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-300">{tokenInfo?.token_balance ?? '—'}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 text-center">
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Portefeuille</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-300">{tokenInfo?.wallet_balance_fcfa?.toLocaleString() ?? '—'} <span className="text-xs">FCFA</span></p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800 text-center">
              <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Essai jusqu'au</p>
              <p className="text-sm font-bold text-blue-600 dark:text-blue-300">
                {profileInfo?.trial_end_date 
                  ? format(new Date(profileInfo.trial_end_date), 'dd MMM yyyy', { locale: fr })
                  : '—'}
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950/30 dark:to-fuchsia-950/30 p-3 rounded-lg border border-purple-200 dark:border-purple-800 text-center">
              <p className="text-xs font-medium text-purple-700 dark:text-purple-400">Pub. gratuite</p>
              <p className="text-sm font-bold text-purple-600 dark:text-purple-300">
                {profileInfo?.free_publish_until && new Date(profileInfo.free_publish_until) > new Date()
                  ? format(new Date(profileInfo.free_publish_until), 'dd MMM yyyy', { locale: fr })
                  : '—'}
              </p>
            </div>
          </div>

          {tokenInfo === null && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <AlertCircle className="w-4 h-4" />
              <span>Cet utilisateur n'a pas encore de solde de jetons (pas vendeur ou pas initialisé).</span>
            </div>
          )}

          {/* Adjust form */}
          <div className="space-y-3 border-t pt-4">
            <Label>Montant de jetons</Label>
            <Input
              type="number"
              min="1"
              placeholder="Ex: 50"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Label>Raison / note (optionnel)</Label>
            <Textarea
              placeholder="Ex: Compensation suite à un bug..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
            <div className="flex gap-3">
              <Button
                onClick={() => adjustTokens(true)}
                disabled={adjusting || !amount}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {adjusting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Ajouter
              </Button>
              <Button
                onClick={() => adjustTokens(false)}
                disabled={adjusting || !amount}
                variant="destructive"
                className="flex-1"
              >
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
                  <SelectItem value="free_publish_days">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Publication gratuite (jours)
                    </span>
                  </SelectItem>
                  <SelectItem value="wallet_credit">
                    <span className="flex items-center gap-2">
                      <Wallet className="w-4 h-4" /> Crédit portefeuille (FCFA)
                    </span>
                  </SelectItem>
                  <SelectItem value="trial_extension">
                    <span className="flex items-center gap-2">
                      <Gift className="w-4 h-4" /> Extension essai gratuit (jours)
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Label>Valeur ({bonusPresets[bonusType]?.label})</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  placeholder={`Ex: ${bonusPresets[bonusType]?.values[0]}`}
                  value={bonusValue}
                  onChange={(e) => setBonusValue(e.target.value)}
                  className="flex-1"
                />
                {bonusPresets[bonusType]?.values.map(v => (
                  <Button
                    key={v}
                    variant="outline"
                    size="sm"
                    onClick={() => setBonusValue(String(v))}
                    className="shrink-0"
                  >
                    {bonusType === 'wallet_credit' ? `${(v / 1000)}k` : `${v}j`}
                  </Button>
                ))}
              </div>

              <Label>Raison (optionnel)</Label>
              <Textarea
                placeholder="Ex: Récompense fidélité..."
                value={bonusReason}
                onChange={(e) => setBonusReason(e.target.value)}
                rows={2}
              />

              <Button
                onClick={grantBonus}
                disabled={grantingBonus || !bonusValue}
                className="w-full"
              >
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
                    <TableHead>Jetons</TableHead>
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
