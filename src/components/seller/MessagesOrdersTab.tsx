import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { MessageSquare, ShoppingBag } from 'lucide-react';
import { SellerMessages } from '@/components/SellerMessages';
import { SellerOrders } from '@/components/SellerOrders';

interface MessagesOrdersTabProps {
  userId: string;
}

export const MessagesOrdersTab = ({ userId }: MessagesOrdersTabProps) => {
  return (
    <Card className="border-0 shadow-lg overflow-hidden relative group animate-in fade-in-0 duration-500">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <Tabs defaultValue="orders" className="p-4 md:p-6 relative">
        <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto bg-muted/50 backdrop-blur-sm">
          <TabsTrigger value="orders" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Commandes</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Messages</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-4 md:mt-6">
          <SellerOrders />
        </TabsContent>

        <TabsContent value="messages" className="mt-4 md:mt-6">
          <SellerMessages />
        </TabsContent>
      </Tabs>
    </Card>
  );
};
