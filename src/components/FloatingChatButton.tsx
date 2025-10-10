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
              className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground shadow-vibrant animate-bounce-subtle hover:animate-none z-50 transition-all duration-300 hover:scale-110 min-w-[56px] min-h-[56px]"
              size="icon"
            >
              <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="mb-2 hidden sm:block">
            <p className="text-sm">Besoin d'aide ? Posez votre question</p>
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