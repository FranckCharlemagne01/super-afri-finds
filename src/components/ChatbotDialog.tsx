import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, ShoppingCart, Package, CreditCard, Store, AlertTriangle, X } from 'lucide-react';
import { useChatbot } from '@/hooks/useChatbot';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';

interface ChatbotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChatbotDialog: React.FC<ChatbotDialogProps> = ({ open, onOpenChange }) => {
  const [message, setMessage] = useState('');
  const { messages, isTyping, sendMessage, selectQuickOption } = useChatbot();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickOptions = [
    { id: 'acheter', icon: ShoppingCart, label: 'Comment acheter', color: 'bg-primary' },
    { id: 'suivi', icon: Package, label: 'Suivi de commande', color: 'bg-success' },
    { id: 'paiement', icon: CreditCard, label: 'Modes de paiement', color: 'bg-accent' },
    { id: 'vendre', icon: Store, label: 'Vendre sur Djassa', color: 'bg-promo' },
    { id: 'probleme', icon: AlertTriangle, label: 'Signaler un problème', color: 'bg-destructive' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Autofocus sur l'input quand le dialog s'ouvre
  useEffect(() => {
    if (open && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleSend = () => {
    if (message.trim()) {
      sendMessage(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Client';

  // Contenu partagé entre Dialog et Drawer
  const ChatContent = () => (
    <>
      <div className={`bg-gradient-to-r from-primary to-primary-hover text-primary-foreground ${isMobile ? 'p-4' : 'p-4 rounded-t-lg'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-base">Boza</div>
              <div className="text-xs text-primary-foreground/80 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                Assistant Djassa en ligne
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="text-primary-foreground hover:bg-white/20 h-9 w-9 rounded-full transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Bot className="h-5 w-5 text-primary" />
                  <span className="text-base font-semibold">Boza - Assistant Djassa</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  👋 Bonjour et bienvenue sur Djassa ! Je suis Boza, votre assistant virtuel. Je suis là pour vous aider à acheter, vendre ou répondre à vos questions.
                </p>
                <p className="text-xs text-muted-foreground">
                  💬 Tapez votre question ou choisissez une option ci-dessous
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Questions fréquentes :</p>
                <div className="grid grid-cols-1 gap-2">
                  {quickOptions.map((option) => (
                    <Button
                      key={option.id}
                      variant="outline"
                      size="sm"
                      onClick={() => selectQuickOption(option.id)}
                      className="justify-start gap-3 h-auto p-3 text-left hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <option.icon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium">{option.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`mb-4 flex animate-fade-in ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`max-w-[85%] ${msg.sender === 'user' ? 'order-2' : 'order-1'}`}>
                <div className={`flex items-start gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-gradient-to-br from-primary to-primary-hover text-primary-foreground' 
                      : 'bg-gradient-to-br from-secondary to-muted'
                  }`}>
                    {msg.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-primary" />}
                  </div>
                  <div className={`rounded-2xl px-4 py-3 shadow-sm transition-all duration-200 ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-br from-primary to-primary-hover text-primary-foreground ml-2'
                      : 'bg-white border border-border mr-2 hover:shadow-md'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    {msg.timestamp && (
                      <p className={`text-xs mt-2 ${
                        msg.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="mb-4 flex justify-start animate-fade-in">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center shadow-sm">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-white border border-border rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </ScrollArea>

        <div className="p-4 border-t bg-background/95 backdrop-blur-sm">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tapez votre message..."
              className="flex-1 min-h-[48px] text-sm rounded-full border-2 focus:border-primary transition-colors"
              autoComplete="off"
            />
            <Button 
              onClick={handleSend} 
              size="icon" 
              disabled={!message.trim()} 
              className="min-h-[48px] min-w-[48px] rounded-full shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );

  // Sur mobile/tablette : Drawer qui glisse depuis le bas
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[90vh] flex flex-col p-0 gap-0">
          <ChatContent />
        </DrawerContent>
      </Drawer>
    );
  }

  // Sur desktop : Dialog élégant
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md h-[600px] flex flex-col p-0 gap-0 animate-scale-in">
        <ChatContent />
      </DialogContent>
    </Dialog>
  );
};