import { useState, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useKYC } from '@/hooks/useKYC';
import { KYCVerificationDialog } from './KYCVerificationDialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Send,
  History,
  AlertCircle,
  Banknote,
  Smartphone,
} from 'lucide-react';
import { useWallet, type WalletTransaction, type WithdrawalRequest } from '@/hooks/useWallet';
import { toast } from 'sonner';

const formatFCFA = (amount: number) => {
  return new Intl.NumberFormat('fr-FR').format(Math.abs(amount)) + ' FCFA';
};

const methodLabels: Record<string, string> = {
  orange_money: 'Orange Money',
  mtn_momo: 'MTN MoMo',
  wave: 'Wave',
  bank_transfer: 'Virement bancaire',
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'En attente', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  approved: { label: 'Approuvé', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: CheckCircle2 },
  processing: { label: 'En cours', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', icon: RefreshCw },
  completed: { label: 'Effectué', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
  rejected: { label: 'Rejeté', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
  cancelled: { label: 'Annulé', color: 'bg-muted text-muted-foreground', icon: XCircle },
  failed: { label: 'Échoué', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
};

const txTypeLabels: Record<string, { label: string; icon: React.ElementType; positive: boolean }> = {
  sale_credit: { label: 'Vente reçue', icon: ArrowDownCircle, positive: true },
  escrow_release: { label: 'Paiement libéré', icon: CheckCircle2, positive: true },
  refund: { label: 'Remboursement', icon: ArrowDownCircle, positive: true },
  withdrawal: { label: 'Retrait', icon: ArrowUpCircle, positive: false },
  commission_deduction: { label: 'Commission', icon: Banknote, positive: false },
};

export const WalletTab = memo(() => {
  const { balance, transactions, withdrawals, loading, refreshAll, requestWithdrawal } = useWallet();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('');
  const [withdrawDest, setWithdrawDest] = useState('');
  const [withdrawName, setWithdrawName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeView, setActiveView] = useState<'overview' | 'history' | 'withdrawals'>('overview');

  const availableBalance = balance.balance - balance.pending_withdrawals;

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount < 500) {
      toast.error('Montant minimum: 500 FCFA');
      return;
    }
    if (!withdrawMethod) {
      toast.error('Choisissez un mode de retrait');
      return;
    }
    if (!withdrawDest || withdrawDest.length < 8) {
      toast.error('Numéro de destination invalide');
      return;
    }

    setSubmitting(true);
    const result = await requestWithdrawal(amount, withdrawMethod, withdrawDest, withdrawName);
    setSubmitting(false);

    if (result?.success) {
      toast.success(result.message || 'Demande de retrait soumise !');
      setWithdrawOpen(false);
      setWithdrawAmount('');
      setWithdrawMethod('');
      setWithdrawDest('');
      setWithdrawName('');
    } else {
      toast.error(result?.error || 'Erreur lors de la demande');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-500">
      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium opacity-90">Solde disponible</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold">{formatFCFA(availableBalance)}</p>
            {balance.pending_withdrawals > 0 && (
              <p className="text-xs opacity-75 mt-1">
                dont {formatFCFA(balance.pending_withdrawals)} en retrait
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">En attente</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{formatFCFA(balance.pending_escrow)}</p>
            <p className="text-xs text-muted-foreground mt-1">Paiements en escrow</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <ArrowUpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Retraits en cours</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{formatFCFA(balance.pending_withdrawals)}</p>
            <p className="text-xs text-muted-foreground mt-1">En traitement</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => setWithdrawOpen(true)}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg"
          disabled={availableBalance < 500}
        >
          <Send className="w-4 h-4" />
          Retirer de l'argent
        </Button>
        <Button
          variant={activeView === 'history' ? 'default' : 'outline'}
          onClick={() => setActiveView(activeView === 'history' ? 'overview' : 'history')}
          className="gap-2 rounded-xl"
        >
          <History className="w-4 h-4" />
          Historique
        </Button>
        <Button
          variant={activeView === 'withdrawals' ? 'default' : 'outline'}
          onClick={() => setActiveView(activeView === 'withdrawals' ? 'overview' : 'withdrawals')}
          className="gap-2 rounded-xl"
        >
          <Banknote className="w-4 h-4" />
          Mes retraits
        </Button>
        <Button variant="ghost" onClick={refreshAll} className="gap-2 rounded-xl" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Overview: Recent Transactions */}
      {activeView === 'overview' && (
        <Card className="border-0 shadow-lg rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Dernières transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Aucune transaction</p>
                <p className="text-sm">Vos transactions apparaîtront ici</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.slice(0, 10).map((tx) => (
                  <TransactionRow key={tx.id} tx={tx} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Full History */}
      {activeView === 'history' && (
        <Card className="border-0 shadow-lg rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Historique complet
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Aucune transaction à afficher</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <TransactionRow key={tx.id} tx={tx} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Withdrawals List */}
      {activeView === 'withdrawals' && (
        <Card className="border-0 shadow-lg rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Banknote className="w-5 h-5 text-primary" />
              Mes demandes de retrait
            </CardTitle>
          </CardHeader>
          <CardContent>
            {withdrawals.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Banknote className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Aucune demande de retrait</p>
              </div>
            ) : (
              <div className="space-y-3">
                {withdrawals.map((wr) => (
                  <WithdrawalRow key={wr.id} withdrawal={wr} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Withdrawal Dialog */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-600" />
              Retirer de l'argent
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3 bg-muted/50 rounded-xl text-sm">
              <span className="text-muted-foreground">Solde disponible: </span>
              <span className="font-bold text-foreground">{formatFCFA(availableBalance)}</span>
            </div>

            <div className="space-y-2">
              <Label>Montant (FCFA)</Label>
              <Input
                type="number"
                placeholder="Ex: 5000"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                min={500}
                max={availableBalance}
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">Minimum: 500 FCFA</p>
            </div>

            <div className="space-y-2">
              <Label>Mode de retrait</Label>
              <Select value={withdrawMethod} onValueChange={setWithdrawMethod}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="orange_money">
                    <span className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4" /> Orange Money
                    </span>
                  </SelectItem>
                  <SelectItem value="mtn_momo">
                    <span className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4" /> MTN MoMo
                    </span>
                  </SelectItem>
                  <SelectItem value="wave">
                    <span className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4" /> Wave
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Numéro de destination</Label>
              <Input
                type="tel"
                placeholder="Ex: 0700000000"
                value={withdrawDest}
                onChange={(e) => setWithdrawDest(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Nom du bénéficiaire (optionnel)</Label>
              <Input
                type="text"
                placeholder="Ex: Jean Koné"
                value={withdrawName}
                onChange={(e) => setWithdrawName(e.target.value)}
                className="rounded-xl"
              />
            </div>

            {parseFloat(withdrawAmount) > availableBalance && (
              <div className="flex items-center gap-2 text-sm text-destructive p-2 bg-destructive/10 rounded-xl">
                <AlertCircle className="w-4 h-4" />
                Solde insuffisant
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawOpen(false)} className="rounded-xl">
              Annuler
            </Button>
            <Button
              onClick={handleWithdraw}
              disabled={submitting || !withdrawAmount || !withdrawMethod || !withdrawDest}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
            >
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Confirmer le retrait
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

WalletTab.displayName = 'WalletTab';

// Sub-components
const TransactionRow = ({ tx }: { tx: WalletTransaction }) => {
  const config = txTypeLabels[tx.transaction_type] || { label: tx.transaction_type, icon: History, positive: tx.amount > 0 };
  const Icon = config.icon;
  const sConfig = statusConfig[tx.status] || statusConfig.pending;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
      <div className={`p-2 rounded-xl ${config.positive ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
        <Icon className={`w-4 h-4 ${config.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{tx.description || config.label}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(tx.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-bold ${config.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
          {config.positive ? '+' : ''}{formatFCFA(tx.amount)}
        </p>
        <Badge className={`text-[10px] ${sConfig.color} border-0`}>{sConfig.label}</Badge>
      </div>
    </div>
  );
};

const WithdrawalRow = ({ withdrawal }: { withdrawal: WithdrawalRequest }) => {
  const sConfig = statusConfig[withdrawal.status] || statusConfig.pending;
  const StatusIcon = sConfig.icon;

  return (
    <div className="p-4 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <StatusIcon className="w-4 h-4" />
          <Badge className={`${sConfig.color} border-0`}>{sConfig.label}</Badge>
        </div>
        <p className="text-lg font-bold text-foreground">{formatFCFA(withdrawal.amount)}</p>
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>{methodLabels[withdrawal.withdrawal_method] || withdrawal.withdrawal_method}</span>
        <span>→ {withdrawal.destination_number}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {new Date(withdrawal.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </p>
      {withdrawal.admin_note && (
        <p className="text-xs text-muted-foreground mt-2 italic">Note: {withdrawal.admin_note}</p>
      )}
    </div>
  );
};
