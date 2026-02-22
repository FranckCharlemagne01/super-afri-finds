import { useState, useEffect, lazy, Suspense, useMemo } from 'react';
import { useStableAuth } from '@/hooks/useStableAuth';
import { useStableRole } from '@/hooks/useStableRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBuyerProfile } from '@/hooks/useBuyerProfile';
import { DashboardSkeleton } from '@/components/buyer/DashboardSkeleton';
import { isDashboardCached } from '@/hooks/useDashboardPrefetch';
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
  ChevronRight,
  Sparkles,
  LayoutDashboard,
  ArrowLeft
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
import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { useNavigate } from 'react-router-dom';
import { SellerUpgradeForm } from '@/components/SellerUpgradeForm';
import { useIsMobile } from '@/hooks/use-mobile';

// Lazy load heavy components
const BuyerMessages = lazy(() => import('@/components/BuyerMessages').then(module => ({ default: module.BuyerMessages })));

// Lazy load notification components
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { RealtimeNotificationBadge } from '@/components/RealtimeNotificationBadge';
import { LocationSelector } from '@/components/LocationSelector';

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
  pending: { label: "En attente", color: "text-orange-500", bgColor: "bg-orange-100 dark:bg-orange-900/30" },
  confirmed: { label: "Confirmée", color: "text-blue-500", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  shipped: { label: "Expédiée", color: "text-purple-500", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
  delivered: { label: "Livrée", color: "text-green-500", bgColor: "bg-green-100 dark:bg-green-900/30" },
  cancelled: { label: "Annulée", color: "text-red-500", bgColor: "bg-red-100 dark:bg-red-900/30" },
};

const MessageNotificationBadge = () => {
  const { unreadMessages } = useRealtimeNotifications();
  return <RealtimeNotificationBadge count={unreadMessages} />;
};

// Desktop sidebar navigation items
const sidebarItems = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'orders', label: 'Mes Commandes', icon: Package },
  { id: 'messages', label: 'Mes Messages', icon: MessageSquare },
  { id: 'profile', label: 'Mon Profil', icon: User },
  { id: 'settings', label: 'Paramètres', icon: Settings },
];

