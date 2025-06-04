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
import { TwoPanelLayout } from '@/components/layouts/two-panel-layout';
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
  Briefcase
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface Company {
  id: number;
  companyName: string;
  legalName?: string;
  taxId?: string;
  industry?: string;
  website?: string;
  employeeCount: number;
  brokerId?: string;
  effectiveDate?: string;
  renewalDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CompanyLocation {
  id: number;
  companyId: number;
  locationName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  ratingArea: string;
  phone?: string;
  employeeCount: number;
  isPrimary: boolean;
  isActive: boolean;
}

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

const companyFormSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  legalName: z.string().optional(),
  taxId: z.string().regex(/^\d{2}-\d{7}$/, 'Tax ID must be in format XX-XXXXXXX'),
  industry: z.string().min(1, 'Industry is required'),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  employeeCount: z.number().min(1, 'Employee count must be at least 1'),
  effectiveDate: z.string().min(1, 'Effective date is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'ZIP code must be in format XXXXX or XXXXX-XXXX'),
  phone: z.string().regex(/^\(\d{3}\) \d{3}-\d{4}$/, 'Phone must be in format (XXX) XXX-XXXX')
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

const RATING_AREAS = [
  'Area 1', 'Area 2', 'Area 3', 'Area 4', 'Area 5', 'Area 6', 'Area 7',
  'Area 8', 'Area 9', 'Area 10', 'Area 11', 'Area 12', 'Area 13',
  'Area 14', 'Area 15', 'Area 16', 'Area 17', 'Area 18', 'Area 19'
];

export default function CompanyManagement() {
  const { toast } = useToast();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      companyName: '',
      legalName: '',
      taxId: '',
      industry: '',
      website: '',
      employeeCount: 1,
      effectiveDate: new Date().toISOString().split('T')[0],
      address: '',
      city: '',
      state: '',
      zipCode: '',
      phone: ''
    }
  });

  // Fetch companies
  const { data: companies } = useQuery<Company[]>({
    queryKey: ['/api/employer-companies'],
  });

  // Create company mutation
  const createCompanyMutation = useMutation({
    mutationFn: async (data: typeof companyFormData) => {
      const res = await apiRequest('POST', '/api/employer-companies', data);
      return await res.json();
    },
    onSuccess: (newCompany) => {
      toast({
        title: 'Company Created',
        description: 'Company has been created successfully.',
      });
      setIsCompanyDialogOpen(false);
      setSelectedCompany(newCompany);
      queryClient.invalidateQueries({ queryKey: ['/api/employer-companies'] });
    },
  });

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    createCompanyMutation.mutate(companyFormData);
  };

  const resetCompanyForm = () => {
    setCompanyFormData({
      companyName: '',
      legalName: '',
      taxId: '',
      industry: '',
      website: '',
      employeeCount: 1,
      effectiveDate: new Date().toISOString().split('T')[0],
    });
  };

  // Table of Contents for left panel
  const tableOfContents = [
    {
      title: 'Companies',
      items: companies?.map(company => ({
        id: company.id.toString(),
        title: company.companyName,
        icon: <Building2 className="h-4 w-4" />,
        badge: `${company.employeeCount} EEs`,
        isActive: selectedCompany?.id === company.id,
        onClick: () => setSelectedCompany(company),
      })) || []
    }
  ];

  // CRM sections for selected company
  const crmSections = selectedCompany ? [
    {
      title: 'Company Data',
      items: [
        {
          id: 'overview',
          title: 'Company Overview',
          icon: <Building2 className="h-4 w-4" />,
          isActive: activeSection === 'overview',
          onClick: () => setActiveSection('overview'),
        },
        {
          id: 'locations',
          title: 'Addresses & Locations',
          icon: <MapPin className="h-4 w-4" />,
          isActive: activeSection === 'locations',
          onClick: () => setActiveSection('locations'),
        },
        {
          id: 'owners',
          title: 'Company Owners',
          icon: <UserCheck className="h-4 w-4" />,
          isActive: activeSection === 'owners',
          onClick: () => setActiveSection('owners'),
        },
        {
          id: 'contacts',
          title: 'Authorized Contacts',
          icon: <Users className="h-4 w-4" />,
          isActive: activeSection === 'contacts',
          onClick: () => setActiveSection('contacts'),
        }
      ]
    },
    {
      title: 'Benefits & Plans',
      items: [
        {
          id: 'carriers',
          title: 'Current Carriers',
          icon: <Shield className="h-4 w-4" />,
          isActive: activeSection === 'carriers',
          onClick: () => setActiveSection('carriers'),
        },
        {
          id: 'contributions',
          title: 'Contribution Setup',
          icon: <DollarSign className="h-4 w-4" />,
          isActive: activeSection === 'contributions',
          onClick: () => setActiveSection('contributions'),
        },
        {
          id: 'employees',
          title: 'Employee Enrollments',
          icon: <Users className="h-4 w-4" />,
          isActive: activeSection === 'employees',
          onClick: () => setActiveSection('employees'),
        }
      ]
    },
    {
      title: 'CRM & Activities',
      items: [
        {
          id: 'activities',
          title: 'Activity Tracking',
          icon: <Activity className="h-4 w-4" />,
          isActive: activeSection === 'activities',
          onClick: () => setActiveSection('activities'),
        },
        {
          id: 'communications',
          title: 'Email Sync',
          icon: <Mail className="h-4 w-4" />,
          isActive: activeSection === 'communications',
          onClick: () => setActiveSection('communications'),
        },
        {
          id: 'reminders',
          title: 'Reminders & Tasks',
          icon: <Calendar className="h-4 w-4" />,
          isActive: activeSection === 'reminders',
          onClick: () => setActiveSection('reminders'),
        },
        {
          id: 'opportunities',
          title: 'Sales Opportunities',
          icon: <Target className="h-4 w-4" />,
          isActive: activeSection === 'opportunities',
          onClick: () => setActiveSection('opportunities'),
        }
      ]
    }
  ] : [];

  const allTableOfContents = [...tableOfContents, ...crmSections];

  // Top panel actions for company management
  const topPanel = selectedCompany && (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div>
          <h2 className="text-lg font-semibold">{selectedCompany.companyName}</h2>
          <p className="text-sm text-muted-foreground">
            {selectedCompany.employeeCount} employees • {selectedCompany.industry || 'Industry not specified'}
          </p>
        </div>
        <Badge variant={selectedCompany.isActive ? 'default' : 'secondary'}>
          {selectedCompany.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Edit Company
        </Button>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Generate Quote
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Activity
        </Button>
      </div>
    </div>
  );

  const renderContent = () => {
    if (!selectedCompany) {
      return (
        <div className="text-center py-12">
          <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-xl font-semibold mb-2">Select a Company</h3>
          <p className="text-muted-foreground mb-6">
            Choose a company from the left panel to view detailed information and CRM data.
          </p>
          <Dialog open={isCompanyDialogOpen} onOpenChange={setIsCompanyDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetCompanyForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Company
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Company</DialogTitle>
                <DialogDescription>
                  Create a new company record that will be shared across all applications.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCreateCompany} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      value={companyFormData.companyName}
                      onChange={(e) => setCompanyFormData({ ...companyFormData, companyName: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="legalName">Legal Name</Label>
                    <Input
                      id="legalName"
                      value={companyFormData.legalName}
                      onChange={(e) => setCompanyFormData({ ...companyFormData, legalName: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="taxId">Tax ID / EIN</Label>
                    <Input
                      id="taxId"
                      value={companyFormData.taxId}
                      onChange={(e) => setCompanyFormData({ ...companyFormData, taxId: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      value={companyFormData.industry}
                      onChange={(e) => setCompanyFormData({ ...companyFormData, industry: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="employeeCount">Employee Count *</Label>
                    <Input
                      id="employeeCount"
                      type="number"
                      min="1"
                      value={companyFormData.employeeCount}
                      onChange={(e) => setCompanyFormData({ ...companyFormData, employeeCount: parseInt(e.target.value) || 1 })}
                      required
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCompanyDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createCompanyMutation.isPending}>
                    Create Company
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      );
    }

    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Company Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Legal Name</Label>
                    <p>{selectedCompany.legalName || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Tax ID</Label>
                    <p>{selectedCompany.taxId || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Industry</Label>
                    <p>{selectedCompany.industry || 'Not specified'}</p>
                  </div>
                  {selectedCompany.website && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Website</Label>
                      <p className="flex items-center space-x-1">
                        <Globe className="h-4 w-4" />
                        <span>{selectedCompany.website}</span>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Key Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Total Employees</Label>
                    <p className="text-2xl font-bold">{selectedCompany.employeeCount}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Effective Date</Label>
                    <p>{selectedCompany.effectiveDate ? new Date(selectedCompany.effectiveDate).toLocaleDateString() : 'Not set'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Renewal Date</Label>
                    <p>{selectedCompany.renewalDate ? new Date(selectedCompany.renewalDate).toLocaleDateString() : 'Not set'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="text-center py-12">
            <div className="text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">{activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</h3>
              <p>This section will display {activeSection} information for {selectedCompany.companyName}.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <TwoPanelLayout
      title="Company Management"
      description="Centralized company data with integrated CRM"
      tableOfContents={allTableOfContents}
      topPanel={topPanel}
      rightPanelTitle={selectedCompany ? `${selectedCompany.companyName} - ${activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}` : 'Company Data Hub'}
      rightPanelActions={!selectedCompany ? (
        <Dialog open={isCompanyDialogOpen} onOpenChange={setIsCompanyDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetCompanyForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Company
            </Button>
          </DialogTrigger>
        </Dialog>
      ) : undefined}
    >
      {renderContent()}
    </TwoPanelLayout>
  );
}