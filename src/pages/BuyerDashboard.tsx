import { useState, useEffect, lazy, Suspense } from 'react';
import { useStableAuth } from '@/hooks/useStableAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBuyerProfile } from '@/hooks/useBuyerProfile';
import { DashboardSkeleton } from '@/components/buyer/DashboardSkeleton';
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

// Lazy load heavy components
const BuyerMessages = lazy(() => import('@/components/BuyerMessages').then(module => ({ default: module.BuyerMessages })));

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
import { LocationSelector } from '@/components/LocationSelector';

const MessageNotificationBadge = () => {
  const { unreadMessages } = useRealtimeNotifications();
  return <RealtimeNotificationBadge count={unreadMessages} />;
};

const BuyerDashboard = () => {
  const { user, loading: authLoading, signOut } = useStableAuth();
  const navigate = useNavigate();
  const { profile, orders, loadingProfile, updateProfile, cancelOrder } = useBuyerProfile(user?.id);
  const [editingProfile, setEditingProfile] = useState(false);
  const [updatedProfile, setUpdatedProfile] = useState<UserProfile>({ full_name: '', phone: '', email: '' });
  const [activeSection, setActiveSection] = useState('dashboard');
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [editingSettings, setEditingSettings] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  const handleViewPublicPage = () => {
    navigate('/');
  };

  const handleUpdateProfile = async () => {
    const result = await updateProfile(updatedProfile);
    if (result.success) {
      setEditingProfile(false);
    }
  };

  const startEditProfile = () => {
    setUpdatedProfile(profile);
    setEditingProfile(true);
  };

  const cancelEditProfile = () => {
    setEditingProfile(false);
  };

  const startEditSettings = () => {
    setUpdatedProfile(profile);
    setEditingSettings(true);
  };

  const cancelEditSettings = () => {
    setEditingSettings(false);
  };

  const handleUpdateSettings = async () => {
    const result = await updateProfile(updatedProfile);
    if (result.success) {
      setEditingSettings(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    setCancellingOrderId(orderId);
    await cancelOrder(orderId);
    setCancellingOrderId(null);
  };

  // Redirect to auth if user is not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Show skeleton while loading auth or profile
  if (authLoading || loadingProfile) {
    return <DashboardSkeleton />;
  }

  // Don't render anything if no user (during redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="container mx-auto px-3 py-4 max-w-md md:max-w-3xl lg:max-w-6xl md:px-6 lg:px-8 lg:py-8">
        {/* Header Mobile & Tablet */}
        <div className="lg:hidden mb-6">
          <div className="flex items-center justify-between p-4 md:p-6 bg-white rounded-2xl shadow-sm border border-border/50">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Mon Profil</h1>
              <p className="text-sm md:text-base text-muted-foreground">Bonjour {profile.full_name?.split(' ')[0] || 'Client'} !</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-red-50 hover:bg-red-100 text-red-600"
            >
              <LogOut className="h-4 w-4 md:h-5 md:w-5" />
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
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
                    <User className="w-7 h-7 md:w-8 md:h-8 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base md:text-lg font-semibold truncate">{profile.full_name || 'Nom non renseigné'}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-1 truncate">
                      <Mail className="w-3 h-3 shrink-0" />
                      <span className="truncate">{profile.email}</span>
                    </p>
                    {profile.phone && (
                      <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3 shrink-0" />
                        {profile.phone}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveSection('profile')}
                    className="text-primary hover:bg-primary/10 shrink-0"
                  >
                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
              <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-5 text-center">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Package className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-blue-600">{orders.length}</div>
                  <p className="text-xs md:text-sm text-muted-foreground">Commandes</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-5 text-center">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Package className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-green-600">
                    {orders.filter(order => ['pending', 'confirmed', 'shipped'].includes(order.status)).length}
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground">En cours</p>
                </CardContent>
              </Card>
            </div>

            {/* Menu Dashboard */}
            <div className="space-y-3 md:space-y-4">
              <h3 className="text-lg md:text-xl font-semibold text-foreground">Tableau de bord</h3>
              
              <Card 
                className="border-0 shadow-sm bg-white hover:shadow-md transition-all cursor-pointer" 
                onClick={() => setActiveSection('orders')}
              >
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                        <Package className="w-6 h-6 md:w-7 md:h-7 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-sm md:text-base">Mes Commandes</h4>
                        <p className="text-xs md:text-sm text-muted-foreground truncate">Suivi des commandes en cours et historique</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="border-0 shadow-sm bg-white hover:shadow-md transition-all cursor-pointer" 
                onClick={() => navigate('/favorites')}
              >
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                        <Heart className="w-6 h-6 md:w-7 md:h-7 text-red-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-sm md:text-base">Mes Favoris</h4>
                        <p className="text-xs md:text-sm text-muted-foreground truncate">Produits sauvegardés pour plus tard</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="border-0 shadow-sm bg-white hover:shadow-md transition-all cursor-pointer" 
                onClick={() => navigate('/cart')}
              >
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                        <ShoppingCart className="w-6 h-6 md:w-7 md:h-7 text-orange-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-sm md:text-base">Mon Panier</h4>
                        <p className="text-xs md:text-sm text-muted-foreground truncate">Articles en attente d'achat</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="border-0 shadow-sm bg-white hover:shadow-md transition-all cursor-pointer" 
                onClick={() => setActiveSection('messages')}
              >
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-purple-100 rounded-xl flex items-center justify-center relative shrink-0">
                        <MessageSquare className="w-6 h-6 md:w-7 md:h-7 text-purple-600" />
                        <MessageNotificationBadge />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-sm md:text-base">Mes Messages</h4>
                        <p className="text-xs md:text-sm text-muted-foreground truncate">Conversations avec les vendeurs</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="border-0 shadow-sm bg-white hover:shadow-md transition-all cursor-pointer" 
                onClick={() => setActiveSection('settings')}
              >
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                        <Settings className="w-6 h-6 md:w-7 md:h-7 text-gray-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-sm md:text-base">Paramètres</h4>
                        <p className="text-xs md:text-sm text-muted-foreground truncate">Email, téléphone, ville</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground shrink-0" />
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
              <h2 className="text-xl font-semibold">Mon Profil</h2>
            </div>

            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-4 md:p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Nom complet</p>
                        <p className="font-semibold text-base">{profile.full_name || 'Non renseigné'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Mail className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Email</p>
                        <p className="font-medium text-base">{profile.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeSection === 'settings' && (
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
              <h2 className="text-xl font-semibold">Paramètres</h2>
            </div>

            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-4 md:p-6 space-y-6">
                {editingSettings ? (
                  <div className="space-y-4">
                    <div className="space-y-4">
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
                        <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié</p>
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
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button 
                        onClick={handleUpdateSettings} 
                        className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Enregistrer
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={cancelEditSettings} 
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
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Mail className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="font-medium">{profile.email}</p>
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

                      <div className="pt-2">
                        <LocationSelector />
                      </div>
                    </div>
                    
                    <Button
                      onClick={startEditSettings}
                      className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier mes paramètres
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

            <Suspense fallback={
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-center text-sm text-muted-foreground">Chargement des messages...</p>
                </CardContent>
              </Card>
            }>
              <BuyerMessages />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyerDashboard;