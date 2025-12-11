import React, { memo } from 'react';
import { AlertCircle } from 'lucide-react';

interface AuthErrorAlertProps {
  message: string;
}

const AuthErrorAlert = memo(function AuthErrorAlert({ message }: AuthErrorAlertProps) {
  if (!message) return null;
  
  return (
    <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl animate-fade-in">
      <div className="flex-shrink-0 w-10 h-10 bg-destructive/20 rounded-full flex items-center justify-center">
        <AlertCircle className="h-5 w-5 text-destructive" />
      </div>
      <div className="flex-1 pt-1">
        <p className="text-sm font-medium text-destructive">{message}</p>
      </div>
    </div>
  );
});

export default AuthErrorAlert;
