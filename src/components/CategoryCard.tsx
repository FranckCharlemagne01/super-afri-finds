import { LucideIcon } from "lucide-react";

interface CategoryCardProps {
  icon: LucideIcon;
  title: string;
  itemCount: number;
  bgColor: string;
  onClick?: () => void;
}

export const CategoryCard = ({ 
  icon: Icon, 
  title, 
  itemCount, 
  bgColor,
  onClick 
}: CategoryCardProps) => {
  return (
    <div 
      className={`${bgColor} p-4 rounded-xl hover-lift cursor-pointer transition-all duration-300 hover:scale-105`}
      onClick={onClick}
    >
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="p-3 bg-white/20 rounded-full">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="text-xs text-white/80">{itemCount} articles</p>
      </div>
    </div>
  );
};