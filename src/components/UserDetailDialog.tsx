import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Mail, Phone, MapPin, Calendar, Package, ShoppingBag } from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone: string;
  city: string;
  country: string;
  address: string;
  created_at: string;
  role: string;
}

interface UserStats {
  total_products: number;
  total_orders: number;
  total_revenue: number;
}

interface UserDetailDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserDetailDialog = ({ userId, open, onOpenChange }: UserDetailDialogProps) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId && open) {
      fetchUserDetails();
    }
  }, [userId, open]);

  const fetchUserDetails = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) throw profileError;

      // Fetch user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      // Fetch user statistics
      const [productsResult, ordersResult] = await Promise.all([
        supabase.from('products').select('id').eq('seller_id', userId),
        supabase.from('orders').select('total_amount').eq('seller_id', userId)
      ]);

      const userStats: UserStats = {
        total_products: productsResult.data?.length || 0,
        total_orders: ordersResult.data?.length || 0,
        total_revenue: ordersResult.data?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0
      };

      setUser({
        ...profile,
        role: roleData?.role || 'buyer'
      });
      setStats(userStats);
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détails de l'utilisateur</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : user ? (
          <div className="space-y-6">
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informations personnelles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Nom complet</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">
                      {user.full_name || 'Non renseigné'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Email</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">{user.email}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Téléphone</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">
                      {user.phone || 'Non renseigné'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Localisation</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">
                      {user.city && user.country ? `${user.city}, ${user.country}` : 'Non renseignée'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Adresse</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">
                    {user.address || 'Non renseignée'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Inscrit le</span>
                  </div>
                  <span className="text-sm">
                    {new Date(user.created_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Rôle</span>
                  <Badge variant={user.role === 'seller' ? 'default' : 'secondary'}>
                    {user.role}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Statistics for sellers */}
            {user.role === 'seller' && stats && (
              <Card>
                <CardHeader>
                  <CardTitle>Statistiques de vente</CardTitle>
                  <CardDescription>
                    Performance en tant que vendeur sur la plateforme
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Package className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-600">
                        {stats.total_products}
                      </div>
                      <div className="text-sm text-muted-foreground">Produits</div>
                    </div>

                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <ShoppingBag className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-600">
                        {stats.total_orders}
                      </div>
                      <div className="text-sm text-muted-foreground">Commandes</div>
                    </div>

                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {new Intl.NumberFormat('fr-FR').format(stats.total_revenue)} FCFA
                      </div>
                      <div className="text-sm text-muted-foreground">Revenus</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Utilisateur introuvable</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};