import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';
import { motion } from 'framer-motion';
import { PieChartIcon, BarChart3 } from 'lucide-react';
import type { CategoryPerformance } from '@/hooks/useBusinessDashboard';

interface BusinessCategoryPerformanceProps {
  categories: CategoryPerformance[];
}

const COLORS = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ef4444', // red
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#84cc16', // lime
];

const chartConfig = {
  revenue: { label: 'Revenus', color: 'hsl(142, 76%, 36%)' },
  orders: { label: 'Commandes', color: 'hsl(217, 91%, 60%)' },
  products: { label: 'Produits', color: 'hsl(262, 83%, 58%)' },
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

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    'electronics': 'Électronique',
    'fashion': 'Mode',
    'beauty': 'Beauté',
    'home': 'Maison',
    'phones': 'Téléphones',
    'auto': 'Auto',
    'grocery': 'Alimentation',
  };
  return labels[category.toLowerCase()] || category;
};

export const BusinessCategoryPerformance = ({ categories }: BusinessCategoryPerformanceProps) => {
  if (!categories || categories.length === 0) {
    return (
      <Card className="shadow-lg border-0">
        <CardHeader className="pb-2 border-b bg-muted/20">
          <CardTitle className="text-base font-semibold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500">
              <PieChartIcon className="w-4 h-4 text-white" />
            </div>
            Performance par Catégorie
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center py-8">
            Aucune donnée de catégorie disponible
          </p>
        </CardContent>
      </Card>
    );
  }

  const pieData = categories.map((cat, index) => ({
    name: getCategoryLabel(cat.category),
    value: cat.revenue,
    color: COLORS[index % COLORS.length],
  }));

  const barData = categories.map(cat => ({
    category: getCategoryLabel(cat.category),
    revenue: cat.revenue,
    orders: cat.order_count,
    products: cat.product_count,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pie Chart - Revenue Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-2 border-b bg-muted/20">
            <CardTitle className="text-base font-semibold flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500">
                <PieChartIcon className="w-4 h-4 text-white" />
              </div>
              Répartition des Revenus
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} className="drop-shadow-sm" />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value.toLocaleString()} FCFA`, 'Revenus']} 
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bar Chart - Category Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-2 border-b bg-muted/20">
            <CardTitle className="text-base font-semibold flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              Catégories les Plus Rentables
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" horizontal={false} />
                <XAxis 
                  type="number" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  className="fill-muted-foreground" 
                  tickFormatter={formatCurrency}
                />
                <YAxis 
                  dataKey="category" 
                  type="category" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  className="fill-muted-foreground" 
                  width={100}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="revenue" 
                  fill="hsl(142, 76%, 36%)" 
                  radius={[0, 6, 6, 0]} 
                  name="revenue"
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
