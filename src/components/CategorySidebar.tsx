import { useNavigate } from "react-router-dom";
import { 
  Smartphone, 
  Shirt, 
  Home, 
  Sparkles, 
  ShoppingBag, 
  Car,
  Gamepad2,
  Tv
} from "lucide-react";

interface Category {
  title: string;
  slug: string;
  icon: React.ElementType;
  itemCount: number;
}

const categories: Category[] = [
  { title: "Téléphones & Tablettes", slug: "Téléphones & Tablettes", icon: Smartphone, itemCount: 1250 },
  { title: "Électroménager / TV & Audio", slug: "Électroménager", icon: Tv, itemCount: 890 },
  { title: "Vêtements & Chaussures", slug: "Mode", icon: Shirt, itemCount: 1450 },
  { title: "Maison & Décoration", slug: "Maison", icon: Home, itemCount: 1100 },
  { title: "Beauté & Soins personnels", slug: "Beauté", icon: Sparkles, itemCount: 675 },
  { title: "Épicerie & Produits alimentaires", slug: "Épicerie", icon: ShoppingBag, itemCount: 820 },
  { title: "Auto & Accessoires", slug: "Auto", icon: Car, itemCount: 340 },
  { title: "Sport & Loisirs", slug: "Sport", icon: Gamepad2, itemCount: 540 },
];

export const CategorySidebar = () => {
  const navigate = useNavigate();

  return (
    <div className="hidden lg:block w-64 flex-shrink-0">
      <div className="bg-card rounded-xl border shadow-sm sticky top-20">
        <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <h3 className="font-bold text-lg text-foreground">Catégories</h3>
        </div>
        <div className="p-2">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.slug}
                onClick={() => navigate(`/category/${category.slug}`)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors group text-left"
              >
                <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-foreground group-hover:text-primary transition-colors truncate">
                    {category.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {category.itemCount.toLocaleString()} articles
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
