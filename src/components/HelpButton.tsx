import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ChatbotDialog } from "./ChatbotDialog";
import { useIsMobile } from "@/hooks/use-mobile";

export const HelpButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  // Afficher uniquement sur mobile/tablette
  if (!isMobile) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 text-primary hover:text-primary/90 px-2"
      >
        <HelpCircle className="w-5 h-5" />
        <span className="text-sm font-medium">Aide</span>
      </Button>
      
      <ChatbotDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
};
