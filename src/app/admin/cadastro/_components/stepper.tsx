"use client";

import { cn } from "@/lib/utils";

interface Step {
  id: string;
  label: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  completedSteps: number[];
  onStepClick?: (index: number) => void;
}

export function Stepper({ steps, currentStep, completedSteps, onStepClick }: StepperProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      {steps.map((step, i) => {
        const isActive = i === currentStep;
        const isCompleted = completedSteps.includes(i);
        const clickable = isCompleted || i <= currentStep;

        return (
          <div key={step.id} className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => clickable && onStepClick?.(i)}
              disabled={!clickable}
              className={cn(
                "flex h-8 items-center rounded-full px-3 text-xs font-medium transition-colors whitespace-nowrap",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : isCompleted
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {isCompleted && i !== currentStep && (
                <span className="mr-1.5 inline-block h-3 w-3 rounded-full bg-green-500" />
              )}
              {step.label}
            </button>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "mx-1 h-px w-4",
                  isCompleted ? "bg-primary/50" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
