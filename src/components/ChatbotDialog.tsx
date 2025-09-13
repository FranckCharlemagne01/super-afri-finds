import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, ShoppingCart, Package, CreditCard, Store, AlertTriangle, X } from 'lucide-react';
import { useChatbot } from '@/hooks/useChatbot';
import { useAuth } from '@/hooks/useAuth';

interface ChatbotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChatbotDialog: React.FC<ChatbotDialogProps> = ({ open, onOpenChange }) => {
  const [message, setMessage] = useState('');
  const { messages, isTyping, sendMessage, selectQuickOption } = useChatbot();
  const { user } = useAuth();
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md md:max-w-sm lg:max-w-md h-[85vh] md:h-[500px] w-[95vw] md:w-auto flex flex-col p-0 gap-0 mx-auto">
        <DialogHeader className="bg-primary text-primary-foreground p-3 md:p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 md:h-6 md:w-6" />
              <DialogTitle className="text-base md:text-lg font-semibold">Assistant Djassa</DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-primary-foreground hover:bg-primary-hover h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-3 md:p-4">
            {messages.length === 0 && (
              <div className="space-y-3 md:space-y-4">
                <div className="bg-card border rounded-lg p-3 md:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    <span className="text-sm md:text-base font-medium">Assistant Djassa</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Bonjour {userName} ! 👋 Comment puis-je vous aider aujourd'hui ?
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    💬 Tapez votre question ou choisissez une option ci-dessous
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Questions fréquentes :</p>
                  <div className="grid grid-cols-1 gap-2">
                    {quickOptions.map((option) => (
                      <Button
                        key={option.id}
                        variant="outline"
                        size="sm"
                        onClick={() => selectQuickOption(option.id)}
                        className="justify-start gap-2 h-auto p-2 md:p-3 text-left"
                      >
                        <option.icon className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                        <span className="text-xs md:text-sm">{option.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg, index) => (
              <div key={index} className={`mb-3 md:mb-4 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] md:max-w-[80%] ${msg.sender === 'user' ? 'order-2' : 'order-1'}`}>
                  <div className={`flex items-start gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                    }`}>
                      {msg.sender === 'user' ? <User className="h-3 w-3 md:h-4 md:w-4" /> : <Bot className="h-3 w-3 md:h-4 md:w-4" />}
                    </div>
                     <div className={`rounded-lg px-3 py-2 md:px-4 md:py-2 ${
                       msg.sender === 'user'
                         ? 'bg-primary text-primary-foreground ml-1 md:ml-2'
                         : 'bg-orange-100 border border-orange-200 mr-1 md:mr-2'
                     }`}>
                      <p className="text-xs md:text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                      {msg.timestamp && (
                        <p className={`text-xs mt-1 ${
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
              <div className="mb-3 md:mb-4 flex justify-start">
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-secondary flex items-center justify-center">
                    <Bot className="h-3 w-3 md:h-4 md:w-4" />
                  </div>
                  <div className="bg-secondary rounded-lg px-3 py-2 md:px-4 md:py-2">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </ScrollArea>

          <div className="p-3 md:p-4 border-t bg-background">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tapez votre message..."
                className="flex-1 text-sm md:text-base"
                autoComplete="off"
              />
              <Button onClick={handleSend} size="icon" disabled={!message.trim()} className="h-9 w-9 md:h-10 md:w-10">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};