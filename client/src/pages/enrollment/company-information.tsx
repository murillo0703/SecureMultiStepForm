import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { Building, MapPin, Calendar, FileText, Phone, CheckCircle, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { ProgressBar } from '@/components/layout/progress-bar';
import { EnrollmentChecklist } from '@/components/enrollment/checklist';
import { getEnabledEnrollmentSteps } from '@/utils/enrollment-steps';

const companyInfoSchema = z.object({
  legalName: z.string().min(1, 'Legal company name is required'),
  dbaName: z.string().optional(),
  taxId: z.string().min(9, 'Valid Tax ID (EIN) is required'),
  companyStructure: z.string().min(1, 'Please select company structure'),
  phone: z.string().min(10, 'Valid phone number is required'),
  sicCode: z.string().optional(),
  industry: z.string().min(1, 'Please select or specify your industry'),
  // Physical Address
  physicalAddress: z.string().min(1, 'Physical address is required'),
  physicalCity: z.string().min(1, 'City is required'),
  physicalState: z.string().min(2, 'State is required'),
  physicalZip: z.string().min(5, 'Valid ZIP code is required'),
  // Mailing Address
  sameAsPhysical: z.boolean().default(true),
  mailingAddress: z.string().optional(),
  mailingCity: z.string().optional(),
  mailingState: z.string().optional(),
  mailingZip: z.string().optional(),
  // Business Formation
  formationDate: z.string().min(1, 'Business formation date is required'),
});

type CompanyInfoData = z.infer<typeof companyInfoSchema>;

const companyStructures = [
  { value: 'corporation', label: 'Corporation (C-Corp)' },
  { value: 's_corporation', label: 'S-Corporation' },
  { value: 'llc', label: 'Limited Liability Company (LLC)' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
  { value: 'non_profit', label: 'Non-Profit Organization' },
  { value: 'other', label: 'Other' },
];

const industries = [
  { value: 'healthcare', label: 'Healthcare & Medical Services' },
  { value: 'technology', label: 'Technology & Software' },
  { value: 'finance', label: 'Finance & Banking' },
  { value: 'retail', label: 'Retail & E-commerce' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'construction', label: 'Construction & Real Estate' },
  { value: 'education', label: 'Education & Training' },
  { value: 'hospitality', label: 'Hospitality & Food Service' },
  { value: 'professional_services', label: 'Professional Services' },
  { value: 'transportation', label: 'Transportation & Logistics' },
  { value: 'other', label: 'Other' },
];

const usStates = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'District of Columbia' },
];

// Phone number formatting function
const formatPhoneNumber = (value: string) => {
  const phoneNumber = value.replace(/[^\d]/g, '');
  const phoneNumberLength = phoneNumber.length;
  if (phoneNumberLength < 4) return phoneNumber;
  if (phoneNumberLength < 7) {
    return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
  }
  return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
};

// Tax ID formatting function
const formatTaxId = (value: string) => {
  const taxId = value.replace(/[^\d]/g, '');
  if (taxId.length < 3) return taxId;
  return `${taxId.slice(0, 2)}-${taxId.slice(2, 9)}`;
};

// Format date to always use day 01
const formatFormationDate = (value: string) => {
  if (!value) return value;
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;

  // Set day to 01
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
};

