import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Package, MessageSquare, Coins,
  Settings, ChevronLeft, ChevronRight, Menu, X,
  Sun, Moon, LogOut, Store, ExternalLink, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

export type SellerSection = 'overview' | 'products' | 'messages-orders' | 'tokens' | 'settings';

interface NavItem {
  id: SellerSection;
  label: string;
  icon: React.ElementType;
  group: string;
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Ma Boutique', icon: LayoutDashboard, group: 'Principal' },
  { id: 'products', label: 'Produits', icon: Package, group: 'Principal' },
  { id: 'messages-orders', label: 'Commandes & Messages', icon: MessageSquare, group: 'Gestion' },
  { id: 'tokens', label: 'Jetons & Abonnement', icon: Coins, group: 'Gestion' },
  { id: 'settings', label: 'Paramètres', icon: Settings, group: 'Réglages' },
];

interface SellerSidebarProps {
  activeSection: SellerSection;
  onSectionChange: (section: SellerSection) => void;
  isDark: boolean;
  onToggleDark: () => void;
  onSignOut: () => void;
  shopName?: string;
  shopSlug?: string;
  shopLogoUrl?: string | null;
}

export const SellerSidebar = ({
  activeSection,
  onSectionChange,
  isDark,
  onToggleDark,
  onSignOut,
  shopName,
  shopSlug,
  shopLogoUrl,
}: SellerSidebarProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const groups = ['Principal', 'Gestion', 'Réglages'];

  const handleSelect = (section: SellerSection) => {
    onSectionChange(section);
    if (isMobile) setMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo / Brand */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
            {shopLogoUrl ? (
              <img src={shopLogoUrl} alt={shopName} className="w-full h-full object-cover" />
            ) : (
              <Store className="w-5 h-5 text-primary" />
            )}
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h2 className="text-sm font-bold text-foreground truncate">{shopName || 'Ma Boutique'}</h2>
              <p className="text-[11px] text-muted-foreground">Espace Vendeur</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
        {groups.map(group => {
          const items = navItems.filter(i => i.group === group);
          return (
            <div key={group}>
              {!collapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {group}
                </p>
              )}
              <div className="space-y-0.5">
                {items.map(item => {
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-primary/10 text-primary shadow-sm'
                          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                        collapsed && 'justify-center px-2'
                      )}
                    >
                      <item.icon className={cn('w-[18px] h-[18px] shrink-0', isActive && 'text-primary')} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="p-3 border-t border-border/50 space-y-2 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {/* Quick links */}
        {!collapsed && (
          <div className="space-y-1">
            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour au site</span>
            </button>
            {shopSlug && (
              <button
                onClick={() => navigate(`/boutique/${shopSlug}`)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Voir ma boutique</span>
              </button>
            )}
          </div>
        )}

        <button
          onClick={onToggleDark}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {!collapsed && <span>{isDark ? 'Clair' : 'Sombre'}</span>}
        </button>

        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>

        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center py-1.5 rounded-lg text-muted-foreground hover:bg-muted/60 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );

  // Mobile: overlay drawer
  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-card shadow-lg border border-border/50 text-foreground lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-72 bg-card shadow-2xl border-r border-border/50 animate-in slide-in-from-left duration-300">
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
              {sidebarContent}
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop: persistent sidebar
  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col bg-card border-r border-border/50 transition-all duration-300 shrink-0',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {sidebarContent}
    </aside>
  );
};