const BuyerDashboard = () => {
  const { user, loading: authLoading, signOut, userId } = useStableAuth();
  const { role, loading: roleLoading, isSeller } = useStableRole();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { profile, orders, loadingProfile, updateProfile, cancelOrder } = useBuyerProfile(user?.id);
  const [editingProfile, setEditingProfile] = useState(false);
  const [updatedProfile, setUpdatedProfile] = useState<UserProfile>({ full_name: '', phone: '', email: '' });
  const [activeSection, setActiveSection] = useState('dashboard');
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [editingSettings, setEditingSettings] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  
  const hasPrefetchedData = useMemo(() => {
    return userId ? isDashboardCached(userId, false) : false;
  }, [userId]);

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

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
      return;
    }
    if (user && !roleLoading && isSeller) {
      navigate('/seller-dashboard', { replace: true });
    }
  }, [user, authLoading, roleLoading, isSeller, navigate]);

  if (!hasPrefetchedData && (authLoading || loadingProfile)) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return null;
  }

  const sectionTitles: Record<string, string> = {
    dashboard: 'Tableau de bord',
    orders: 'Mes Commandes',
    messages: 'Mes Messages',
    profile: 'Mon Profil',
    settings: 'Paramètres',
  };

  return (
    <div className="min-h-screen bg-background lg:flex lg:overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-[240px] bg-card border-r border-border/50 shrink-0">
        <div className="flex flex-col h-full">
          {/* Brand */}
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="overflow-hidden">
                <h2 className="text-sm font-bold text-foreground truncate">{profile.full_name || 'Mon Compte'}</h2>
                <p className="text-[11px] text-muted-foreground">Espace Client</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
            {sidebarItems.map(item => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary/10 text-primary shadow-sm'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  }`}
                >
                  <item.icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-primary' : ''}`} />
                  <span className="truncate">{item.label}</span>
                  {item.id === 'messages' && <MessageNotificationBadge />}
                </button>
              );
            })}
          </nav>

          {/* Bottom actions */}
          <div className="p-3 border-t border-border/50 space-y-1">
            <button
              onClick={handleViewPublicPage}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour au site</span>
            </button>
            <button
              onClick={() => setShowUpgradeDialog(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              <Store className="w-4 h-4" />
              <span>Devenir vendeur</span>
              <Sparkles className="w-3 h-3 ml-auto" />
            </button>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col overflow-x-hidden overscroll-contain [-webkit-overflow-scrolling:touch] pb-20 lg:pb-0 lg:flex-1 lg:min-h-0 lg:overflow-y-auto">
        {/* Desktop Top Bar */}
        <header className="hidden lg:block sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border/50">
          <div className="flex items-center justify-between px-8 h-14">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-foreground">{sectionTitles[activeSection]}</h1>
              <Badge className="bg-primary/10 text-primary border-0 text-[10px] font-semibold">Client</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={handleViewPublicPage} className="gap-2 text-muted-foreground hover:text-foreground">
              <Store className="w-4 h-4" />
              <span className="text-xs">Marketplace</span>
            </Button>
          </div>
        </header>

        {/* Mobile Content */}
        <div className="max-w-lg mx-auto lg:max-w-7xl w-full px-4 py-3 lg:px-8 lg:py-6 safe-area-inset-top">
          {/* Header Mobile & Tablet */}
          <div className="lg:hidden mb-5">
            <div className="flex items-center justify-between py-2">
              {activeSection === 'dashboard' ? (
                <>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Mon Djassa</h1>
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">
                      Bonjour{profile.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''} 👋
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="icon" onClick={handleViewPublicPage}
                      className="h-11 w-11 rounded-xl bg-muted/50 hover:bg-muted active:scale-95 transition-all">
                      <Store className="h-5 w-5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleSignOut}
                      className="h-11 w-11 rounded-xl bg-destructive/10 hover:bg-destructive/20 active:scale-95 transition-all">
                      <LogOut className="h-5 w-5 text-destructive" />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => setActiveSection('dashboard')}
                      className="h-10 w-10 rounded-xl bg-muted/50 hover:bg-muted shrink-0">
                      <ChevronRight className="w-5 h-5 rotate-180" />
                    </Button>
                    <h2 className="text-xl font-bold text-foreground">{sectionTitles[activeSection]}</h2>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Dashboard Home */}
          {activeSection === 'dashboard' && (
            <>
              {/* Profile Summary Card */}
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
                  <Button variant="ghost" size="icon" onClick={() => setActiveSection('profile')}
                    className="h-11 w-11 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-primary-foreground shrink-0 transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <Card className="rounded-2xl border-border/50 shadow-sm active:scale-[0.98] transition-transform">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center shrink-0">
                        <Package className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-foreground tabular-nums">{orders.length}</div>
                        <p className="text-xs text-muted-foreground font-medium">Commandes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-border/50 shadow-sm active:scale-[0.98] transition-transform">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center shrink-0">
                        <Package className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-foreground tabular-nums">
                          {orders.filter(order => ['pending', 'confirmed', 'shipped'].includes(order.status)).length}
                        </div>
                        <p className="text-xs text-muted-foreground font-medium">En cours</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Menu Dashboard - Mobile style on mobile, grid on desktop */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1 mb-3">Navigation</p>
                
                {/* Mobile: stacked list / Desktop: hidden (use sidebar) */}
                <div className="lg:hidden">
                  <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
                    <button className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 active:bg-muted transition-all text-left border-b border-border/50"
                      onClick={() => setActiveSection('orders')}>
                      <div className="w-11 h-11 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-foreground">Mes Commandes</h4>
                        <p className="text-xs text-muted-foreground">Suivi et historique</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                    </button>

                    <button className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 active:bg-muted transition-all text-left border-b border-border/50"
                      onClick={() => navigate('/favorites')}>
                      <div className="w-11 h-11 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center shrink-0">
                        <Heart className="w-5 h-5 text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-foreground">Mes Favoris</h4>
                        <p className="text-xs text-muted-foreground">Produits sauvegardés</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                    </button>

                    <button className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 active:bg-muted transition-all text-left border-b border-border/50"
                      onClick={() => navigate('/cart')}>
                      <div className="w-11 h-11 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center shrink-0">
                        <ShoppingCart className="w-5 h-5 text-orange-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-foreground">Mon Panier</h4>
                        <p className="text-xs text-muted-foreground">Articles en attente</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                    </button>

                    <button className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 active:bg-muted transition-all text-left border-b border-border/50"
                      onClick={() => setActiveSection('messages')}>
                      <div className="w-11 h-11 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center relative shrink-0">
                        <MessageSquare className="w-5 h-5 text-purple-600" />
                        <MessageNotificationBadge />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-foreground">Mes Messages</h4>
                        <p className="text-xs text-muted-foreground">Conversations vendeurs</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                    </button>

                    <button className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 active:bg-muted transition-all text-left bg-gradient-to-r from-primary/5 to-primary/10"
                      onClick={() => setShowUpgradeDialog(true)}>
                      <div className="w-11 h-11 bg-gradient-to-br from-primary to-primary-hover rounded-xl flex items-center justify-center shrink-0 shadow-md">
                        <Store className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                          Devenir vendeur <Sparkles className="w-4 h-4 text-primary" />
                        </h4>
                        <p className="text-xs text-muted-foreground">28 jours d'essai gratuit</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-primary shrink-0" />
                    </button>
                  </Card>
                </div>

                {/* Desktop: Quick action cards grid */}
                <div className="hidden lg:grid grid-cols-3 gap-4">
                  <Card className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setActiveSection('orders')}>
                    <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                      <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                        <Package className="w-7 h-7 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">Mes Commandes</h4>
                        <p className="text-xs text-muted-foreground mt-1">Suivi et historique</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate('/favorites')}>
                    <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                      <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center">
                        <Heart className="w-7 h-7 text-red-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">Mes Favoris</h4>
                        <p className="text-xs text-muted-foreground mt-1">Produits sauvegardés</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate('/cart')}>
                    <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                      <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center">
                        <ShoppingCart className="w-7 h-7 text-orange-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">Mon Panier</h4>
                        <p className="text-xs text-muted-foreground mt-1">Articles en attente</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Upgrade Dialog */}
              {isMobile ? (
                <Drawer open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
                  <DrawerContent className="h-[95vh] max-h-[95vh]">
                    <SellerUpgradeForm 
                      onSuccess={() => setShowUpgradeDialog(false)} 
                      onCancel={() => setShowUpgradeDialog(false)}
                    />
                  </DrawerContent>
                </Drawer>
              ) : (
                <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
                  <DialogContent className="sm:max-w-md max-h-[90vh] overflow-hidden p-0">
                    <SellerUpgradeForm 
                      onSuccess={() => setShowUpgradeDialog(false)} 
                      onCancel={() => setShowUpgradeDialog(false)}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </>
          )}

          {/* Profile Section */}
          {activeSection === 'profile' && (
            <div className="space-y-4 pb-8">
              <Card className="rounded-2xl border-border/50 shadow-sm">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl">
                    <div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center shrink-0">
                      <User className="w-7 h-7 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground mb-0.5 font-medium">Nom complet</p>
                      <p className="font-bold text-foreground truncate">{profile.full_name || 'Non renseigné'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center shrink-0">
                      <Mail className="w-7 h-7 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground mb-0.5 font-medium">Email</p>
                      <p className="font-medium text-foreground truncate">{profile.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Settings Section */}
          {activeSection === 'settings' && (
            <div className="space-y-4">
              <Card className="border-border/50 shadow-sm rounded-2xl">
                <CardContent className="p-4 md:p-6 space-y-6">
                  {editingSettings ? (
                    <div className="space-y-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                            <Mail className="w-4 h-4" /> Email
                          </Label>
                          <Input id="email" value={updatedProfile.email} disabled
                            className="h-12 rounded-xl bg-muted border-border/50" />
                          <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium">
                            <Phone className="w-4 h-4" /> Téléphone
                          </Label>
                          <Input id="phone" value={updatedProfile.phone}
                            onChange={(e) => setUpdatedProfile({ ...updatedProfile, phone: e.target.value })}
                            placeholder="Votre numéro de téléphone" className="h-12 rounded-xl border-border/50" />
                        </div>
                      </div>
                      <div className="flex gap-3 pt-4">
                        <Button onClick={handleUpdateSettings} className="flex-1 h-12 rounded-xl">
                          <Save className="h-4 w-4 mr-2" /> Enregistrer
                        </Button>
                        <Button variant="outline" onClick={cancelEditSettings} className="h-12 px-6 rounded-xl border-border/50">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                              <Mail className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Email</p>
                              <p className="font-medium text-foreground">{profile.email}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                              <Phone className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Téléphone</p>
                              <p className="font-medium text-foreground">{profile.phone || 'Non renseigné'}</p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2">
                          <LocationSelector />
                        </div>
                      </div>
                      
                      <Button onClick={startEditSettings} className="w-full h-12 rounded-xl">
                        <Edit className="h-4 w-4 mr-2" /> Modifier mes paramètres
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Orders Section */}
          {activeSection === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between lg:mb-2">
                <Badge className="bg-primary text-primary-foreground">
                  {orders.length} commande{orders.length > 1 ? 's' : ''}
                </Badge>
              </div>

              {orders.length === 0 ? (
                <Card className="border-border/50 shadow-sm rounded-2xl">
                  <CardContent className="text-center py-12">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Package className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-foreground">Aucune commande</h3>
                    <p className="text-muted-foreground mb-6">Vous n'avez pas encore passé de commande</p>
                    <Button onClick={() => navigate('/')} className="h-12 px-8 rounded-xl">
                      Découvrir nos produits
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                  {orders.map((order) => {
                    const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
                    const canCancel = order.status === 'pending' || order.status === 'confirmed';
                    
                    return (
                      <Card key={order.id} className="border-border/50 shadow-sm rounded-2xl">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-medium text-sm text-foreground">#{order.id.slice(-8)}</h4>
                              <p className="text-xs text-muted-foreground">
                                {new Date(order.created_at).toLocaleDateString('fr-FR', {
                                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <Badge className={`${statusInfo.bgColor} ${statusInfo.color} text-xs px-2 py-1 rounded-full border-0`}>
                              {statusInfo.label}
                            </Badge>
                          </div>
                          
                          <div className="mb-3">
                            <h3 className="font-medium text-sm text-foreground">{order.product_title}</h3>
                            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                              <span>Qté: {order.quantity}</span>
                              <span>{order.product_price.toLocaleString()} FCFA/u</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-border/50">
                            <div>
                              <span className="text-sm font-medium text-foreground">Total</span>
                              <div className="text-lg font-bold text-primary">
                                {order.total_amount.toLocaleString()} FCFA
                              </div>
                            </div>
                            {canCancel && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" disabled={cancellingOrderId === order.id}
                                    className="text-destructive border-destructive/20 hover:bg-destructive/10 h-8 px-3 text-xs">
                                    {cancellingOrderId === order.id ? (
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-destructive"></div>
                                    ) : (
                                      <><X className="w-3 h-3 mr-1" />Annuler</>
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
                                    <AlertDialogCancel className="w-full sm:w-auto">Non, garder</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleCancelOrder(order.id)}
                                      className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90">
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

          {/* Messages Section */}
          {activeSection === 'messages' && (
            <div className="space-y-4">
              <Suspense fallback={
                <Card className="border-border/50 shadow-sm rounded-2xl">
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
    </div>
  );
};

export default BuyerDashboard;
