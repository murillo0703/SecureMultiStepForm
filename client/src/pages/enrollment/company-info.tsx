import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { companyValidationSchema } from '@/utils/form-validators';
import { getEnabledEnrollmentSteps } from '@/utils/enrollment-steps';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { EnrollmentLayout } from '@/components/layout/enrollment-layout';
import { AddressValidator } from '@/components/address-validator';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { FormattedInputField } from '@/components/ui/form-formatted-input';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  ArrowRight,
  Info,
  AlertTriangle,
  Building2,
  CalendarDays,
  Users,
  ShieldAlert,
} from 'lucide-react';
import { format, addMonths, startOfMonth, addBusinessDays, isWithinInterval } from 'date-fns';

// Form schema
type CompanyFormValues = z.infer<typeof companyValidationSchema>;

// Company structure options
const COMPANY_STRUCTURES = [
  'Sole Proprietor',
  'Corporation',
  'Partnership',
  'Limited Liability Partnership',
  'Limited Partnership',
  'LLC',
];

export default function CompanyInfo() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, navigate] = useLocation();

  // Fetch companies for this user
  const { data: companies = [], isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['/api/companies'],
  });

  // Get the first company if exists
  const companyId = companies.length > 0 ? companies[0].id : null;

  // Fetch application data if company exists
  const { data: application, isLoading: isLoadingApplication } = useQuery({
    queryKey: [`/api/companies/${companyId}/application`],
    enabled: !!companyId,
  });

  // Use the enabled enrollment steps (without the Employee step)
  const steps = getEnabledEnrollmentSteps();

  // Calculate default start date options
  const today = new Date();
  const isNearFirstOfMonth = isWithinInterval(today, {
    start: startOfMonth(today),
    end: addBusinessDays(startOfMonth(today), 5),
  });

  // Default to 1st of current month if within 5 business days, otherwise offer choices
  const defaultStartDate = isNearFirstOfMonth ? format(startOfMonth(today), 'yyyy-MM-dd') : '';

  // Form setup
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyValidationSchema),
    defaultValues: {
      userId: user?.id || 0,
      name: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      phone: '',
      taxId: '',
      industry: '',
      companyStructure: undefined,
      startDate: defaultStartDate,
      totalEmployees: 1,
      fullTimeEmployees: 1,
      hadTwentyPlusEmployees: false,
      hasMedicalCoverage: false,
      currentCarrier: '',
      mailingAddressSame: true,
      mailingAddress: '',
      mailingCity: '',
      mailingState: '',
      mailingZip: '',
    },
  });

  // Watch values for conditional display
  const hasMedicalCoverage = form.watch('hasMedicalCoverage');
  const mailingAddressSame = form.watch('mailingAddressSame');

  // Mutation for creating/updating company
  const mutation = useMutation({
    mutationFn: async (values: CompanyFormValues) => {
      try {
        if (companyId) {
          // Update existing company
          const res = await apiRequest('PATCH', `/api/companies/${companyId}`, values);
          return await res.json();
        } else {
          // Create new company
          const res = await apiRequest('POST', '/api/companies', values);
          const company = await res.json();

          // If we have a selected carrier in localStorage, create application with it
          const selectedCarrier = localStorage.getItem('selectedCarrier');
          if (selectedCarrier) {
            await apiRequest('POST', '/api/applications', {
              companyId: company.id,
              selectedCarrier: selectedCarrier,
              currentStep: 'company',
              completedSteps: ['carriers', 'company'],
            });
            // Clear from localStorage since it's now saved in the application
            localStorage.removeItem('selectedCarrier');
          }

          return company;
        }
      } catch (error) {
        // Ensure we're propagating the error for onError to catch
        throw error;
      }
    },
    onSuccess: data => {
      toast({
        title: companyId ? 'Company updated' : 'Company created',
        description: companyId
          ? 'Your company information has been updated.'
          : 'Your company has been successfully created.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${data.id}/application`] });

      // Add a small delay before navigation to ensure data is fully processed
      setTimeout(() => {
        navigate('/enrollment/ownership-info');
      }, 300);
    },
    onError: error => {
      toast({
        title: 'Error',
        description: `Failed to ${companyId ? 'update' : 'create'} company information: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Load company data if available
  useEffect(() => {
    if (companies.length > 0) {
      const company = companies[0];
      form.reset({
        userId: company.userId,
        name: company.name,
        address: company.address,
        city: company.city,
        state: company.state,
        zip: company.zip,
        phone: company.phone,
        taxId: company.taxId,
        industry: company.industry,
      });
    }
  }, [companies, form]);

  const onSubmit = (values: CompanyFormValues) => {
    mutation.mutate(values);
  };

  // Loading state
  const isLoading = isLoadingCompanies || isLoadingApplication || mutation.isPending;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <ProgressBar
          steps={steps}
          currentStep="company"
          completedSteps={(application?.completedSteps as string[]) || []}
        />

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Main Form Area */}
          <div className="lg:flex-1">
            {/* Autosave Indicator */}
            <div className="flex items-center mb-2 text-xs sm:text-sm text-gray-500">
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-secondary" />
              <span>All changes autosaved</span>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>
                  Provide details about your company for the health insurance enrollment.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Basic Company Information */}
                    <div className="space-y-6">
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-medium">Basic Company Information</h3>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Acme Corporation" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormattedInputField
                          control={form.control}
                          name="taxId"
                          label="Tax ID / EIN"
                          placeholder="XX-XXXXXXX"
                          formatType="ein"
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="companyStructure"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Structure</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select company structure" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {COMPANY_STRUCTURES.map(structure => (
                                  <SelectItem key={structure} value={structure}>
                                    {structure}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>The legal structure of your business</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormattedInputField
                          control={form.control}
                          name="phone"
                          label="Phone Number"
                          placeholder="(555) 123-4567"
                          formatType="phone"
                        />
                        <FormField
                          control={form.control}
                          name="industry"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Industry</FormLabel>
                              <FormControl>
                                <Input placeholder="Technology" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator className="my-6" />

                    {/* Company Start Date */}
                    <div className="space-y-6">
                      <div className="flex items-center space-x-2">
                        <CalendarDays className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-medium">Business Formation Date</h3>
                      </div>

                      {isNearFirstOfMonth ? (
                        <FormField
                          control={form.control}
                          name="startDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Coverage Start Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormDescription>
                                Since we're within 5 business days of the 1st, coverage can begin on
                                the 1st of this month.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : (
                        <FormField
                          control={form.control}
                          name="startDate"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel>Coverage Start Date</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="flex flex-col space-y-1"
                                >
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem
                                        value={format(
                                          startOfMonth(addMonths(today, 1)),
                                          'yyyy-MM-dd'
                                        )}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      1st of next month (
                                      {format(startOfMonth(addMonths(today, 1)), 'MMMM d, yyyy')})
                                    </FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem
                                        value={format(
                                          startOfMonth(addMonths(today, 2)),
                                          'yyyy-MM-dd'
                                        )}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      1st of the following month (
                                      {format(startOfMonth(addMonths(today, 2)), 'MMMM d, yyyy')})
                                    </FormLabel>
                                  </FormItem>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    <Separator className="my-6" />

                    {/* Employee Information */}
                    <div className="space-y-6">
                      <div className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-medium">Employee Information</h3>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="totalEmployees"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Total Employees</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={1}
                                  {...field}
                                  onChange={e => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormDescription>
                                Total number of employees at your company
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="fullTimeEmployees"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full-Time Employees</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={1}
                                  max={form.watch('totalEmployees')}
                                  {...field}
                                  onChange={e => {
                                    const totalEmployees = form.watch('totalEmployees');
                                    const value = parseInt(e.target.value);

                                    // Ensure full-time employees don't exceed total
                                    if (value > totalEmployees) {
                                      field.onChange(totalEmployees);
                                    } else {
                                      field.onChange(value);
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormDescription>
                                Number of full-time employees (cannot exceed total)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="hadTwentyPlusEmployees"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>COBRA Eligibility</FormLabel>
                            <FormControl>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  id="hadTwentyPlusEmployees"
                                />
                                <label
                                  htmlFor="hadTwentyPlusEmployees"
                                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  Has your company had more than 20 full-time employees at any point
                                  in the last 6 months?
                                </label>
                              </div>
                            </FormControl>
                            <FormDescription>
                              This determines whether Federal COBRA or Cal-COBRA applies to your
                              company
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator className="my-6" />

                    {/* Current Coverage */}
                    <div className="space-y-6">
                      <div className="flex items-center space-x-2">
                        <ShieldAlert className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-medium">Current Coverage Status</h3>
                      </div>

                      <FormField
                        control={form.control}
                        name="hasMedicalCoverage"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Medical Coverage</FormLabel>
                            <FormControl>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  id="hasMedicalCoverage"
                                />
                                <label
                                  htmlFor="hasMedicalCoverage"
                                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  Do you currently have group medical coverage?
                                </label>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {hasMedicalCoverage && (
                        <div className="pl-6 border-l-2 border-primary/20">
                          <FormField
                            control={form.control}
                            name="currentCarrier"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Current Carrier</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter current carrier name" {...field} />
                                </FormControl>
                                <FormDescription>
                                  Please provide the name of your current medical insurance carrier
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="mt-4">
                            <p className="text-sm text-muted-foreground mb-2">
                              Please upload a copy of your current carrier bill in the Documents
                              section.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator className="my-6" />

                    {/* Physical Address */}
                    <div className="space-y-6">
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-medium">Physical Address</h3>
                      </div>

                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street Address</FormLabel>
                            <FormControl>
                              <Input placeholder="123 Main St" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input placeholder="San Francisco" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <FormControl>
                                <Input placeholder="CA" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="zip"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ZIP Code</FormLabel>
                              <FormControl>
                                <Input placeholder="94103" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="mt-4">
                        <AddressValidator
                          address={form.watch('address')}
                          city={form.watch('city')}
                          state={form.watch('state')}
                          zip={form.watch('zip')}
                          onAddressChange={(field, value) => {
                            form.setValue(field as any, value, { shouldValidate: true });
                          }}
                          onValidatedAddress={validatedAddress => {
                            toast({
                              title: validatedAddress.isValid
                                ? 'Address Validated'
                                : 'Address Recorded',
                              description: validatedAddress.isValid
                                ? 'The address has been validated and saved.'
                                : "We've saved your address as entered.",
                              variant: validatedAddress.isValid ? 'default' : 'destructive',
                            });
                          }}
                        />
                      </div>
                    </div>

                    <Separator className="my-6" />

                    {/* Mailing Address */}
                    <div className="space-y-6">
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-medium">Mailing Address</h3>
                      </div>

                      <FormField
                        control={form.control}
                        name="mailingAddressSame"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormControl>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  id="mailingAddressSame"
                                />
                                <label
                                  htmlFor="mailingAddressSame"
                                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  Is your mailing address the same as your physical address?
                                </label>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {!mailingAddressSame && (
                        <div className="space-y-4 pl-6 border-l-2 border-primary/20">
                          <FormField
                            control={form.control}
                            name="mailingAddress"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Mailing Street Address</FormLabel>
                                <FormControl>
                                  <Input placeholder="123 Main St" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <FormField
                              control={form.control}
                              name="mailingCity"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>City</FormLabel>
                                  <FormControl>
                                    <Input placeholder="San Francisco" {...field} />
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
                                  <FormLabel>State</FormLabel>
                                  <FormControl>
                                    <Input placeholder="CA" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="mailingZip"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>ZIP Code</FormLabel>
                                  <FormControl>
                                    <Input placeholder="94103" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end mt-8">
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Next: Ownership Information'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80">
            {companyId && <EnrollmentChecklist companyId={companyId} />}
          </div>
        </div>
      </main>
    </div>
  );
}
