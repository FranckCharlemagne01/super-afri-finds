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
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="min-w-[44px] min-h-[44px]"
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
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="messages" className="relative">
              <MessageSquare className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Messages</span>
              <span className="sm:hidden">Messages</span>
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 bg-promo text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="orders">
              <Package className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Commandes</span>
              <span className="sm:hidden">Commandes</span>
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Notifications</span>
              <span className="sm:hidden">Notifs</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="messages" className="mt-0">
            <BuyerMessages />
          </TabsContent>

          <TabsContent value="orders" className="mt-0">
            <MyOrders />
          </TabsContent>

          <TabsContent value="notifications" className="mt-0">
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Notifications</h3>
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
