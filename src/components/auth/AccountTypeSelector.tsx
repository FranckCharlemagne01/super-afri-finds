import React, { memo, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ShoppingCart, Store } from 'lucide-react';

interface AccountTypeSelectorProps {
  value: 'buyer' | 'seller';
  onChange: (value: 'buyer' | 'seller') => void;
}

const AccountTypeSelector = memo(function AccountTypeSelector({ 
  value, 
  onChange 
}: AccountTypeSelectorProps) {
  const handleChange = useCallback((newValue: string) => {
    onChange(newValue as 'buyer' | 'seller');
  }, [onChange]);

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold">Type de compte</Label>
      <RadioGroup 
        value={value} 
        onValueChange={handleChange}
        className="grid grid-cols-2 gap-3"
      >
        <div>
          <RadioGroupItem value="buyer" id="buyer" className="sr-only" />
          <Label 
            htmlFor="buyer" 
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
              value === 'buyer' 
                ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' 
                : 'border-input hover:border-primary/30 hover:bg-muted/50'
            }`}
          >
            <div className={`p-2 rounded-xl ${value === 'buyer' ? 'bg-primary/10' : 'bg-muted'}`}>
              <ShoppingCart className={`w-5 h-5 ${value === 'buyer' ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <span className={`text-sm font-medium ${value === 'buyer' ? 'text-primary' : 'text-foreground'}`}>
              Acheteur
            </span>
          </Label>
        </div>
        
        <div>
          <RadioGroupItem value="seller" id="seller" className="sr-only" />
          <Label 
            htmlFor="seller" 
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
              value === 'seller' 
                ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' 
                : 'border-input hover:border-primary/30 hover:bg-muted/50'
            }`}
          >
            <div className={`p-2 rounded-xl ${value === 'seller' ? 'bg-primary/10' : 'bg-muted'}`}>
              <Store className={`w-5 h-5 ${value === 'seller' ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <span className={`text-sm font-medium ${value === 'seller' ? 'text-primary' : 'text-foreground'}`}>
              Vendeur
            </span>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
});

export default AccountTypeSelector;
