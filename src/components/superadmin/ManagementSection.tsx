import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, ShoppingBag, Store, Coins, Settings2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { OrdersManagement } from './OrdersManagement';
import { UsersManagement } from './UsersManagement';
import { TopSellersSection } from './TopSellersSection';
import { TokenStatsSuperAdmin } from '@/components/TokenStatsSuperAdmin';
import { TokenTransactionsSuperAdmin } from '@/components/TokenTransactionsSuperAdmin';
import { AdminTokenManagement } from './AdminTokenManagement';

interface ManagementSectionProps {
  orders: any[];
  users: any[];
  onRefresh: () => void;
}

export const ManagementSection = ({ orders, users, onRefresh }: ManagementSectionProps) => {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-8 w-1 bg-gradient-to-b from-amber-500 to-amber-500/50 rounded-full" />
        <h2 className="text-xl font-bold text-foreground">Gestion & Administration</h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList className="w-full flex flex-wrap gap-1 bg-muted/50 p-1.5 rounded-xl h-auto">
            {[
              { value: 'orders', icon: ShoppingBag, label: 'Commandes' },
              { value: 'users', icon: Users, label: 'Utilisateurs' },
              { value: 'sellers', icon: Store, label: 'Vendeurs' },
              { value: 'tokens', icon: Coins, label: 'Jetons' },
              { value: 'admin-tokens', icon: Settings2, label: 'Gérer jetons' },
            ].map(tab => (
              <TabsTrigger 
                key={tab.value} 
                value={tab.value} 
                className="flex-1 min-w-[100px] gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg py-2.5 transition-all"
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="orders" className="mt-4">
            <OrdersManagement orders={orders} onRefresh={onRefresh} />
          </TabsContent>

          <TabsContent value="users" className="mt-4">
            <UsersManagement users={users} />
          </TabsContent>

          <TabsContent value="sellers" className="mt-4">
            <TopSellersSection />
          </TabsContent>

          <TabsContent value="tokens" className="mt-4 space-y-6">
            <TokenStatsSuperAdmin />
            <TokenTransactionsSuperAdmin />
          </TabsContent>

          <TabsContent value="admin-tokens" className="mt-4">
            <AdminTokenManagement />
          </TabsContent>
        </Tabs>
      </motion.div>
    </section>
  );
};
