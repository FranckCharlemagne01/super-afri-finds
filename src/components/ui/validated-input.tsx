import * as React from "react";
import { cn } from "@/lib/utils";

interface BaseInputProps extends Omit<React.ComponentProps<"input">, 'onChange'> {
  onChange?: (value: string) => void;
  errorMessage?: string;
}

interface NumericInputProps extends BaseInputProps {
  variant: 'numeric';
  allowDecimals?: boolean;
}

interface TextInputProps extends BaseInputProps {
  variant: 'text';
  allowNumbers?: boolean;
}

type ValidatedInputProps = NumericInputProps | TextInputProps;

const ValidatedInput = React.forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({ className, variant, onChange, errorMessage, ...props }, ref) => {
    const [error, setError] = React.useState<string>("");
    const [internalValue, setInternalValue] = React.useState(props.value?.toString() || "");

    React.useEffect(() => {
      setInternalValue(props.value?.toString() || "");
    }, [props.value]);

    const validateAndUpdate = (newValue: string) => {
      let isValid = true;
      let errorMsg = "";

      if (variant === 'numeric') {
        const { allowDecimals = false } = props as NumericInputProps;
        const numericRegex = allowDecimals ? /^[0-9]*\.?[0-9]*$/ : /^[0-9]*$/;
        
        if (newValue && !numericRegex.test(newValue)) {
          isValid = false;
          errorMsg = "Veuillez entrer uniquement des chiffres.";
        }
      } else if (variant === 'text') {
        const { allowNumbers = false } = props as TextInputProps;
        const textRegex = allowNumbers ? /^[a-zA-ZÀ-ÿ0-9\s]*$/ : /^[a-zA-ZÀ-ÿ\s]*$/;
        
        if (newValue && !textRegex.test(newValue)) {
          isValid = false;
          errorMsg = allowNumbers 
            ? "Veuillez entrer uniquement des lettres et des chiffres."
            : "Veuillez entrer uniquement des lettres.";
        }
      }

      if (isValid) {
        setError("");
        setInternalValue(newValue);
        onChange?.(newValue);
      } else {
        setError(errorMsg);
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      validateAndUpdate(newValue);
    };

    const displayError = error || errorMessage;

    return (
      <div className="w-full">
        <input
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            displayError && "border-destructive focus-visible:ring-destructive",
            className,
          )}
          ref={ref}
          value={internalValue}
          onChange={handleChange}
          {...props}
        />
        {displayError && (
          <p className="text-xs text-destructive mt-1">{displayError}</p>
        )}
      </div>
    );
  },
);

ValidatedInput.displayName = "ValidatedInput";

// Composants spécialisés pour plus de facilité d'utilisation
const NumericInput = React.forwardRef<HTMLInputElement, Omit<NumericInputProps, 'variant'>>(
  (props, ref) => <ValidatedInput {...props} variant="numeric" ref={ref} />
);

const TextInput = React.forwardRef<HTMLInputElement, Omit<TextInputProps, 'variant'>>(
  (props, ref) => <ValidatedInput {...props} variant="text" ref={ref} />
);

NumericInput.displayName = "NumericInput";
TextInput.displayName = "TextInput";

export { ValidatedInput, NumericInput, TextInput };