export default function CompanyInformation() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  // Get the enrollment steps
  const steps = getEnabledEnrollmentSteps();

  // Fetch companies for this user to get companyId
  const { data: companies = [], isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['/api/companies'],
  });

  const companyId = companies.length > 0 ? companies[0].id : null;

  // Fetch application data
  const { data: application, isLoading: isLoadingApplication } = useQuery({
    queryKey: [`/api/companies/${companyId}/application`],
    enabled: !!companyId,
  });

  const form = useForm<CompanyInfoData>({
    resolver: zodResolver(companyInfoSchema),
    defaultValues: {
      legalName: '',
      dbaName: '',
      taxId: '',
      companyStructure: '',
      phone: '',
      sicCode: '',
      industry: '',
      physicalAddress: '',
      physicalCity: '',
      physicalState: '',
      physicalZip: '',
      sameAsPhysical: true,
      mailingAddress: '',
      mailingCity: '',
      mailingState: '',
      mailingZip: '',
      formationDate: '',
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: CompanyInfoData) => {
      const dataWithUserId = {
        ...data,
        userId: user?.id,
      };
      const res = await apiRequest('POST', '/api/company-information', dataWithUserId);

      // Check if response is OK and has content
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await res.json();
      } else {
        // If no JSON content, return a success indicator
        return { success: true };
      }
    },
    onSuccess: () => {
      toast({
        title: 'Company information saved',
        description: 'Proceeding to coverage information...',
      });
      setLocation('/enrollment/coverage-information');
    },
    onError: (error: any) => {
      toast({
        title: 'Error saving company information',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: CompanyInfoData) => {
    // If mailing address is same as physical, copy the values
    if (data.sameAsPhysical) {
      data.mailingAddress = data.physicalAddress;
      data.mailingCity = data.physicalCity;
      data.mailingState = data.physicalState;
      data.mailingZip = data.physicalZip;
    }

    saveMutation.mutate(data);
  };

  const watchSameAsPhysical = form.watch('sameAsPhysical');

  if (isLoadingCompanies || isLoadingApplication) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Enrollment Progress</h2>
            <EnrollmentChecklist 
              companyId={companyId}
              completedSteps={application?.completedSteps || {}}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Building className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Company Information</h1>
                  <p className="text-gray-600">
                    Please provide your company's basic information and business details
                  </p>
                </div>
              </div>
            </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Company Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Basic Company Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="legalName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Legal Company Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="ABC Corporation" {...field} />
                        </FormControl>
                        <FormDescription>
                          The exact legal name as registered with the state
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dbaName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>DBA Name (if applicable)</FormLabel>
                        <FormControl>
                          <Input placeholder="Doing Business As name" {...field} />
                        </FormControl>
                        <FormDescription>Trade name or "Doing Business As" name</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="taxId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax ID (EIN) *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="12-3456789"
                            {...field}
                            onChange={e => {
                              const formatted = formatTaxId(e.target.value);
                              field.onChange(formatted);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Employer Identification Number from the IRS
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="companyStructure"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Structure *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select structure" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {companyStructures.map(structure => (
                              <SelectItem key={structure.value} value={structure.value}>
                                {structure.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Phone *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="555-123-4567"
                            {...field}
                            onChange={e => {
                              const formatted = formatPhoneNumber(e.target.value);
                              field.onChange(formatted);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sicCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SIC Code (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="1234" {...field} />
                        </FormControl>
                        <FormDescription>Standard Industrial Classification</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="formationDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Formation Date *</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            onChange={e => {
                              const formatted = formatFormationDate(e.target.value);
                              field.onChange(formatted);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Date when the business was officially formed (day defaults to 1st)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your industry" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {industries.map(industry => (
                            <SelectItem key={industry.value} value={industry.value}>
                              {industry.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Physical Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Physical Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="physicalAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address *</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main Street" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="physicalCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City *</FormLabel>
                        <FormControl>
                          <Input placeholder="Los Angeles" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="physicalState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {usStates.map(state => (
                              <SelectItem key={state.value} value={state.value}>
                                {state.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="physicalZip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code *</FormLabel>
                        <FormControl>
                          <Input placeholder="90210" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Mailing Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Mailing Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="sameAsPhysical"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Same as physical address</FormLabel>
                        <FormDescription>
                          Check this if your mailing address is the same as your physical address
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {!watchSameAsPhysical && (
                  <>
                    <FormField
                      control={form.control}
                      name="mailingAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mailing Street Address *</FormLabel>
                          <FormControl>
                            <Input placeholder="P.O. Box 123 or 456 Business Ave" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="mailingCity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City *</FormLabel>
                            <FormControl>
                              <Input placeholder="Los Angeles" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="mailingState"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select state" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {usStates.map(state => (
                                  <SelectItem key={state.value} value={state.value}>
                                    {state.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="mailingZip"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ZIP Code *</FormLabel>
                            <FormControl>
                              <Input placeholder="90210" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-between space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation('/enrollment/application-initiator')}
              >
                Back to Application Initiator
              </Button>
              <Button type="submit" disabled={saveMutation.isPending} className="min-w-[150px]">
                {saveMutation.isPending ? 'Saving...' : 'Continue to Coverage Information'}
              </Button>
            </div>
          </form>
        </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
