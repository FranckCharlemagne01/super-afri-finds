import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, Search, Filter, User, Mail, Phone, MapPin, Calendar, ShoppingBag, Package, DollarSign, Users } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  role: string;
  created_at: string;
}

interface UsersManagementProps {
  users: UserProfile[];
}

const roleConfig: Record<string, { label: string; color: string }> = {
  superadmin: { label: 'Super Admin', color: 'bg-red-100 text-red-800 border-red-300' },
  admin: { label: 'Admin', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  seller: { label: 'Vendeur', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  buyer: { label: 'Acheteur', color: 'bg-green-100 text-green-800 border-green-300' },
};

export const UsersManagement = ({ users }: UsersManagementProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [userDetail, setUserDetail] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const fetchUserDetails = async (userId: string) => {
    setLoadingDetail(true);
    try {
      // SECURITY: Use secure RPC with audit logging for profile access
      const { data: profile } = await supabase
        .rpc('get_profile_with_audit', { target_user_id: userId });

      // SECURITY: Use secure RPC for order stats instead of direct table access
      const [productsResult, orderStatsResult, messagesResult] = await Promise.all([
        supabase.from('products').select('id, is_active').eq('seller_id', userId),
        supabase.rpc('get_user_order_stats_superadmin', { target_user_id: userId }),
        supabase.from('messages').select('id').or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      ]);

      const orderStats = orderStatsResult.data?.[0] || { total_orders: 0, completed_orders: 0, total_revenue: 0 };

      const stats = {
        total_products: productsResult.data?.length || 0,
        active_products: productsResult.data?.filter(p => p.is_active).length || 0,
        total_orders: Number(orderStats.total_orders) || 0,
        completed_orders: Number(orderStats.completed_orders) || 0,
        total_revenue: Number(orderStats.total_revenue) || 0,
        total_messages: messagesResult.data?.length || 0,
      };

      setUserDetail(profile);
      setUserStats(stats);
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleViewUser = (userId: string) => {
    setSelectedUserId(userId);
    setDetailOpen(true);
    fetchUserDetails(userId);
  };

  const getRoleBadge = (role: string) => {
    const config = roleConfig[role] || roleConfig.buyer;
    return (
      <Badge className={`${config.color} border font-medium`}>
        {config.label}
      </Badge>
    );
  };

  const userCounts = {
    all: users.length,
    superadmin: users.filter(u => u.role === 'superadmin').length,
    admin: users.filter(u => u.role === 'admin').length,
    seller: users.filter(u => u.role === 'seller').length,
    buyer: users.filter(u => u.role === 'buyer').length,
  };

  return (
    <>
      <Card className="shadow-lg border-0">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Gestion des Utilisateurs</CardTitle>
              <CardDescription>
                Fiches détaillées et statistiques individuelles
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{users.length} utilisateurs</span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email ou téléphone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrer par rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous ({userCounts.all})</SelectItem>
                <SelectItem value="superadmin">Super Admin ({userCounts.superadmin})</SelectItem>
                <SelectItem value="admin">Admin ({userCounts.admin})</SelectItem>
                <SelectItem value="seller">Vendeurs ({userCounts.seller})</SelectItem>
                <SelectItem value="buyer">Acheteurs ({userCounts.buyer})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20">
                  <TableHead className="font-semibold">Utilisateur</TableHead>
                  <TableHead className="font-semibold">Contact</TableHead>
                  <TableHead className="font-semibold">Localisation</TableHead>
                  <TableHead className="font-semibold">Rôle</TableHead>
                  <TableHead className="font-semibold">Inscription</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>Aucun utilisateur trouvé</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user, index) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2, delay: index * 0.02 }}
                        className="border-b hover:bg-muted/30 transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{user.full_name || 'Non renseigné'}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{user.phone || '-'}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">
                            {user.city && user.country ? `${user.city}, ${user.country}` : user.country || '-'}
                          </p>
                        </TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(user.created_at), 'dd MMM yyyy', { locale: fr })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewUser(user.user_id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fiche Utilisateur</DialogTitle>
          </DialogHeader>
          
          {loadingDetail ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : userDetail ? (
            <div className="space-y-4">
              {/* Profile Info */}
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                    <User className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{userDetail.full_name || 'Non renseigné'}</h3>
                    <p className="text-sm text-muted-foreground">{userDetail.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{userDetail.phone || 'Non renseigné'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{userDetail.city || userDetail.country || 'Non renseigné'}</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Inscrit le {format(new Date(userDetail.created_at), 'dd MMMM yyyy', { locale: fr })}</span>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              {userStats && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <Package className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-xl font-bold text-blue-600">{userStats.total_products}</p>
                    <p className="text-xs text-muted-foreground">Produits ({userStats.active_products} actifs)</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <ShoppingBag className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <p className="text-xl font-bold text-green-600">{userStats.total_orders}</p>
                    <p className="text-xs text-muted-foreground">Commandes</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center col-span-2">
                    <DollarSign className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                    <p className="text-xl font-bold text-purple-600">
                      {userStats.total_revenue.toLocaleString()} FCFA
                    </p>
                    <p className="text-xs text-muted-foreground">Revenus totaux</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3 text-center col-span-2">
                    <Mail className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                    <p className="text-xl font-bold text-amber-600">{userStats.total_messages}</p>
                    <p className="text-xs text-muted-foreground">Messages échangés</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Utilisateur introuvable
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
