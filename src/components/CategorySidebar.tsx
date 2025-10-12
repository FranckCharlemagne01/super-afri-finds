import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { categories } from "@/data/categories";
import { supabase } from "@/integrations/supabase/client";
import { useUserLocation } from "@/hooks/useUserLocation";
import { ChevronDown } from "lucide-react";

export const CategorySidebar = () => {
  const { location: userLocation } = useUserLocation();
  const navigate = useNavigate();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchProductCounts = async () => {
      let query = supabase
        .from('products')
        .select('category')
        .eq('is_active', true);
      
      // Filtrage géographique : même ville ET même pays
      if (userLocation.city && userLocation.country) {
        query = query
          .eq('city', userLocation.city)
          .eq('country', userLocation.country);
      }
      
      const { data, error } = await query;

      if (!error && data) {
        const counts: Record<string, number> = {};
        data.forEach((product) => {
          counts[product.category] = (counts[product.category] || 0) + 1;
        });
        setProductCounts(counts);
      }
    };

    fetchProductCounts();
  }, [userLocation.city, userLocation.country]);

  return (
    <div className="hidden lg:block w-64 flex-shrink-0">
      <div className="bg-card rounded-xl border shadow-sm sticky top-20 max-h-[calc(100vh-100px)] overflow-y-auto">
        <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10 sticky top-0 bg-card z-10">
          <h3 className="font-bold text-lg text-foreground">Catégories</h3>
        </div>
        <div className="p-2">
          {categories.map((category) => {
            const Icon = category.icon;
            const isExpanded = expandedCategory === category.id;
            const categoryTotal = category.subcategories.reduce(
              (sum, sub) => sum + (productCounts[sub.slug] || 0),
              0
            );

            return (
              <div key={category.id} className="mb-1">
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors group text-left"
                >
                  <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-foreground group-hover:text-primary transition-colors truncate">
                      {category.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {categoryTotal.toLocaleString()} articles
                    </div>
                  </div>
                  <ChevronDown 
                    className={`w-4 h-4 text-muted-foreground transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`} 
                  />
                </button>
                
                {isExpanded && (
                  <div className="ml-4 mt-1 space-y-1">
                    {category.subcategories.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => navigate(`/category/${sub.slug}`)}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-accent/30 transition-colors text-left"
                      >
                        <span className="text-sm text-foreground truncate">
                          {sub.name}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {(productCounts[sub.slug] || 0).toLocaleString()}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
