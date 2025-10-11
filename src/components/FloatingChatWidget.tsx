import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  ShoppingCart, 
  Package, 
  CreditCard, 
  Store, 
  AlertTriangle, 
  X, 
  Minimize2,
  Maximize2 
} from 'lucide-react';
import { useChatbot } from '@/hooks/useChatbot';
import { useAuth } from '@/hooks/useAuth';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const FloatingChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const { messages, isTyping, sendMessage, selectQuickOption } = useChatbot();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => {
    if (isOpen && !isMinimized && textareaRef.current) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isMinimized]);

  // Auto-resize du textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [message, adjustTextareaHeight]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  }, []);

  const handleSend = useCallback(() => {
    if (message.trim()) {
      sendMessage(message);
      setMessage('');
      // Reset la hauteur du textarea après envoi
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.focus();
        }
      }, 0);
    }
  }, [message, sendMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleToggleWidget = () => {
    if (isOpen) {
      setIsOpen(false);
      setIsMinimized(false);
    } else {
      setIsOpen(true);
      setIsMinimized(false);
    }
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Client';

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
      {/* Chat Widget */}
      {isOpen && (
        <div 
          className={`mb-4 bg-background border border-border rounded-xl shadow-xl transition-all duration-300 animate-scale-in ${
            isMinimized 
              ? 'w-80 h-16' 
              : 'w-80 sm:w-96 h-[500px]'
          }`}
        >
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-3 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="font-semibold text-sm">Boza - Assistant Djassa</span>
              {!isMinimized && <Badge variant="secondary" className="text-xs bg-white/20 text-white">En ligne</Badge>}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleMinimize}
                className="text-primary-foreground hover:bg-primary-hover h-7 w-7"
              >
                {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="text-primary-foreground hover:bg-primary-hover h-7 w-7"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Chat Content - Only show when not minimized */}
          {!isMinimized && (
            <>
              {/* Messages Area */}
              <div className="flex-1 flex flex-col h-[400px]">
                <ScrollArea className="flex-1 p-3">
                  {messages.length === 0 && (
                    <div className="space-y-3">
                      <div className="bg-card border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Bot className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">Boza - Assistant Djassa</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          👋 Bonjour et bienvenue sur Djassa ! Je suis Boza, votre assistant virtuel. Je suis là pour vous aider à acheter, vendre ou répondre à vos questions. N'hésitez pas à me dire "Bonjour" ou à poser votre question !
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Questions fréquentes :</p>
                        <div className="grid grid-cols-1 gap-1">
                          {quickOptions.map((option) => (
                            <Button
                              key={option.id}
                              variant="outline"
                              size="sm"
                              onClick={() => selectQuickOption(option.id)}
                              className="justify-start gap-2 h-auto p-2 text-left text-xs"
                            >
                              <option.icon className="h-3 w-3 text-primary flex-shrink-0" />
                              <span className="truncate">{option.label}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {messages.map((msg, index) => (
                    <div key={index} className={`mb-3 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] ${msg.sender === 'user' ? 'order-2' : 'order-1'}`}>
                        <div className={`flex items-start gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                            msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                          }`}>
                            {msg.sender === 'user' ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                          </div>
                          <div className={`rounded-lg px-3 py-2 ${
                            msg.sender === 'user'
                              ? 'bg-primary text-primary-foreground ml-1'
                              : 'bg-orange-100 border border-orange-200 mr-1'
                          }`}>
                            <p className="text-xs whitespace-pre-wrap leading-relaxed">{msg.text}</p>
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
                    <div className="mb-3 flex justify-start">
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                          <Bot className="h-3 w-3" />
                        </div>
                        <div className="bg-secondary rounded-lg px-3 py-2">
                          <div className="flex space-x-1">
                            <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce"></div>
                            <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </ScrollArea>

                {/* Input Area */}
                <div className="p-3 border-t bg-background rounded-b-xl">
                  <div className="flex gap-2 items-end">
                    <Textarea
                      ref={textareaRef}
                      value={message}
                      onChange={handleChange}
                      onKeyDown={handleKeyPress}
                      placeholder="Tapez votre message..."
                      className="flex-1 text-sm min-h-[32px] max-h-[100px] rounded-lg resize-none py-2 px-3 transition-all duration-200"
                      autoComplete="off"
                      rows={1}
                    />
                    <Button 
                      onClick={handleSend} 
                      size="icon" 
                      disabled={!message.trim()} 
                      className="h-8 w-8 flex-shrink-0"
                    >
                      <Send className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleToggleWidget}
              className={`h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground shadow-vibrant transition-all duration-300 hover:scale-110 min-w-[56px] min-h-[56px] ${
                isOpen ? 'animate-none' : 'animate-bounce-subtle hover:animate-none'
              }`}
              size="icon"
            >
              {isOpen ? (
                <X className="h-6 w-6 sm:h-7 sm:w-7" />
              ) : (
                <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="mb-2 hidden sm:block">
            <p className="text-sm">
              {isOpen ? 'Fermer le chat' : 'Besoin d\'aide ? Posez votre question'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};