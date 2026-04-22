import { useState, useEffect, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  ShieldCheck, CheckCircle2, XCircle, Clock, Eye, RefreshCw, User,
  ShieldAlert, AlertTriangle, History,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useStableRole } from '@/hooks/useStableRole';

interface KYCRecord {
  id: string;
  user_id: string;
  selfie_url: string;
  id_front_url: string;
  id_back_url: string;
  status: string;
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  updated_at: string;
}

interface UserInfo {
  full_name: string | null;
  email: string | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'En attente', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  approved: { label: 'Approuvé', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
  rejected: { label: 'Rejeté', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
  suspended: { label: 'Suspendu', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', icon: ShieldAlert },
};

const SUSPEND_CONFIRM_KEYWORD = 'SUSPENDRE';

export const KYCManagement = memo(() => {
  const { isSuperAdmin } = useStableRole();
  const [records, setRecords] = useState<(KYCRecord & { user_info?: UserInfo })[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewRecord, setReviewRecord] = useState<(KYCRecord & { user_info?: UserInfo }) | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'suspended'>('pending');

  // Suspension flow state
  const [suspendStep, setSuspendStep] = useState<0 | 1 | 2>(0); // 0=closed, 1=alert, 2=confirm
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendKeyword, setSuspendKeyword] = useState('');

  // History state for the reviewed record
  const [reviewerInfo, setReviewerInfo] = useState<UserInfo | null>(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('kyc_verifications')
        .select('*')
        .order('updated_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;

      const userIds = [...new Set((data || []).map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

      setRecords((data || []).map(r => ({
        ...r,
        user_info: profileMap.get(r.user_id) || undefined,
      })));
    } catch (err) {
      console.error('Error fetching KYC records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [filter]);

  const getSignedUrl = async (path: string): Promise<string> => {
    if (imageUrls[path]) return imageUrls[path];
    const { data } = await supabase.storage
      .from('kyc-documents')
      .createSignedUrl(path, 3600);
    const url = data?.signedUrl || '';
    setImageUrls(prev => ({ ...prev, [path]: url }));
    return url;
  };

  const openReview = async (record: KYCRecord & { user_info?: UserInfo }) => {
    setReviewRecord(record);
    setAdminNote(record.admin_note || '');
    setReviewerInfo(null);

    // Load reviewer info if exists
    if (record.reviewed_by) {
      const { data: reviewer } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', record.reviewed_by)
        .maybeSingle();
      if (reviewer) setReviewerInfo(reviewer);
    }

    await Promise.all([
      getSignedUrl(record.selfie_url),
      getSignedUrl(record.id_front_url),
      getSignedUrl(record.id_back_url),
    ]);
  };

  const handleReview = async (status: 'approved' | 'rejected') => {
    if (!reviewRecord) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase.rpc('review_kyc', {
        _kyc_id: reviewRecord.id,
        _status: status,
        _admin_note: adminNote || null,
      });
      if (error) throw error;
      const result = data as any;
      if (result?.success) {
        toast({ title: 'Succès', description: result.message });
        setReviewRecord(null);
        fetchRecords();
      } else {
        toast({ title: 'Erreur', description: result?.error, variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const resetSuspendFlow = () => {
    setSuspendStep(0);
    setSuspendReason('');
    setSuspendKeyword('');
  };

  const handleSuspend = async () => {
    if (!reviewRecord) return;
    if (suspendReason.trim().length < 10) {
      toast({ title: 'Motif trop court', description: 'Le motif doit faire au moins 10 caractères.', variant: 'destructive' });
      return;
    }
    if (suspendKeyword.trim().toUpperCase() !== SUSPEND_CONFIRM_KEYWORD) {
      toast({ title: 'Confirmation invalide', description: `Vous devez taper exactement "${SUSPEND_CONFIRM_KEYWORD}".`, variant: 'destructive' });
      return;
    }

    setProcessing(true);
    try {
      // Direct UPDATE allowed by existing RLS "Superadmins can manage all KYC" (ALL)
      // Backend logic unchanged — only uses pre-existing superadmin permissions
      const { data: { user } } = await supabase.auth.getUser();
      const note = `[SUSPENSION] ${suspendReason.trim()}\n\n— Précédente note: ${reviewRecord.admin_note || '(aucune)'}`;

      const { error } = await supabase
        .from('kyc_verifications')
        .update({
          status: 'suspended',
          admin_note: note,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', reviewRecord.id);

      if (error) throw error;

      toast({ title: 'KYC suspendu', description: "L'utilisateur a été suspendu et l'action a été enregistrée." });
      resetSuspendFlow();
      setReviewRecord(null);
      fetchRecords();
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const pendingCount = records.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'approved', 'rejected', 'suspended'] as const).map(f => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
            className="rounded-xl gap-2"
          >
            {f === 'all' && 'Tous'}
            {f === 'pending' && (
              <>
                <Clock className="w-3.5 h-3.5" />
                En attente
                {pendingCount > 0 && (
                  <Badge className="bg-amber-500 text-white text-[10px] ml-1">{pendingCount}</Badge>
                )}
              </>
            )}
            {f === 'approved' && <><CheckCircle2 className="w-3.5 h-3.5" /> Approuvés</>}
            {f === 'rejected' && <><XCircle className="w-3.5 h-3.5" /> Rejetés</>}
            {f === 'suspended' && <><ShieldAlert className="w-3.5 h-3.5" /> Suspendus</>}
          </Button>
        ))}
        <Button variant="ghost" size="sm" onClick={fetchRecords} className="rounded-xl gap-2 ml-auto">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Records Table */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Vérifications KYC
          </CardTitle>
          <CardDescription>Gérer les demandes de vérification d'identité</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                      Aucune demande de vérification
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map(record => {
                    const sc = statusConfig[record.status] || statusConfig.pending;
                    return (
                      <TableRow key={record.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div>
                            <div className="font-medium">{record.user_info?.full_name || 'Utilisateur'}</div>
                            <div className="text-xs text-muted-foreground">{record.user_info?.email || record.user_id.slice(0, 8)}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${sc.color} border-0 text-[10px]`}>{sc.label}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {new Date(record.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openReview(record)}
                            className="gap-1.5"
                          >
                            <Eye className="w-4 h-4" />
                            Examiner
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!reviewRecord} onOpenChange={(o) => { if (!o) { setReviewRecord(null); resetSuspendFlow(); } }}>
        <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Vérification de {reviewRecord?.user_info?.full_name || 'Utilisateur'}
            </DialogTitle>
          </DialogHeader>

          {reviewRecord && (
            <div className="space-y-4 py-2">
              <div className="text-sm text-muted-foreground">
                Email: {reviewRecord.user_info?.email || 'N/A'} ·
                Soumis le {new Date(reviewRecord.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </div>

              {/* Status banner */}
              {reviewRecord.status === 'suspended' && (
                <Alert className="border-orange-300 bg-orange-50 dark:bg-orange-950/20">
                  <ShieldAlert className="h-4 w-4 text-orange-600" />
                  <AlertTitle className="text-orange-900 dark:text-orange-300">KYC suspendu</AlertTitle>
                  <AlertDescription className="text-orange-800 dark:text-orange-400 text-xs">
                    Cet utilisateur ne peut plus effectuer de retraits ni d'opérations vérifiées.
                  </AlertDescription>
                </Alert>
              )}

              {/* Documents */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Photo Selfie', url: reviewRecord.selfie_url },
                  { label: 'Pièce ID (Recto)', url: reviewRecord.id_front_url },
                  { label: 'Pièce ID (Verso)', url: reviewRecord.id_back_url },
                ].map(doc => (
                  <div key={doc.label} className="space-y-2">
                    <p className="text-xs font-medium text-foreground">{doc.label}</p>
                    <div className="border rounded-xl overflow-hidden aspect-[3/4] bg-muted">
                      {imageUrls[doc.url] ? (
                        <img
                          src={imageUrls[doc.url]}
                          alt={doc.label}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Historique visuel */}
              <div className="space-y-2 rounded-xl border bg-muted/30 p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <History className="w-4 h-4 text-primary" />
                  Historique des actions
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="text-[10px] shrink-0">Soumission</Badge>
                    <span className="text-muted-foreground">
                      {new Date(reviewRecord.created_at).toLocaleString('fr-FR')}
                    </span>
                  </div>
                  {reviewRecord.reviewed_at && (
                    <div className="flex items-start gap-2">
                      <Badge className={`${statusConfig[reviewRecord.status]?.color} border-0 text-[10px] shrink-0`}>
                        {statusConfig[reviewRecord.status]?.label || reviewRecord.status}
                      </Badge>
                      <div className="flex-1">
                        <div className="text-muted-foreground">
                          {new Date(reviewRecord.reviewed_at).toLocaleString('fr-FR')}
                          {reviewerInfo && (
                            <span> · par <span className="font-medium text-foreground">{reviewerInfo.full_name || reviewerInfo.email || 'Admin'}</span></span>
                          )}
                        </div>
                        {reviewRecord.admin_note && (
                          <div className="mt-1 text-foreground/80 whitespace-pre-line">
                            <span className="font-medium">Motif :</span> {reviewRecord.admin_note}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Note (only editable for pending) */}
              {reviewRecord.status === 'pending' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Note admin (optionnel)</label>
                  <Textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Raison du refus ou commentaire..."
                    className="rounded-xl"
                    rows={2}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setReviewRecord(null)} className="rounded-xl">
              Fermer
            </Button>

            {reviewRecord?.status === 'pending' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => handleReview('rejected')}
                  disabled={processing}
                  className="gap-2 rounded-xl"
                >
                  <XCircle className="w-4 h-4" />
                  Refuser
                </Button>
                <Button
                  onClick={() => handleReview('approved')}
                  disabled={processing}
                  className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Approuver
                </Button>
              </>
            )}

            {/* Suspend KYC button — visible only when approved & user is superadmin */}
            {reviewRecord?.status === 'approved' && isSuperAdmin && (
              <Button
                variant="outline"
                onClick={() => setSuspendStep(1)}
                disabled={processing}
                className="gap-2 rounded-xl border-orange-300 text-orange-700 hover:bg-orange-50 hover:text-orange-800 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950/30"
              >
                <ShieldAlert className="w-4 h-4" />
                Suspendre KYC
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Step 1 — Alert */}
      <Dialog open={suspendStep === 1} onOpenChange={(o) => { if (!o) resetSuspendFlow(); }}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <AlertTriangle className="w-5 h-5" />
              Action critique : Suspension KYC
            </DialogTitle>
            <DialogDescription className="pt-2">
              Vous êtes sur le point de suspendre une vérification KYC déjà <strong>approuvée</strong>.
            </DialogDescription>
          </DialogHeader>

          <Alert className="border-orange-300 bg-orange-50 dark:bg-orange-950/20">
            <ShieldAlert className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-900 dark:text-orange-300">Conséquences immédiates</AlertTitle>
            <AlertDescription className="text-orange-800 dark:text-orange-400 text-xs space-y-1 mt-2">
              <div>• L'utilisateur ne pourra plus effectuer de <strong>retraits</strong></div>
              <div>• Ses opérations financières vérifiées seront bloquées</div>
              <div>• L'action sera <strong>enregistrée</strong> avec votre identité d'admin</div>
              <div>• Cette décision est <strong>réversible</strong> via une nouvelle approbation</div>
            </AlertDescription>
          </Alert>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={resetSuspendFlow} className="rounded-xl">
              Annuler
            </Button>
            <Button
              onClick={() => setSuspendStep(2)}
              className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white gap-2"
            >
              Continuer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Step 2 — Reason + Keyword confirmation */}
      <Dialog open={suspendStep === 2} onOpenChange={(o) => { if (!o) resetSuspendFlow(); }}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <ShieldAlert className="w-5 h-5" />
              Confirmation finale
            </DialogTitle>
            <DialogDescription>
              Saisissez le motif et confirmez en tapant le mot-clé.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Motif de la suspension <span className="text-red-600">*</span>
              </label>
              <Textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Ex: Documents falsifiés détectés après contrôle complémentaire..."
                className="rounded-xl"
                rows={3}
                maxLength={500}
              />
              <div className="text-xs text-muted-foreground flex justify-between">
                <span>Min. 10 caractères — visible dans l'historique</span>
                <span>{suspendReason.length}/500</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Tapez <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-orange-700">{SUSPEND_CONFIRM_KEYWORD}</span> pour confirmer <span className="text-red-600">*</span>
              </label>
              <Input
                value={suspendKeyword}
                onChange={(e) => setSuspendKeyword(e.target.value)}
                placeholder={SUSPEND_CONFIRM_KEYWORD}
                className="rounded-xl font-mono"
                autoComplete="off"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={resetSuspendFlow} className="rounded-xl" disabled={processing}>
              Annuler
            </Button>
            <Button
              onClick={handleSuspend}
              disabled={
                processing ||
                suspendReason.trim().length < 10 ||
                suspendKeyword.trim().toUpperCase() !== SUSPEND_CONFIRM_KEYWORD
              }
              className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white gap-2 disabled:opacity-50"
            >
              {processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
              Confirmer la suspension
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

KYCManagement.displayName = 'KYCManagement';
