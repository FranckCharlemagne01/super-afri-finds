import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { categories } from "@/data/categories";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const CategoriesPage = () => {
  const navigate = useNavigate();
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductCounts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .eq('is_active', true);

      if (!error && data) {
        const counts: Record<string, number> = {};
        data.forEach((product) => {
          counts[product.category] = (counts[product.category] || 0) + 1;
        });
        setProductCounts(counts);
      }
      setLoading(false);
    };

    fetchProductCounts();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à l'accueil
        </Button>

        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
          Toutes les catégories
        </h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {categories.map((category) => {
              const Icon = category.icon;
              const categoryTotal = category.subcategories.reduce(
                (sum, sub) => sum + (productCounts[sub.slug] || 0),
                0
              );

              return (
                <div key={category.id} className="bg-card rounded-xl border shadow-sm p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="bg-primary/10 p-3 rounded-xl">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">
                        {category.name}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {categoryTotal.toLocaleString()} articles disponibles
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {category.subcategories.map((sub) => {
                      const count = productCounts[sub.slug] || 0;
                      
                      return (
                        <button
                          key={sub.id}
                          onClick={() => navigate(`/category/${sub.slug}`)}
                          className="flex flex-col items-start p-4 rounded-lg border hover:border-primary hover:bg-accent/50 transition-all text-left group"
                        >
                          <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors mb-1">
                            {sub.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {count.toLocaleString()} article{count !== 1 ? 's' : ''}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
