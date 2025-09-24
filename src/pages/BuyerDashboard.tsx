import { useState, useEffect } from 'react';
import { useStableAuth } from '@/hooks/useStableAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { BuyerMessages } from '@/components/BuyerMessages';
import { 
  User, 
  Package, 
  MessageSquare, 
  LogOut, 
  Store,
  Edit,
  Save,
  X,
  Heart,
  ShoppingCart,
  Settings,
  Phone,
  Mail,
  MapPin,
  ChevronRight
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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

// Message notification component
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { RealtimeNotificationBadge } from '@/components/RealtimeNotificationBadge';

const MessageNotificationBadge = () => {
  const { unreadMessages } = useRealtimeNotifications();
  return <RealtimeNotificationBadge count={unreadMessages} />;
};

const BuyerDashboard = () => {
  const { user, signOut } = useStableAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<UserProfile>({ full_name: '', phone: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [updatedProfile, setUpdatedProfile] = useState<UserProfile>({ full_name: '', phone: '', email: '' });
  const [activeSection, setActiveSection] = useState('dashboard');
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

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
    } else if (!user && !loading) {
      // Si l'utilisateur n'est pas connecté, rediriger vers l'auth
      navigate('/auth');
    }
  }, [user, navigate]);

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

  const handleCancelOrder = async (orderId: string) => {
    try {
      setCancellingOrderId(orderId);
      
      // Utiliser la nouvelle fonction sécurisée pour l'annulation
      const { data, error } = await supabase.rpc('cancel_order_by_customer', {
        order_id: orderId
      });

      if (error) throw error;

      // Typage correct pour la réponse JSON
      const result = data as { success: boolean; error?: string; seller_id?: string; customer_name?: string; product_title?: string };

      // Vérifier le résultat de la fonction
      if (!result.success) {
        toast({
          title: "Impossible d'annuler",
          description: result.error || "Erreur inconnue",
          variant: "destructive",
        });
        return;
      }

      // Envoyer une notification temps réel au vendeur
      if (result.seller_id) {
        await supabase
          .from('messages')
          .insert({
            sender_id: user.id,
            recipient_id: result.seller_id,
            subject: 'Commande annulée',
            content: `Le client ${result.customer_name} a annulé sa commande pour "${result.product_title}". La commande a été automatiquement marquée comme annulée.`,
            is_read: false
          });
      }

      toast({
        title: "✅ Commande annulée",
        description: "Votre commande a été annulée avec succès. Le vendeur a été notifié.",
      });

      // Refresh orders to show updated status
      await fetchUserData();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'annuler la commande. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setCancellingOrderId(null);
    }
  };

  // Extract first and last name from full name
  const getFirstName = (fullName: string) => fullName.split(' ')[0] || '';
  const getLastName = (fullName: string) => fullName.split(' ').slice(1).join(' ') || '';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="mt-2 text-center">Chargement de votre profil...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    // Éviter le clignotement en redirigeant immédiatement
    navigate('/auth');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p>Redirection vers la connexion...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="container mx-auto px-3 py-4 max-w-md lg:max-w-6xl lg:px-6 lg:py-8">
        {/* Header Mobile */}
        <div className="lg:hidden mb-6">
          <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-border/50">
            <div>
              <h1 className="text-xl font-bold text-foreground">Mon Profil</h1>
              <p className="text-sm text-muted-foreground">Bonjour {profile.full_name?.split(' ')[0] || 'Client'} !</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="h-10 w-10 rounded-full bg-red-50 hover:bg-red-100 text-red-600"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Header Desktop */}
        <div className="hidden lg:flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text-primary">Mon Espace Client</h1>
            <p className="text-muted-foreground mt-1">Gérez votre profil et suivez vos activités</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleViewPublicPage}
              className="items-center gap-2"
            >
              <Store className="h-4 w-4" />
              Continuer mes achats
            </Button>
            <Button
              variant="destructive"
              onClick={handleSignOut}
              className="items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        </div>

        {activeSection === 'dashboard' && (
          <>
            {/* Profile Summary Card */}
            <Card className="mb-6 border-0 shadow-sm bg-gradient-to-r from-primary/10 to-secondary/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{profile.full_name || 'Nom non renseigné'}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {profile.email}
                    </p>
                    {profile.phone && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {profile.phone}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveSection('profile')}
                    className="text-primary hover:bg-primary/10"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{orders.length}</div>
                  <p className="text-xs text-muted-foreground">Commandes</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Package className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {orders.filter(order => ['pending', 'confirmed', 'shipped'].includes(order.status)).length}
                  </div>
                  <p className="text-xs text-muted-foreground">En cours</p>
                </CardContent>
              </Card>
            </div>

            {/* Menu Dashboard */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">Tableau de bord</h3>
              
              <Card 
                className="border-0 shadow-sm bg-white hover:shadow-md transition-all cursor-pointer" 
                onClick={() => setActiveSection('orders')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Package className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Mes Commandes</h4>
                        <p className="text-sm text-muted-foreground">Suivi des commandes en cours et historique</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="border-0 shadow-sm bg-white hover:shadow-md transition-all cursor-pointer" 
                onClick={() => navigate('/favorites')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                        <Heart className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Mes Favoris</h4>
                        <p className="text-sm text-muted-foreground">Produits sauvegardés pour plus tard</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="border-0 shadow-sm bg-white hover:shadow-md transition-all cursor-pointer" 
                onClick={() => navigate('/cart')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                        <ShoppingCart className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Mon Panier</h4>
                        <p className="text-sm text-muted-foreground">Articles en attente d'achat</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="border-0 shadow-sm bg-white hover:shadow-md transition-all cursor-pointer" 
                onClick={() => setActiveSection('messages')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center relative">
                        <MessageSquare className="w-6 h-6 text-purple-600" />
                        <MessageNotificationBadge />
                      </div>
                      <div>
                        <h4 className="font-medium">Mes Messages</h4>
                        <p className="text-sm text-muted-foreground">Conversations avec les vendeurs</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="border-0 shadow-sm bg-white hover:shadow-md transition-all cursor-pointer" 
                onClick={() => setActiveSection('profile')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                        <Settings className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Paramètres</h4>
                        <p className="text-sm text-muted-foreground">Modifier le profil et adresses</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {activeSection === 'profile' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveSection('dashboard')}
                className="p-2"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
              </Button>
              <h2 className="text-xl font-semibold">Informations Personnelles</h2>
            </div>

            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-6 space-y-6">
                {editingProfile ? (
                  <div className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="flex items-center gap-2 text-sm font-medium">
                          <User className="w-4 h-4" />
                          Nom complet
                        </Label>
                        <Input
                          id="firstName"
                          value={updatedProfile.full_name}
                          onChange={(e) => setUpdatedProfile({
                            ...updatedProfile,
                            full_name: e.target.value
                          })}
                          placeholder="Votre nom complet"
                          className="h-12 rounded-xl border-border/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium">
                          <Phone className="w-4 h-4" />
                          Téléphone
                        </Label>
                        <Input
                          id="phone"
                          value={updatedProfile.phone}
                          onChange={(e) => setUpdatedProfile({
                            ...updatedProfile,
                            phone: e.target.value
                          })}
                          placeholder="Votre numéro de téléphone"
                          className="h-12 rounded-xl border-border/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                          <Mail className="w-4 h-4" />
                          Email
                        </Label>
                        <Input
                          id="email"
                          value={updatedProfile.email}
                          disabled
                          className="h-12 rounded-xl bg-muted border-border/50"
                        />
                        <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié depuis ce profil</p>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button 
                        onClick={handleUpdateProfile} 
                        className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Enregistrer
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={cancelEdit} 
                        className="h-12 px-6 rounded-xl border-border/50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Nom complet</p>
                            <p className="font-medium">{profile.full_name || 'Non renseigné'}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <Phone className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Téléphone</p>
                            <p className="font-medium">{profile.phone || 'Non renseigné'}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Mail className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="font-medium">{profile.email}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => setEditingProfile(true)}
                      className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier mes informations
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeSection === 'orders' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveSection('dashboard')}
                className="p-2"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
              </Button>
              <h2 className="text-xl font-semibold">Mes Commandes</h2>
              <Badge className="bg-primary text-primary-foreground ml-auto">
                {orders.length} commande{orders.length > 1 ? 's' : ''}
              </Badge>
            </div>

            {orders.length === 0 ? (
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Aucune commande</h3>
                  <p className="text-muted-foreground mb-6">Vous n'avez pas encore passé de commande</p>
                  <Button 
                    onClick={() => navigate('/')}
                    className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90"
                  >
                    Découvrir nos produits
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => {
                  const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
                  const canCancel = order.status === 'pending' || order.status === 'confirmed';
                  
                  return (
                    <Card key={order.id} className="border-0 shadow-sm bg-white">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-sm">#{order.id.slice(-8)}</h4>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <Badge 
                            className={`${statusInfo.bgColor} ${statusInfo.color} text-xs px-2 py-1 rounded-full`}
                          >
                            {statusInfo.label}
                          </Badge>
                        </div>
                        
                        <div className="mb-3">
                          <h3 className="font-medium text-sm">{order.product_title}</h3>
                          <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                            <span>Qté: {order.quantity}</span>
                            <span>{order.product_price.toLocaleString()} FCFA/u</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-border/50">
                          <div>
                            <span className="text-sm font-medium">Total</span>
                            <div className="text-lg font-bold text-primary">
                              {order.total_amount.toLocaleString()} FCFA
                            </div>
                          </div>
                          {canCancel && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  disabled={cancellingOrderId === order.id}
                                  className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 h-8 px-3 text-xs"
                                >
                                  {cancellingOrderId === order.id ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                                  ) : (
                                    <>
                                      <X className="w-3 h-3 mr-1" />
                                      Annuler
                                    </>
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="max-w-md mx-4">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-lg">Confirmer l'annulation</AlertDialogTitle>
                                  <AlertDialogDescription className="text-sm text-muted-foreground">
                                    Êtes-vous sûr de vouloir annuler cette commande ? Le vendeur sera automatiquement notifié de l'annulation.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="gap-2 flex-col sm:flex-row">
                                  <AlertDialogCancel className="w-full sm:w-auto">
                                    Non, garder
                                  </AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleCancelOrder(order.id)}
                                    className="w-full sm:w-auto bg-red-600 text-white hover:bg-red-700"
                                  >
                                    Oui, annuler
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeSection === 'messages' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveSection('dashboard')}
                className="p-2"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
              </Button>
              <h2 className="text-xl font-semibold">Mes Messages</h2>
            </div>

            <BuyerMessages />
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyerDashboard;