import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, RefreshCw, AlertCircle, Clock, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const VerifyOtp = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const emailFromParams = searchParams.get('email') || '';
  const fullName = searchParams.get('name') || '';

  const [otpCode, setOtpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(60);
  const [error, setError] = useState('');

  // Cooldown timer
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => setCooldownSeconds(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  // Redirect if no email
  useEffect(() => {
    if (!emailFromParams) {
      navigate('/auth', { replace: true });
    }
  }, [emailFromParams, navigate]);

  const handleVerify = useCallback(async () => {
    if (otpCode.length !== 6 || isVerifying) return;

    setIsVerifying(true);
    setError('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('verify-email-otp', {
        body: { email: emailFromParams, otp: otpCode, fullName }
      });

      if (fnError || data?.error) {
        setError(data?.error || fnError?.message || 'Code invalide');
        setOtpCode('');
        return;
      }

      if (data?.success && data?.magicLink) {
        // Extract token from magic link and use it to sign in
        const url = new URL(data.magicLink);
        const token_hash = url.searchParams.get('token') || url.hash?.split('token=')[1];
        
        // Try verifying OTP with the token
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: token_hash || '',
          type: 'magiclink',
        });

        if (verifyError) {
          // Fallback: try direct session with the magic link
          const { error: signInError } = await supabase.auth.signInWithOtp({
            email: emailFromParams,
          });
          
          if (signInError) {
            console.error('Auto sign-in failed:', signInError);
          }
        }

        toast({
          title: data.isNewUser ? '🎉 Compte créé !' : '✅ Connexion réussie !',
          description: 'Bienvenue sur Djassa !',
          duration: 3000,
        });

        // Small delay to let the session establish
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 500);
      }
    } catch (err) {
      console.error('Verify error:', err);
      setError('Erreur de connexion. Réessayez.');
    } finally {
      setIsVerifying(false);
    }
  }, [otpCode, emailFromParams, fullName, isVerifying, navigate, toast]);

  // Auto-verify when 6 digits entered
  useEffect(() => {
    if (otpCode.length === 6) {
      handleVerify();
    }
  }, [otpCode, handleVerify]);

  const handleResend = useCallback(async () => {
    if (cooldownSeconds > 0 || isResending) return;

    setIsResending(true);
    setError('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('send-email-otp', {
        body: { email: emailFromParams }
      });

      if (fnError || data?.error) {
        setError(data?.error || 'Erreur lors du renvoi. Réessayez.');
      } else {
        toast({
          title: '📧 Code renvoyé !',
          description: 'Vérifiez votre boîte de réception.',
          duration: 4000,
        });
        setCooldownSeconds(60);
      }
    } catch {
      setError('Erreur de connexion.');
    } finally {
      setIsResending(false);
    }
  }, [cooldownSeconds, isResending, emailFromParams, toast]);

  if (!emailFromParams) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Back */}
        <button
          onClick={() => navigate('/auth')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Retour</span>
        </button>

        <div className="bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <ShieldCheck className="w-10 h-10 text-primary" />
            </motion.div>

            <h1 className="text-2xl font-bold text-foreground mb-1">
              Vérification de votre compte
            </h1>
            <p className="text-muted-foreground text-sm">
              Entrez le code à 6 chiffres reçu par email
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Email display */}
            <div className="bg-muted/50 rounded-xl px-4 py-3 text-center">
              <p className="text-sm text-muted-foreground">Code envoyé à</p>
              <p className="font-semibold text-foreground break-all">{emailFromParams}</p>
            </div>

            {/* OTP Input */}
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otpCode}
                onChange={setOtpCode}
                disabled={isVerifying}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="w-12 h-14 text-xl font-bold rounded-xl border-2" />
                  <InputOTPSlot index={1} className="w-12 h-14 text-xl font-bold rounded-xl border-2" />
                  <InputOTPSlot index={2} className="w-12 h-14 text-xl font-bold rounded-xl border-2" />
                </InputOTPGroup>
                <div className="w-4" />
                <InputOTPGroup>
                  <InputOTPSlot index={3} className="w-12 h-14 text-xl font-bold rounded-xl border-2" />
                  <InputOTPSlot index={4} className="w-12 h-14 text-xl font-bold rounded-xl border-2" />
                  <InputOTPSlot index={5} className="w-12 h-14 text-xl font-bold rounded-xl border-2" />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-destructive bg-destructive/10 rounded-xl px-4 py-3"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            {/* Verify button */}
            <Button
              onClick={handleVerify}
              disabled={otpCode.length !== 6 || isVerifying}
              className="w-full h-14 rounded-xl font-semibold text-base shadow-lg"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Vérification...
                </>
              ) : (
                'Vérifier'
              )}
            </Button>

            {/* Resend */}
            <Button
              variant="ghost"
              onClick={handleResend}
              disabled={isResending || cooldownSeconds > 0}
              className="w-full h-12 rounded-xl font-medium"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : cooldownSeconds > 0 ? (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Renvoyer dans {cooldownSeconds}s
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Renvoyer le code
                </>
              )}
            </Button>

            {/* Tips */}
            <div className="bg-muted/30 rounded-xl p-4 space-y-2">
              <p className="text-sm font-semibold text-foreground">💡 Conseils :</p>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Vérifiez le dossier <strong>spam</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Le code expire dans <strong>5 minutes</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Expéditeur : <strong>noreply@mail.djassa.tech</strong></span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2024 Djassa. Tous droits réservés.
        </p>
      </motion.div>
    </div>
  );
};

export default VerifyOtp;
