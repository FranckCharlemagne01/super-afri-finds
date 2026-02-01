import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  BarChart,
  Bar,
  ResponsiveContainer,
  ComposedChart,
  Line
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3 } from 'lucide-react';
import type { RevenueChartData } from '@/hooks/useBusinessDashboard';

interface BusinessRevenueChartProps {
  data: RevenueChartData[];
}

const chartConfig = {
  revenue: { label: 'Revenus', color: 'hsl(142, 76%, 36%)' },
  commissions: { label: 'Commissions', color: 'hsl(45, 93%, 47%)' },
  orders: { label: 'Commandes', color: 'hsl(217, 91%, 60%)' },
};

const formatDate = (date: string) => {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
};

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}k`;
  }
  return value.toString();
};

export const BusinessRevenueChart = ({ data }: BusinessRevenueChartProps) => {
  const formattedData = data.map(item => ({
    ...item,
    dateFormatted: formatDate(item.date),
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Revenue Area Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-2 border-b bg-muted/20">
            <CardTitle className="text-base font-semibold flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              Revenus (30 jours)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <AreaChart data={formattedData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis 
                  dataKey="dateFormatted" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  className="fill-muted-foreground"
                  interval="preserveStartEnd"
                />
                <YAxis 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  className="fill-muted-foreground" 
                  tickFormatter={formatCurrency}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  formatter={(value: number) => [`${value.toLocaleString()} FCFA`, 'Revenus']}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(142, 76%, 36%)" 
                  strokeWidth={2} 
                  fill="url(#colorRevenue)" 
                  name="revenue"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Commissions & Orders Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-2 border-b bg-muted/20">
            <CardTitle className="text-base font-semibold flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              Commissions & Commandes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ComposedChart data={formattedData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis 
                  dataKey="dateFormatted" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  className="fill-muted-foreground"
                  interval="preserveStartEnd"
                />
                <YAxis 
                  yAxisId="left"
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  className="fill-muted-foreground" 
                  tickFormatter={formatCurrency}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  className="fill-muted-foreground"
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  yAxisId="left"
                  dataKey="commissions" 
                  fill="hsl(45, 93%, 47%)" 
                  radius={[4, 4, 0, 0]} 
                  name="commissions"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="orders" 
                  stroke="hsl(217, 91%, 60%)" 
                  strokeWidth={2}
                  dot={false}
                  name="orders"
                />
              </ComposedChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
