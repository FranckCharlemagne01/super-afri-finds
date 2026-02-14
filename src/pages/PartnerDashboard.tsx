import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStableAuth } from '@/hooks/useStableAuth';
import { useStableRole } from '@/hooks/useStableRole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Link2, Users, DollarSign, TrendingUp, Copy, Check, 
  LogOut, Home, Sun, Moon, UserPlus, Wallet
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AmbassadorData {
  id: string;
  referral_code: string;
  referral_link: string | null;
  commission_rate: number;
  total_earnings: number;
  total_paid: number;
  status: string;
  created_at: string;
}

interface ReferralSignup {
  id: string;
  referral_code: string;
  status: string;
  created_at: string;
}

interface Commission {
  id: string;
  order_amount: number;
  commission_rate: number;
  commission_amount: number;
  status: string;
  paid_at: string | null;
  created_at: string;
}

const PartnerDashboard = () => {
  const { user, signOut } = useStableAuth();
  const { role, loading: roleLoading } = useStableRole();
  const navigate = useNavigate();

  const [ambassador, setAmbassador] = useState<AmbassadorData | null>(null);
  const [referrals, setReferrals] = useState<ReferralSignup[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleDark = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  }, []);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch ambassador record for this user
      const { data: ambData, error: ambError } = await supabase
        .from('ambassadors')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (ambError) throw ambError;
      if (!ambData) {
        setLoading(false);
        return;
      }
      setAmbassador(ambData as AmbassadorData);

      // Fetch referrals and commissions in parallel
      const [refRes, comRes] = await Promise.all([
        supabase
          .from('referral_signups')
          .select('*')
          .eq('ambassador_id', ambData.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('affiliate_commissions')
          .select('*')
          .eq('ambassador_id', ambData.id)
          .order('created_at', { ascending: false }),
      ]);

      setReferrals((refRes.data as ReferralSignup[]) || []);
      setCommissions((comRes.data as Commission[]) || []);
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de charger vos données partenaire.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!roleLoading && user) {
      if (role !== 'partner' && role !== 'superadmin') {
        navigate('/', { replace: true });
        return;
      }
      fetchData();
    }
  }, [user, role, roleLoading, navigate, fetchData]);

  const copyLink = useCallback(() => {
    if (!ambassador?.referral_link) return;
    navigator.clipboard.writeText(ambassador.referral_link);
    setCopiedLink(true);
    toast({ title: 'Lien copié !' });
    setTimeout(() => setCopiedLink(false), 2000);
  }, [ambassador]);

  const stats = useMemo(() => {
    const totalPending = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + Number(c.commission_amount), 0);
    const totalPaid = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + Number(c.commission_amount), 0);
    return { totalReferrals: referrals.length, totalPending, totalPaid };
  }, [referrals, commissions]);

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!ambassador) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-border/50">
          <CardContent className="p-8 text-center space-y-4">
            <UserPlus className="w-12 h-12 text-muted-foreground mx-auto" />
            <h2 className="text-lg font-semibold text-foreground">Aucun profil partenaire</h2>
            <p className="text-sm text-muted-foreground">
              Votre compte partenaire n'a pas encore été activé. Contactez l'administration Djassa.
            </p>
            <Button variant="outline" onClick={() => navigate('/')}>Retour à l'accueil</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-4 sm:px-6 h-14 max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-foreground">Partner Dashboard</h1>
            <Badge className="bg-primary/10 text-primary border-0 text-[10px] font-semibold">Affilié</Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <Home className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={toggleDark}>
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate('/'); }}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Referral Link Card */}
        <Card className="border-primary/20 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
                  <Link2 className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Votre lien de parrainage</p>
                  <p className="text-sm font-mono text-foreground truncate">{ambassador.referral_link || `${window.location.origin}/auth?ref=${ambassador.referral_code}`}</p>
                </div>
              </div>
              <Button size="sm" onClick={copyLink} className="gap-2 shrink-0">
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedLink ? 'Copié' : 'Copier'}
              </Button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">Code: {ambassador.referral_code}</Badge>
              <Badge variant="outline" className="text-[10px]">Commission: {(ambassador.commission_rate * 100).toFixed(0)}%</Badge>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Inscriptions', value: stats.totalReferrals, icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'À recevoir', value: `${fmt(stats.totalPending)} F`, icon: DollarSign, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
            { label: 'Total payé', value: `${fmt(stats.totalPaid)} F`, icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Total gagné', value: `${fmt(ambassador.total_earnings)} F`, icon: Wallet, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/10' },
          ].map(kpi => (
            <Card key={kpi.label} className="border-border/50 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
                    <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-foreground">{kpi.value}</div>
                    <div className="text-[11px] text-muted-foreground">{kpi.label}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="referrals" className="space-y-4">
          <TabsList className="w-full flex gap-1 bg-muted/50 p-1.5 rounded-xl h-auto">
            <TabsTrigger value="referrals" className="flex-1 gap-2 rounded-lg py-2.5">
              <Users className="w-4 h-4" /><span>Parrainages</span>
            </TabsTrigger>
            <TabsTrigger value="commissions" className="flex-1 gap-2 rounded-lg py-2.5">
              <DollarSign className="w-4 h-4" /><span>Commissions</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="referrals">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm">Utilisateurs inscrits via votre lien</CardTitle>
              </CardHeader>
              <CardContent>
                {referrals.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Aucun parrainage pour le moment. Partagez votre lien !</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Code utilisé</TableHead>
                          <TableHead>Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {referrals.map(r => (
                          <TableRow key={r.id}>
                            <TableCell className="text-sm">{new Date(r.created_at).toLocaleDateString('fr-FR')}</TableCell>
                            <TableCell><Badge variant="outline" className="text-[10px]">{r.referral_code}</Badge></TableCell>
                            <TableCell>
                              <Badge variant={r.status === 'registered' ? 'default' : 'secondary'} className="text-[10px]">
                                {r.status === 'registered' ? 'Inscrit' : r.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commissions">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm">Historique des commissions</CardTitle>
              </CardHeader>
              <CardContent>
                {commissions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Aucune commission pour le moment.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Montant commande</TableHead>
                          <TableHead>Taux</TableHead>
                          <TableHead>Commission</TableHead>
                          <TableHead>Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {commissions.map(c => (
                          <TableRow key={c.id}>
                            <TableCell className="text-sm">{new Date(c.created_at).toLocaleDateString('fr-FR')}</TableCell>
                            <TableCell className="text-sm">{fmt(c.order_amount)} F</TableCell>
                            <TableCell className="text-sm">{(c.commission_rate * 100).toFixed(0)}%</TableCell>
                            <TableCell className="text-sm font-medium">{fmt(c.commission_amount)} F</TableCell>
                            <TableCell>
                              <Badge variant={c.status === 'paid' ? 'default' : 'secondary'} className="text-[10px]">
                                {c.status === 'paid' ? '✅ Payé' : '⏳ En attente'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default PartnerDashboard;
