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
    <Card className="border-0 shadow-lg overflow-hidden animate-in fade-in-0 duration-500 rounded-2xl">
      <Tabs defaultValue="orders" className="p-3 md:p-5">
        <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto bg-muted/50 backdrop-blur-sm rounded-xl h-auto p-1">
          <TabsTrigger value="orders" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all rounded-lg py-2 text-xs md:text-sm">
            <ShoppingBag className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span>Commandes</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all rounded-lg py-2 text-xs md:text-sm">
            <MessageSquare className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span>Messages</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-3 md:mt-4">
          <SellerOrders />
        </TabsContent>

        <TabsContent value="messages" className="mt-3 md:mt-4">
          <SellerMessages />
        </TabsContent>
      </Tabs>
    </Card>
  );
};
