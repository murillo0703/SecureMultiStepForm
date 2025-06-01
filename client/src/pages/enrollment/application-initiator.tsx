import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { TwoPanelLayout } from '@/components/layouts/two-panel-layout';
import { 
  Building, 
  User, 
  Crown,
  FileText,
  CheckCircle,
  Edit,
  ArrowRight,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useLocation } from 'wouter';

interface OnboardingData {
  company: {
    id: number;
    name: string;
    taxId: string;
    industry: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  contacts: Array<{
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    title: string;
    relationshipToCompany: string;
  }>;
  owners: Array<{
    id: number;
    firstName: string;
    lastName: string;
    ownershipPercentage: number;
    isAuthorizedContact: boolean;
  }>;
}

export default function ApplicationInitiator() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch pre-populated data from onboarding
  const { data: onboardingData, isLoading } = useQuery<OnboardingData>({
    queryKey: ['/api/employer/onboarding/data'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/employer/onboarding/data');
      return response.json();
    },
  });

  const startApplicationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/enrollment/start-application');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Application Started',
        description: 'Your insurance application has been initialized with your company data.',
      });
      setLocation(`/enrollment/application/${data.applicationId}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start application.',
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <TwoPanelLayout 
        title="Start Your Application"
        tableOfContents={[]}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your information...</p>
          </div>
        </div>
      </TwoPanelLayout>
    );
  }

  const leftContent = (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Start Your Application</h1>
        <p className="text-muted-foreground">
          We've pre-filled your application with the information from your company setup. 
          Review the details below and start your insurance application process.
        </p>
      </div>

      {onboardingData && (
        <div className="space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Company Information</span>
                <Badge variant="secondary">Pre-filled</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Company Name</Label>
                  <p className="text-sm text-muted-foreground">{onboardingData.company.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Tax ID</Label>
                  <p className="text-sm text-muted-foreground">{onboardingData.company.taxId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Industry</Label>
                  <p className="text-sm text-muted-foreground">{onboardingData.company.industry}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <p className="text-sm text-muted-foreground">{onboardingData.company.phone}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Address</Label>
                <p className="text-sm text-muted-foreground">
                  {onboardingData.company.address}, {onboardingData.company.city}, {onboardingData.company.state} {onboardingData.company.zip}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation('/employer/dashboard?tab=company')}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Company Info
              </Button>
            </CardContent>
          </Card>

          {/* Contacts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Authorized Contacts</span>
                <Badge variant="secondary">{onboardingData.contacts.length} Contact{onboardingData.contacts.length !== 1 ? 's' : ''}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {onboardingData.contacts.map((contact, index) => (
                <div key={contact.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{contact.firstName} {contact.lastName}</p>
                    <p className="text-sm text-muted-foreground">{contact.title} • {contact.relationshipToCompany}</p>
                    <p className="text-sm text-muted-foreground">{contact.email}</p>
                  </div>
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation('/employer/dashboard?tab=contacts')}
              >
                <Edit className="h-4 w-4 mr-2" />
                Manage Contacts
              </Button>
            </CardContent>
          </Card>

          {/* Owners */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Crown className="h-5 w-5" />
                <span>Company Owners</span>
                <Badge variant="secondary">{onboardingData.owners.length} Owner{onboardingData.owners.length !== 1 ? 's' : ''}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {onboardingData.owners.map((owner, index) => (
                <div key={owner.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{owner.firstName} {owner.lastName}</p>
                    <p className="text-sm text-muted-foreground">{owner.ownershipPercentage}% ownership</p>
                    {owner.isAuthorizedContact && (
                      <Badge variant="outline" className="mt-1">Authorized Contact</Badge>
                    )}
                  </div>
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation('/employer/dashboard?tab=owners')}
              >
                <Edit className="h-4 w-4 mr-2" />
                Manage Owners
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <Separator />

      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          onClick={() => startApplicationMutation.mutate()}
          disabled={startApplicationMutation.isPending}
          className="flex-1"
          size="lg"
        >
          {startApplicationMutation.isPending ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Starting Application...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Start Application Process
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
        <Button 
          variant="outline"
          onClick={() => setLocation('/employer/dashboard')}
          size="lg"
        >
          Return to Dashboard
        </Button>
      </div>
    </div>
  );

  const rightContent = (
    <div className="space-y-6">
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-800">
            <Shield className="h-5 w-5" />
            <span>What Happens Next?</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-blue-700">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
              <div>
                <p className="font-medium">Employee Information</p>
                <p className="text-sm text-blue-600">Add your employees and their details</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
              <div>
                <p className="font-medium">Document Upload</p>
                <p className="text-sm text-blue-600">Upload required business documents</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
              <div>
                <p className="font-medium">Plan Selection</p>
                <p className="text-sm text-blue-600">Choose your insurance plans and coverage</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</div>
              <div>
                <p className="font-medium">Contribution Setup</p>
                <p className="text-sm text-blue-600">Configure employer contribution amounts</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">5</div>
              <div>
                <p className="font-medium">Review & Submit</p>
                <p className="text-sm text-blue-600">Final review and application submission</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-green-800">Pre-filled Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-green-700">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Company details verified</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Contact information ready</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Ownership structure documented</span>
          </div>
          <p className="text-xs text-green-600 mt-4">
            Your onboarding information has been automatically transferred to streamline the application process.
          </p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <TwoPanelLayout 
      title="Start Your Application"
      tableOfContents={[
        { title: "Company Information", href: "#company" },
        { title: "Authorized Contacts", href: "#contacts" },
        { title: "Company Owners", href: "#owners" }
      ]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {leftContent}
        </div>
        <div className="lg:col-span-1">
          {rightContent}
        </div>
      </div>
    </TwoPanelLayout>
  );
}