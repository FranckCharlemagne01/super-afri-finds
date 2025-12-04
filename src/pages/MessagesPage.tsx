import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStableAuth } from "@/hooks/useStableAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BuyerMessages } from "@/components/BuyerMessages";
import { ArrowLeft, MessageSquare, Package, Bell } from "lucide-react";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import MyOrders from "@/pages/MyOrders";

const MessagesPage = () => {
  const { user } = useStableAuth();
  const navigate = useNavigate();
  const { unreadMessages } = useRealtimeNotifications();
  const [activeTab, setActiveTab] = useState("messages");

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8 page-transition">
      {/* Header - Style mobile native */}
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
              <h1 className="text-lg font-bold text-foreground">Messages & Activités</h1>
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
          {/* Tabs - Style app native */}
          <TabsList className="grid w-full grid-cols-3 mb-4 bg-muted/50 p-1 rounded-xl h-auto">
            <TabsTrigger 
              value="messages" 
              className="relative rounded-lg py-3 data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all"
            >
              <MessageSquare className="w-4 h-4 mr-1.5" />
              <span className="text-sm font-medium">Messages</span>
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
              <span className="text-sm font-medium">Commandes</span>
            </TabsTrigger>
            <TabsTrigger 
              value="notifications"
              className="rounded-lg py-3 data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all"
            >
              <Bell className="w-4 h-4 mr-1.5" />
              <span className="text-sm font-medium">Notifs</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="messages" className="mt-0 animate-fade-in">
            <BuyerMessages />
          </TabsContent>

          <TabsContent value="orders" className="mt-0 animate-fade-in">
            <MyOrders />
          </TabsContent>

          <TabsContent value="notifications" className="mt-0 animate-fade-in">
            <Card className="native-card">
              <CardContent className="p-10 text-center">
                <div className="w-16 h-16 mx-auto bg-muted/50 rounded-full flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold mb-2">Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Aucune notification pour le moment
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MessagesPage;
