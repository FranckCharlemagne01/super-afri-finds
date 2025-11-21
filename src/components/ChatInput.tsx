import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
  className?: string;
  disabled?: boolean;
}

export const ChatInput = ({ 
  onSendMessage,
  placeholder = "Tapez votre message...",
  minHeight = "48px",
  maxHeight = "120px",
  className = "",
  disabled = false
}: ChatInputProps) => {
  // État LOCAL pour éviter les re-renders du parent
  const [localValue, setLocalValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize du textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, parseInt(maxHeight));
      textarea.style.height = newHeight + 'px';
    }
  }, [maxHeight]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [localValue, adjustTextareaHeight]);

  // Scroll mobile pour éviter que le clavier ne cache le champ
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleFocus = () => {
      // Attendre que le clavier mobile apparaisse
      setTimeout(() => {
        textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    };

    textarea.addEventListener('focus', handleFocus);
    return () => textarea.removeEventListener('focus', handleFocus);
  }, []);

  // Security: Enforce maximum message length
  const MAX_MESSAGE_LENGTH = 5000;

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_MESSAGE_LENGTH) {
      setLocalValue(value);
    }
  }, []);

  const handleSend = useCallback(() => {
    if (localValue.trim()) {
      onSendMessage(localValue);
      setLocalValue('');
      // Reset la hauteur du textarea après envoi
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = minHeight;
          textareaRef.current.focus();
        }
      }, 0);
    }
  }, [localValue, onSendMessage, minHeight]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex gap-2.5 items-end">
        <Textarea
          ref={textareaRef}
          value={localValue}
          onChange={handleChange}
          onKeyDown={handleKeyPress}
          placeholder={placeholder}
          className="flex-1 text-sm rounded-2xl border border-border focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all duration-200 resize-none py-3 px-4 bg-background shadow-sm hover:shadow-md"
          style={{ minHeight, maxHeight }}
          autoComplete="off"
          rows={1}
          disabled={disabled}
        />
        <Button 
          onClick={handleSend} 
          size="icon" 
          disabled={!localValue.trim() || disabled} 
          className="min-h-[50px] min-w-[50px] rounded-full shadow-md hover:shadow-xl transition-all duration-200 disabled:opacity-40 flex-shrink-0 hover:scale-110 active:scale-95 bg-gradient-to-br from-primary to-primary-hover"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
      {/* Security: Character counter to enforce length limits */}
      <div className="text-xs text-muted-foreground text-right px-1">
        {localValue.length}/{MAX_MESSAGE_LENGTH}
      </div>
    </div>
  );
};

ChatInput.displayName = 'ChatInput';
