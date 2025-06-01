import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

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
  const [companyFormData, setCompanyFormData] = useState({
    companyName: '',
    legalName: '',
    taxId: '',
    industry: '',
    website: '',
    employeeCount: 1,
    effectiveDate: new Date().toISOString().split('T')[0],
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