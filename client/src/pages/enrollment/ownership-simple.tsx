import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/layout/header';
import { ProgressSidebar } from '@/components/enrollment/progress-sidebar';
import { Company, Owner, ApplicationInitiator } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { ArrowLeft, ArrowRight, Users, Plus, CheckCircle } from 'lucide-react';

// Owner form validation schema
const ownerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  title: z.string().min(1, 'Title is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Phone number is required'),
  ownershipPercentage: z.number().min(1, 'Ownership percentage must be at least 1%').max(100, 'Ownership percentage cannot exceed 100%'),
  isEligibleForCoverage: z.boolean().default(false),
});

type OwnerFormData = z.infer<typeof ownerSchema>;

export default function OwnershipSimple() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [owners, setOwners] = useState<(OwnerFormData & { id: string })[]>([]);
  const [isAddingOwner, setIsAddingOwner] = useState(false);
  const [hasAutoPopulated, setHasAutoPopulated] = useState(false);

  // Fetch companies for this user
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ['/api/companies'],
  });

  // Get the first company
  const companyId = companies.length > 0 ? companies[0].id : null;

  // Fetch initiator data
  const { data: initiator } = useQuery<ApplicationInitiator>({
    queryKey: ['/api/application-initiator'],
  });

  const form = useForm<OwnerFormData>({
    resolver: zodResolver(ownerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      title: '',
      email: '',
      phone: '',
      ownershipPercentage: 0,
      isEligibleForCoverage: false,
    },
  });

  // Auto-populate owner from initiator if relationship is "Owner"
  useEffect(() => {
    if (initiator && !hasAutoPopulated && 'relationshipToCompany' in initiator && initiator.relationshipToCompany === 'Owner') {
      const autoOwner = {
        id: `auto-${Date.now()}`,
        firstName: (initiator as any).firstName || '',
        lastName: (initiator as any).lastName || '',
        title: (initiator as any).title || '',
        email: (initiator as any).email || '',
        phone: formatPhoneNumber((initiator as any).phone || ''),
        ownershipPercentage: 100, // Default to 100%, user can adjust
        isEligibleForCoverage: false,
      };
      
      setOwners([autoOwner]);
      setHasAutoPopulated(true);
      
      toast({
        title: 'Owner information added',
        description: `${(initiator as any).firstName} ${(initiator as any).lastName} has been automatically added as an owner from the initiator information.`,
      });
    }
  }, [initiator, hasAutoPopulated, toast]);

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length >= 6) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
    if (digits.length >= 3) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }
    return digits;
  };

  const onSubmit = (data: OwnerFormData) => {
    const newOwner = {
      ...data,
      id: Date.now().toString(),
      phone: formatPhoneNumber(data.phone),
    };
    
    setOwners([...owners, newOwner]);
    form.reset();
    setIsAddingOwner(false);
    
    toast({
      title: 'Owner added successfully',
      description: `${data.firstName} ${data.lastName} has been added as an owner.`,
    });
  };

  const removeOwner = (id: string) => {
    setOwners(owners.filter(owner => owner.id !== id));
    toast({
      title: 'Owner removed',
      description: 'The owner has been removed from the list.',
    });
  };

  const totalOwnership = owners.reduce((sum, owner) => sum + owner.ownershipPercentage, 0);

  const canContinue = owners.length > 0 && totalOwnership === 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        {/* Sidebar */}
        <ProgressSidebar />
        
        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Autosave Indicator */}
          <div className="flex items-center mb-6 text-sm text-gray-500">
            <CheckCircle className="h-4 w-4 mr-1 text-secondary" />
            <span>All changes autosaved</span>
          </div>
          
          <div className="max-w-4xl space-y-6">
            
            {/* Header Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  Ownership Information
                </CardTitle>
                <p className="text-gray-600">
                  Add company owners with their ownership percentages. Total ownership must equal 100%.
                </p>
              </CardHeader>
            </Card>

            {/* Current Owners List */}
            {owners.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Current Owners</CardTitle>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">
                      Total Ownership: {totalOwnership}%
                    </span>
                    {totalOwnership !== 100 && (
                      <span className="text-sm text-red-600">
                        (Must equal 100%)
                      </span>
                    )}
                    {totalOwnership === 100 && (
                      <span className="text-sm text-green-600">
                        ✓ Complete
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {owners.map((owner) => (
                      <div key={owner.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{owner.firstName} {owner.lastName}</h4>
                          <p className="text-sm text-gray-600">{owner.title}</p>
                          <p className="text-sm text-gray-600">{owner.email} • {owner.phone}</p>
                          <p className="text-sm font-medium text-blue-600">
                            {owner.ownershipPercentage}% ownership
                            {owner.isEligibleForCoverage && ' • Eligible for coverage'}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeOwner(owner.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Add Owner Form */}
            {isAddingOwner ? (
              <Card>
                <CardHeader>
                  <CardTitle>Add New Owner</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
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
                          control={form.control}
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input placeholder="CEO, President, etc." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="ownershipPercentage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ownership Percentage</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="25" 
                                  min="1" 
                                  max="100"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="john@company.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="555-555-5555" 
                                  {...field}
                                  onChange={(e) => field.onChange(formatPhoneNumber(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="isEligibleForCoverage"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-4 w-4 text-blue-600 rounded border-gray-300"
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">
                              This owner is eligible for coverage
                            </FormLabel>
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-3 pt-4">
                        <Button type="submit">Add Owner</Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setIsAddingOwner(false);
                            form.reset();
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <Button 
                    onClick={() => setIsAddingOwner(true)}
                    className="w-full"
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Owner
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation('/enrollment/company-information')}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Company Information
                  </Button>
                  <Button
                    onClick={() => setLocation('/enrollment/authorized-contact')}
                    className="flex items-center gap-2"
                    disabled={!canContinue}
                  >
                    Continue to Authorized Contact
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
                {!canContinue && owners.length > 0 && (
                  <p className="text-sm text-gray-600 mt-2 text-center">
                    Please ensure total ownership equals 100% to continue
                  </p>
                )}
                {owners.length === 0 && (
                  <p className="text-sm text-gray-600 mt-2 text-center">
                    Please add at least one owner to continue
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}