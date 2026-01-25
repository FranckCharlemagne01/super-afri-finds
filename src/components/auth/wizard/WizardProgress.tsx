import { memo } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

const WizardProgress = memo(({ currentStep, totalSteps, stepLabels }: WizardProgressProps) => {
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="w-full space-y-3">
      {/* Progress bar */}
      <div className="relative">
        {/* Background track */}
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          {/* Animated progress fill */}
          <motion.div
            className="h-full bg-gradient-to-r from-primary via-primary to-primary/80 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>

        {/* Step dots */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between">
          {Array.from({ length: totalSteps }).map((_, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;
            
            return (
              <motion.div
                key={stepNumber}
                className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  transition-all duration-300 border-2
                  ${isCompleted 
                    ? 'bg-primary border-primary text-primary-foreground' 
                    : isCurrent 
                      ? 'bg-primary border-primary text-primary-foreground ring-4 ring-primary/20' 
                      : 'bg-card border-muted text-muted-foreground'
                  }
                `}
                initial={false}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                }}
                transition={{ duration: 0.2 }}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                ) : (
                  stepNumber
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Step label */}
      <motion.div 
        className="text-center"
        key={currentStep}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <p className="text-xs text-muted-foreground font-medium">
          Étape {currentStep} sur {totalSteps}
        </p>
        <p className="text-sm font-semibold text-foreground mt-0.5">
          {stepLabels[currentStep - 1]}
        </p>
      </motion.div>
    </div>
  );
});

WizardProgress.displayName = 'WizardProgress';

export default WizardProgress;
