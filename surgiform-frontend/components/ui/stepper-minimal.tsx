"use client"

import { Check } from "lucide-react"

interface StepperProps {
  steps: string[]
  currentStep: number
  onStepClick?: (step: number) => void
}

export function StepperMinimal({ steps, currentStep, onStepClick }: StepperProps) {
  return (
    <div className="flex items-center justify-between max-w-3xl mx-auto">
      {steps.map((label, index) => {
        const isCompleted = index < currentStep
        const isActive = index === currentStep
        
        return (
          <div
            key={index}
            className="flex-1 relative"
          >
            <div className="flex flex-col items-center">
              <button
                onClick={() => onStepClick?.(index)}
                className={`
                  relative z-10 flex items-center justify-center w-10 h-10 rounded-full
                  text-sm font-medium transition-all border
                  ${isActive 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : isCompleted 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'bg-white text-muted-foreground border-light hover:border-foreground'
                  }
                `}
                disabled={index > currentStep + 1}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" strokeWidth={2} />
                ) : (
                  <span>{index + 1}</span>
                )}
              </button>
              
              {index < steps.length - 1 && (
                <div className="absolute top-5 left-[calc(50%+20px)] w-[calc(100%-40px)] h-[1px]">
                  <div className={`h-full transition-all duration-300 ${
                    isCompleted ? 'bg-primary' : 'bg-border'
                  }`} />
                </div>
              )}
              
              <div className="mt-2">
                <p className={`text-xs font-medium transition-colors text-center ${
                  isActive || isCompleted ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {label}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}