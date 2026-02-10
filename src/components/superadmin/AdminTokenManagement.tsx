import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Coins, Search, Plus, Minus, Loader2, User, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Textarea } from '@/components/ui/textarea';

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

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      // Use get_users_with_profiles RPC (superadmin-only)
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
    await Promise.all([loadTokenInfo(user.user_id), loadTransactions(user.user_id)]);
  };

  const loadTokenInfo = async (userId: string) => {
    const { data } = await supabase
      .from('seller_tokens')
      .select('token_balance, free_tokens_count, paid_tokens_count, free_tokens_expires_at')
      .eq('seller_id', userId)
      .maybeSingle();
    setTokenInfo(data as TokenInfo | null);
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
        _seller_id: selectedUser.user_id,
        _amount: finalAmount,
        _reason: reason || (isCredit ? 'Crédit admin' : 'Débit admin'),
      });

      if (error) throw error;

      const result = data as any;
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
            <Button variant="ghost" size="sm" onClick={() => { setSelectedUser(null); setTokenInfo(null); setTransactions([]); }}>
              ✕
            </Button>
          </div>

          {/* Token balance display */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-3 rounded-lg border border-amber-200 text-center">
              <p className="text-xs font-medium text-amber-700">Solde total</p>
              <p className="text-2xl font-bold text-amber-600">{tokenInfo?.token_balance ?? '—'}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200 text-center">
              <p className="text-xs font-medium text-blue-700">Gratuits</p>
              <p className="text-2xl font-bold text-blue-600">{tokenInfo?.free_tokens_count ?? '—'}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 p-3 rounded-lg border border-purple-200 text-center">
              <p className="text-xs font-medium text-purple-700">Payés</p>
              <p className="text-2xl font-bold text-purple-600">{tokenInfo?.paid_tokens_count ?? '—'}</p>
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
