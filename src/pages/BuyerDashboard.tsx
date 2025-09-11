import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { BuyerMessages } from '@/components/BuyerMessages';
import { 
  ArrowLeft, 
  User, 
  Package, 
  MessageSquare, 
  LogOut, 
  Store,
  Edit,
  Save,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Order {
  id: string;
  product_id: string;
  product_title: string;
  product_price: number;
  quantity: number;
  total_amount: number;
  status: string;
  customer_name: string;
  customer_phone: string;
  delivery_location: string;
  created_at: string;
  updated_at: string;
}

interface UserProfile {
  full_name: string;
  phone: string;
  email: string;
}

const statusConfig = {
  pending: { label: "En attente", color: "text-orange-500", bgColor: "bg-orange-100" },
  confirmed: { label: "Confirmée", color: "text-blue-500", bgColor: "bg-blue-100" },
  shipped: { label: "Expédiée", color: "text-purple-500", bgColor: "bg-purple-100" },
  delivered: { label: "Livrée", color: "text-green-500", bgColor: "bg-green-100" },
  cancelled: { label: "Annulée", color: "text-red-500", bgColor: "bg-red-100" },
};

const BuyerDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<UserProfile>({ full_name: '', phone: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [updatedProfile, setUpdatedProfile] = useState<UserProfile>({ full_name: '', phone: '', email: '' });

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleViewPublicPage = () => {
    navigate('/');
  };

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, phone, email')
        .eq('user_id', user?.id)
        .single();

      if (profileError) throw profileError;
      
      const userProfile = {
        full_name: profileData?.full_name || '',
        phone: profileData?.phone || '',
        email: profileData?.email || user?.email || ''
      };
      
      setProfile(userProfile);
      setUpdatedProfile(userProfile);

      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase.rpc('get_seller_orders');
      
      if (ordersError) throw ordersError;
      
      // Filter only orders where the current user is the customer
      const customerOrders = ordersData?.filter(order => order.customer_id === user?.id) || [];
      setOrders(customerOrders);
      
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos données",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: updatedProfile.full_name,
          phone: updatedProfile.phone,
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      setProfile(updatedProfile);
      setEditingProfile(false);
      
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été mises à jour avec succès",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour votre profil",
        variant: "destructive",
      });
    }
  };

  const cancelEdit = () => {
    setUpdatedProfile(profile);
    setEditingProfile(false);
  };

  // Extract first and last name from full name
  const getFirstName = (fullName: string) => fullName.split(' ')[0] || '';
  const getLastName = (fullName: string) => fullName.split(' ').slice(1).join(' ') || '';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-center">Chargement...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p>Vous devez être connecté pour accéder à votre espace.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center mb-6 lg:mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold gradient-text-primary">Mon Espace</h1>
            <p className="text-sm lg:text-base text-muted-foreground">Gérez votre profil et suivez vos commandes</p>
          </div>
          
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleViewPublicPage}
                className="flex-1 lg:flex-none items-center gap-2 text-sm"
                size="sm"
              >
                <Store className="h-4 w-4" />
                <span className="hidden sm:inline">Continuer mes achats</span>
                <span className="sm:hidden">Achats</span>
              </Button>
              <Button
                variant="destructive"
                onClick={handleSignOut}
                className="flex-1 lg:flex-none items-center gap-2 text-sm"
                size="sm"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Déconnexion</span>
                <span className="sm:hidden">Sortir</span>
              </Button>
            </div>
            <Badge variant="secondary" className="px-3 py-1 text-xs lg:px-4 lg:py-2 self-center lg:self-auto">
              Client
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Commandes</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold">{orders.length}</div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commandes Actives</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold">
                {orders.filter(order => ['pending', 'confirmed', 'shipped'].includes(order.status)).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-none lg:flex">
            <TabsTrigger value="profile" className="text-sm">Mon Profil</TabsTrigger>
            <TabsTrigger value="orders" className="text-sm">Mes Commandes</TabsTrigger>
            <TabsTrigger value="messages" className="text-sm">Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card className="border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg lg:text-xl flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informations Personnelles
                  </CardTitle>
                </div>
                {!editingProfile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingProfile(true)}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Modifier
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {editingProfile ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Prénom</Label>
                        <Input
                          id="firstName"
                          value={getFirstName(updatedProfile.full_name)}
                          onChange={(e) => {
                            const lastName = getLastName(updatedProfile.full_name);
                            setUpdatedProfile({
                              ...updatedProfile,
                              full_name: `${e.target.value} ${lastName}`.trim()
                            });
                          }}
                          placeholder="Votre prénom"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Nom</Label>
                        <Input
                          id="lastName"
                          value={getLastName(updatedProfile.full_name)}
                          onChange={(e) => {
                            const firstName = getFirstName(updatedProfile.full_name);
                            setUpdatedProfile({
                              ...updatedProfile,
                              full_name: `${firstName} ${e.target.value}`.trim()
                            });
                          }}
                          placeholder="Votre nom"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input
                        id="phone"
                        value={updatedProfile.phone}
                        onChange={(e) => setUpdatedProfile({
                          ...updatedProfile,
                          phone: e.target.value
                        })}
                        placeholder="Votre numéro de téléphone"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={updatedProfile.email}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié</p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleUpdateProfile} className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Enregistrer
                      </Button>
                      <Button variant="outline" onClick={cancelEdit} className="flex items-center gap-2">
                        <X className="h-4 w-4" />
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Prénom</Label>
                        <p className="text-lg">{getFirstName(profile.full_name) || 'Non renseigné'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Nom</Label>
                        <p className="text-lg">{getLastName(profile.full_name) || 'Non renseigné'}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Téléphone</Label>
                      <p className="text-lg">{profile.phone || 'Non renseigné'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                      <p className="text-lg">{profile.email}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:justify-between lg:items-center">
              <h2 className="text-lg lg:text-xl font-semibold">Historique des Commandes</h2>
            </div>

            {orders.length === 0 ? (
              <Card className="border-0 shadow-md">
                <CardContent className="text-center py-12">
                  <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Aucune commande</h3>
                  <p className="text-muted-foreground mb-6">Vous n'avez pas encore passé de commande</p>
                  <Button onClick={() => navigate('/')}>
                    Découvrir nos produits
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
                  
                  return (
                    <Card key={order.id} className="border-0 shadow-md">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Commande #{order.id.slice(-8)}</CardTitle>
                          <Badge className={`${statusInfo.bgColor} ${statusInfo.color} hover:${statusInfo.bgColor}`}>
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Passée le {new Date(order.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h3 className="font-medium text-foreground">{order.product_title}</h3>
                          <div className="flex items-center justify-between text-sm text-muted-foreground mt-1">
                            <span>Quantité: {order.quantity}</span>
                            <span>Prix unitaire: {order.product_price.toLocaleString()} FCFA</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t">
                          <span className="text-lg font-bold text-promo">
                            Total: {order.total_amount.toLocaleString()} FCFA
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            <BuyerMessages />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BuyerDashboard;