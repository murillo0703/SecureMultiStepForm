import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Users, 
  Plus,
  Edit,
  Trash2,
  Globe,
  FileText,
  UserCheck,
  DollarSign,
  Shield,
  Activity,
  Calendar,
  Mail,
  Clock,
  Target,
  Briefcase,
  Upload,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

const US_STATES = [
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
  { value: 'WY', label: 'Wyoming' }
];

const INDUSTRIES = [
  { value: '11', label: 'Agriculture, Forestry, Fishing and Hunting' },
  { value: '21', label: 'Mining, Quarrying, and Oil and Gas Extraction' },
  { value: '22', label: 'Utilities' },
  { value: '23', label: 'Construction' },
  { value: '31-33', label: 'Manufacturing' },
  { value: '42', label: 'Wholesale Trade' },
  { value: '44-45', label: 'Retail Trade' },
  { value: '48-49', label: 'Transportation and Warehousing' },
  { value: '51', label: 'Information' },
  { value: '52', label: 'Finance and Insurance' },
  { value: '53', label: 'Real Estate and Rental and Leasing' },
  { value: '54', label: 'Professional, Scientific, and Technical Services' },
  { value: '55', label: 'Management of Companies and Enterprises' },
  { value: '56', label: 'Administrative and Support and Waste Management and Remediation Services' },
  { value: '61', label: 'Educational Services' },
  { value: '62', label: 'Health Care and Social Assistance' },
  { value: '71', label: 'Arts, Entertainment, and Recreation' },
  { value: '72', label: 'Accommodation and Food Services' },
  { value: '81', label: 'Other Services (except Public Administration)' },
  { value: '92', label: 'Public Administration' }
];

// Form schemas
const companyFormSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  taxId: z.string().regex(/^\d{2}-\d{7}$/, 'Tax ID must be in format XX-XXXXXXX'),
  industry: z.string().min(1, 'Industry is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'ZIP code must be in format XXXXX or XXXXX-XXXX'),
  phone: z.string().regex(/^\(\d{3}\) \d{3}-\d{4}$/, 'Phone must be in format (XXX) XXX-XXXX')
});

const ownerFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  title: z.string().min(1, 'Title is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().regex(/^\(\d{3}\) \d{3}-\d{4}$/, 'Phone must be in format (XXX) XXX-XXXX'),
  ownershipPercentage: z.number().min(0).max(100, 'Ownership must be between 0-100%'),
  relationshipToCompany: z.string().optional(),
  isEligibleForCoverage: z.boolean(),
  isAuthorizedContact: z.boolean()
});

const employeeFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().regex(/^\(\d{3}\) \d{3}-\d{4}$/, 'Phone must be in format (XXX) XXX-XXXX').optional(),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'ZIP code must be in format XXXXX or XXXXX-XXXX'),
  dob: z.string().min(1, 'Date of birth is required'),
  ssn: z.string().regex(/^\d{3}-\d{2}-\d{4}$/, 'SSN must be in format XXX-XX-XXXX')
});

// Input masking functions
const formatTaxId = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}-${digits.slice(2, 9)}`;
};

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

const formatZipCode = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5, 9)}`;
};

const formatSSN = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
};

interface Company {
  id: number;
  name: string;
  taxId: string;
  industry: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
}

interface Owner {
  id: number;
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  phone: string;
  ownershipPercentage: number;
  relationshipToCompany?: string;
  isEligibleForCoverage: boolean;
  isAuthorizedContact: boolean;
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  dob: string;
  ssn: string;
}

