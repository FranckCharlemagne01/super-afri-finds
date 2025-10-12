import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CitySelect } from '@/components/CitySelect';
import { getCountryByCode } from '@/data/countries';
import { MapPin, Loader2 } from 'lucide-react';
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

  const handleUpdateCity = async () => {
    if (!user || !newCity) return;
    
    if (newCity === location.city) {
      setOpen(false);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          city: newCity,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Invalider le cache de localisation utilisateur en premier
      await queryClient.invalidateQueries({ queryKey: ['user-location', user.id] });
      
      // Invalider tous les caches de produits pour forcer le rechargement
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['featured-products'] });
      await queryClient.invalidateQueries({ queryKey: ['boosted-products'] });
      await queryClient.invalidateQueries({ queryKey: ['flash-sales'] });
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      await queryClient.invalidateQueries({ queryKey: ['search'] });
      
      setNewCity('');
      setOpen(false);

      toast({
        title: "Ville mise à jour",
        description: "Les produits sont maintenant filtrés selon votre nouvelle ville.",
      });
    } catch (error: any) {
      console.error('Error updating city:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour la ville",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const countryName = location.country ? getCountryByCode(location.country)?.name || location.country : 'Non défini';
  const currentCity = newCity || location.city || '';

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
                Modifier ma ville
              </SheetTitle>
              <SheetDescription>
                Changez de ville pour voir les produits disponibles dans votre région
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-6 mt-6">
              <div className="space-y-2">
                <Label htmlFor="country" className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Pays (fixe)
                </Label>
                <div className="min-h-[48px] px-4 py-3 bg-muted/50 rounded-xl border border-border/50 flex items-center text-muted-foreground">
                  {countryName}
                </div>
                <p className="text-xs text-muted-foreground">
                  Le pays ne peut pas être modifié après l'inscription
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Ville
                </Label>
                <CitySelect
                  countryCode={location.country || ''}
                  value={currentCity}
                  onValueChange={setNewCity}
                  placeholder="Sélectionnez votre ville"
                />
                <p className="text-xs text-muted-foreground">
                  Choisissez une ville pour voir les produits disponibles
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
                  onClick={handleUpdateCity}
                  className="flex-1 h-12 rounded-xl"
                  disabled={loading || !newCity || newCity === location.city}
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
