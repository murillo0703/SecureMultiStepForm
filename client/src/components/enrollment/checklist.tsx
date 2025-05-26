import { useQuery } from '@tanstack/react-query';
import { Application, Company, User } from '@shared/schema';
import { Check, AlertCircle, Circle } from 'lucide-react';
import { Link } from 'wouter';
import { getEnabledEnrollmentSteps } from '@/utils/enrollment-steps';

interface ChecklistProps {
  companyId: number;
}

export function EnrollmentChecklist({ companyId }: ChecklistProps) {
  const { data: application } = useQuery<Application>({
    queryKey: [`/api/companies/${companyId}/application`],
    enabled: !!companyId,
  });

  const completedSteps = (application?.completedSteps as string[]) || [];
  const currentStep = application?.currentStep || '';

  // Get the enabled steps from our utility
  const checklistItems = getEnabledEnrollmentSteps().map(step => ({
    id: step.id,
    label:
      step.id === 'company'
        ? 'Company details'
        : step.id === 'ownership'
          ? 'Business owners'
          : step.id === 'employees'
            ? 'Employee census'
            : step.id === 'documents'
              ? 'Required documents'
              : step.id === 'plans'
                ? 'Plan selection'
                : step.id === 'contributions'
                  ? 'Contribution setup'
                  : step.id === 'review'
                    ? 'Application signature'
                    : step.label,
    href: step.href,
  }));

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
      <div className="p-4 bg-primary text-white">
        <h3 className="font-medium">Enrollment Checklist</h3>
      </div>
      <div className="p-4">
        <div className="space-y-3">
          {checklistItems.map(item => {
            const isCompleted = completedSteps.includes(item.id);
            const isActive = currentStep === item.id;

            return (
              <div key={item.id} className="flex">
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <Check className="h-5 w-5 text-secondary" />
                  ) : isActive ? (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-300" />
                  )}
                </div>
                <div className="ml-3">
                  <Link href={item.href}>
                    <a
                      className={`text-sm ${isCompleted ? 'text-gray-700' : isActive ? 'text-gray-700 font-medium' : 'text-gray-400'}`}
                    >
                      {item.label} {isActive && '(in progress)'}
                    </a>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
