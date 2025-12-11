import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface AuthSubmitButtonProps {
  loading: boolean;
  text: string;
  loadingText: string;
  disabled?: boolean;
}

const AuthSubmitButton = memo(function AuthSubmitButton({ 
  loading, 
  text, 
  loadingText,
  disabled = false 
}: AuthSubmitButtonProps) {
  return (
    <Button 
      type="submit" 
      className="w-full h-14 text-base font-bold rounded-2xl shadow-lg shadow-primary/20 
        hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.98]
        transition-all duration-200" 
      disabled={loading || disabled}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          {loadingText}
        </span>
      ) : text}
    </Button>
  );
});

export default AuthSubmitButton;
