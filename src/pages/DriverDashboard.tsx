import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStableAuth } from "@/hooks/useStableAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import { NativeHeader } from "@/components/NativeHeader";
import { toast } from "@/hooks/use-toast";
import { DriverSidebar } from "@/components/driver/DriverSidebar";
import { DriverOverview } from "@/components/driver/DriverOverview";
import { DriverMissions } from "@/components/driver/DriverMissions";
import { DriverDeliveries } from "@/components/driver/DriverDeliveries";
import { DriverEarnings } from "@/components/driver/DriverEarnings";
import { DriverVerification } from "@/components/driver/DriverVerification";
import { DriverProfile } from "@/components/driver/DriverProfile";
import { DriverSettings } from "@/components/driver/DriverSettings";

export type DriverTab = 'overview' | 'missions' | 'deliveries' | 'earnings' | 'profile' | 'settings';

export interface DriverProfileData {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  city: string;
  vehicle_type: string;
  driver_status: string;
  id_document_url: string | null;
  vehicle_photo_url: string | null;
  selfie_url: string | null;
  average_rating: number;
  total_deliveries: number;
  total_earnings: number;
}

const DriverDashboard = () => {
  const { user } = useStableAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<DriverTab>('overview');
  const [driverProfile, setDriverProfile] = useState<DriverProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchDriverProfile();
  }, [user]);

  const fetchDriverProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('driver_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setDriverProfile(data as DriverProfileData | null);
    } catch (err) {
      console.error('Error fetching driver profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return <DriverOverview profile={driverProfile} onNavigate={setActiveTab} />;
      case 'missions':
        return <DriverMissions profile={driverProfile} />;
      case 'deliveries':
        return <DriverDeliveries profile={driverProfile} />;
      case 'earnings':
        return <DriverEarnings profile={driverProfile} />;
      case 'profile':
        return <DriverProfile profile={driverProfile} onRefresh={fetchDriverProfile} />;
      case 'settings':
        return <DriverSettings />;
      default:
        return <DriverOverview profile={driverProfile} onNavigate={setActiveTab} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <>
      <SEOHead title="Tableau de bord Livreur | Djassa" description="Gérez vos livraisons et missions sur Djassa" />
      <NativeHeader title="Espace Livreur" showBack onBack={() => navigate('/')} />
      <div className="min-h-screen bg-background flex flex-col md:flex-row">
        <DriverSidebar activeTab={activeTab} onTabChange={setActiveTab} profile={driverProfile} />
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 overflow-y-auto">
          {renderTab()}
        </main>
      </div>
    </>
  );
};

export default DriverDashboard;
