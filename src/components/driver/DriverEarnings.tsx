import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useStableAuth } from "@/hooks/useStableAuth";
import { DriverProfileData } from "@/pages/DriverDashboard";
import { Wallet, TrendingUp, CalendarDays, Loader2 } from "lucide-react";

interface Props {
  profile: DriverProfileData | null;
}

export const DriverEarnings = ({ profile }: Props) => {
  const { user } = useStableAuth();
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [weekEarnings, setWeekEarnings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchEarnings();
  }, [user]);

  const fetchEarnings = async () => {
    if (!user) return;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);

      const { data: todayData } = await supabase
        .from('delivery_missions')
        .select('fee')
        .eq('driver_id', user.id)
        .eq('status', 'delivered')
        .gte('delivered_at', today.toISOString());

      const { data: weekData } = await supabase
        .from('delivery_missions')
        .select('fee')
        .eq('driver_id', user.id)
        .eq('status', 'delivered')
        .gte('delivered_at', weekAgo.toISOString());

      setTodayEarnings((todayData || []).reduce((sum, m) => sum + (m.fee || 0), 0));
      setWeekEarnings((weekData || []).reduce((sum, m) => sum + (m.fee || 0), 0));
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">Mes gains</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 text-center">
            <CalendarDays className="w-8 h-8 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold text-foreground">{todayEarnings.toLocaleString()} F</p>
            <p className="text-sm text-muted-foreground">Aujourd'hui</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <TrendingUp className="w-8 h-8 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold text-foreground">{weekEarnings.toLocaleString()} F</p>
            <p className="text-sm text-muted-foreground">Cette semaine</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <Wallet className="w-8 h-8 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold text-foreground">{(profile?.total_earnings || 0).toLocaleString()} F</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
