import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

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
    // Mobile-native & desktop enhanced image-based design
    return (
      <motion.div 
        className="relative overflow-hidden rounded-2xl lg:rounded-3xl cursor-pointer group shadow-md lg:shadow-lg border border-border/20 bg-card"
        onClick={onClick}
        whileTap={{ scale: 0.96 }}
        whileHover={{ scale: 1.03, y: -4 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="aspect-square relative">
          <img
            src={image}
            alt={title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/90 transition-all duration-300" />
          <div className="absolute bottom-0 left-0 right-0 p-3 lg:p-4 text-center">
            <h3 className="text-sm lg:text-base font-bold text-white mb-1 lg:mb-2 line-clamp-2 leading-tight drop-shadow-md">{title}</h3>
            <p className="text-xs lg:text-sm text-white/90 font-medium">{itemCount} articles</p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Mobile-native icon-based design
  return (
    <motion.div 
      className={`${bgColor || 'bg-gradient-to-br from-primary to-primary-hover'} p-4 rounded-2xl cursor-pointer shadow-md border border-white/10`}
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
          {Icon && <Icon className="w-6 h-6 text-white" />}
        </div>
        <h3 className="text-sm font-bold text-white">{title}</h3>
        <p className="text-xs text-white/80 font-medium">{itemCount} articles</p>
      </div>
    </motion.div>
  );
};