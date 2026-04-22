import { useState, useRef, memo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Camera, CreditCard, Upload, CheckCircle2, Clock, XCircle,
  RefreshCw, ShieldCheck, AlertCircle, User,
} from 'lucide-react';
import { useKYC, type KYCStatus } from '@/hooks/useKYC';
import { toast } from 'sonner';

interface KYCVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified?: () => void;
}

const statusDisplay: Record<KYCStatus, { label: string; color: string; icon: React.ElementType; message: string }> = {
  none: {
    label: 'Non vérifié',
    color: 'bg-muted text-muted-foreground',
    icon: AlertCircle,
    message: 'Vous devez vérifier votre identité pour effectuer des retraits.',
  },
  pending: {
    label: 'En attente',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    icon: Clock,
    message: 'Vos documents sont en cours de vérification. Vous serez notifié une fois la vérification terminée.',
  },
  approved: {
    label: 'Vérifié',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    icon: CheckCircle2,
    message: 'Votre identité est vérifiée. Vous pouvez effectuer des retraits.',
  },
  rejected: {
    label: 'Rejeté',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    icon: XCircle,
    message: 'Votre vérification a été rejetée. Veuillez soumettre de nouveaux documents.',
  },
};

const DEFAULT_STATUS_DISPLAY = {
  label: 'Statut inconnu',
  color: 'bg-muted text-muted-foreground',
  icon: AlertCircle,
  message: 'Le statut KYC reçu est inattendu. Vérifiez les données avant de continuer.',
};

export const KYCVerificationDialog = memo(({ open, onOpenChange, onVerified }: KYCVerificationDialogProps) => {
  const { status, adminNote, submitKYC, loading: kycLoading } = useKYC();
  const [selfie, setSelfie] = useState<File | null>(null);
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selfieRef = useRef<HTMLInputElement>(null);
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);

  const canSubmit = status === 'none' || status === 'rejected';
  const allFilesSelected = selfie && idFront && idBack;
  const display = statusDisplay[status] ?? DEFAULT_STATUS_DISPLAY;
  const StatusIcon = display?.icon || AlertCircle;

  if (!statusDisplay[status]) {
    console.log('DEBUG ICON:', { source: 'KYCVerificationDialog', status, display });
  }

  const handleSubmit = async () => {
    if (!selfie || !idFront || !idBack) return;
    setSubmitting(true);
    const result = await submitKYC(selfie, idFront, idBack);
    setSubmitting(false);

    if (result.success) {
      toast.success('Documents soumis avec succès ! Vérification en cours.');
      setSelfie(null);
      setIdFront(null);
      setIdBack(null);
    } else {
      toast.error(result.error || 'Erreur lors de la soumission');
    }
  };

  const FileUploadBox = ({
    label,
    icon: Icon,
    file,
    onFile,
    inputRef,
  }: {
    label: string;
    icon: React.ElementType;
    file: File | null;
    onFile: (f: File | null) => void;
    inputRef: React.RefObject<HTMLInputElement | null>;
  }) => (
    <div
      onClick={() => inputRef.current?.click()}
      className="border-2 border-dashed border-border/50 rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] || null)}
      />
      {file ? (
        <div className="space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
          <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
          <p className="text-[10px] text-muted-foreground">Cliquer pour changer</p>
        </div>
      ) : (
        <div className="space-y-2">
          <Icon className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-xs font-medium text-foreground">{label}</p>
          <p className="text-[10px] text-muted-foreground">Cliquer pour ajouter</p>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Vérification d'identité (KYC)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Status Banner */}
          <div className={`flex items-start gap-3 p-3 rounded-xl ${display.color.includes('bg-') ? display.color.split(' ')[0] + '/20' : 'bg-muted/50'}`}>
            <StatusIcon className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className={`${display.color} border-0 text-xs`}>{display.label}</Badge>
              </div>
              <p className="text-sm text-foreground/80">{display.message}</p>
              {adminNote && status === 'rejected' && (
                <p className="text-xs text-destructive mt-2 italic">
                  Raison : {adminNote}
                </p>
              )}
            </div>
          </div>

          {/* Upload Form - only show if can submit */}
          {canSubmit && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Documents requis</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FileUploadBox
                  label="Photo Selfie"
                  icon={Camera}
                  file={selfie}
                  onFile={setSelfie}
                  inputRef={selfieRef}
                />
                <FileUploadBox
                  label="Pièce d'identité (Recto)"
                  icon={CreditCard}
                  file={idFront}
                  onFile={setIdFront}
                  inputRef={frontRef}
                />
                <FileUploadBox
                  label="Pièce d'identité (Verso)"
                  icon={CreditCard}
                  file={idBack}
                  onFile={setIdBack}
                  inputRef={backRef}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Formats acceptés : JPG, PNG. Taille max : 5 Mo par fichier.
              </p>
            </div>
          )}

          {status === 'approved' && (
            <div className="text-center py-4">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-3" />
              <p className="text-lg font-semibold text-foreground">Identité vérifiée ✓</p>
              <p className="text-sm text-muted-foreground mt-1">
                Vous pouvez effectuer des retraits en toute sécurité.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            Fermer
          </Button>
          {canSubmit && (
            <Button
              onClick={handleSubmit}
              disabled={submitting || !allFilesSelected}
              className="gap-2 rounded-xl"
            >
              {submitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Soumettre les documents
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

KYCVerificationDialog.displayName = 'KYCVerificationDialog';
