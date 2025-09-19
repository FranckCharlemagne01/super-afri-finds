import { Badge } from '@/components/ui/badge';

interface RealtimeNotificationBadgeProps {
  count: number;
  maxDisplay?: number;
  className?: string;
}

export const RealtimeNotificationBadge = ({ 
  count, 
  maxDisplay = 9,
  className = ""
}: RealtimeNotificationBadgeProps) => {
  if (count === 0) return null;

  return (
    <Badge 
      variant="destructive" 
      className={`absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center transition-all duration-200 animate-in fade-in scale-in ${className}`}
    >
      {count > maxDisplay ? `${maxDisplay}+` : count}
    </Badge>
  );
};