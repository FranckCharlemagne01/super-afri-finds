import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { DriverTab, DriverProfileData } from "@/pages/DriverDashboard";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  MapPin,
  Package,
  Wallet,
  UserCheck,
  User,
  Settings,
} from "lucide-react";

interface DriverSidebarProps {
  activeTab: DriverTab;
  onTabChange: (tab: DriverTab) => void;
  profile: DriverProfileData | null;
}

const tabs: { key: DriverTab; label: string; icon: React.ElementType }[] = [
  { key: 'overview', label: 'Tableau de bord', icon: LayoutDashboard },
  { key: 'missions', label: 'Missions disponibles', icon: MapPin },
  { key: 'deliveries', label: 'Mes livraisons', icon: Package },
  { key: 'earnings', label: 'Mes gains', icon: Wallet },
  { key: 'verification', label: 'Vérification', icon: UserCheck },
  { key: 'profile', label: 'Mon profil', icon: User },
  { key: 'settings', label: 'Paramètres', icon: Settings },
];

export const DriverSidebar = ({ activeTab, onTabChange, profile }: DriverSidebarProps) => {
  const isMobile = useIsMobile();

  const statusColor = profile?.driver_status === 'verified'
    ? 'bg-green-500/10 text-green-600 border-green-500/20'
    : profile?.driver_status === 'rejected'
    ? 'bg-destructive/10 text-destructive border-destructive/20'
    : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';

  const statusLabel = profile?.driver_status === 'verified'
    ? 'Vérifié'
    : profile?.driver_status === 'rejected'
    ? 'Rejeté'
    : 'En attente';

  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
        <div className="flex overflow-x-auto gap-1 px-2 py-2">
          {tabs.slice(0, 5).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={cn(
                  "flex flex-col items-center justify-center min-w-[60px] px-2 py-1.5 rounded-lg text-xs transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="truncate max-w-[56px]">{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <aside className="w-64 min-h-screen bg-card border-r border-border p-4 space-y-4">
      {/* Driver info */}
      <div className="text-center pb-4 border-b border-border">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
          <User className="w-8 h-8 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground text-sm">
          {profile?.full_name || 'Livreur'}
        </h3>
        <Badge variant="outline" className={cn("mt-1 text-xs", statusColor)}>
          {statusLabel}
        </Badge>
      </div>

      {/* Nav */}
      <nav className="space-y-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                isActive
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
