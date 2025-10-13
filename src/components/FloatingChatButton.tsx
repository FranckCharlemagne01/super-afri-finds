import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatbotDialog } from './ChatbotDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';

export const FloatingChatButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  // Ne pas afficher sur mobile (remplacé par le bouton Aide)
  if (isMobile) return null;

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setIsOpen(true)}
              className="fixed bottom-6 right-6 h-16 w-16 rounded-full bg-gradient-to-br from-primary via-primary-hover to-primary text-primary-foreground shadow-2xl hover:shadow-[0_8px_30px_rgba(var(--primary-rgb),0.5)] animate-bounce-subtle hover:animate-none z-50 transition-all duration-300 hover:scale-110 active:scale-95 border-2 border-white/20"
              size="icon"
              aria-label="Ouvrir le chat d'aide"
            >
              <MessageCircle className="h-7 w-7" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="mb-2 bg-card border shadow-lg">
            <p className="text-sm font-medium">Besoin d'aide ?</p>
            <p className="text-xs text-muted-foreground">Discutez avec Boza</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <ChatbotDialog 
        open={isOpen} 
        onOpenChange={setIsOpen} 
      />
    </>
  );
};