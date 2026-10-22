import React from 'react';
import { Check } from 'lucide-react';

export interface Step {
  id: number;
  title: string;
  shortTitle: string;
}

export interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  onStepClick,
}) => {
  return (
    <div className="w-full py-2">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-gray-200 dark:bg-gray-700 z-0" />
        
        {steps.map((step) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isClickable = onStepClick && step.id <= currentStep;

          return (
            <div
              key={step.id}
              className={`relative z-10 flex flex-col items-center cursor-pointer transition-transform ${
                isClickable ? 'active:scale-95' : 'cursor-default'
              }`}
              onClick={() => isClickable && onStepClick(step.id)}
            >
              <div
                className={`tap-target w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 border-2 ${
                  isCompleted
                    ? 'bg-[#0B6B3A] border-[#0B6B3A] text-white'
                    : isCurrent
                    ? 'bg-[#FFC93C] border-[#0B6B3A] text-[#111827] ring-4 ring-[#FFC93C]/30 shadow-md scale-105'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'
                }`}
              >
                {isCompleted ? <Check className="w-5 h-5 text-white" /> : step.id}
              </div>
              <span
                className={`mt-1.5 text-xs font-semibold tracking-wide ${
                  isCurrent
                    ? 'text-[#0B6B3A] dark:text-[#FFC93C]'
                    : isCompleted
                    ? 'text-gray-700 dark:text-gray-300'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {step.shortTitle}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
