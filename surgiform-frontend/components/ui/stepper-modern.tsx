"use client"

import { CheckCircle } from "lucide-react"

interface StepperProps {
  steps: string[]
  currentStep: number
  onStepClick?: (step: number) => void
}

export function StepperModern({ steps, currentStep, onStepClick }: StepperProps) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((label, index) => {
        const isCompleted = index < currentStep
        const isActive = index === currentStep
        
        return (
          <div
            key={index}
            className="flex-1 relative"
          >
            <div className="flex items-center">
              <button
                onClick={() => onStepClick?.(index)}
                className={`
                  relative z-10 flex items-center justify-center w-12 h-12 rounded-2xl
                  font-semibold transition-all-smooth
                  ${isActive 
                    ? 'gradient-primary text-white shadow-card scale-110' 
                    : isCompleted 
                      ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                      : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                  }
                `}
                disabled={!isCompleted && !isActive}
              >
                {isCompleted ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <span className="text-lg">{index + 1}</span>
                )}
              </button>
              
              {index < steps.length - 1 && (
                <div className="flex-1 ml-4">
                  <div className="h-1 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={`h-full gradient-primary transition-all duration-500 ease-out ${
                        isCompleted ? 'w-full' : 'w-0'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-3">
              <p className={`text-sm font-medium transition-colors ${
                isActive ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {label}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}