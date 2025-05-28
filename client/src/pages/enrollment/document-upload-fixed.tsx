import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { REQUIRED_DOCUMENT_TYPES, validateRequiredDocuments } from '@/utils/form-validators';
import { Document } from '@shared/schema';
import { getEnabledEnrollmentSteps } from '@/utils/enrollment-steps';
import { Header } from '@/components/layout/header';
import { ProgressSidebar } from '@/components/enrollment/progress-sidebar';
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
  const companyId = companies.length > 0 ? companies[0].id : 1; // Default to 1 for testing

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

  // Filter out documents that have already been uploaded
  const uploadedDocumentTypes = documents.map(doc => doc.type);
  const missingDocuments = REQUIRED_DOCUMENT_TYPES.filter(
    docType => !uploadedDocumentTypes.includes(docType)
  );

  // Loading state
  const isLoading = isLoadingCompanies || isLoadingDocuments || isLoadingApplication;

  if (!companyId) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        {/* Sidebar */}
        <ProgressSidebar currentStep="documents" />
        
        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Autosave Indicator */}
          <div className="flex items-center mb-6 text-sm text-gray-500">
            <CheckCircle className="h-4 w-4 mr-1 text-secondary" />
            <span>All changes autosaved</span>
          </div>
          
          <div className="max-w-4xl">
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
                    <h3 className="font-medium text-blue-900 mb-2">Document Requirements</h3>
                    <p className="text-blue-700 text-sm mb-3">
                      Please ensure all documents are clear, legible, and in PDF format. 
                      Maximum file size is 10MB per document.
                    </p>
                    <ul className="list-disc list-inside text-blue-700 text-sm space-y-1">
                      <li>Business license or articles of incorporation</li>
                      <li>Most recent tax return (Form 1120 or 1120S)</li>
                      <li>Employee census with eligibility information</li>
                      <li>Current health plan information (if applicable)</li>
                    </ul>
                  </div>

                  {/* Document Upload Section */}
                  <div className="space-y-4">
                    {REQUIRED_DOCUMENT_TYPES.map((docType) => (
                      <div key={docType} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{docType}</h4>
                          {uploadedDocumentTypes.includes(docType) && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                        <DocumentUploader
                          documentType={docType}
                          companyId={companyId}
                          onUploadComplete={() => {
                            queryClient.invalidateQueries({ 
                              queryKey: [`/api/companies/${companyId}/documents`] 
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => navigate('/enrollment/authorized-contact')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Contacts
                </Button>
                <Button
                  onClick={() => navigate('/enrollment/plan-selection')}
                  className="flex items-center gap-2"
                  disabled={missingDocuments.length > 0}
                >
                  Continue to Plans
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}