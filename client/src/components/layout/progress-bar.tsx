import { Link } from "wouter";

export type StepType = {
  id: string;
  label: string;
  href?: string;
};

interface ProgressBarProps {
  steps: StepType[];
  currentStep: string;
  completedSteps: string[];
}

export function ProgressBar({ steps, currentStep, completedSteps }: ProgressBarProps) {
  return (
    <div className="mb-8 px-4">
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-gray-500">Progress</div>
          <div className="text-sm font-medium text-primary">
            {completedSteps.length} of {steps.length} steps completed
          </div>
        </div>
        
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
          <div 
            style={{ width: `${(completedSteps.length / steps.length) * 100}%` }} 
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-secondary"
          />
        </div>
        
        <div className="flex items-center justify-between w-full">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            const isActive = currentStep === step.id;
            
            return (
              <div key={step.id} className="flex flex-col items-center">
                <div className="flex items-center relative">
                  {isCompleted ? (
                    <Link href={step.href || "#"}>
                      <a className="step-completed rounded-full h-8 w-8 flex items-center justify-center z-10 text-xs">
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path 
                            fillRule="evenodd" 
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                            clipRule="evenodd" 
                          />
                        </svg>
                      </a>
                    </Link>
                  ) : isActive ? (
                    <div className="step-active rounded-full h-8 w-8 flex items-center justify-center z-10 text-xs">
                      {index + 1}
                    </div>
                  ) : (
                    <div className="rounded-full h-8 w-8 border-2 border-gray-300 flex items-center justify-center z-10 text-xs text-gray-500">
                      {index + 1}
                    </div>
                  )}
                  
                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <>
                      <div 
                        className={`absolute top-4 h-0.5 w-full ${isCompleted ? 'bg-secondary' : 'bg-gray-200'} right-1/2 hidden sm:block`}
                      />
                      <div 
                        className={`absolute top-4 h-0.5 w-full ${
                          steps[index + 1] && completedSteps.includes(steps[index + 1].id) 
                            ? 'bg-secondary' 
                            : 'bg-gray-200'
                        } left-1/2 hidden sm:block`}
                      />
                    </>
                  )}
                </div>
                <span className="mt-2 text-xs font-medium text-gray-700 hidden sm:block">
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
