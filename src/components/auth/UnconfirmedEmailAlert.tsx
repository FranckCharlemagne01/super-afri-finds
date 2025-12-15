import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface UnconfirmedEmailAlertProps {
  email: string;
  onSwitchToSignin?: () => void;
  onDismiss?: () => void;
}

const UnconfirmedEmailAlert = ({ email, onSwitchToSignin, onDismiss }: UnconfirmedEmailAlertProps) => {
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');

  // Cooldown timer effect
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => setCooldownSeconds(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  const handleResendConfirmation = useCallback(async () => {
    if (cooldownSeconds > 0 || isResending) return;

    setIsResending(true);
    setResendError('');
    setResendSuccess(false);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        if (error.message.includes('rate limit') || error.message.includes('too many')) {
          setResendError('Trop de tentatives. Réessayez dans quelques minutes.');
          setCooldownSeconds(120);
        } else if (error.message.includes('already confirmed')) {
          setResendSuccess(true);
          toast({
            title: "✅ Email déjà confirmé",
            description: "Vous pouvez vous connecter.",
            duration: 4000,
          });
          if (onSwitchToSignin) {
            setTimeout(onSwitchToSignin, 1500);
          }
        } else {
          setResendError('Une erreur est survenue. Réessayez.');
        }
      } else {
        setResendSuccess(true);
        setCooldownSeconds(60);
        toast({
          title: "📧 Email envoyé !",
          description: "Vérifiez votre boîte de réception.",
          duration: 5000,
        });
      }
    } catch {
      setResendError('Erreur de connexion. Vérifiez votre réseau.');
    } finally {
      setIsResending(false);
    }
  }, [email, cooldownSeconds, isResending, toast, onSwitchToSignin]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full"
    >
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 space-y-4">
        {/* Header with icon */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-xl flex items-center justify-center">
            <Mail className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-amber-900 dark:text-amber-100 text-base">
              Confirmation requise
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1 leading-relaxed">
              Votre compte existe mais n'a pas encore été confirmé. Vérifiez votre boîte email ou renvoyez le lien.
            </p>
          </div>
        </div>

        {/* Email display */}
        <div className="bg-amber-100/50 dark:bg-amber-900/30 rounded-xl px-4 py-3">
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">Email du compte</p>
          <p className="font-medium text-amber-900 dark:text-amber-100 truncate">{email}</p>
        </div>

        {/* Success message */}
        <AnimatePresence>
          {resendSuccess && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 rounded-xl px-4 py-3"
            >
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">
                Un nouvel email de confirmation vient de vous être envoyé.
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error message */}
        <AnimatePresence>
          {resendError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-xl px-4 py-3"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{resendError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Resend button */}
        <Button
          type="button"
          onClick={handleResendConfirmation}
          disabled={isResending || cooldownSeconds > 0}
          className="w-full h-14 rounded-xl font-semibold text-base bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20 hover:shadow-amber-600/30 transition-all active:scale-[0.98]"
        >
          {isResending ? (
            <>
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              Envoi en cours...
            </>
          ) : cooldownSeconds > 0 ? (
            <>
              <Clock className="w-5 h-5 mr-2" />
              Réessayer dans {cooldownSeconds}s
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5 mr-2" />
              Renvoyer l'email de confirmation
            </>
          )}
        </Button>

        {/* Tips section */}
        <div className="pt-2 border-t border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-2 font-medium">
            💡 Conseils :
          </p>
          <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-amber-500">•</span>
              <span>Vérifiez votre dossier spam ou courrier indésirable</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500">•</span>
              <span>L'email peut prendre quelques minutes à arriver</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500">•</span>
              <span>Ajoutez noreply@djassa.tech à vos contacts</span>
            </li>
          </ul>
        </div>

        {/* Secondary action */}
        {onSwitchToSignin && (
          <button
            type="button"
            onClick={onSwitchToSignin}
            className="w-full text-center text-sm text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 transition-colors py-2"
          >
            Réessayer de se connecter
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default UnconfirmedEmailAlert;
