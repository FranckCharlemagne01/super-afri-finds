import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TextInput } from '@/components/ui/validated-input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, User, Mail, Phone, MapPin } from 'lucide-react';
import { CountrySelect } from '@/components/CountrySelect';
import { CitySelect } from '@/components/CitySelect';
import { getCountryByCode } from '@/data/countries';

interface ProfileData {
  full_name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  country: string;
}

export const ProfileUpdateForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: '',
    email: '',
    phone: '',
    city: '',
    address: '',
    country: ''
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfileData({
          full_name: data.full_name || '',
          email: data.email || user?.email || '',
          phone: data.phone || '',
          city: data.city || '',
          address: data.address || '',
          country: data.country || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le profil",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Update profile (country is excluded - cannot be changed)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name,
          phone: profileData.phone,
          city: profileData.city,
          address: profileData.address,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Update email in auth if changed
      if (profileData.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: profileData.email
        });

        if (emailError) throw emailError;

        toast({
          title: "Email mis à jour",
          description: "Un email de confirmation a été envoyé à votre nouvelle adresse",
        });
      }

      // Invalider tous les caches de produits pour forcer le rechargement
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['featured-products'] });
      await queryClient.invalidateQueries({ queryKey: ['boosted-products'] });
      await queryClient.invalidateQueries({ queryKey: ['flash-sales'] });
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      await queryClient.invalidateQueries({ queryKey: ['search'] });

      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été sauvegardées. Les produits sont maintenant filtrés selon votre nouvelle ville.",
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le profil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="full_name" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Nom complet
          </Label>
          <TextInput
            id="full_name"
            value={profileData.full_name}
            onChange={(value) => handleChange('full_name', value)}
            placeholder="Votre nom complet"
            className="min-h-[48px] text-base px-4"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={profileData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="votre@email.com"
            className="min-h-[48px] text-base px-4"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Téléphone
          </Label>
          <Input
            id="phone"
            type="text"
            value={profileData.phone}
            onChange={(e) => {
              const value = e.target.value;
              // Accepter +, 00, chiffres et espaces
              if (value === '' || /^(\+|0{0,2})[0-9\s]*$/.test(value)) {
                handleChange('phone', value);
              }
            }}
            placeholder="+225 0707070707"
            className="min-h-[48px] text-base px-4"
            maxLength={20}
          />
          <p className="text-xs text-muted-foreground">Format: +225 0707070707, 00225 0707070707 ou 0707070707</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="country" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Pays (fixe)
          </Label>
          <div className="min-h-[48px] px-4 py-2 bg-muted rounded-md border border-border flex items-center text-muted-foreground">
            {profileData.country ? getCountryByCode(profileData.country)?.name || profileData.country : 'Non défini'}
          </div>
          <p className="text-xs text-muted-foreground">Le pays ne peut pas être modifié après l'inscription</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="city" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Ville (modifiable)
          </Label>
          <CitySelect
            countryCode={profileData.country}
            value={profileData.city}
            onValueChange={(value) => handleChange('city', value)}
          />
          <p className="text-xs text-muted-foreground">Vous pouvez changer de ville pour voir les produits d'autres villes</p>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Adresse</Label>
          <Input
            id="address"
            value={profileData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Votre adresse complète"
            className="min-h-[48px] text-base px-4"
          />
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full md:w-auto">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sauvegarder les modifications
      </Button>
    </form>
  );
};