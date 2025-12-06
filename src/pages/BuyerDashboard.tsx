import { useState, useEffect, lazy, Suspense } from 'react';
import { useStableAuth } from '@/hooks/useStableAuth';
import { useStableRole } from '@/hooks/useStableRole';
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
  const { role, loading: roleLoading, isSeller } = useStableRole();
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
    navigate('/marketplace');
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

  // Redirection automatique : vendeurs vers leur tableau de bord vendeur
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
      return;
    }

    // Si l'utilisateur est vendeur, le rediriger vers son tableau de bord vendeur
    if (user && !roleLoading && isSeller) {
      navigate('/seller-dashboard', { replace: true });
    }
  }, [user, authLoading, roleLoading, isSeller, navigate]);

  // Show skeleton while loading auth or profile
  if (authLoading || loadingProfile) {
    return <DashboardSkeleton />;
  }

  // Don't render anything if no user (during redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <div className="max-w-lg mx-auto lg:max-w-6xl px-4 py-3 lg:px-8 lg:py-8 safe-area-inset-top">
        {/* Header Mobile & Tablet - Style App Native */}
        <div className="lg:hidden mb-5">
          <div className="flex items-center justify-between py-2">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Mon Djassa</h1>
              <p className="text-sm text-muted-foreground mt-0.5 truncate">
                Bonjour{profile.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''} 👋
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleViewPublicPage}
                className="h-11 w-11 rounded-xl bg-muted/50 hover:bg-muted active:scale-95 transition-all"
              >
                <Store className="h-5 w-5 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="h-11 w-11 rounded-xl bg-red-50 hover:bg-red-100 active:scale-95 transition-all"
              >
                <LogOut className="h-5 w-5 text-red-500" />
              </Button>
            </div>
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
            {/* Profile Summary Card - Style App Native */}
            <div className="bg-gradient-to-br from-primary via-primary to-primary-hover rounded-2xl p-4 mb-4 shadow-lg overflow-hidden relative">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgyMHYyMEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')] opacity-50" />
              <div className="flex items-center gap-4 relative">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shrink-0 border border-white/20">
                  <User className="w-8 h-8 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-primary-foreground truncate">
                    {profile.full_name || 'Compléter le profil'}
                  </h3>
                  <p className="text-sm text-primary-foreground/80 flex items-center gap-1.5 truncate mt-0.5">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{profile.email}</span>
                  </p>
                  {profile.phone && (
                    <p className="text-sm text-primary-foreground/80 flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      {profile.phone}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setActiveSection('profile')}
                  className="h-11 w-11 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-primary-foreground shrink-0 transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Quick Stats - Style App Native */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm active:scale-[0.98] transition-transform">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground tabular-nums">{orders.length}</div>
                    <p className="text-xs text-muted-foreground font-medium">Commandes</p>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm active:scale-[0.98] transition-transform">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                    <Package className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground tabular-nums">
                      {orders.filter(order => ['pending', 'confirmed', 'shipped'].includes(order.status)).length}
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">En cours</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Dashboard - Style App Native */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1 mb-3">
                Navigation
              </p>
              
              {/* Menu Items - Unified Style */}
              <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
                <button 
                  className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 active:bg-muted transition-all text-left border-b border-border/50"
                  onClick={() => setActiveSection('orders')}
                >
                  <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-foreground">Mes Commandes</h4>
                    <p className="text-xs text-muted-foreground">Suivi et historique</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                </button>

                <button 
                  className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 active:bg-muted transition-all text-left border-b border-border/50"
                  onClick={() => navigate('/favorites')}
                >
                  <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                    <Heart className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-foreground">Mes Favoris</h4>
                    <p className="text-xs text-muted-foreground">Produits sauvegardés</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                </button>

                <button 
                  className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 active:bg-muted transition-all text-left border-b border-border/50"
                  onClick={() => navigate('/cart')}
                >
                  <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                    <ShoppingCart className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-foreground">Mon Panier</h4>
                    <p className="text-xs text-muted-foreground">Articles en attente</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                </button>

                <button 
                  className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 active:bg-muted transition-all text-left border-b border-border/50"
                  onClick={() => setActiveSection('messages')}
                >
                  <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center relative shrink-0">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                    <MessageNotificationBadge />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-foreground">Mes Messages</h4>
                    <p className="text-xs text-muted-foreground">Conversations vendeurs</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                </button>

                <button 
                  className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 active:bg-muted transition-all text-left"
                  onClick={() => setActiveSection('settings')}
                >
                  <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                    <Settings className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-foreground">Paramètres</h4>
                    <p className="text-xs text-muted-foreground">Email, téléphone, ville</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                </button>
              </div>
            </div>
          </>
        )}

        {activeSection === 'profile' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActiveSection('dashboard')}
                className="h-10 w-10 rounded-xl bg-muted/50 hover:bg-muted shrink-0"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </Button>
              <h2 className="text-xl font-bold text-foreground">Mon Profil</h2>
            </div>

            <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl">
                  <div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center shrink-0">
                    <User className="w-7 h-7 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5 font-medium">Nom complet</p>
                    <p className="font-bold text-foreground truncate">{profile.full_name || 'Non renseigné'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
                  <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                    <Mail className="w-7 h-7 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5 font-medium">Email</p>
                    <p className="font-medium text-foreground truncate">{profile.email}</p>
                  </div>
                </div>
              </div>
            </div>
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