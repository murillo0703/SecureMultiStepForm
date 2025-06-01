import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { TwoPanelLayout } from '@/components/layouts/two-panel-layout';
import { 
  Building, 
  User, 
  Crown,
  CheckCircle,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { INDUSTRY_OPTIONS, INDUSTRY_CATEGORIES, RELATIONSHIP_OPTIONS, US_STATES, formatPhoneNumber, cleanPhoneNumber, formatTaxId } from '@shared/constants';

interface OnboardingProgress {
  step1CompanyInfo: boolean;
  step2ContactInfo: boolean;
  step3OwnershipInfo: boolean;
  isComplete: boolean;
  companyId?: number;
}

export default function EmployerOnboarding() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Company Information State
  const [companyData, setCompanyData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    taxId: '',
    sicCode: '',
    industry: '',
    industrySubcategory: ''
  });

  // Industry selection state
  const [selectedIndustryCategory, setSelectedIndustryCategory] = useState('');

  // Contact Information State
  const [contactData, setContactData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    jobTitle: '',
    relationshipToCompany: '',
    phone: '',
    isPrimaryContact: true,
    isAuthorizedSigner: false
  });

  // Owner Information State
  const [ownerData, setOwnerData] = useState({
    firstName: '',
    lastName: '',
    title: '',
    ownershipPercentage: '',
    email: '',
    phone: '',
    relationshipToCompany: '',
    isEligibleForCoverage: false,
    isAuthorizedContact: false
  });

  // Redirect if not employer
  if (user?.role !== 'employer') {
    setLocation('/');
    return null;
  }

  // Fetch onboarding progress
  const { data: progress, isLoading } = useQuery<OnboardingProgress>({
    queryKey: ['/api/employer/onboarding/progress'],
  });

  // Step 1: Company Information Mutation
  const saveCompanyMutation = useMutation({
    mutationFn: async (data: typeof companyData) => {
      const response = await apiRequest('POST', '/api/employer/onboarding/company', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: 'Company information saved successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/employer/onboarding/progress'] });
      setCurrentStep(2);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save company information.',
        variant: 'destructive',
      });
    },
  });

  // Step 2: Contact Information Mutation
  const saveContactMutation = useMutation({
    mutationFn: async (data: typeof contactData) => {
      const response = await apiRequest('POST', '/api/employer/onboarding/contact', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Contact information saved successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/employer/onboarding/progress'] });
      setCurrentStep(3);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save contact information.',
        variant: 'destructive',
      });
    },
  });

  // Step 3: Owner Information Mutation
  const saveOwnerMutation = useMutation({
    mutationFn: async (data: typeof ownerData) => {
      const response = await apiRequest('POST', '/api/employer/onboarding/owner', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Congratulations!',
        description: 'Your company setup is complete! 🎉',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/employer/onboarding/progress'] });
      // Don't redirect yet - show completion screen
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save owner information.',
        variant: 'destructive',
      });
    },
  });

  const getProgressPercentage = () => {
    if (!progress) return 0;
    let completed = 0;
    if (progress.step1CompanyInfo) completed++;
    if (progress.step2ContactInfo) completed++;
    if (progress.step3OwnershipInfo) completed++;
    return (completed / 3) * 100;
  };

  const tableOfContentsItems = [
    {
      title: 'Setup Progress',
      items: [
        {
          id: 'step1',
          title: 'Company Information',
          icon: <Building className="h-4 w-4" />,
          isActive: currentStep === 1,
          isComplete: progress?.step1CompanyInfo,
          onClick: () => setCurrentStep(1),
        },
        {
          id: 'step2',
          title: 'Contact Information',
          icon: <User className="h-4 w-4" />,
          isActive: currentStep === 2,
          isComplete: progress?.step2ContactInfo,
          onClick: () => setCurrentStep(2),
        },
        {
          id: 'step3',
          title: 'Ownership Information',
          icon: <Crown className="h-4 w-4" />,
          isActive: currentStep === 3,
          isComplete: progress?.step3OwnershipInfo,
          onClick: () => setCurrentStep(3),
        },
      ]
    }
  ];

  const renderStepContent = () => {
    // Show completion screen if onboarding is complete
    if (progress?.isComplete) {
      return (
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Setup Complete!</CardTitle>
            <p className="text-muted-foreground">
              Congratulations! Your company information has been successfully set up.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">What's Next?</h3>
              <p className="text-green-700 text-sm">
                You can now start your insurance application process. All the information you've provided 
                will be automatically pre-filled to save you time.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => setLocation('/enrollment/application-initiator')}
                className="bg-green-600 hover:bg-green-700"
                size="lg"
              >
                Start Application Process
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                variant="outline"
                onClick={() => setLocation('/employer/dashboard')}
                size="lg"
              >
                Maybe Later - Go to Dashboard
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              Don't worry - you can always edit your information later from your dashboard.
            </div>
          </CardContent>
        </Card>
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Company Information</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Enter your company's basic information. This will be used throughout the system.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input 
                      id="companyName" 
                      placeholder="Enter company name"
                      value={companyData.name}
                      onChange={(e) => setCompanyData({...companyData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="taxId">Tax ID / EIN *</Label>
                    <Input 
                      id="taxId" 
                      placeholder="XX-XXXXXXX"
                      value={companyData.taxId}
                      onChange={(e) => {
                        const formatted = formatTaxId(e.target.value);
                        setCompanyData({...companyData, taxId: formatted});
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sicCode">SIC Code (Optional)</Label>
                    <Input 
                      id="sicCode" 
                      placeholder="Enter SIC code"
                      value={companyData.sicCode}
                      onChange={(e) => setCompanyData({...companyData, sicCode: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="industryCategory">Industry Category *</Label>
                    <Select 
                      value={selectedIndustryCategory} 
                      onValueChange={(value) => {
                        setSelectedIndustryCategory(value);
                        setCompanyData({...companyData, industry: '', industrySubcategory: ''});
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry category" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRY_CATEGORIES.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedIndustryCategory && (
                    <div>
                      <Label htmlFor="industrySubcategory">Industry Subcategory *</Label>
                      <Select 
                        value={companyData.industrySubcategory} 
                        onValueChange={(value) => {
                          const selectedCategory = INDUSTRY_CATEGORIES.find(cat => cat.value === selectedIndustryCategory);
                          const selectedSub = selectedCategory?.subcategories.find(sub => sub.value === value);
                          setCompanyData({
                            ...companyData, 
                            industry: selectedCategory?.label || '',
                            industrySubcategory: value
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select specific industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDUSTRY_CATEGORIES.find(cat => cat.value === selectedIndustryCategory)?.subcategories.map((subcategory) => (
                            <SelectItem key={subcategory.value} value={subcategory.value}>
                              {subcategory.value}. {subcategory.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address">Street Address *</Label>
                    <Input 
                      id="address" 
                      placeholder="123 Main Street"
                      value={companyData.address}
                      onChange={(e) => setCompanyData({...companyData, address: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input 
                        id="city" 
                        placeholder="City"
                        value={companyData.city}
                        onChange={(e) => setCompanyData({...companyData, city: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Select 
                        value={companyData.state}
                        onValueChange={(value) => setCompanyData({...companyData, state: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {US_STATES.map((state) => (
                            <SelectItem key={state.value} value={state.value}>
                              {state.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="zip">ZIP Code *</Label>
                    <Input 
                      id="zip" 
                      placeholder="12345"
                      value={companyData.zip}
                      onChange={(e) => setCompanyData({...companyData, zip: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input 
                      id="phone" 
                      placeholder="(555) 123-4567"
                      value={companyData.phone}
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value);
                        setCompanyData({...companyData, phone: formatted});
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button 
                  onClick={() => {
                    // Validate required fields
                    if (!companyData.name || !companyData.taxId || !companyData.industry || !companyData.address || !companyData.city || !companyData.state || !companyData.zip || !companyData.phone) {
                      toast({
                        title: 'Missing Information',
                        description: 'Please fill in all required fields.',
                        variant: 'destructive',
                      });
                      return;
                    }
                    
                    if (!selectedIndustryCategory || !companyData.industrySubcategory) {
                      toast({
                        title: 'Missing Information', 
                        description: 'Please select both industry category and subcategory.',
                        variant: 'destructive',
                      });
                      return;
                    }
                    
                    // Clean phone and tax ID for storage
                    const cleanedData = {
                      ...companyData,
                      phone: cleanPhoneNumber(companyData.phone),
                      taxId: companyData.taxId.replace(/[^\d]/g, '')
                    };
                    
                    saveCompanyMutation.mutate(cleanedData);
                  }}
                  disabled={saveCompanyMutation.isPending}
                  className="flex items-center space-x-2"
                >
                  <span>{saveCompanyMutation.isPending ? 'Saving...' : 'Continue'}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Contact Information</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Enter information about the primary contact person for your company.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input 
                      id="firstName" 
                      placeholder="Enter first name"
                      value={contactData.firstName}
                      onChange={(e) => setContactData({...contactData, firstName: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input 
                      id="lastName" 
                      placeholder="Enter last name"
                      value={contactData.lastName}
                      onChange={(e) => setContactData({...contactData, lastName: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input 
                      id="email" 
                      type="email"
                      placeholder="contact@company.com"
                      value={contactData.email}
                      onChange={(e) => setContactData({...contactData, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPhone">Phone Number</Label>
                    <Input 
                      id="contactPhone" 
                      placeholder="(555) 123-4567"
                      value={contactData.phone}
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value);
                        setContactData({...contactData, phone: formatted});
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="jobTitle">Job Title *</Label>
                    <Input 
                      id="jobTitle" 
                      placeholder="HR Manager"
                      value={contactData.jobTitle}
                      onChange={(e) => setContactData({...contactData, jobTitle: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="relationship">Relationship to Company *</Label>
                    <Select 
                      value={contactData.relationshipToCompany} 
                      onValueChange={(value) => setContactData({...contactData, relationshipToCompany: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        {RELATIONSHIP_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isPrimaryContact"
                        checked={contactData.isPrimaryContact}
                        onChange={(e) => setContactData({...contactData, isPrimaryContact: e.target.checked})}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="isPrimaryContact">Primary Contact</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isAuthorizedSigner"
                        checked={contactData.isAuthorizedSigner}
                        onChange={(e) => setContactData({...contactData, isAuthorizedSigner: e.target.checked})}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="isAuthorizedSigner">Authorized to Sign Documents</Label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-between">
                <Button 
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>
                <Button 
                  onClick={() => saveContactMutation.mutate(contactData)}
                  disabled={saveContactMutation.isPending}
                  className="flex items-center space-x-2"
                >
                  <span>{saveContactMutation.isPending ? 'Saving...' : 'Continue'}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Crown className="h-5 w-5" />
                <span>Ownership Information</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Enter information about company ownership and authorized contacts.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ownerFirstName">Owner First Name *</Label>
                    <Input 
                      id="ownerFirstName" 
                      placeholder="Enter first name"
                      value={ownerData.firstName}
                      onChange={(e) => setOwnerData({...ownerData, firstName: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ownerLastName">Owner Last Name *</Label>
                    <Input 
                      id="ownerLastName" 
                      placeholder="Enter last name"
                      value={ownerData.lastName}
                      onChange={(e) => setOwnerData({...ownerData, lastName: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ownerTitle">Title *</Label>
                    <Input 
                      id="ownerTitle" 
                      placeholder="Owner, President, etc."
                      value={ownerData.title}
                      onChange={(e) => setOwnerData({...ownerData, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ownershipPercentage">Ownership Percentage *</Label>
                    <Input 
                      id="ownershipPercentage" 
                      type="number"
                      placeholder="100"
                      min="0"
                      max="100"
                      value={ownerData.ownershipPercentage}
                      onChange={(e) => setOwnerData({...ownerData, ownershipPercentage: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ownerEmail">Email Address *</Label>
                    <Input 
                      id="ownerEmail" 
                      type="email"
                      placeholder="owner@company.com"
                      value={ownerData.email}
                      onChange={(e) => setOwnerData({...ownerData, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ownerPhone">Phone Number</Label>
                    <Input 
                      id="ownerPhone" 
                      placeholder="(555) 123-4567"
                      value={ownerData.phone}
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value);
                        setOwnerData({...ownerData, phone: formatted});
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ownerRelationship">Relationship to Company *</Label>
                    <Select 
                      value={ownerData.relationshipToCompany} 
                      onValueChange={(value) => setOwnerData({...ownerData, relationshipToCompany: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        {RELATIONSHIP_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isEligibleForCoverage"
                        checked={ownerData.isEligibleForCoverage}
                        onChange={(e) => setOwnerData({...ownerData, isEligibleForCoverage: e.target.checked})}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="isEligibleForCoverage">Eligible for Coverage</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isAuthorizedContact"
                        checked={ownerData.isAuthorizedContact}
                        onChange={(e) => setOwnerData({...ownerData, isAuthorizedContact: e.target.checked})}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="isAuthorizedContact">Authorized Contact</Label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-between">
                <Button 
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>
                <Button 
                  onClick={() => {
                    // Validate required fields
                    if (!ownerData.firstName || !ownerData.lastName || !ownerData.title || !ownerData.ownershipPercentage || !ownerData.email || !ownerData.phone || !ownerData.relationshipToCompany) {
                      toast({
                        title: 'Missing Information',
                        description: 'Please fill in all required fields.',
                        variant: 'destructive',
                      });
                      return;
                    }
                    
                    // Clean phone number for storage
                    const cleanedData = {
                      ...ownerData,
                      phone: cleanPhoneNumber(ownerData.phone)
                    };
                    
                    saveOwnerMutation.mutate(cleanedData);
                  }}
                  disabled={saveOwnerMutation.isPending}
                  className="flex items-center space-x-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>{saveOwnerMutation.isPending ? 'Saving...' : 'Complete Setup'}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <TwoPanelLayout
      title="Employer Setup"
      tableOfContents={tableOfContentsItems}
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Welcome to Murillo Insurance</h1>
          <p className="text-muted-foreground">
            Let's get your company set up in our system. This information will be used throughout your experience.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Setup Progress</span>
            <span className="text-sm text-muted-foreground">{Math.round(getProgressPercentage())}% Complete</span>
          </div>
          <Progress value={getProgressPercentage()} className="w-full" />
        </div>

        {renderStepContent()}
      </div>
    </TwoPanelLayout>
  );
}