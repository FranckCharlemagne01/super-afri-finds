import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CitySelect } from '@/components/CitySelect';
import { CountrySelect } from '@/components/CountrySelect';
import { getCountryByCode } from '@/data/countries';
import { MapPin, Loader2, Lock } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useStableAuth } from '@/hooks/useStableAuth';
import { useUserLocation } from '@/hooks/useUserLocation';

export const LocationSelector = () => {
  const { user } = useStableAuth();
  const { location, loading: locationLoading } = useUserLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newCity, setNewCity] = useState('');
  const [newCountry, setNewCountry] = useState('');
  
  // Determine if country is locked (already set in profile)
  const isCountryLocked = Boolean(location.country);

  // Sync local state with location data when sheet opens
  useEffect(() => {
    if (open) {
      setNewCity(location.city || '');
      setNewCountry(location.country || '');
    }
  }, [open, location.city, location.country]);

  const handleCountryChange = (value: string) => {
    if (isCountryLocked) return; // Don't allow change if locked
    if (value !== newCountry) {
      setNewCity(''); // Reset city when country changes
    }
    setNewCountry(value);
  };

  const handleUpdateLocation = async () => {
    if (!user) return;
    
    // For locked country, only city is required
    const effectiveCountry = isCountryLocked ? location.country : newCountry;
    
    if (!effectiveCountry || !newCity) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une ville",
        variant: "destructive",
      });
      return;
    }
    
    // If nothing changed, just close
    if (newCity === location.city && effectiveCountry === location.country) {
      setOpen(false);
      return;
    }

    setLoading(true);
    try {
      const updateData: { city: string; country?: string; updated_at: string } = {
        city: newCity,
        updated_at: new Date().toISOString()
      };
      
      // Only update country if it wasn't locked
      if (!isCountryLocked && newCountry) {
        updateData.country = newCountry;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id);

      if (error) throw error;

      // Invalidate all relevant caches
      await queryClient.invalidateQueries({ queryKey: ['user-location', user.id] });
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['featured-products'] });
      await queryClient.invalidateQueries({ queryKey: ['boosted-products'] });
      await queryClient.invalidateQueries({ queryKey: ['flash-sales'] });
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      await queryClient.invalidateQueries({ queryKey: ['search'] });
      
      setOpen(false);

      toast({
        title: "Localisation mise à jour",
        description: "Les produits sont maintenant filtrés selon votre nouvelle ville.",
      });
    } catch (error: any) {
      console.error('Error updating location:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour la localisation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const countryName = location.country ? getCountryByCode(location.country)?.name || location.country : 'Non défini';
  const effectiveCountryCode = isCountryLocked ? location.country : newCountry;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-auto py-4 px-4 rounded-xl border-border/50 hover:bg-accent/5"
          disabled={locationLoading}
        >
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <h4 className="font-medium text-sm">Changer de ville</h4>
            <p className="text-xs text-muted-foreground truncate">
              {location.city || 'Aucune ville'} • {countryName}
            </p>
          </div>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-3xl">
        {locationLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Modifier ma localisation
              </SheetTitle>
              <SheetDescription>
                {isCountryLocked 
                  ? "Changez de ville pour voir les produits disponibles dans votre région"
                  : "Définissez votre pays et votre ville pour voir les produits locaux"
                }
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-6 mt-6">
              <div className="space-y-2">
                <Label htmlFor="country" className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Pays
                  {isCountryLocked && <Lock className="w-3 h-3 text-muted-foreground" />}
                </Label>
                {isCountryLocked ? (
                  <>
                    <div className="min-h-[48px] px-4 py-3 bg-muted/50 rounded-xl border border-border/50 flex items-center text-muted-foreground">
                      {countryName}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Le pays ne peut pas être modifié après sa première définition
                    </p>
                  </>
                ) : (
                  <CountrySelect
                    value={newCountry}
                    onValueChange={handleCountryChange}
                    placeholder="Sélectionnez votre pays"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Ville
                </Label>
                <CitySelect
                  countryCode={effectiveCountryCode || ''}
                  value={newCity}
                  onValueChange={setNewCity}
                  placeholder="Sélectionnez votre ville"
                />
                <p className="text-xs text-muted-foreground">
                  Vous pouvez changer de ville à tout moment
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="flex-1 h-12 rounded-xl"
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleUpdateLocation}
                  className="flex-1 h-12 rounded-xl"
                  disabled={loading || !newCity || (!isCountryLocked && !newCountry)}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmer
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
