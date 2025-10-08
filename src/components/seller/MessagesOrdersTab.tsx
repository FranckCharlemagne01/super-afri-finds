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
    <Card className="border-0 shadow-lg">
      <Tabs defaultValue="orders" className="p-6">
        <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
          <TabsTrigger value="orders" className="gap-2">
            <ShoppingBag className="h-4 w-4" />
            Commandes
          </TabsTrigger>
          <TabsTrigger value="messages" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Messages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-6">
          <SellerOrders />
        </TabsContent>

        <TabsContent value="messages" className="mt-6">
          <SellerMessages />
        </TabsContent>
      </Tabs>
    </Card>
  );
};
