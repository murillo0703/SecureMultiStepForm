import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Users, 
  Plus,
  Edit,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface EmployerLocation {
  id: number;
  companyName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  ratingArea: string;
  phone?: string;
  taxId?: string;
  industry?: string;
  sicCode?: string;
  naicsCode?: string;
  employeeCount: number;
  brokerId?: string;
  effectiveDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

export default function LocationManagement() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<EmployerLocation | null>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    county: '',
    ratingArea: '',
    phone: '',
    taxId: '',
    industry: '',
    sicCode: '',
    naicsCode: '',
    employeeCount: 1,
    effectiveDate: new Date().toISOString().split('T')[0],
  });

  // Fetch employer locations
  const { data: locations, isLoading } = useQuery<EmployerLocation[]>({
    queryKey: ['/api/employer-locations'],
  });

  // Create location mutation
  const createLocationMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest('POST', '/api/employer-locations', data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Location Created',
        description: 'Employer location has been created successfully.',
      });
      setIsDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/employer-locations'] });
    },
  });

  // Update location mutation
  const updateLocationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      const res = await apiRequest('PUT', `/api/employer-locations/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Location Updated',
        description: 'Employer location has been updated successfully.',
      });
      setIsDialogOpen(false);
      setEditingLocation(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/employer-locations'] });
    },
  });

  // Delete location mutation
  const deleteLocationMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/employer-locations/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Location Deleted',
        description: 'Employer location has been deleted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/employer-locations'] });
    },
  });

  const resetForm = () => {
    setFormData({
      companyName: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      county: '',
      ratingArea: '',
      phone: '',
      taxId: '',
      industry: '',
      sicCode: '',
      naicsCode: '',
      employeeCount: 1,
      effectiveDate: new Date().toISOString().split('T')[0],
    });
  };

  const handleEdit = (location: EmployerLocation) => {
    setEditingLocation(location);
    setFormData({
      companyName: location.companyName,
      address: location.address,
      city: location.city,
      state: location.state,
      zipCode: location.zipCode,
      county: location.county,
      ratingArea: location.ratingArea,
      phone: location.phone || '',
      taxId: location.taxId || '',
      industry: location.industry || '',
      sicCode: location.sicCode || '',
      naicsCode: location.naicsCode || '',
      employeeCount: location.employeeCount,
      effectiveDate: location.effectiveDate ? location.effectiveDate.split('T')[0] : new Date().toISOString().split('T')[0],
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLocation) {
      updateLocationMutation.mutate({ id: editingLocation.id, data: formData });
    } else {
      createLocationMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this location? This will affect all associated quotes and applications.')) {
      deleteLocationMutation.mutate(id);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Location Management</h1>
          <p className="text-muted-foreground">
            Manage employer locations and company information
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingLocation(null);
              resetForm();
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingLocation ? 'Edit Location' : 'Add New Location'}
              </DialogTitle>
              <DialogDescription>
                {editingLocation 
                  ? 'Update the employer location information.'
                  : 'Add a new employer location that can be used for quotes and applications.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    required
                  />
                </div>
                
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Select value={formData.state} onValueChange={(value) => setFormData({ ...formData, state: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((state) => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code *</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="county">County *</Label>
                  <Input
                    id="county"
                    value={formData.county}
                    onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ratingArea">Rating Area *</Label>
                  <Select value={formData.ratingArea} onValueChange={(value) => setFormData({ ...formData, ratingArea: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rating area" />
                    </SelectTrigger>
                    <SelectContent>
                      {RATING_AREAS.map((area) => (
                        <SelectItem key={area} value={area}>{area}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID</Label>
                  <Input
                    id="taxId"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="employeeCount">Employee Count *</Label>
                  <Input
                    id="employeeCount"
                    type="number"
                    min="1"
                    value={formData.employeeCount}
                    onChange={(e) => setFormData({ ...formData, employeeCount: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="effectiveDate">Effective Date</Label>
                  <Input
                    id="effectiveDate"
                    type="date"
                    value={formData.effectiveDate}
                    onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createLocationMutation.isPending || updateLocationMutation.isPending}
                >
                  {editingLocation ? 'Update Location' : 'Create Location'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations?.map((location) => (
          <Card key={location.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{location.companyName}</CardTitle>
                </div>
                <Badge variant={location.isActive ? 'default' : 'secondary'}>
                  {location.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <CardDescription className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{location.city}, {location.state}</span>
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div>{location.address}</div>
                <div>{location.city}, {location.state} {location.zipCode}</div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">County:</span>
                  <span>{location.county}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Rating Area:</span>
                  <Badge variant="outline">{location.ratingArea}</Badge>
                </div>
                {location.phone && (
                  <div className="flex items-center space-x-1">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{location.phone}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{location.employeeCount} employees</span>
                </div>
                {location.industry && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Industry:</span>
                    <span className="text-xs">{location.industry}</span>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center pt-3 border-t">
                <div className="flex space-x-1">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(location)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleDelete(location.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Button size="sm" variant="ghost">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!locations || locations.length === 0) && !isLoading && (
        <Card className="p-8">
          <div className="text-center space-y-4">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-medium">No Locations Found</h3>
              <p className="text-muted-foreground">
                Create your first employer location to start managing quotes and applications.
              </p>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Location
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}