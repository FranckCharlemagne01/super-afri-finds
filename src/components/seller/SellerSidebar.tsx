import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  MessageSquare, 
  ShoppingCart, 
  Coins, 
  Settings,
  Store
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SellerSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  shopName?: string;
  collapsed?: boolean;
}

const menuItems = [
  { id: 'overview', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'products', label: 'Produits', icon: Package },
  { id: 'messages-orders', label: 'Messages & Commandes', icon: MessageSquare },
  { id: 'tokens', label: 'Jetons', icon: Coins },
  { id: 'shop-settings', label: 'Paramètres', icon: Settings },
];

export const SellerSidebar = ({ activeTab, onTabChange, shopName, collapsed = false }: SellerSidebarProps) => {
  return (
    <aside 
      className={cn(
        "sticky top-0 h-screen bg-card border-r border-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Shop Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0",
              collapsed && "w-8 h-8"
            )}>
              <Store className={cn("text-primary", collapsed ? "h-4 w-4" : "h-5 w-5")} />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-sm truncate">{shopName || 'Ma Boutique'}</h2>
                <p className="text-xs text-muted-foreground">Espace vendeur</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                "hover:bg-accent hover:text-accent-foreground",
                activeTab === item.id 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground",
                collapsed && "justify-center px-2"
              )}
            >
              <item.icon className={cn("flex-shrink-0", collapsed ? "h-5 w-5" : "h-4 w-4")} />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
};