export default function CompanyManagement() {
  const { toast } = useToast();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
  const [isOwnerDialogOpen, setIsOwnerDialogOpen] = useState(false);
  const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = useState(false);

  // Forms
  const companyForm = useForm({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: '',
      taxId: '',
      industry: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      phone: ''
    }
  });

  const ownerForm = useForm({
    resolver: zodResolver(ownerFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      title: '',
      email: '',
      phone: '',
      ownershipPercentage: 0,
      relationshipToCompany: '',
      isEligibleForCoverage: false,
      isAuthorizedContact: false
    }
  });

  const employeeForm = useForm({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      dob: '',
      ssn: ''
    }
  });

  // Fetch data
  const { data: companies } = useQuery<Company[]>({
    queryKey: ['/api/companies'],
  });

  const { data: owners } = useQuery<Owner[]>({
    queryKey: ['/api/owners', selectedCompany?.id],
    enabled: !!selectedCompany?.id
  });

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ['/api/employees', selectedCompany?.id],
    enabled: !!selectedCompany?.id
  });

  // Mutations
  const createCompanyMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/companies', data);
      if (!response.ok) {
        throw new Error('Failed to create company');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      setIsCompanyDialogOpen(false);
      companyForm.reset();
      toast({
        title: 'Success',
        description: 'Company created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create company',
        variant: 'destructive',
      });
    },
  });

  const createOwnerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/owners', {
        ...data,
        companyId: selectedCompany?.id
      });
      if (!response.ok) {
        throw new Error('Failed to create owner');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/owners', selectedCompany?.id] });
      setIsOwnerDialogOpen(false);
      ownerForm.reset();
      toast({
        title: 'Success',
        description: 'Owner added successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add owner',
        variant: 'destructive',
      });
    },
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/employees', {
        ...data,
        companyId: selectedCompany?.id
      });
      if (!response.ok) {
        throw new Error('Failed to create employee');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees', selectedCompany?.id] });
      setIsEmployeeDialogOpen(false);
      employeeForm.reset();
      toast({
        title: 'Success',
        description: 'Employee added successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add employee',
        variant: 'destructive',
      });
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('companyId', selectedCompany?.id?.toString() || '');

    try {
      const response = await apiRequest('POST', '/api/employees/census-upload', formData);
      if (!response.ok) {
        throw new Error('Failed to upload census file');
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/employees', selectedCompany?.id] });
      toast({
        title: 'Success',
        description: 'Employee census uploaded successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload census file',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Company Management</h1>
          <p className="text-gray-600">Manage your company information, owners, and employees</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Company List Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Companies</span>
                  <Dialog open={isCompanyDialogOpen} onOpenChange={setIsCompanyDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Add New Company</DialogTitle>
                        <DialogDescription>
                          Enter the company information below
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...companyForm}>
                        <form onSubmit={companyForm.handleSubmit((data) => createCompanyMutation.mutate(data))} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={companyForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Company Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Acme Corp" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={companyForm.control}
                              name="taxId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Tax ID (EIN)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="XX-XXXXXXX"
                                      {...field}
                                      onChange={(e) => {
                                        const formatted = formatTaxId(e.target.value);
                                        field.onChange(formatted);
                                      }}
                                      maxLength={10}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={companyForm.control}
                            name="industry"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Industry</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select industry" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {INDUSTRIES.map((industry) => (
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

                          <FormField
                            control={companyForm.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                  <Input placeholder="123 Main St" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-3 gap-4">
                            <FormField
                              control={companyForm.control}
                              name="city"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>City</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Los Angeles" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={companyForm.control}
                              name="state"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>State</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="State" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {US_STATES.map((state) => (
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
                              control={companyForm.control}
                              name="zip"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>ZIP Code</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="90210"
                                      {...field}
                                      onChange={(e) => {
                                        const formatted = formatZipCode(e.target.value);
                                        field.onChange(formatted);
                                      }}
                                      maxLength={10}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={companyForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="(555) 555-5555"
                                    {...field}
                                    onChange={(e) => {
                                      const formatted = formatPhone(e.target.value);
                                      field.onChange(formatted);
                                    }}
                                    maxLength={14}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsCompanyDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={createCompanyMutation.isPending}
                            >
                              {createCompanyMutation.isPending ? 'Creating...' : 'Create Company'}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-2">
                  {companies?.map((company) => (
                    <div
                      key={company.id}
                      className={`p-3 cursor-pointer hover:bg-gray-50 border-l-4 ${
                        selectedCompany?.id === company.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-transparent'
                      }`}
                      onClick={() => setSelectedCompany(company)}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium text-sm">{company.name}</p>
                          <p className="text-xs text-gray-500">{company.city}, {company.state}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!companies || companies.length === 0) && (
                    <p className="text-sm text-gray-500 p-3">No companies yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {selectedCompany ? (
              <Tabs defaultValue="owners" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="owners">Owners & Contacts</TabsTrigger>
                  <TabsTrigger value="employees">Employees</TabsTrigger>
                </TabsList>

                <TabsContent value="owners">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Company Owners & Authorized Contacts</span>
                        <Dialog open={isOwnerDialogOpen} onOpenChange={setIsOwnerDialogOpen}>
                          <DialogTrigger asChild>
                            <Button>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Owner
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Add Company Owner</DialogTitle>
                              <DialogDescription>
                                Add a company owner or authorized contact
                              </DialogDescription>
                            </DialogHeader>
                            <Form {...ownerForm}>
                              <form onSubmit={ownerForm.handleSubmit((data) => createOwnerMutation.mutate(data))} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <FormField
                                    control={ownerForm.control}
                                    name="firstName"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>First Name</FormLabel>
                                        <FormControl>
                                          <Input placeholder="John" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={ownerForm.control}
                                    name="lastName"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Last Name</FormLabel>
                                        <FormControl>
                                          <Input placeholder="Doe" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <FormField
                                    control={ownerForm.control}
                                    name="title"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Title</FormLabel>
                                        <FormControl>
                                          <Input placeholder="CEO" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={ownerForm.control}
                                    name="ownershipPercentage"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Ownership %</FormLabel>
                                        <FormControl>
                                          <Input 
                                            type="number"
                                            min="0"
                                            max="100"
                                            placeholder="25"
                                            {...field}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>

                                <FormField
                                  control={ownerForm.control}
                                  name="email"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Email</FormLabel>
                                      <FormControl>
                                        <Input placeholder="john@company.com" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={ownerForm.control}
                                  name="phone"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Phone Number</FormLabel>
                                      <FormControl>
                                        <Input 
                                          placeholder="(555) 555-5555"
                                          {...field}
                                          onChange={(e) => {
                                            const formatted = formatPhone(e.target.value);
                                            field.onChange(formatted);
                                          }}
                                          maxLength={14}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <div className="flex justify-end gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsOwnerDialogOpen(false)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button 
                                    type="submit" 
                                    disabled={createOwnerMutation.isPending}
                                  >
                                    {createOwnerMutation.isPending ? 'Adding...' : 'Add Owner'}
                                  </Button>
                                </div>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Ownership %</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {owners?.map((owner) => (
                            <TableRow key={owner.id}>
                              <TableCell>{owner.firstName} {owner.lastName}</TableCell>
                              <TableCell>{owner.title}</TableCell>
                              <TableCell>{owner.email}</TableCell>
                              <TableCell>{owner.phone}</TableCell>
                              <TableCell>{owner.ownershipPercentage}%</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                          {(!owners || owners.length === 0) && (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8">
                                <div className="text-gray-500">
                                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                  <p>No owners added yet</p>
                                  <p className="text-sm">Add company owners and authorized contacts</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="employees">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Employees</span>
                        <div className="flex gap-2">
                          <label htmlFor="file-upload">
                            <Button variant="outline" asChild>
                              <span>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Census
                              </span>
                            </Button>
                          </label>
                          <input
                            id="file-upload"
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          <Dialog open={isEmployeeDialogOpen} onOpenChange={setIsEmployeeDialogOpen}>
                            <DialogTrigger asChild>
                              <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Employee
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Add Employee</DialogTitle>
                                <DialogDescription>
                                  Add a new employee to the company
                                </DialogDescription>
                              </DialogHeader>
                              <Form {...employeeForm}>
                                <form onSubmit={employeeForm.handleSubmit((data) => createEmployeeMutation.mutate(data))} className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                      control={employeeForm.control}
                                      name="firstName"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>First Name</FormLabel>
                                          <FormControl>
                                            <Input placeholder="Jane" {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={employeeForm.control}
                                      name="lastName"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Last Name</FormLabel>
                                          <FormControl>
                                            <Input placeholder="Smith" {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                      control={employeeForm.control}
                                      name="email"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Email</FormLabel>
                                          <FormControl>
                                            <Input placeholder="jane@company.com" {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={employeeForm.control}
                                      name="phone"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Phone (Optional)</FormLabel>
                                          <FormControl>
                                            <Input 
                                              placeholder="(555) 555-5555"
                                              {...field}
                                              onChange={(e) => {
                                                const formatted = formatPhone(e.target.value);
                                                field.onChange(formatted);
                                              }}
                                              maxLength={14}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>

                                  <FormField
                                    control={employeeForm.control}
                                    name="address"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Address</FormLabel>
                                        <FormControl>
                                          <Input placeholder="456 Oak St" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <div className="grid grid-cols-3 gap-4">
                                    <FormField
                                      control={employeeForm.control}
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
                                      control={employeeForm.control}
                                      name="state"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>State</FormLabel>
                                          <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                              <SelectTrigger>
                                                <SelectValue placeholder="State" />
                                              </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                              {US_STATES.map((state) => (
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
                                      control={employeeForm.control}
                                      name="zip"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>ZIP Code</FormLabel>
                                          <FormControl>
                                            <Input 
                                              placeholder="94102"
                                              {...field}
                                              onChange={(e) => {
                                                const formatted = formatZipCode(e.target.value);
                                                field.onChange(formatted);
                                              }}
                                              maxLength={10}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                      control={employeeForm.control}
                                      name="dob"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Date of Birth</FormLabel>
                                          <FormControl>
                                            <Input type="date" {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={employeeForm.control}
                                      name="ssn"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>SSN</FormLabel>
                                          <FormControl>
                                            <Input 
                                              placeholder="XXX-XX-XXXX"
                                              {...field}
                                              onChange={(e) => {
                                                const formatted = formatSSN(e.target.value);
                                                field.onChange(formatted);
                                              }}
                                              maxLength={11}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>

                                  <div className="flex justify-end gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => setIsEmployeeDialogOpen(false)}
                                    >
                                      Cancel
                                    </Button>
                                    <Button 
                                      type="submit" 
                                      disabled={createEmployeeMutation.isPending}
                                    >
                                      {createEmployeeMutation.isPending ? 'Adding...' : 'Add Employee'}
                                    </Button>
                                  </div>
                                </form>
                              </Form>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Date of Birth</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {employees?.map((employee) => (
                            <TableRow key={employee.id}>
                              <TableCell>{employee.firstName} {employee.lastName}</TableCell>
                              <TableCell>{employee.email}</TableCell>
                              <TableCell>{employee.phone || 'N/A'}</TableCell>
                              <TableCell>{employee.dob}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                          {(!employees || employees.length === 0) && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8">
                                <div className="text-gray-500">
                                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                  <p>No employees added yet</p>
                                  <p className="text-sm">Add employees individually or upload a census file</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-16">
                  <div className="text-center text-gray-500">
                    <Building2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Select a company</p>
                    <p className="text-sm">Choose a company from the sidebar to manage owners and employees</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}