import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CountrySelect } from '@/components/CountrySelect';
import { MapPin, Loader2 } from 'lucide-react';
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

        // Check if country or city are missing
        const needsCompletion = !profile?.country || !profile?.city;
        
        console.log('[ProfileCompletionModal] Profile check:', {
          userId: user.id,
          country: profile?.country,
          city: profile?.city,
          needsCompletion
        });

        // Pre-fill existing values if any
        if (profile?.country) setCountry(profile.country);
        if (profile?.city) setCity(profile.city);

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
    if (!country || !city.trim()) {
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
          city: city.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('[ProfileCompletionModal] Update error:', error);
        toast.error('Erreur lors de la mise à jour du profil');
        return;
      }

      toast.success('Profil complété avec succès !');
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
            Complétez votre profil
          </DialogTitle>
          <DialogDescription className="text-center">
            Pour une meilleure expérience sur Djassa, nous avons besoin de connaître votre localisation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="country">Pays *</Label>
            <CountrySelect
              value={country}
              onValueChange={setCountry}
              placeholder="Sélectionnez votre pays"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">Ville *</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ex: Abidjan, Dakar, Lagos..."
              className="h-11"
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={!country || !city.trim() || isSaving}
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
