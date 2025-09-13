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
              className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground shadow-vibrant animate-bounce-subtle hover:animate-none z-50 transition-all duration-300"
              size="icon"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="mb-2">
            <p>Besoin d'aide ? Posez votre question</p>
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