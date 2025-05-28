import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { REQUIRED_DOCUMENT_TYPES, validateRequiredDocuments } from '@/utils/form-validators';
import { Document } from '@shared/schema';
import { getEnabledEnrollmentSteps } from '@/utils/enrollment-steps';
import { Header } from '@/components/layout/header';
import { ProgressBar } from '@/components/layout/progress-bar';
import { EnrollmentChecklist } from '@/components/enrollment/checklist';
import { DocumentUploader } from '@/components/enrollment/document-uploader';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';

export default function DocumentUpload() {
  const queryClient = useQueryClient();
  const [location, navigate] = useLocation();

  // Fetch companies for this user
  const { data: companies = [], isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['/api/companies'],
  });

  // Get the first company
  const companyId = companies.length > 0 ? companies[0].id : null;

  // Redirect if no company exists
  useEffect(() => {
    if (!isLoadingCompanies && !companyId) {
      navigate('/enrollment/company-information');
    }
  }, [companyId, isLoadingCompanies, navigate]);

  // Fetch documents for this company
  const { data: documents = [], isLoading: isLoadingDocuments } = useQuery<Document[]>({
    queryKey: [`/api/companies/${companyId}/documents`],
    enabled: !!companyId,
  });

  // Fetch application data (optional, handle 404 gracefully)
  const { data: application, isLoading: isLoadingApplication } = useQuery({
    queryKey: [`/api/companies/${companyId}/application`],
    enabled: !!companyId,
    retry: false,
    throwOnError: false,
  });

  // Use the enabled enrollment steps (without the Employee step)
  const steps = getEnabledEnrollmentSteps();

  // Filter out documents that have already been uploaded
  const uploadedDocumentTypes = documents.map(doc => doc.type);
  const missingDocuments = REQUIRED_DOCUMENT_TYPES.filter(
    docType => !uploadedDocumentTypes.includes(docType)
  );

  // Loading state
  const isLoading = isLoadingCompanies || isLoadingDocuments || isLoadingApplication;

  if (!companyId) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <ProgressBar
          steps={steps}
          currentStep="documents"
          completedSteps={(application?.completedSteps as string[]) || []}
        />

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content Area */}
          <div className="lg:flex-1">
            {/* Autosave Indicator */}
            <div className="flex items-center mb-2 text-sm text-gray-500">
              <CheckCircle className="h-4 w-4 mr-1 text-secondary" />
              <span>All changes autosaved</span>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Required Documents</CardTitle>
                <CardDescription>
                  Upload all required supporting documentation for your health insurance
                  application.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <h3 className="text-sm font-medium text-blue-800">Document Requirements</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      The following documents are required to process your application:
                    </p>
                    <ul className="mt-2 list-disc pl-5 text-sm text-blue-700 space-y-1">
                      <li>DE-9C (Quarterly Contribution Return and Report of Wages)</li>
                      <li>Articles of Incorporation or Organization</li>
                      <li>Business License</li>
                    </ul>
                  </div>

                  {/* Document Uploader Component */}
                  <DocumentUploader companyId={companyId} />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => navigate('/enrollment/employees')}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous: Employees
                </Button>
                <Button
                  onClick={() => navigate('/enrollment/plans')}
                  disabled={!validateRequiredDocuments(documents)}
                >
                  Next: Plans
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80">
            <EnrollmentChecklist companyId={companyId} />
          </div>
        </div>
      </main>
    </div>
  );
}
