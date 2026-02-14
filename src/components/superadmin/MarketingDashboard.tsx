import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { 
  Megaphone, Users, Link2, DollarSign, Plus, Copy, Check, 
  Trash2, Eye, EyeOff, TrendingUp, UserPlus, AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface MarketingPost {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  is_active: boolean;
  target_audience: string;
  created_at: string;
}

interface Ambassador {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  referral_code: string;
  referral_link: string | null;
  commission_rate: number;
  status: string;
  total_earnings: number;
  total_paid: number;
  created_at: string;
}

interface ReferralSignup {
  id: string;
  ambassador_id: string;
  referred_user_id: string;
  referral_code: string;
  status: string;
  created_at: string;
}

interface AffiliateCommission {
  id: string;
  ambassador_id: string;
  order_amount: number;
  commission_rate: number;
  commission_amount: number;
  status: string;
  paid_at: string | null;
  created_at: string;
}

export const MarketingDashboard = () => {
  const [posts, setPosts] = useState<MarketingPost[]>([]);
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [referrals, setReferrals] = useState<ReferralSignup[]>([]);
  const [commissions, setCommissions] = useState<AffiliateCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [showNewAmbassador, setShowNewAmbassador] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form states
  const [postForm, setPostForm] = useState({ title: '', content: '', image_url: '', target_audience: 'all' });
  const [ambassadorForm, setAmbassadorForm] = useState({ full_name: '', email: '', phone: '', commission_rate: '5' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [postsRes, ambassadorsRes, referralsRes, commissionsRes] = await Promise.all([
        supabase.from('marketing_posts').select('*').order('created_at', { ascending: false }),
        supabase.from('ambassadors').select('*').order('created_at', { ascending: false }),
        supabase.from('referral_signups').select('*').order('created_at', { ascending: false }),
        supabase.from('affiliate_commissions').select('*').order('created_at', { ascending: false }),
      ]);
      setPosts((postsRes.data as any[]) || []);
      setAmbassadors((ambassadorsRes.data as any[]) || []);
      setReferrals((referralsRes.data as any[]) || []);
      setCommissions((commissionsRes.data as any[]) || []);
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de charger les données marketing', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const generateReferralCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'DJ-';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  const handleCreatePost = async () => {
    if (!postForm.title || !postForm.content) {
      toast({ title: 'Erreur', description: 'Titre et contenu requis', variant: 'destructive' });
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('marketing_posts').insert({
      title: postForm.title, content: postForm.content,
      image_url: postForm.image_url || null,
      target_audience: postForm.target_audience, created_by: user.id,
    } as any);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: '✅ Post créé', description: 'Le post marketing a été publié.' });
    setPostForm({ title: '', content: '', image_url: '', target_audience: 'all' });
    setShowNewPost(false);
    fetchData();
  };

  const [creatingPartner, setCreatingPartner] = useState(false);

  const handleCreateAmbassador = async () => {
    if (!ambassadorForm.full_name || !ambassadorForm.email) {
      toast({ title: 'Erreur', description: 'Nom et email requis', variant: 'destructive' });
      return;
    }
    setCreatingPartner(true);
    try {
      const code = generateReferralCode();
      const link = `${window.location.origin}/auth?ref=${code}`;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `https://zqskpspbyzptzjcoitwt.supabase.co/functions/v1/create-partner-account`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            full_name: ambassadorForm.full_name,
            email: ambassadorForm.email,
            phone: ambassadorForm.phone || null,
            commission_rate: parseFloat(ambassadorForm.commission_rate) / 100,
            referral_code: code,
            referral_link: link,
          }),
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        toast({ title: 'Erreur', description: result.error || 'Échec de création', variant: 'destructive' });
        return;
      }

      toast({ 
        title: '✅ Partenaire créé', 
        description: result.temp_password 
          ? `Code: ${code} — Mot de passe temporaire: ${result.temp_password}` 
          : `Code: ${code} — Compte existant lié.`,
      });
      setAmbassadorForm({ full_name: '', email: '', phone: '', commission_rate: '5' });
      setShowNewAmbassador(false);
      fetchData();
    } catch (err) {
      toast({ title: 'Erreur', description: 'Erreur réseau', variant: 'destructive' });
    } finally {
      setCreatingPartner(false);
    }
  };

  const handleTogglePostStatus = async (id: string, current: boolean) => {
    await supabase.from('marketing_posts').update({ is_active: !current } as any).eq('id', id);
    fetchData();
  };

  const handleDeletePost = async (id: string) => {
    await supabase.from('marketing_posts').delete().eq('id', id);
    fetchData();
  };

  const handleMarkCommissionPaid = async (id: string) => {
    await supabase.from('affiliate_commissions').update({ status: 'paid', paid_at: new Date().toISOString() } as any).eq('id', id);
    fetchData();
    toast({ title: '✅ Commission marquée payée' });
  };

  const copyToClipboard = (text: string, code: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Stats
  const totalAmbassadors = ambassadors.length;
  const totalReferrals = referrals.length;
  const totalCommissionsPending = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + Number(c.commission_amount), 0);
  const totalCommissionsPaid = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + Number(c.commission_amount), 0);
  const activePosts = posts.filter(p => p.is_active).length;

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Posts actifs', value: activePosts, icon: Megaphone, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Ambassadeurs', value: totalAmbassadors, icon: Users, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/10' },
          { label: 'Parrainages', value: totalReferrals, icon: UserPlus, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'À payer', value: `${fmt(totalCommissionsPending)} F`, icon: DollarSign, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Payé', value: `${fmt(totalCommissionsPaid)} F`, icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
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
      <Tabs defaultValue="posts" className="space-y-4">
        <TabsList className="w-full flex flex-wrap gap-1 bg-muted/50 p-1.5 rounded-xl h-auto">
          <TabsTrigger value="posts" className="flex-1 min-w-[100px] gap-2 rounded-lg py-2.5">
            <Megaphone className="w-4 h-4" /><span className="hidden sm:inline">Posts</span>
          </TabsTrigger>
          <TabsTrigger value="ambassadors" className="flex-1 min-w-[100px] gap-2 rounded-lg py-2.5">
            <Users className="w-4 h-4" /><span className="hidden sm:inline">Ambassadeurs</span>
          </TabsTrigger>
          <TabsTrigger value="referrals" className="flex-1 min-w-[100px] gap-2 rounded-lg py-2.5">
            <Link2 className="w-4 h-4" /><span className="hidden sm:inline">Parrainages</span>
          </TabsTrigger>
          <TabsTrigger value="commissions" className="flex-1 min-w-[100px] gap-2 rounded-lg py-2.5">
            <DollarSign className="w-4 h-4" /><span className="hidden sm:inline">Commissions</span>
          </TabsTrigger>
        </TabsList>

        {/* Posts Tab */}
        <TabsContent value="posts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Posts Marketing</h3>
            <Button size="sm" onClick={() => setShowNewPost(!showNewPost)} className="gap-2">
              <Plus className="w-4 h-4" /><span className="hidden sm:inline">Nouveau post</span>
            </Button>
          </div>

          {showNewPost && (
            <Card className="border-primary/20 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="grid gap-3">
                  <div>
                    <Label className="text-xs">Titre</Label>
                    <Input placeholder="Titre du post..." value={postForm.title} onChange={e => setPostForm({ ...postForm, title: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Contenu</Label>
                    <Textarea placeholder="Contenu du post..." value={postForm.content} onChange={e => setPostForm({ ...postForm, content: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">URL image (optionnel)</Label>
                    <Input placeholder="https://..." value={postForm.image_url} onChange={e => setPostForm({ ...postForm, image_url: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleCreatePost}>Publier</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowNewPost(false)}>Annuler</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {loading ? [...Array(3)].map((_, i) => (
              <Card key={i} className="border-border/50"><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
            )) : posts.length === 0 ? (
              <Card className="border-border/50"><CardContent className="p-8 text-center text-muted-foreground text-sm">Aucun post marketing</CardContent></Card>
            ) : posts.map(post => (
              <Card key={post.id} className="border-border/50 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm text-foreground truncate">{post.title}</h4>
                        <Badge variant={post.is_active ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                          {post.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{post.content}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{new Date(post.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => handleTogglePostStatus(post.id, post.is_active)}>
                        {post.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer ce post ?</AlertDialogTitle>
                            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeletePost(post.id)}>Supprimer</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Ambassadors Tab */}
        <TabsContent value="ambassadors" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Ambassadeurs & Commerciaux</h3>
            <Button size="sm" onClick={() => setShowNewAmbassador(!showNewAmbassador)} className="gap-2">
              <Plus className="w-4 h-4" /><span className="hidden sm:inline">Inviter</span>
            </Button>
          </div>

          {showNewAmbassador && (
            <Card className="border-primary/20 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs">Nom complet *</Label>
                    <Input placeholder="Nom..." value={ambassadorForm.full_name} onChange={e => setAmbassadorForm({ ...ambassadorForm, full_name: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Email *</Label>
                    <Input type="email" placeholder="email@..." value={ambassadorForm.email} onChange={e => setAmbassadorForm({ ...ambassadorForm, email: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Téléphone</Label>
                    <Input placeholder="+225..." value={ambassadorForm.phone} onChange={e => setAmbassadorForm({ ...ambassadorForm, phone: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Commission (%)</Label>
                    <Input type="number" min="1" max="50" value={ambassadorForm.commission_rate} onChange={e => setAmbassadorForm({ ...ambassadorForm, commission_rate: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleCreateAmbassador} disabled={creatingPartner}>
                    {creatingPartner ? 'Création du compte...' : 'Créer compte partenaire'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowNewAmbassador(false)}>Annuler</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead className="hidden md:table-cell">Contact</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="hidden sm:table-cell">Commission</TableHead>
                  <TableHead className="hidden lg:table-cell">Gains</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? [...Array(3)].map((_, i) => (
                  <TableRow key={i}>{[...Array(6)].map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>)}</TableRow>
                )) : ambassadors.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">Aucun ambassadeur</TableCell></TableRow>
                ) : ambassadors.map(amb => (
                  <TableRow key={amb.id}>
                    <TableCell className="font-medium text-sm">
                      <div>{amb.full_name}</div>
                      <div className="text-[10px] text-muted-foreground md:hidden">{amb.email}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      <div>{amb.email}</div>
                      <div>{amb.phone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{amb.referral_code}</code>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard(amb.referral_link || amb.referral_code, amb.referral_code)}>
                          {copiedCode === amb.referral_code ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{(Number(amb.commission_rate) * 100).toFixed(0)}%</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{fmt(Number(amb.total_earnings))} F</TableCell>
                    <TableCell>
                      <Badge variant={amb.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                        {amb.status === 'active' ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Referrals Tab */}
        <TabsContent value="referrals" className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-muted-foreground">L'auto-parrainage est automatiquement bloqué.</span>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code Referral</TableHead>
                  <TableHead className="hidden md:table-cell">Utilisateur parrainé</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? [...Array(3)].map((_, i) => (
                  <TableRow key={i}>{[...Array(4)].map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>)}</TableRow>
                )) : referrals.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm">Aucun parrainage enregistré</TableCell></TableRow>
                ) : referrals.map(ref => (
                  <TableRow key={ref.id}>
                    <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{ref.referral_code}</code></TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground font-mono">{ref.referred_user_id.substring(0, 8)}...</TableCell>
                    <TableCell>
                      <Badge variant={ref.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">{ref.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(ref.created_at).toLocaleDateString('fr-FR')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Commissions Tab */}
        <TabsContent value="commissions" className="space-y-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardContent className="p-4 text-center">
                <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{fmt(totalCommissionsPending)} FCFA</div>
                <div className="text-[11px] text-muted-foreground">À payer</div>
              </CardContent>
            </Card>
            <Card className="border-emerald-500/20 bg-emerald-500/5">
              <CardContent className="p-4 text-center">
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{fmt(totalCommissionsPaid)} FCFA</div>
                <div className="text-[11px] text-muted-foreground">Déjà payé</div>
              </CardContent>
            </Card>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Montant commande</TableHead>
                  <TableHead>Taux</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? [...Array(3)].map((_, i) => (
                  <TableRow key={i}>{[...Array(6)].map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>)}</TableRow>
                )) : commissions.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">Aucune commission</TableCell></TableRow>
                ) : commissions.map(com => (
                  <TableRow key={com.id}>
                    <TableCell className="text-sm">{fmt(Number(com.order_amount))} F</TableCell>
                    <TableCell className="text-sm">{(Number(com.commission_rate) * 100).toFixed(0)}%</TableCell>
                    <TableCell className="text-sm font-semibold">{fmt(Number(com.commission_amount))} F</TableCell>
                    <TableCell>
                      <Badge variant={com.status === 'paid' ? 'default' : 'secondary'} className="text-[10px]">
                        {com.status === 'paid' ? '✅ Payé' : '⏳ En attente'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{new Date(com.created_at).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>
                      {com.status === 'pending' && (
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleMarkCommissionPaid(com.id)}>
                          Payer
                        </Button>
                      )}
                      {com.status === 'paid' && com.paid_at && (
                        <span className="text-[10px] text-muted-foreground">{new Date(com.paid_at).toLocaleDateString('fr-FR')}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
