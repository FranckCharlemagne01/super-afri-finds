import React, { memo, useCallback, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, LucideIcon } from 'lucide-react';

interface OptimizedInputProps {
  id: string;
  label: string;
  icon?: LucideIcon;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  maxLength?: number;
  hint?: string;
  error?: boolean;
  showPasswordToggle?: boolean;
  autoComplete?: string;
}

const OptimizedInput = memo(function OptimizedInput({
  id,
  label,
  icon: Icon,
  type = "text",
  placeholder,
  value,
  onChange,
  required = false,
  maxLength,
  hint,
  error,
  showPasswordToggle = false,
  autoComplete,
}: OptimizedInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  const togglePassword = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);

  const inputType = showPasswordToggle ? (showPassword ? "text" : "password") : type;

  return (
    <div className="space-y-2">
      <Label 
        htmlFor={id} 
        className="text-sm font-semibold text-foreground flex items-center gap-2"
      >
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          name={id}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          required={required}
          maxLength={maxLength}
          autoComplete={autoComplete}
          className={`
            h-14 text-base rounded-2xl border-2 bg-background/50
            px-4 transition-all duration-200 ease-out
            placeholder:text-muted-foreground/50 placeholder:text-sm
            hover:border-primary/30 hover:bg-background
            ${showPasswordToggle ? 'pr-14' : 'pr-4'}
            ${isFocused 
              ? 'border-primary ring-4 ring-primary/10 bg-background scale-[1.01]' 
              : 'border-input'
            }
            ${error ? 'border-destructive ring-2 ring-destructive/20' : ''}
          `}
        />
        {showPasswordToggle && (
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-muted/50 transition-colors"
            onClick={togglePassword}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        )}
      </div>
      {hint && (
        <p className="text-xs text-muted-foreground pl-1 animate-fade-in">
          {hint}
        </p>
      )}
    </div>
  );
});

export default OptimizedInput;
