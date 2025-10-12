import { useState, useEffect } from 'react';
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

export const LocationSelector = () => {
  const { user } = useStableAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentCity, setCurrentCity] = useState('');
  const [currentCountry, setCurrentCountry] = useState('');
  const [newCity, setNewCity] = useState('');

  useEffect(() => {
    if (user && open) {
      fetchLocation();
    }
  }, [user, open]);

  const fetchLocation = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('city, country')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setCurrentCity(data.city || '');
        setCurrentCountry(data.country || '');
        setNewCity(data.city || '');
      }
    } catch (error) {
      console.error('Error fetching location:', error);
    }
  };

  const handleUpdateCity = async () => {
    if (!user || !newCity) return;
    
    if (newCity === currentCity) {
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

      // Invalider tous les caches de produits pour forcer le rechargement
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['featured-products'] });
      await queryClient.invalidateQueries({ queryKey: ['boosted-products'] });
      await queryClient.invalidateQueries({ queryKey: ['flash-sales'] });
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      await queryClient.invalidateQueries({ queryKey: ['search'] });
      
      setCurrentCity(newCity);
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

  const countryName = currentCountry ? getCountryByCode(currentCountry)?.name || currentCountry : 'Non défini';

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-auto py-4 px-4 rounded-xl border-border/50 hover:bg-accent/5"
        >
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <h4 className="font-medium text-sm">Changer de ville</h4>
            <p className="text-xs text-muted-foreground truncate">
              {currentCity || 'Aucune ville'} • {countryName}
            </p>
          </div>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-3xl">
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
              countryCode={currentCountry}
              value={newCity}
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
              disabled={loading || !newCity || newCity === currentCity}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
