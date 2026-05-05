import { useEffect, useMemo, useRef, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Loader2, Navigation, Clock, Star, X, Building2 } from 'lucide-react';
import { cities } from '@/data/cities';
import { communes, getCommunesByCity } from '@/data/communes';
import { supabase } from '@/integrations/supabase/client';
import { useStableAuth } from '@/hooks/useStableAuth';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useUserLocation } from '@/hooks/useUserLocation';
import { invalidateCacheByPrefix } from '@/utils/dataCache';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const POPULAR_CITIES = ['Abidjan', 'Bouaké', 'Yamoussoukro', 'San-Pédro', 'Daloa', 'Korhogo'];
const HISTORY_KEY = 'djassa:recent_cities';
const MAX_HISTORY = 5;

const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Pick {
  city: string;
  commune?: string;
}

export const QuickLocationPicker = ({ open, onOpenChange }: Props) => {
  const { user } = useStableAuth();
  const { location } = useUserLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  const [history, setHistory] = useState<Pick[]>(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedCity(null);
      // Autofocus search after the sheet animation
      const t = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Filter cities & communes (fuzzy normalized contains)
  const results = useMemo(() => {
    const q = normalize(query);
    if (!q) {
      return {
        cities: cities.slice(0, 30),
        communes: [] as { name: string; city: string }[],
      };
    }
    const cityHits = cities.filter((c) => normalize(c.name).includes(q));
    const communeHits = communes
      .filter((c) => normalize(c.name).includes(q))
      .slice(0, 20)
      .map((c) => ({ name: c.name, city: c.city }));
    return { cities: cityHits, communes: communeHits };
  }, [query]);

  const cityCommunes = selectedCity ? getCommunesByCity(selectedCity) : [];

  const persistHistory = (pick: Pick) => {
    const next = [pick, ...history.filter((h) => !(h.city === pick.city && h.commune === pick.commune))].slice(
      0,
      MAX_HISTORY,
    );
    setHistory(next);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const apply = async (pick: Pick) => {
    persistHistory(pick);

    if (user) {
      setSaving(true);
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            city: pick.city,
            commune: pick.commune || null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
        if (error) throw error;

        invalidateCacheByPrefix('products:');
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['user-location', user.id] }),
          queryClient.invalidateQueries({ queryKey: ['products'] }),
          queryClient.invalidateQueries({ queryKey: ['featured-products'] }),
          queryClient.invalidateQueries({ queryKey: ['boosted-products'] }),
          queryClient.invalidateQueries({ queryKey: ['flash-sales'] }),
          queryClient.invalidateQueries({ queryKey: ['categories'] }),
          queryClient.invalidateQueries({ queryKey: ['search'] }),
        ]);
      } catch (err: any) {
        toast({
          title: 'Erreur',
          description: err.message || "Impossible d'enregistrer la localisation",
          variant: 'destructive',
        });
        setSaving(false);
        return;
      }
      setSaving(false);
    }

    toast({
      title: '📍 Localisation mise à jour',
      description: pick.commune ? `${pick.commune}, ${pick.city}` : pick.city,
      duration: 2000,
    });
    onOpenChange(false);
    window.dispatchEvent(new CustomEvent('djassa:refresh-products'));
  };

  const useGeolocation = () => {
    if (!navigator.geolocation) {
      toast({ title: 'Géolocalisation indisponible', variant: 'destructive' });
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&accept-language=fr`,
          );
          const data = await res.json();
          const detectedCity: string =
            data?.address?.city || data?.address?.town || data?.address?.village || data?.address?.county || '';
          const detectedSuburb: string = data?.address?.suburb || data?.address?.neighbourhood || '';

          // Match to known city (normalized)
          const matchCity = cities.find((c) => normalize(c.name) === normalize(detectedCity))?.name;
          if (matchCity) {
            const matchCommune = getCommunesByCity(matchCity).find(
              (c) => normalize(c.name) === normalize(detectedSuburb),
            )?.name;
            await apply({ city: matchCity, commune: matchCommune });
          } else {
            toast({
              title: 'Position détectée',
              description: detectedCity ? `${detectedCity} (non couvert)` : 'Ville inconnue',
              variant: 'destructive',
            });
          }
        } catch {
          toast({ title: 'Erreur de géolocalisation', variant: 'destructive' });
        } finally {
          setGeoLoading(false);
        }
      },
      () => {
        setGeoLoading(false);
        toast({ title: 'Position refusée', variant: 'destructive' });
      },
      { timeout: 10000, enableHighAccuracy: false },
    );
  };

  const currentLabel = location.commune
    ? `${location.commune}, ${location.city || ''}`
    : location.city || 'Non défini';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl p-0 max-h-[92vh] flex flex-col overflow-hidden"
      >
        <SheetHeader className="px-4 pt-4 pb-2 border-b border-border/50 flex-shrink-0">
          <SheetTitle className="flex items-center gap-2 text-base">
            <MapPin className="w-5 h-5 text-primary" />
            Choisir une localisation
          </SheetTitle>
          <p className="text-xs text-muted-foreground text-left">
            Actuelle : <span className="font-semibold text-foreground">{currentLabel}</span>
          </p>
        </SheetHeader>

        {/* Search */}
        <div className="px-4 pt-3 pb-2 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une ville ou commune… (ex: Yop, Coco)"
              className="h-12 pl-9 pr-9 rounded-xl text-sm"
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full hover:bg-muted flex items-center justify-center"
                aria-label="Effacer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={useGeolocation}
            disabled={geoLoading || saving}
            className="w-full mt-2 h-11 justify-start gap-2 rounded-xl border-primary/30 text-primary hover:bg-primary/5"
          >
            {geoLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
            <span className="text-sm font-semibold">Utiliser ma position actuelle</span>
          </Button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 overscroll-contain">
          <AnimatePresence mode="wait">
            {selectedCity ? (
              <motion.div
                key="commune-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-2"
              >
                <button
                  onClick={() => setSelectedCity(null)}
                  className="text-xs text-primary font-semibold mt-2"
                >
                  ← Changer de ville
                </button>
                <div className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  Commune dans {selectedCity}
                </div>
                <button
                  onClick={() => apply({ city: selectedCity })}
                  className="w-full text-left px-3 py-3 rounded-xl border border-border hover:bg-muted active:bg-muted text-sm font-medium"
                >
                  Toute la ville ({selectedCity})
                </button>
                {cityCommunes.map((c) => (
                  <button
                    key={c.name}
                    disabled={saving}
                    onClick={() => apply({ city: selectedCity, commune: c.name })}
                    className="w-full text-left px-3 py-3 rounded-xl border border-border hover:bg-primary/5 active:bg-primary/10 transition text-sm flex items-center justify-between"
                  >
                    <span>{c.name}</span>
                    {saving && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                  </button>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="city-step"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4 pt-2"
              >
                {/* History */}
                {!query && history.length > 0 && (
                  <Section title="Récentes" icon={<Clock className="w-3.5 h-3.5" />}>
                    {history.map((h, i) => (
                      <Chip
                        key={`h-${i}`}
                        label={h.commune ? `${h.commune}, ${h.city}` : h.city}
                        onClick={() => apply(h)}
                      />
                    ))}
                  </Section>
                )}

                {/* Popular */}
                {!query && (
                  <Section title="Villes populaires" icon={<Star className="w-3.5 h-3.5" />}>
                    {POPULAR_CITIES.map((c) => (
                      <Chip key={c} label={c} onClick={() => setSelectedCity(c)} />
                    ))}
                  </Section>
                )}

                {/* City results */}
                <Section title={query ? 'Villes' : 'Toutes les villes'} icon={<MapPin className="w-3.5 h-3.5" />}>
                  {results.cities.length === 0 && (
                    <p className="text-xs text-muted-foreground">Aucune ville trouvée</p>
                  )}
                  <div className="grid grid-cols-1 gap-1.5 w-full">
                    {results.cities.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => setSelectedCity(c.name)}
                        className="w-full text-left px-3 py-3 rounded-xl border border-border hover:bg-primary/5 active:bg-primary/10 transition text-sm flex items-center justify-between"
                      >
                        <span className="font-medium">{c.name}</span>
                        <span className="text-[10px] text-muted-foreground">{c.countryCode}</span>
                      </button>
                    ))}
                  </div>
                </Section>

                {/* Commune results when searching */}
                {query && results.communes.length > 0 && (
                  <Section title="Communes" icon={<Building2 className="w-3.5 h-3.5" />}>
                    <div className="grid grid-cols-1 gap-1.5 w-full">
                      {results.communes.map((c) => (
                        <button
                          key={`${c.city}-${c.name}`}
                          onClick={() => apply({ city: c.city, commune: c.name })}
                          className="w-full text-left px-3 py-3 rounded-xl border border-border hover:bg-primary/5 active:bg-primary/10 transition text-sm"
                        >
                          <div className="font-medium">{c.name}</div>
                          <div className="text-[11px] text-muted-foreground">à {c.city}</div>
                        </button>
                      ))}
                    </div>
                  </Section>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const Section = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div>
    <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
      {icon}
      {title}
    </div>
    <div className={cn('flex flex-wrap gap-1.5')}>{children}</div>
  </div>
);

const Chip = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="px-3 py-2 rounded-full bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 active:scale-95 transition"
  >
    {label}
  </button>
);
