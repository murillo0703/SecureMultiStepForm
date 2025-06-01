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
import { 
  Building2, 
  MapPin, 
  Phone, 
  Users, 
  Plus,
  Edit,
  Trash2,
  Globe,
  FileText
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
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [companyFormData, setCompanyFormData] = useState({
    companyName: '',
    legalName: '',
    taxId: '',
    industry: '',
    website: '',
    employeeCount: 1,
    effectiveDate: new Date().toISOString().split('T')[0],
  });
  const [locationFormData, setLocationFormData] = useState({
    locationName: 'Headquarters',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    county: '',
    ratingArea: '',
    phone: '',
    employeeCount: 0,
    isPrimary: true,
  });

  // Fetch companies
  const { data: companies } = useQuery<Company[]>({
    queryKey: ['/api/employer-companies'],
  });

  // Fetch locations for selected company
  const { data: locations } = useQuery<CompanyLocation[]>({
    queryKey: ['/api/employer-companies', selectedCompany?.id, 'locations'],
    enabled: !!selectedCompany,
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Company Data Management</h1>
          <p className="text-muted-foreground">
            Centralized company information that feeds all quotes, applications, and enrollments
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Company
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Companies List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Companies</span>
            </CardTitle>
            <CardDescription>
              Select a company to view details and locations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No companies yet</p>
                <p className="text-xs">This will be your central company data source</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Details */}
        <Card className="lg:col-span-2">
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Company Data Hub</h3>
              <p className="mb-4">
                This will be the central location for all company information that automatically
                populates quotes, applications, and enrollment forms.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Company details, tax information, industry data</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Multiple locations with rating areas for accurate pricing</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Employee counts and demographic information</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}