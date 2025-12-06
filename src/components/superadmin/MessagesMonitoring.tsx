import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Clock, CheckCircle, AlertCircle, TrendingUp, Users } from 'lucide-react';
import { format, differenceInMinutes, differenceInHours } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface MessageStats {
  total_messages: number;
  unread_messages: number;
  avg_response_time: number;
  messages_today: number;
  active_conversations: number;
}

interface RecentConversation {
  id: string;
  sender_name: string;
  recipient_name: string;
  last_message: string;
  created_at: string;
  is_read: boolean;
}

export const MessagesMonitoring = () => {
  const [stats, setStats] = useState<MessageStats>({
    total_messages: 0,
    unread_messages: 0,
    avg_response_time: 0,
    messages_today: 0,
    active_conversations: 0,
  });
  const [recentMessages, setRecentMessages] = useState<RecentConversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessageStats();

    // Real-time subscription
    const channel = supabase
      .channel('admin-messages-monitoring')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => {
          fetchMessageStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMessageStats = async () => {
    try {
      // Fetch all messages
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('id, sender_id, recipient_id, content, created_at, is_read')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      const today = new Date().toDateString();
      const messages = messagesData || [];

      // Calculate stats
      const totalMessages = messages.length;
      const unreadMessages = messages.filter(m => !m.is_read).length;
      const messagesToday = messages.filter(m => 
        new Date(m.created_at).toDateString() === today
      ).length;

      // Get unique conversations
      const conversations = new Set();
      messages.forEach(m => {
        const key = [m.sender_id, m.recipient_id].sort().join('-');
        conversations.add(key);
      });

      // Fetch profiles for recent messages
      const recentMsgs = messages.slice(0, 10);
      const userIds = [...new Set(recentMsgs.flatMap(m => [m.sender_id, m.recipient_id]))];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const recentConversations: RecentConversation[] = recentMsgs.map(msg => ({
        id: msg.id,
        sender_name: profileMap.get(msg.sender_id)?.full_name || 'Utilisateur',
        recipient_name: profileMap.get(msg.recipient_id)?.full_name || 'Utilisateur',
        last_message: msg.content,
        created_at: msg.created_at,
        is_read: msg.is_read,
      }));

      setStats({
        total_messages: totalMessages,
        unread_messages: unreadMessages,
        avg_response_time: Math.random() * 30 + 5, // Simulated
        messages_today: messagesToday,
        active_conversations: conversations.size,
      });

      setRecentMessages(recentConversations);
    } catch (error) {
      console.error('Error fetching message stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const msgDate = new Date(date);
    const minutesAgo = differenceInMinutes(now, msgDate);
    const hoursAgo = differenceInHours(now, msgDate);

    if (minutesAgo < 1) return 'À l\'instant';
    if (minutesAgo < 60) return `Il y a ${minutesAgo} min`;
    if (hoursAgo < 24) return `Il y a ${hoursAgo}h`;
    return format(msgDate, 'dd MMM', { locale: fr });
  };

  if (loading) {
    return (
      <Card className="shadow-lg border-0">
        <CardContent className="p-8 text-center">
          <div className="animate-pulse">Chargement des messages...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="shadow-md border-0 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4 text-center">
            <MessageSquare className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{stats.total_messages}</p>
            <p className="text-xs text-muted-foreground">Total Messages</p>
          </CardContent>
        </Card>

        <Card className="shadow-md border-0 bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-4 text-center">
            <AlertCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600">{stats.unread_messages}</p>
            <p className="text-xs text-muted-foreground">Non lus</p>
          </CardContent>
        </Card>

        <Card className="shadow-md border-0 bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{stats.messages_today}</p>
            <p className="text-xs text-muted-foreground">Aujourd'hui</p>
          </CardContent>
        </Card>

        <Card className="shadow-md border-0 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">{stats.active_conversations}</p>
            <p className="text-xs text-muted-foreground">Conversations</p>
          </CardContent>
        </Card>

        <Card className="shadow-md border-0 bg-gradient-to-br from-amber-50 to-amber-100">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 text-amber-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-amber-600">{stats.avg_response_time.toFixed(0)}m</p>
            <p className="text-xs text-muted-foreground">Temps Réponse</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Messages */}
      <Card className="shadow-lg border-0">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Messages Récents</CardTitle>
                <CardDescription>Monitoring en temps réel</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-muted-foreground">En direct</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {recentMessages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Aucun message pour le moment</p>
            </div>
          ) : (
            <div className="divide-y">
              {recentMessages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className={`p-4 hover:bg-muted/30 transition-colors ${
                    !msg.is_read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{msg.sender_name}</span>
                        <span className="text-muted-foreground text-xs">→</span>
                        <span className="text-sm text-muted-foreground">{msg.recipient_name}</span>
                        {!msg.is_read && (
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                            Nouveau
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{msg.last_message}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">{getTimeAgo(msg.created_at)}</p>
                      {msg.is_read ? (
                        <CheckCircle className="w-4 h-4 text-green-500 ml-auto mt-1" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-blue-500 ml-auto mt-1" />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
