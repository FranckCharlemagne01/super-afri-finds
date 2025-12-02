import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Store, Upload, Image as ImageIcon, Check, ExternalLink, Edit } from 'lucide-react';

interface Shop {
  id: string;
  shop_name: string;
  shop_slug: string;
  shop_description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  subscription_active: boolean;
  subscription_expires_at: string | null;
  created_at: string;
}

export const ShopManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [formData, setFormData] = useState({
    shop_name: '',
    shop_description: '',
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [bannerPreview, setBannerPreview] = useState<string>('');

  useEffect(() => {
    fetchShop();
  }, [user]);

  const fetchShop = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('seller_shops')
        .select('*')
        .eq('seller_id', user.id)
        .maybeSingle();

      if (!error && data) {
        setShop(data);
        setFormData({
          shop_name: data.shop_name,
          shop_description: data.shop_description || '',
        });
        setLogoPreview(data.logo_url || '');
        setBannerPreview(data.banner_url || '');
      }
    } catch (error) {
      console.error('Error fetching shop:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (type: 'logo' | 'banner', file: File | null) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'logo') {
        setLogoFile(file);
        setLogoPreview(reader.result as string);
      } else {
        setBannerFile(file);
        setBannerPreview(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (file: File, path: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${path}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);

    try {
      let logoUrl = shop?.logo_url || null;
      let bannerUrl = shop?.banner_url || null;

      // Upload logo if changed
      if (logoFile) {
        const uploaded = await uploadImage(logoFile, 'shop-logos');
        if (uploaded) logoUrl = uploaded;
      }

      // Upload banner if changed
      if (bannerFile) {
        const uploaded = await uploadImage(bannerFile, 'shop-banners');
        if (uploaded) bannerUrl = uploaded;
      }

      if (shop) {
        // Update existing shop
        const { error } = await supabase
          .from('seller_shops')
          .update({
            shop_name: formData.shop_name,
            shop_description: formData.shop_description,
            logo_url: logoUrl,
            banner_url: bannerUrl,
          })
          .eq('id', shop.id);

        if (error) throw error;

        toast({
          title: 'Boutique mise à jour',
          description: 'Les modifications ont été enregistrées.',
        });
      } else {
        // Create new shop
        const { data: slugData } = await supabase.rpc('generate_shop_slug', {
          shop_name: formData.shop_name,
        });

        const { error } = await supabase
          .from('seller_shops')
          .insert({
            seller_id: user.id,
            shop_name: formData.shop_name,
            shop_slug: slugData,
            shop_description: formData.shop_description,
            logo_url: logoUrl,
            banner_url: bannerUrl,
          });

        if (error) throw error;

        toast({
          title: 'Boutique créée',
          description: 'Votre boutique a été créée avec succès !',
        });
      }

      setEditing(false);
      setLogoFile(null);
      setBannerFile(null);
      await fetchShop();
    } catch (error) {
      console.error('Error saving shop:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder la boutique.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  if (!shop && !editing) {
    return (
      <Card className="p-6 text-center">
        <Store className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Créer ma boutique</h3>
        <p className="text-muted-foreground mb-4">
          Créez votre boutique personnalisée pour présenter vos produits avec votre propre identité.
        </p>
        <Button onClick={() => setEditing(true)}>
          <Store className="h-4 w-4 mr-2" />
          Créer ma boutique
        </Button>
      </Card>
    );
  }

  if (shop && !editing) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Store className="h-5 w-5" />
            Ma Boutique
          </h3>
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        </div>

        <div className="space-y-4">
          {/* Banner */}
          <div className="relative w-full h-32 rounded-lg overflow-hidden bg-gradient-to-r from-primary/20 to-secondary/20">
            {shop.banner_url && (
              <img src={shop.banner_url} alt="Bannière" className="w-full h-full object-cover" />
            )}
          </div>

          {/* Logo & Info */}
          <div className="flex gap-4">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-card border flex-shrink-0">
              {shop.logo_url ? (
                <img src={shop.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <Store className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-lg">{shop.shop_name}</h4>
                {shop.subscription_active && (
                  <Badge variant="secondary">Premium</Badge>
                )}
              </div>
              {shop.shop_description && (
                <p className="text-sm text-muted-foreground">{shop.shop_description}</p>
              )}
            </div>
          </div>

          {/* Shop Access Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="default"
              className="flex-1 transition-all hover:scale-105"
              onClick={() => window.open(`/boutique/${shop.shop_slug}`, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Voir ma boutique
            </Button>
            <Button
              variant="outline"
              className="flex-1 transition-all hover:scale-105"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/boutique/${shop.shop_slug}`);
                toast({
                  title: "Copié !",
                  description: "Le lien de votre boutique a été copié.",
                });
              }}
            >
              <Check className="h-4 w-4 mr-2" />
              Partager ma boutique
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">
        {shop ? 'Modifier ma boutique' : 'Créer ma boutique'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Shop Name */}
        <div className="space-y-2">
          <Label htmlFor="shop_name">Nom de la boutique *</Label>
          <Input
            id="shop_name"
            value={formData.shop_name}
            onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
            placeholder="Ex: Ma Super Boutique"
            required
            maxLength={100}
            className="w-full"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="shop_description">Description</Label>
          <Textarea
            id="shop_description"
            value={formData.shop_description}
            onChange={(e) => setFormData({ ...formData, shop_description: e.target.value })}
            placeholder="Décrivez votre boutique..."
            rows={4}
            maxLength={500}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">{formData.shop_description.length}/500 caractères</p>
        </div>

        {/* Logo */}
        <div className="space-y-2">
          <Label>Logo de la boutique</Label>
          <div className="flex flex-col sm:flex-row items-start gap-4 mt-2">
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted border-2 flex-shrink-0 shadow-sm">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                </div>
              )}
            </div>
            <div className="flex-1 w-full space-y-2">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange('logo', e.target.files?.[0] || null)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">Recommandé: 200x200px (PNG ou JPEG)</p>
            </div>
          </div>
        </div>

        {/* Banner */}
        <div className="space-y-2">
          <Label>Bannière de la boutique</Label>
          <div className="mt-2 space-y-3">
            <div className="w-full h-40 rounded-xl overflow-hidden bg-muted border-2 shadow-sm">
              {bannerPreview ? (
                <img src={bannerPreview} alt="Bannière" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-16 w-16 text-muted-foreground/40" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange('banner', e.target.files?.[0] || null)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">Recommandé: 1200x400px (PNG ou JPEG)</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button 
            type="submit" 
            disabled={saving || !formData.shop_name}
            className="flex-1 min-h-[48px] rounded-xl font-semibold shadow-md transition-all hover:scale-[1.02]"
          >
            {saving ? 'Enregistrement...' : shop ? 'Enregistrer' : 'Créer la boutique'}
          </Button>
          {shop && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setEditing(false);
                setFormData({
                  shop_name: shop.shop_name,
                  shop_description: shop.shop_description || '',
                });
                setLogoPreview(shop.logo_url || '');
                setBannerPreview(shop.banner_url || '');
                setLogoFile(null);
                setBannerFile(null);
              }}
              className="flex-1 min-h-[48px] rounded-xl font-semibold transition-all hover:scale-[1.02]"
            >
              Annuler
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
};
