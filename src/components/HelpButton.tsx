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
        size="icon"
        onClick={() => setIsOpen(true)}
        className="w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center p-0"
        aria-label="Aide"
      >
        <span className="text-sm font-bold">?</span>
      </Button>
      
      <ChatbotDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
};
