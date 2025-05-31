import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Owner } from '@shared/schema';
import { ownerValidationSchema } from '@/utils/form-validators';
import { formatPhoneNumber } from '@/utils/format-masks';
import { Header } from '@/components/layout/header';
import { ProgressSidebar } from '@/components/enrollment/progress-sidebar';
import { getEnabledEnrollmentSteps } from '@/utils/enrollment-steps';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, ArrowRight, ArrowLeft, CheckCircle, AlertCircle, Edit, Trash2 } from 'lucide-react';

type OwnerFormValues = z.infer<typeof ownerValidationSchema>;

export default function OwnershipInfo() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedOwnerId, setSelectedOwnerId] = useState<number | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch companies for this user
  const { data: companies = [], isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['/api/companies'],
  });

  const companyId = companies.length > 0 ? companies[0].id : null;

  // Use the enabled enrollment steps
  const steps = getEnabledEnrollmentSteps();

  // Fetch application data
  const { data: application, isLoading: isLoadingApplication } = useQuery({
    queryKey: [`/api/companies/${companyId}/application`],
    enabled: !!companyId,
  });

  // Fetch owners
  const { data: owners = [], isLoading: isLoadingOwners } = useQuery({
    queryKey: [`/api/companies/${companyId}/owners`],
    enabled: !!companyId,
  });

  // Fetch application data
  const { data: application, isLoading: isLoadingApplication } = useQuery({
    queryKey: [`/api/companies/${companyId}/application`],
    enabled: !!companyId,
  });

  // Fetch application initiator
  const { data: initiator } = useQuery({
    queryKey: ['/api/application-initiator'],
  });

  const form = useForm<OwnerFormValues>({
    resolver: zodResolver(ownerValidationSchema),
    defaultValues: {
      companyId: companyId || 0,
      firstName: '',
      lastName: '',
      title: '',
      email: '',
      phone: '',
      ownershipPercentage: 0,
      isEligibleForCoverage: false,
    },
  });

  // Update companyId when available
  useEffect(() => {
    if (companyId) {
      form.setValue('companyId', companyId);
    }
  }, [companyId, form]);

  // Auto-populate owner information if initiator is an owner
  // Auto-create the initiator as the first owner if they are marked as owner
  const autoCreateOwnerMutation = useMutation({
    mutationFn: async (ownerData: OwnerFormValues) => {
      // If no company exists, create one first
      let currentCompanyId = companyId;
      if (!currentCompanyId) {
        const newCompany = await createCompanyMutation.mutateAsync();
        currentCompanyId = newCompany.id;
      }
      
      const res = await apiRequest('POST', `/api/companies/${currentCompanyId}/owners`, ownerData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/owners`] });
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
    },
  });

  useEffect(() => {
    if (initiator && (initiator as any).isOwner && owners.length === 0) {
      // Auto-create the initiator as the first owner
      const ownerData = {
        companyId: companyId || 0,
        firstName: (initiator as any).firstName || '',
        lastName: (initiator as any).lastName || '',
        email: (initiator as any).email || '',
        phone: (initiator as any).phone || '',
        title: (initiator as any).title || 'Owner',
        ownershipPercentage: 100,
        isEligibleForCoverage: true,
      };
      
      autoCreateOwnerMutation.mutate(ownerData);
    }
  }, [initiator, owners.length]);

  // Reset form for adding additional owners
  useEffect(() => {
    form.reset({
      companyId: companyId || 0,
      firstName: '',
      lastName: '',
      title: '',
      email: '',
      phone: '',
      ownershipPercentage: 0,
      isEligibleForCoverage: false,
    });
  }, [companyId, form]);

  // Create company if it doesn't exist - with userId included
  const createCompanyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/companies', {
        name: `${(initiator as any)?.firstName || 'Business'} ${(initiator as any)?.lastName || 'Owner'} Company`.trim(),
        address: '123 Main Street',
        city: 'Los Angeles', 
        state: 'CA',
        zip: '90210',
        phone: formatPhoneNumber((initiator as any)?.phone || '5551234567'),
        taxId: '12-3456789',
        industry: 'Professional Services',
        userId: user?.id || 1, // Include the required userId field
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      toast({
        title: 'Company Created',
        description: 'Company record created successfully',
      });
    },
  });

  // Create owner mutation
  const createMutation = useMutation({
    mutationFn: async (values: OwnerFormValues) => {
      // If no company exists, create one first
      let currentCompanyId = companyId;
      if (!currentCompanyId) {
        const newCompany = await createCompanyMutation.mutateAsync();
        currentCompanyId = newCompany.id;
      }
      
      const res = await apiRequest('POST', `/api/companies/${currentCompanyId}/owners`, values);
      return await res.json();
    },
    onSuccess: () => {
      form.reset({
        companyId: companyId || 0,
        firstName: '',
        lastName: '',
        title: '',
        email: '',
        phone: '',
        ownershipPercentage: 0,
        isEligibleForCoverage: false,
      });
      toast({
        title: 'Owner added',
        description: 'The business owner has been added successfully.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/owners`] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to add owner: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Delete owner mutation
  const deleteMutation = useMutation({
    mutationFn: async (ownerId: number) => {
      await apiRequest('DELETE', `/api/companies/${companyId}/owners/${ownerId}`);
    },
    onSuccess: () => {
      toast({
        title: 'Owner deleted',
        description: 'The business owner has been removed.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/owners`] });
      setSelectedOwnerId(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to delete owner: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: OwnerFormValues) => {
    createMutation.mutate(data);
  };

  const handleContinue = () => {
    const totalPercentage = owners.reduce((sum, owner) => sum + owner.ownershipPercentage, 0);

    if (owners.length === 0) {
      setConfirmDialogOpen(true);
    } else if (Math.abs(totalPercentage - 100) > 0.01) {
      toast({
        title: 'Ownership percentage error',
        description: `Total ownership must equal 100%. Current total: ${totalPercentage}%`,
        variant: 'destructive',
      });
    } else {
      navigate('/enrollment/authorized-contact');
    }
  };

  const handleDeleteOwner = (ownerId: number) => {
    setSelectedOwnerId(ownerId);
    setDeleteDialogOpen(true);
  };

  // Loading state
  const isLoading = isLoadingCompanies || isLoadingOwners || isLoadingApplication;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-64">
            <Loader2 className="h-8 w-8 animate-spin text-border" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <ProgressBar
          steps={steps}
          currentStep="ownership-info"
          completedSteps={(application?.completedSteps as string[]) || []}
        />

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content Area */}
          <div className="lg:flex-1">
            {/* Autosave Indicator */}
            <div className="flex items-center mb-2 text-sm text-gray-500">
              <CheckCircle className="h-4 w-4 mr-1 text-secondary" />
              <span>All changes autosaved</span>
            </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Business Ownership</CardTitle>
          <CardDescription>
            Add all owners with 5% or more ownership in the company.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Owners Table with Enhanced Features */}
          {(owners as any[]).length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">Current Business Owners</h3>
                <div className="text-sm text-gray-600">
                  Total Ownership: {(owners as any[]).reduce((sum: number, owner: any) => sum + owner.ownershipPercentage, 0)}%
                  {(owners as any[]).reduce((sum: number, owner: any) => sum + owner.ownershipPercentage, 0) === 100 && (
                    <span className="ml-2 text-green-600 font-medium">✓ Complete</span>
                  )}
                </div>
              </div>
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Ownership %</TableHead>
                      <TableHead>Coverage</TableHead>
                      <TableHead className="w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(owners as any[]).map((owner: any) => (
                      <TableRow key={owner.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          {owner.firstName} {owner.lastName}
                        </TableCell>
                        <TableCell>{owner.title}</TableCell>
                        <TableCell>{formatPhoneNumber(owner.phone)}</TableCell>
                        <TableCell>{owner.email}</TableCell>
                        <TableCell>
                          <span className="font-semibold">{owner.ownershipPercentage}%</span>
                        </TableCell>
                        <TableCell>
                          {owner.isEligibleForCoverage ? (
                            <span className="text-green-600">Yes</span>
                          ) : (
                            <span className="text-gray-500">No</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedOwnerId(owner.id);
                                // Pre-fill form for editing
                                form.reset({
                                  companyId: companyId || 0,
                                  firstName: owner.firstName,
                                  lastName: owner.lastName,
                                  title: owner.title,
                                  email: owner.email,
                                  phone: owner.phone,
                                  ownershipPercentage: owner.ownershipPercentage,
                                  isEligibleForCoverage: owner.isEligibleForCoverage,
                                });
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteOwner(owner.id!)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Ownership Summary */}
              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                <div className="flex justify-between text-sm">
                  <span>Total Ownership Accounted For:</span>
                  <span className="font-semibold">
                    {(owners as any[]).reduce((sum: number, owner: any) => sum + owner.ownershipPercentage, 0)}%
                  </span>
                </div>
                {(owners as any[]).reduce((sum: number, owner: any) => sum + owner.ownershipPercentage, 0) < 100 && (
                  <div className="flex justify-between text-sm text-orange-600 mt-1">
                    <span>Remaining Ownership:</span>
                    <span className="font-semibold">
                      {100 - (owners as any[]).reduce((sum: number, owner: any) => sum + owner.ownershipPercentage, 0)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Add Owner Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                          min={0}
                          max={100}
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
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
                          placeholder="XXX-XXX-XXXX" 
                          {...field}
                          onChange={(e) => {
                            const formatted = formatPhoneNumber(e.target.value);
                            field.onChange(formatted);
                          }}
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
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Eligible for coverage</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Adding...' : 'Add Owner'}
              </Button>
            </form>
          </Form>

          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={() => navigate('/enrollment/coverage-information')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous: Coverage
            </Button>
            <Button onClick={handleContinue}>
              Next: Authorized Contact
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Continue without owners?</AlertDialogTitle>
            <AlertDialogDescription>
              You haven't added any business owners. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate('/enrollment/authorized-contact')}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Owner?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the owner information.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedOwnerId) {
                  deleteMutation.mutate(selectedOwnerId);
                  setDeleteDialogOpen(false);
                  setSelectedOwnerId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </EnrollmentLayout>
  );
}
