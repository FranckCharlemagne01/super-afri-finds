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
  Legend
} from 'recharts';
import { motion } from 'framer-motion';

interface AnalyticsChartsProps {
  registrationData: Array<{ date: string; count: number }>;
  salesData: Array<{ date: string; amount: number; orders: number }>;
  orderStatusData: Array<{ name: string; value: number; color: string }>;
  sellerPerformanceData: Array<{ name: string; sales: number; products: number }>;
  hourlyActivityData: Array<{ hour: string; visits: number; orders: number }>;
}

const chartConfig = {
  registrations: { label: 'Inscriptions', color: 'hsl(217, 91%, 60%)' },
  sales: { label: 'Ventes', color: 'hsl(142, 76%, 36%)' },
  orders: { label: 'Commandes', color: 'hsl(262, 83%, 58%)' },
  visits: { label: 'Visites', color: 'hsl(199, 89%, 48%)' },
  products: { label: 'Produits', color: 'hsl(45, 93%, 47%)' },
};

export const AnalyticsCharts = ({
  registrationData,
  salesData,
  orderStatusData,
  sellerPerformanceData,
  hourlyActivityData
}: AnalyticsChartsProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Inscriptions Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="shadow-lg border-0 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              Inscriptions (30 derniers jours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <AreaChart data={registrationData}>
                <defs>
                  <linearGradient id="colorRegistrations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis 
                  dataKey="date" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  className="fill-muted-foreground"
                />
                <YAxis 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  className="fill-muted-foreground"
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(217, 91%, 60%)"
                  strokeWidth={2}
                  fill="url(#colorRegistrations)"
                  name="registrations"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sales Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="shadow-lg border-0 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              Ventes (30 derniers jours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis 
                  dataKey="date" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  className="fill-muted-foreground"
                />
                <YAxis 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  className="fill-muted-foreground"
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="amount" 
                  fill="hsl(142, 76%, 36%)" 
                  radius={[4, 4, 0, 0]}
                  name="sales"
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Order Status Pie Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="shadow-lg border-0 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              Répartition des Commandes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Hourly Activity Heatmap-style Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="shadow-lg border-0 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-500" />
              Activité par Heure (Aujourd'hui)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart data={hourlyActivityData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis 
                  dataKey="hour" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  className="fill-muted-foreground"
                />
                <YAxis 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  className="fill-muted-foreground"
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="visits" 
                  fill="hsl(199, 89%, 48%)" 
                  radius={[2, 2, 0, 0]}
                  name="visits"
                />
                <Bar 
                  dataKey="orders" 
                  fill="hsl(262, 83%, 58%)" 
                  radius={[2, 2, 0, 0]}
                  name="orders"
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Seller Performance Chart - Full Width */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="lg:col-span-2"
      >
        <Card className="shadow-lg border-0 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              Top Vendeurs (par ventes)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <BarChart data={sellerPerformanceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" horizontal={false} />
                <XAxis 
                  type="number" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  className="fill-muted-foreground"
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <YAxis 
                  dataKey="name" 
                  type="category"
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  className="fill-muted-foreground"
                  width={100}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="sales" 
                  fill="hsl(45, 93%, 47%)" 
                  radius={[0, 4, 4, 0]}
                  name="sales"
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
