import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
  { num: 1, label: 'Script' },
  { num: 2, label: 'Settings' },
  { num: 3, label: 'Generate' },
  { num: 4, label: 'Edit' },
  { num: 5, label: 'Export' },
];

export default function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {steps.map((step, i) => (
        <React.Fragment key={step.num}>
          <div className="flex items-center gap-1.5">
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
              currentStep > step.num
                ? "bg-primary text-primary-foreground"
                : currentStep === step.num
                  ? "bg-primary/20 text-primary ring-2 ring-primary/40 neon-glow"
                  : "bg-secondary text-muted-foreground"
            )}>
              {currentStep > step.num ? <Check className="w-3.5 h-3.5" /> : step.num}
            </div>
            <span className={cn(
              "text-xs font-medium hidden md:block",
              currentStep === step.num ? "text-primary" : "text-muted-foreground"
            )}>{step.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={cn(
              "w-8 h-0.5 rounded-full transition-all duration-300",
              currentStep > step.num ? "bg-primary" : "bg-secondary"
            )} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}