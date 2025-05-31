import { useState, useEffect } from 'react';
import { useLocation, useRoute, Link } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { SignaturePad } from '@/components/enrollment/signature-pad';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/layout/header';
import { ProgressSidebar } from '@/components/enrollment/progress-sidebar';
import { Loader2, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { isFeatureEnabled } from '@/config/feature-flags';
import { Company, Application } from '@shared/schema';

export default function SignaturePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [signature, setSignature] = useState<string>('');
  const [agreement, setAgreement] = useState<boolean>(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Get user's companies
  const { data: companies = [], isLoading: isLoadingCompanies } = useQuery<Company[]>({
    queryKey: ['/api/companies'],
    enabled: !!user,
  });

  // Get the first company (for now we only support one company per user)
  const company = companies.length > 0 ? companies[0] : null;
  const companyId = company?.id;

  // Get application data
  const { data: application, isLoading: isLoadingApplication } = useQuery<Application>({
    queryKey: [`/api/companies/${companyId}/application`],
    enabled: !!companyId && !!user,
  });

  // Signature submission mutation
  const signatureMutation = useMutation({
    mutationFn: async () => {
      if (!application || !application.id) {
        throw new Error('Application information is missing');
      }

      console.log('Submitting signature for application:', application.id);

      try {
        const res = await apiRequest('POST', `/api/applications/${application.id}/signature`, {
          signature,
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to submit signature');
        }

        return await res.json();
      } catch (error) {
        console.error('Error submitting signature:', error);
        throw error;
      }
    },
    onSuccess: () => {
      setSubmissionStatus('success');

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/applications/company/${companyId}`] });

      toast({
        title: 'Signature Submitted',
        description: 'Your application has been signed and submitted successfully.',
        variant: 'default',
      });

      // Redirect to confirmation page after a short delay
      setTimeout(() => {
        setLocation('/enrollment/review');
      }, 2000);
    },
    onError: (error: Error) => {
      setSubmissionStatus('error');

      toast({
        title: 'Submission Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!signature) {
      toast({
        title: 'Signature Required',
        description: 'Please sign the application before submitting.',
        variant: 'destructive',
      });
      return;
    }

    if (!agreement) {
      toast({
        title: 'Agreement Required',
        description: 'Please agree to the terms before submitting.',
        variant: 'destructive',
      });
      return;
    }

    signatureMutation.mutate();
  };

  // Loading state
  if (isLoadingCompanies || isLoadingApplication) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check if we have the necessary data
  if (!company || !application) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Could not load the required information. Please go back and try again.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => setLocation('/enrollment/review')}>
            Back to Review
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        {/* Sidebar */}
        <ProgressSidebar />
        
        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Autosave Indicator */}
          <div className="flex items-center mb-6 text-sm text-gray-500">
            <CheckCircle2 className="h-4 w-4 mr-1 text-secondary" />
            <span>All changes autosaved</span>
          </div>
          
          <div className="max-w-4xl">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Digital Signature</h1>
                  <p className="text-gray-600">
                    Sign your application to complete the enrollment process
                  </p>
                </div>
              </div>
            </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Legal Agreement */}
          <Card>
            <CardHeader>
              <CardTitle>Legal Agreement</CardTitle>
              <CardDescription>
                Please review the terms of this application before signing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted p-4 rounded-md max-h-[300px] overflow-y-auto text-sm">
                <h3 className="font-medium mb-2">Terms and Conditions</h3>
                <p className="mb-4">
                  By signing this application, I {user?.username || 'Applicant'}, an authorized
                  representative of {company.name}, agree to the following terms:
                </p>

                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    I certify that all information provided in this application is true and correct
                    to the best of my knowledge.
                  </li>
                  <li>
                    I understand that any false statements or misrepresentations may result in the
                    denial of this application.
                  </li>
                  <li>
                    I authorize Murillo Insurance Agency to submit this application and all
                    supporting documents to the selected insurance carriers.
                  </li>
                  <li>
                    I understand that this application is subject to approval by the insurance
                    carriers, and coverage is not guaranteed until approved.
                  </li>
                  <li>
                    I acknowledge that premium rates will be determined by the insurance carriers
                    based on multiple factors including census data, location, and plan selections.
                  </li>
                  <li>
                    I agree to provide any additional information that may be required to process
                    this application.
                  </li>
                </ol>

                <h3 className="font-medium mt-6 mb-2">Privacy Statement</h3>
                <p>
                  The information collected in this application will be used solely for the purpose
                  of obtaining health insurance coverage. We will not sell or distribute your
                  information to unaffiliated third parties. For more information, please review our
                  complete Privacy Policy.
                </p>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="agreement"
                  checked={agreement}
                  onCheckedChange={value => setAgreement(value === true)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="agreement"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I agree to the terms and conditions
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    By checking this box, you acknowledge that you have read and agree to the terms
                    above.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Signature Pad */}
          <SignaturePad
            onChange={setSignature}
            value={signature}
            label="Your Digital Signature"
            description="Please sign below to authorize submission of this application to insurance carriers."
          />

          {/* Submission Status */}
          {submissionStatus === 'success' && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-700">Application Submitted</AlertTitle>
              <AlertDescription className="text-green-600">
                Your application has been successfully signed and submitted. You will be redirected
                to the confirmation page.
              </AlertDescription>
            </Alert>
          )}

          {submissionStatus === 'error' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Submission Failed</AlertTitle>
              <AlertDescription>
                There was an error submitting your application. Please try again or contact support.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation('/enrollment/review')}
              className="w-full sm:w-auto"
            >
              Back to Review
            </Button>

            <Button
              type="submit"
              disabled={
                signatureMutation.isPending ||
                !signature ||
                !agreement ||
                submissionStatus === 'success'
              }
              className="w-full sm:w-auto sm:ml-auto"
            >
              {signatureMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
          </div>
        </form>
          </div>
        </div>
      </div>
    </div>
  );
}
