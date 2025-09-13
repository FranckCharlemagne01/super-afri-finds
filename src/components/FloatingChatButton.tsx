import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatbotDialog } from './ChatbotDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const FloatingChatButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setIsOpen(true)}
              className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground shadow-vibrant animate-bounce-subtle hover:animate-none z-50 transition-all duration-300 hover:scale-110"
              size="icon"
            >
              <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
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