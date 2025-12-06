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
    <div className={`flex items-end gap-2 ${className}`}>
      <div className="flex-1 relative">
        <Textarea
          ref={textareaRef}
          value={localValue}
          onChange={handleChange}
          onKeyDown={handleKeyPress}
          placeholder={placeholder}
          className="w-full text-[15px] rounded-3xl border-0 bg-card focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-200 resize-none py-3 px-4 shadow-sm"
          style={{ minHeight: '44px', maxHeight }}
          autoComplete="off"
          rows={1}
          disabled={disabled}
        />
      </div>
      <Button 
        onClick={handleSend} 
        size="icon" 
        disabled={!localValue.trim() || disabled} 
        className="h-11 w-11 rounded-full shadow-md transition-all duration-200 disabled:opacity-40 flex-shrink-0 active:scale-95 bg-primary hover:bg-primary-hover"
      >
        <Send className="h-5 w-5" />
      </Button>
    </div>
  );
};

ChatInput.displayName = 'ChatInput';
