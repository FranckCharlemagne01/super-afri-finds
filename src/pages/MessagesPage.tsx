import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useStableAuth } from "@/hooks/useStableAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MyMessagesTabs } from "@/components/messages/MyMessagesTabs";
import { MyOrdersTabs } from "@/components/orders/MyOrdersTabs";
import { ArrowLeft, MessageSquare, Package } from "lucide-react";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";

const MessagesPage = () => {
  const { user } = useStableAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { unreadMessages } = useRealtimeNotifications();
  const conversationUserId = searchParams.get('conversation');
  const highlightMessageId = searchParams.get('message');
  const [activeTab, setActiveTab] = useState("messages");

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8 page-transition">
      {/* Header */}
      <header className="native-header">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="rounded-xl h-11 w-11 active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground">Messages & Commandes</h1>
              <p className="text-xs text-muted-foreground">
                Gérez vos conversations et commandes
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/50 p-1 rounded-xl h-auto">
            <TabsTrigger
              value="messages"
              className="relative rounded-lg py-3 data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all"
            >
              <MessageSquare className="w-4 h-4 mr-1.5" />
              <span className="text-sm font-bold">Messages</span>
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="orders"
              className="rounded-lg py-3 data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all"
            >
              <Package className="w-4 h-4 mr-1.5" />
              <span className="text-sm font-bold">Commandes</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="messages" className="mt-0 animate-fade-in">
            <MyMessagesTabs initialTab="purchases" autoOpenConversation={conversationUserId} />
          </TabsContent>

          <TabsContent value="orders" className="mt-0 animate-fade-in">
            <MyOrdersTabs initialTab="purchases" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MessagesPage;
