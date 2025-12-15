import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, RefreshCw, CheckCircle, AlertCircle, Clock, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ConfirmEmail = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const emailFromParams = searchParams.get('email') || '';
  
  const [email] = useState(emailFromParams);
  const [isResending, setIsResending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  // Cooldown timer
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => setCooldownSeconds(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  // Poll for email confirmation status
  useEffect(() => {
    if (!email) return;

    const checkAuthStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email_confirmed_at) {
        toast({
          title: "✅ Email confirmé !",
          description: "Bienvenue sur Djassa !",
          duration: 3000,
        });
        navigate('/', { replace: true });
      }
    };

    // Check immediately
    checkAuthStatus();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
        toast({
          title: "✅ Email confirmé !",
          description: "Bienvenue sur Djassa !",
          duration: 3000,
        });
        navigate('/', { replace: true });
      }
    });

    // Poll every 3 seconds
    const pollInterval = setInterval(checkAuthStatus, 3000);

    return () => {
      subscription.unsubscribe();
      clearInterval(pollInterval);
    };
  }, [email, navigate, toast]);

  const handleResendConfirmation = useCallback(async () => {
    if (cooldownSeconds > 0 || isResending || !email) return;

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
          toast({
            title: "✅ Email déjà confirmé",
            description: "Vous pouvez vous connecter.",
            duration: 4000,
          });
          navigate('/auth', { replace: true });
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
  }, [email, cooldownSeconds, isResending, toast, navigate]);

  const handleCheckStatus = useCallback(async () => {
    setIsCheckingStatus(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email_confirmed_at) {
        toast({
          title: "✅ Email confirmé !",
          description: "Redirection en cours...",
          duration: 2000,
        });
        navigate('/', { replace: true });
      } else {
        toast({
          title: "⏳ En attente",
          description: "L'email n'est pas encore confirmé.",
          duration: 3000,
        });
      }
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de vérifier le statut.",
        duration: 3000,
      });
    } finally {
      setIsCheckingStatus(false);
    }
  }, [navigate, toast]);

  // Redirect if no email provided
  if (!email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <p className="text-muted-foreground mb-4">Aucun email à confirmer.</p>
          <Button onClick={() => navigate('/auth')} variant="outline">
            Retour à la connexion
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Back button */}
        <button
          onClick={() => navigate('/auth')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Retour</span>
        </button>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header with icon */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Mail className="w-10 h-10 text-primary" />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-foreground mb-2"
            >
              Confirmez votre adresse email
            </motion.h1>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-2 text-primary"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Dernière étape !</span>
              <Sparkles className="w-4 h-4" />
            </motion.div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Message */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center space-y-3"
            >
              <p className="text-muted-foreground leading-relaxed">
                Un email de confirmation vient de vous être envoyé à :
              </p>
              <div className="bg-muted/50 rounded-xl px-4 py-3">
                <p className="font-semibold text-foreground break-all">{email}</p>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Cliquez sur le lien contenu dans cet email pour activer votre compte et commencer à utiliser Djassa.
              </p>
            </motion.div>

            {/* Success message */}
            {resendSuccess && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-3 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 rounded-xl px-4 py-3"
              >
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">
                  Un nouvel email de confirmation vient de vous être envoyé.
                </span>
              </motion.div>
            )}

            {/* Error message */}
            {resendError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-3 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-xl px-4 py-3"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{resendError}</span>
              </motion.div>
            )}

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-3"
            >
              {/* Resend button */}
              <Button
                onClick={handleResendConfirmation}
                disabled={isResending || cooldownSeconds > 0}
                className="w-full h-14 rounded-xl font-semibold text-base shadow-lg transition-all active:scale-[0.98]"
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

              {/* Check status button */}
              <Button
                variant="outline"
                onClick={handleCheckStatus}
                disabled={isCheckingStatus}
                className="w-full h-12 rounded-xl font-medium"
              >
                {isCheckingStatus ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Vérification...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    J'ai confirmé mon email
                  </>
                )}
              </Button>
            </motion.div>

            {/* Tips section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="bg-muted/30 rounded-xl p-4 space-y-3"
            >
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                💡 Si vous ne voyez pas l'email :
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Vérifiez votre dossier <strong>spam</strong> ou <strong>courrier indésirable</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>L'email peut prendre quelques minutes à arriver</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Ajoutez <strong>noreply@djassa.tech</strong> à vos contacts</span>
                </li>
              </ul>
            </motion.div>

            {/* Already have account link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center pt-2"
            >
              <button
                onClick={() => navigate('/auth')}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Déjà un compte confirmé ? <span className="font-semibold">Se connecter</span>
              </button>
            </motion.div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-center text-xs text-muted-foreground mt-6"
        >
          © 2024 Djassa. Tous droits réservés.
        </motion.p>
      </motion.div>
    </div>
  );
};

export default ConfirmEmail;
