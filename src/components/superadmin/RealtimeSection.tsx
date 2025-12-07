import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Clock, Users, Zap, AlertCircle, CheckCircle, Store } from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface RecentMessage {
  id: string;
  sender_name: string;
  recipient_name: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface RecentUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

export const RealtimeSection = () => {
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [activeSellers, setActiveSellers] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRealtimeData();

    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => fetchRealtimeData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchRealtimeData = async () => {
    try {
      // Fetch recent messages
      const { data: messagesData } = await supabase
        .from('messages')
        .select('id, sender_id, recipient_id, content, created_at, is_read')
        .order('created_at', { ascending: false })
        .limit(8);

      // Fetch users with roles
      const { data: usersData } = await supabase.rpc('get_users_with_profiles');

      const users = usersData || [];
      const profileMap = new Map(users.map((u: any) => [u.user_id, u]));

      // Map messages with names
      const messages = (messagesData || []).map(msg => ({
        id: msg.id,
        sender_name: profileMap.get(msg.sender_id)?.full_name || 'Utilisateur',
        recipient_name: profileMap.get(msg.recipient_id)?.full_name || 'Utilisateur',
        content: msg.content,
        created_at: msg.created_at,
        is_read: msg.is_read,
      }));

      // Recent users (last 24h)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recent = users
        .filter((u: any) => new Date(u.created_at) >= oneDayAgo)
        .slice(0, 6)
        .map((u: any) => ({
          id: u.user_id,
          full_name: u.full_name || 'Utilisateur',
          email: u.email || '',
          role: u.role,
          created_at: u.created_at,
        }));

      // Count active sellers (with products)
      const { count } = await supabase
        .from('products')
        .select('seller_id', { count: 'exact', head: true })
        .eq('is_active', true);

      setRecentMessages(messages);
      setRecentUsers(recent);
      setActiveSellers(count || 0);
    } catch (error) {
      console.error('Error fetching realtime data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (date: string) => {
    const minutes = differenceInMinutes(new Date(), new Date(date));
    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (minutes < 1440) return `Il y a ${Math.floor(minutes / 60)}h`;
    return format(new Date(date), 'dd MMM', { locale: fr });
  };

  if (loading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-1 bg-gradient-to-b from-red-500 to-red-500/50 rounded-full" />
          <h2 className="text-xl font-bold text-foreground">Temps Réel</h2>
        </div>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="animate-pulse">Chargement...</div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-8 w-1 bg-gradient-to-b from-red-500 to-red-500/50 rounded-full" />
        <h2 className="text-xl font-bold text-foreground">Temps Réel</h2>
        <div className="flex items-center gap-2 ml-auto">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">En direct</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Messages */}
        <Card className="border-0 shadow-lg lg:col-span-2">
          <CardHeader className="border-b bg-muted/20 pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              Messages Récents
              <Badge variant="secondary" className="ml-auto">{recentMessages.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-[400px] overflow-y-auto">
            {recentMessages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucun message récent</p>
              </div>
            ) : (
              <div className="divide-y">
                {recentMessages.map((msg, idx) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                    className={`p-4 hover:bg-muted/30 transition-colors ${!msg.is_read ? 'bg-blue-50/50' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm truncate">{msg.sender_name}</span>
                          <span className="text-muted-foreground text-xs">→</span>
                          <span className="text-sm text-muted-foreground truncate">{msg.recipient_name}</span>
                          {!msg.is_read && <Badge className="text-xs bg-blue-100 text-blue-700">Nouveau</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{msg.content}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">{getTimeAgo(msg.created_at)}</p>
                        {msg.is_read ? <CheckCircle className="w-4 h-4 text-green-500 ml-auto mt-1" /> : <AlertCircle className="w-4 h-4 text-blue-500 ml-auto mt-1" />}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Active Sellers Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100/50">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500 shadow-md">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vendeurs Actifs</p>
                <p className="text-3xl font-bold text-emerald-600">{activeSellers}</p>
              </div>
            </CardContent>
          </Card>

          {/* Recently Connected Users */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-muted/20 pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500">
                  <Users className="w-4 h-4 text-white" />
                </div>
                Nouveaux Utilisateurs (24h)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-[280px] overflow-y-auto">
              {recentUsers.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Aucun nouvel utilisateur</p>
                </div>
              ) : (
                <div className="divide-y">
                  {recentUsers.map((user, idx) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.05 }}
                      className="p-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{user.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0 capitalize">
                          {user.role === 'seller' ? 'Vendeur' : 'Acheteur'}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
