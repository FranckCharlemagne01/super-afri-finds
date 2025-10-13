import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, ArrowRight, Mail } from 'lucide-react';

interface RecentMessagesCardProps {
  messages?: any[];
  onViewAll?: () => void;
}

export const RecentMessagesCard = ({ messages = [], onViewAll }: RecentMessagesCardProps) => {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5 text-primary" />
          Messages récents
        </CardTitle>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onViewAll} className="gap-1">
            Voir tout
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-3">
              <Mail className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">Aucun message pour le moment</p>
            <p className="text-xs text-muted-foreground mt-1">Vos conversations apparaîtront ici</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.slice(0, 5).map((message, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {message.sender?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium truncate">Client #{index + 1}</p>
                    <span className="text-xs text-muted-foreground">2h</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    Nouveau message concernant un produit...
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
