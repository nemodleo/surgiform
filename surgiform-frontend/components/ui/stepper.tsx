"use client"

import { cn } from "@/lib/utils"

interface StepperProps {
  steps: string[]
  currentStep: number
  onStepClick?: (step: number) => void
}

export function Stepper({ steps, currentStep, onStepClick }: StepperProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center" style={{ flex: index === steps.length - 1 ? '0' : '1' }}>
            <button
              onClick={() => onStepClick?.(index)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                index < currentStep
                  ? "border-green-dark bg-green-dark text-white"
                  : index === currentStep
                  ? "border-green-dark bg-white text-green-dark"
                  : "border-gray-300 bg-white text-gray-500"
              )}
            >
              {index < currentStep ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </button>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 transition-colors",
                  index < currentStep ? "bg-green-dark" : "bg-gray-300"
                )}
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 flex">
        {steps.map((step, index) => (
          <div
            key={index}
            className={cn(
              "text-center text-xs",
              index === 0 ? "text-left" : index === steps.length - 1 ? "text-right flex-shrink-0" : "flex-1",
              index === currentStep
                ? "font-medium text-green-dark"
                : index < currentStep
                ? "text-green-dark"
                : "text-gray-500"
            )}
            style={{ 
              width: index === 0 || index === steps.length - 1 ? 'auto' : '100%',
              paddingLeft: index === 0 ? '0' : '10px',
              paddingRight: index === steps.length - 1 ? '0' : '10px'
            }}
          >
            {step}
          </div>
        ))}
      </div>
    </div>
  )
}