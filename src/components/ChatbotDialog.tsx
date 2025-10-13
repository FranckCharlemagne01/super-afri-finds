import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Bot, User, ShoppingCart, Package, CreditCard, Store, AlertTriangle, X } from 'lucide-react';
import { useChatbot } from '@/hooks/useChatbot';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { ChatInput } from '@/components/ChatInput';

interface ChatbotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChatbotDialog: React.FC<ChatbotDialogProps> = ({ open, onOpenChange }) => {
  const { messages, isTyping, sendMessage, selectQuickOption } = useChatbot();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const handleSendMessage = useCallback((message: string) => {
    sendMessage(message);
  }, [sendMessage]);

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Client';

  // Contenu partagé entre Dialog et Drawer
  const ChatContent = () => (
    <>
      <div className="bg-gradient-to-r from-primary via-primary-hover to-primary text-primary-foreground p-4 border-b shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center shadow-md">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-white animate-pulse"></span>
            </div>
            <div>
              <div className="font-semibold text-base">Boza</div>
              <div className="text-xs text-primary-foreground/90">
                Assistant virtuel Djassa
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="text-primary-foreground hover:bg-white/10 h-9 w-9 rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-muted/20 to-background">
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-base font-semibold">Assistant Djassa</span>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed mb-3">
                  👋 Bienvenue sur Djassa ! Je suis là pour vous aider à acheter, vendre ou répondre à toutes vos questions.
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                  Choisissez une option ou tapez votre message
                </p>
              </div>

              <div className="space-y-2.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">Questions rapides</p>
                <div className="grid grid-cols-1 gap-2">
                  {quickOptions.map((option) => (
                    <Button
                      key={option.id}
                      variant="outline"
                      size="sm"
                      onClick={() => selectQuickOption(option.id)}
                      className="justify-start gap-3 h-auto p-3.5 text-left hover:bg-primary/5 hover:border-primary/40 transition-all duration-200 group hover:shadow-sm hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center group-hover:from-primary/20 group-hover:to-primary/10 transition-all">
                        <option.icon className="h-4.5 w-4.5 text-primary" />
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
              className={`mb-3 flex animate-fade-in ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className={`max-w-[85%] ${msg.sender === 'user' ? 'order-2' : 'order-1'}`}>
                <div className={`flex items-end gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.sender === 'user' 
                      ? 'bg-gradient-to-br from-primary to-primary-hover shadow-md' 
                      : 'bg-card border border-border shadow-sm'
                  }`}>
                    {msg.sender === 'user' ? (
                      <User className="h-3.5 w-3.5 text-primary-foreground" />
                    ) : (
                      <Bot className="h-3.5 w-3.5 text-primary" />
                    )}
                  </div>
                  <div className={`rounded-2xl px-4 py-2.5 shadow-sm transition-all duration-200 ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-br from-primary to-primary-hover text-primary-foreground rounded-br-md'
                      : 'bg-card border border-border rounded-bl-md hover:shadow-md'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    {msg.timestamp && (
                      <p className={`text-[10px] mt-1.5 ${
                        msg.sender === 'user' ? 'text-primary-foreground/60' : 'text-muted-foreground/60'
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
            <div className="mb-3 flex justify-start animate-fade-in">
              <div className="flex items-end gap-2">
                <div className="w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center shadow-sm">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </ScrollArea>

        <div className="p-4 border-t bg-card/50 backdrop-blur-md shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
          <ChatInput
            onSendMessage={handleSendMessage}
            placeholder="Écrivez votre message..."
            minHeight="48px"
            maxHeight="120px"
          />
        </div>
      </div>
    </>
  );

  // Sur mobile/tablette : Drawer plein écran avec animation native
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[95vh] flex flex-col p-0 gap-0 rounded-t-3xl">
          <ChatContent />
        </DrawerContent>
      </Drawer>
    );
  }

  // Sur desktop : Dialog élégant avec position fixe
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg h-[650px] flex flex-col p-0 gap-0 sm:rounded-2xl overflow-hidden shadow-2xl border-0">
        <ChatContent />
      </DialogContent>
    </Dialog>
  );
};