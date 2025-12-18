import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface FacebookAuthButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  mode?: 'signin' | 'signup';
}

const FacebookAuthButton = ({ onClick, disabled, loading, mode = 'signin' }: FacebookAuthButtonProps) => {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full h-14 md:h-12 text-base font-medium rounded-xl border-2 hover:bg-accent/50 hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3"
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            fill="#1877F2"
            d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
          />
        </svg>
      )}
      <span>
        {mode === 'signin' ? 'Continuer avec Facebook' : 'S\'inscrire avec Facebook'}
      </span>
    </Button>
  );
};

export default FacebookAuthButton;
