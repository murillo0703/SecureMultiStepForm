import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Header } from '@/components/layout/header';
import { ProgressBar } from '@/components/layout/progress-bar';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, ArrowLeft, ArrowRight } from 'lucide-react';

interface ComingSoonPageProps {
  featureName?: string;
  redirectPath?: string;
}

export default function ComingSoonPage({
  featureName = 'Employees Section',
  redirectPath = '/enrollment/documents',
}: ComingSoonPageProps) {
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    toast({
      title: 'Feature Coming Soon',
      description: `The ${featureName} will be available in a future version.`,
    });
  }, []);

  // Get the steps without the disabled ones
  const steps = [
    { id: 'company', label: 'Company', href: '/enrollment/company' },
    { id: 'ownership', label: 'Owners', href: '/enrollment/ownership' },
    // Employee step is intentionally skipped
    { id: 'documents', label: 'Documents', href: '/enrollment/documents' },
    { id: 'plans', label: 'Plans', href: '/enrollment/plans' },
    { id: 'contributions', label: 'Contributions', href: '/enrollment/contributions' },
    { id: 'review', label: 'Submit', href: '/enrollment/review' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <ProgressBar steps={steps} currentStep="documents" completedSteps={[]} />

        <div className="mt-6">
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-6 w-6 mr-2 text-primary" />
                Feature Coming Soon
              </CardTitle>
              <CardDescription>
                This feature is currently in development and will be available in a future version.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-800">About {featureName}</h3>
                <p className="mt-1 text-sm text-blue-600">
                  We're working on making this feature available to you. In the next release, you'll
                  be able to add and manage employee information directly through this interface.
                </p>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => navigate('/enrollment/ownership')}
                  className="flex items-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Ownership
                </Button>
                <Button onClick={() => navigate(redirectPath)} className="flex items-center">
                  Continue to Documents
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
