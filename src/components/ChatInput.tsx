import React, { useRef, useEffect, useCallback, memo } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
  className?: string;
  disabled?: boolean;
}

export const ChatInput = memo(({ 
  value, 
  onChange, 
  onSend, 
  placeholder = "Tapez votre message...",
  minHeight = "48px",
  maxHeight = "120px",
  className = "",
  disabled = false
}: ChatInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isFocusedRef = useRef(false);

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
  }, [value, adjustTextareaHeight]);

  // Maintenir le focus si l'utilisateur était en train de taper
  useEffect(() => {
    if (isFocusedRef.current && textareaRef.current) {
      textareaRef.current.focus();
    }
  });

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  const handleSend = useCallback(() => {
    if (value.trim()) {
      onSend();
      // Reset la hauteur du textarea après envoi
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.focus();
        }
      }, 0);
    }
  }, [value, onSend]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleFocus = useCallback(() => {
    isFocusedRef.current = true;
  }, []);

  const handleBlur = useCallback(() => {
    isFocusedRef.current = false;
  }, []);

  return (
    <div className={`flex gap-2 items-end ${className}`}>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyPress}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`flex-1 text-sm rounded-2xl border-2 focus:border-primary transition-all duration-200 resize-none py-3 px-4`}
        style={{ minHeight, maxHeight }}
        autoComplete="off"
        rows={1}
        disabled={disabled}
      />
      <Button 
        onClick={handleSend} 
        size="icon" 
        disabled={!value.trim() || disabled} 
        className="min-h-[48px] min-w-[48px] rounded-full shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex-shrink-0"
      >
        <Send className="h-5 w-5" />
      </Button>
    </div>
  );
});

ChatInput.displayName = 'ChatInput';
