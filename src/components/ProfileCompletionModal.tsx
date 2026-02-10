import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CountrySelect } from '@/components/CountrySelect';
import { CitySelect } from '@/components/CitySelect';
import { MapPin, Loader2, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useStableAuth } from '@/hooks/useStableAuth';
import { toast } from 'sonner';

export const ProfileCompletionModal = () => {
  const { user, loading: authLoading } = useStableAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [isCountryLocked, setIsCountryLocked] = useState(false);

  // Reset city when country changes (only if country is not locked)
  const handleCountryChange = (newCountry: string) => {
    if (isCountryLocked) return; // Don't allow changes if locked
    if (newCountry !== country) {
      setCity(''); // Reset city when country changes
    }
    setCountry(newCountry);
  };

  // Check profile completion on mount and when user changes
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      setIsChecking(false);
      setIsOpen(false);
      return;
    }

    const checkProfile = async () => {
      try {
        // Skip for Google users — they use /auth/complete-profile instead
        const isGoogleUser = user.app_metadata?.provider === 'google' ||
          user.identities?.some(id => id.provider === 'google');
        if (isGoogleUser) {
          setIsChecking(false);
          setIsOpen(false);
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('country, city')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('[ProfileCompletionModal] Error fetching profile:', error);
          setIsChecking(false);
          return;
        }

        const hasCountry = Boolean(profile?.country);
        const hasCity = Boolean(profile?.city);

        console.log('[ProfileCompletionModal] Profile check:', {
          userId: user.id,
          country: profile?.country,
          city: profile?.city,
          hasCountry,
          hasCity
        });

        // Pre-fill and lock country if already set
        if (hasCountry) {
          setCountry(profile.country);
          setIsCountryLocked(true);
        }

        // Pre-fill city if exists
        if (hasCity) {
          setCity(profile.city);
        }

        // Show modal if country OR city is missing
        const needsCompletion = !hasCountry || !hasCity;
        setIsOpen(needsCompletion);
        setIsChecking(false);
      } catch (error) {
        console.error('[ProfileCompletionModal] Error:', error);
        setIsChecking(false);
      }
    };

    checkProfile();
  }, [user, authLoading]);

  const handleSave = async () => {
    if (!country || !city) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          country,
          city,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('[ProfileCompletionModal] Update error:', error);
        toast.error('Erreur lors de la mise à jour du profil');
        return;
      }

      toast.success('Localisation enregistrée avec succès !');
      setIsOpen(false);
    } catch (error) {
      console.error('[ProfileCompletionModal] Error:', error);
      toast.error('Une erreur est survenue');
    } finally {
      setIsSaving(false);
    }
  };

  // Don't render anything while checking or if no user
  if (isChecking || authLoading || !user) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10">
            <MapPin className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">
            Complétez votre localisation
          </DialogTitle>
          <DialogDescription className="text-center">
            {isCountryLocked 
              ? "Confirmez votre ville pour continuer sur Djassa."
              : "Pour une meilleure expérience sur Djassa, nous avons besoin de connaître votre localisation."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="country" className="flex items-center gap-2">
              Pays {isCountryLocked && <Lock className="w-3 h-3 text-muted-foreground" />}
              {!isCountryLocked && <span className="text-destructive">*</span>}
            </Label>
            {isCountryLocked ? (
              <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted/50 text-muted-foreground flex items-center">
                {country}
              </div>
            ) : (
              <CountrySelect
                value={country}
                onValueChange={handleCountryChange}
                placeholder="Sélectionnez votre pays"
              />
            )}
            {isCountryLocked && (
              <p className="text-xs text-muted-foreground">
                Le pays ne peut plus être modifié après validation.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">Ville <span className="text-destructive">*</span></Label>
            <CitySelect
              countryCode={country}
              value={city}
              onValueChange={setCity}
              placeholder="Sélectionnez votre ville"
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={!country || !city || isSaving}
            className="w-full h-11 mt-6"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              'Continuer'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
