import { LucideIcon } from "lucide-react";

interface CategoryCardProps {
  icon?: LucideIcon;
  title: string;
  itemCount: number;
  bgColor?: string;
  image?: string;
  onClick?: () => void;
}

export const CategoryCard = ({ 
  icon: Icon, 
  title, 
  itemCount, 
  bgColor,
  image,
  onClick 
}: CategoryCardProps) => {
  if (image) {
    // New image-based design for realistic product presentation
    return (
      <div 
        className="relative overflow-hidden rounded-lg sm:rounded-xl hover-lift cursor-pointer transition-all duration-300 hover:scale-105 group"
        onClick={onClick}
      >
        <div className="aspect-square relative">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-1.5 sm:p-2 md:p-3 text-center">
            <h3 className="text-xs sm:text-sm md:text-base font-semibold text-white mb-0.5 sm:mb-1 line-clamp-2 leading-tight">{title}</h3>
            <p className="text-xs sm:text-sm text-white/80">{itemCount} articles</p>
          </div>
        </div>
      </div>
    );
  }

  // Fallback to icon-based design
  return (
    <div 
      className={`${bgColor || 'bg-primary'} p-4 rounded-xl hover-lift cursor-pointer transition-all duration-300 hover:scale-105`}
      onClick={onClick}
    >
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="p-3 bg-white/20 rounded-full">
          {Icon && <Icon className="w-6 h-6 text-white" />}
        </div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="text-xs text-white/80">{itemCount} articles</p>
      </div>
    </div>
  );
};