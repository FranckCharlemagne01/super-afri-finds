import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  Area,
  AreaChart,
  Legend,
  Tooltip
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, PieChartIcon, Users, Activity } from 'lucide-react';

interface ChartsData {
  registrationData: Array<{ date: string; count: number }>;
  salesData: Array<{ date: string; amount: number; orders: number }>;
  orderStatusData: Array<{ name: string; value: number; color: string }>;
  sellerPerformanceData: Array<{ name: string; sales: number }>;
  hourlyActivityData: Array<{ hour: string; visits: number; orders: number }>;
}

const chartConfig = {
  registrations: { label: 'Inscriptions', color: 'hsl(217, 91%, 60%)' },
  sales: { label: 'Ventes', color: 'hsl(142, 76%, 36%)' },
  orders: { label: 'Commandes', color: 'hsl(262, 83%, 58%)' },
  visits: { label: 'Visites', color: 'hsl(199, 89%, 48%)' },
};

const ChartCard = ({ 
  title, 
  icon: Icon, 
  iconColor,
  children, 
  delay = 0 
}: { 
  title: string; 
  icon: React.ElementType;
  iconColor: string;
  children: React.ReactNode; 
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
  >
    <Card className="shadow-lg border-0 bg-card overflow-hidden">
      <CardHeader className="pb-2 border-b bg-muted/20">
        <CardTitle className="text-base font-semibold flex items-center gap-3">
          <div className={`p-2 rounded-lg ${iconColor}`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {children}
      </CardContent>
    </Card>
  </motion.div>
);

export const VerticalChartsSection = ({
  registrationData,
  salesData,
  orderStatusData,
  sellerPerformanceData,
  hourlyActivityData
}: ChartsData) => {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-8 w-1 bg-gradient-to-b from-emerald-500 to-emerald-500/50 rounded-full" />
        <h2 className="text-xl font-bold text-foreground">Analytique</h2>
      </div>

      <div className="space-y-6">
        {/* Inscriptions Chart - Full Width */}
        <ChartCard title="Inscriptions (30 derniers jours)" icon={TrendingUp} iconColor="bg-blue-500" delay={0.1}>
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <AreaChart data={registrationData}>
              <defs>
                <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
              <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} className="fill-muted-foreground" />
              <YAxis fontSize={11} tickLine={false} axisLine={false} className="fill-muted-foreground" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="count" stroke="hsl(217, 91%, 60%)" strokeWidth={2} fill="url(#colorReg)" name="registrations" />
            </AreaChart>
          </ChartContainer>
        </ChartCard>

        {/* Sales Chart - Full Width */}
        <ChartCard title="Revenus Mensuels (30 jours)" icon={BarChart3} iconColor="bg-green-500" delay={0.2}>
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <BarChart data={salesData}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(142, 76%, 36%)" stopOpacity={1}/>
                  <stop offset="100%" stopColor="hsl(142, 76%, 50%)" stopOpacity={0.8}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
              <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} className="fill-muted-foreground" />
              <YAxis fontSize={11} tickLine={false} axisLine={false} className="fill-muted-foreground" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="amount" fill="url(#colorSales)" radius={[6, 6, 0, 0]} name="sales" />
            </BarChart>
          </ChartContainer>
        </ChartCard>

        {/* Order Status Pie Chart - Full Width */}
        <ChartCard title="Répartition des Commandes" icon={PieChartIcon} iconColor="bg-purple-500" delay={0.3}>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} className="drop-shadow-sm" />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number, name: string) => [`${value} commandes`, name]} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Top Sellers Bar Chart - Full Width */}
        <ChartCard title="Top Vendeurs (par ventes)" icon={Users} iconColor="bg-amber-500" delay={0.4}>
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <BarChart data={sellerPerformanceData} layout="vertical">
              <defs>
                <linearGradient id="colorSeller" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(45, 93%, 47%)" stopOpacity={1}/>
                  <stop offset="100%" stopColor="hsl(35, 90%, 55%)" stopOpacity={0.8}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" horizontal={false} />
              <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} className="fill-muted-foreground" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <YAxis dataKey="name" type="category" fontSize={11} tickLine={false} axisLine={false} className="fill-muted-foreground" width={120} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="sales" fill="url(#colorSeller)" radius={[0, 6, 6, 0]} name="sales" />
            </BarChart>
          </ChartContainer>
        </ChartCard>

        {/* Hourly Activity - Full Width */}
        <ChartCard title="Activité Horaire (Aujourd'hui)" icon={Activity} iconColor="bg-cyan-500" delay={0.5}>
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <BarChart data={hourlyActivityData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
              <XAxis dataKey="hour" fontSize={10} tickLine={false} axisLine={false} className="fill-muted-foreground" />
              <YAxis fontSize={11} tickLine={false} axisLine={false} className="fill-muted-foreground" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="visits" fill="hsl(199, 89%, 48%)" radius={[4, 4, 0, 0]} name="visits" />
              <Bar dataKey="orders" fill="hsl(262, 83%, 58%)" radius={[4, 4, 0, 0]} name="orders" />
            </BarChart>
          </ChartContainer>
        </ChartCard>
      </div>
    </section>
  );
};
