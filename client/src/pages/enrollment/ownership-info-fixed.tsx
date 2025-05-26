import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Owner } from '@shared/schema';
import { ownerValidationSchema } from '@/utils/form-validators';
import { EnrollmentLayout } from '@/components/layout/enrollment-layout';
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
  const [selectedOwnerId, setSelectedOwnerId] = useState<number | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch companies for this user
  const { data: companies = [], isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['/api/companies'],
  });

  const companyId = companies.length > 0 ? companies[0].id : null;

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
  useEffect(() => {
    if (initiator && (initiator as any).isOwner && owners.length === 0) {
      form.setValue('firstName', (initiator as any).firstName || '');
      form.setValue('lastName', (initiator as any).lastName || '');
      form.setValue('email', (initiator as any).email || '');
      form.setValue('phone', (initiator as any).phone || '');
      form.setValue('title', (initiator as any).title || '');
      form.setValue('ownershipPercentage', 100);
    }
  }, [initiator, owners, form]);

  // Create owner mutation
  const createMutation = useMutation({
    mutationFn: async (values: OwnerFormValues) => {
      const res = await apiRequest('POST', `/api/companies/${companyId}/owners`, values);
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

  if (!companyId) return null;

  return (
    <EnrollmentLayout
      title="Business Ownership"
      subtitle="Add all owners with 5% or more ownership in the company."
      icon={<Users className="w-6 h-6 text-blue-600" />}
    >
      <div className="flex items-center mb-2 text-sm text-gray-500">
        <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
        <span>All changes auto-saved</span>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Business Ownership</CardTitle>
          <CardDescription>
            Add all owners with 5% or more ownership in the company.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Owners Table */}
          {owners.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2">Current Owners</h3>
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Ownership %</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {owners.map(owner => (
                      <TableRow key={owner.id}>
                        <TableCell>
                          {owner.firstName} {owner.lastName}
                        </TableCell>
                        <TableCell>{owner.title}</TableCell>
                        <TableCell>{owner.ownershipPercentage}%</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteOwner(owner.id!)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Total ownership: {owners.reduce((sum, owner) => sum + owner.ownershipPercentage, 0)}
                %
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
                        <Input {...field} />
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
