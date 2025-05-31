import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Employee } from '@shared/schema';
import { employeeValidationSchema } from '@/utils/form-validators';
import { Header } from '@/components/layout/header';
import { ProgressSidebar } from '@/components/enrollment/progress-sidebar';
import { FileUpload } from '@/components/ui/file-upload';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardFooter,
  CardTitle,
} from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  FileText,
  AlertCircle,
} from 'lucide-react';

// Form schema
type EmployeeFormValues = z.infer<typeof employeeValidationSchema>;

export default function EmployeeInfo() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('add-manually');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Fetch companies for this user
  const { data: companies = [], isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['/api/companies'],
  });

  // Get the first company
  const companyId = companies.length > 0 ? companies[0].id : null;

  // Redirect if no company exists
  useEffect(() => {
    if (!isLoadingCompanies && !companyId) {
      navigate('/enrollment/company');
    }
  }, [companyId, isLoadingCompanies, navigate]);

  // Fetch employees for this company
  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery<Employee[]>({
    queryKey: [`/api/companies/${companyId}/employees`],
    enabled: !!companyId,
  });

  // Fetch company owners
  const { data: owners = [], isLoading: isLoadingOwners } = useQuery({
    queryKey: [`/api/companies/${companyId}/owners`],
    enabled: !!companyId,
  });

  // Fetch authorized contact
  const { data: authorizedContact, isLoading: isLoadingContact } = useQuery({
    queryKey: [`/api/companies/${companyId}/authorized-contact`],
    enabled: !!companyId,
  });

  // Fetch application data
  const { data: application, isLoading: isLoadingApplication } = useQuery({
    queryKey: [`/api/companies/${companyId}/application`],
    enabled: !!companyId,
  });

  // Steps configuration for progress bar
  const steps = [
    { id: 'company', label: 'Company', href: '/enrollment/company' },
    { id: 'ownership', label: 'Owners', href: '/enrollment/ownership' },
    { id: 'authorized-contact', label: 'Contact', href: '/enrollment/authorized-contact' },
    { id: 'employees', label: 'Employees', href: '/enrollment/employees' },
    { id: 'documents', label: 'Documents', href: '/enrollment/documents' },
    { id: 'plans', label: 'Plans', href: '/enrollment/plans' },
    { id: 'contributions', label: 'Contributions', href: '/enrollment/contributions' },
    { id: 'review', label: 'Submit', href: '/enrollment/review' },
  ];

  // Form setup
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeValidationSchema),
    defaultValues: {
      companyId: companyId || 0,
      firstName: '',
      lastName: '',
      dob: '',
      ssn: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      email: '',
      phone: '',
    },
  });

  // Update companyId when it's available
  useEffect(() => {
    if (companyId) {
      form.setValue('companyId', companyId);
    }
  }, [companyId, form]);

  // Mutation for creating an employee
  const createMutation = useMutation({
    mutationFn: async (values: EmployeeFormValues) => {
      const res = await apiRequest('POST', `/api/companies/${companyId}/employees`, values);
      return res.json();
    },
    onSuccess: () => {
      form.reset({
        companyId: companyId || 0,
        firstName: '',
        lastName: '',
        dob: '',
        ssn: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        email: '',
        phone: '',
      });
      toast({
        title: 'Employee added',
        description: 'The employee has been added successfully.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/employees`] });
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/application`] });
    },
    onError: error => {
      toast({
        title: 'Error',
        description: `Failed to add employee: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Mutation for deleting an employee
  const deleteMutation = useMutation({
    mutationFn: async (employeeId: number) => {
      await apiRequest('DELETE', `/api/companies/${companyId}/employees/${employeeId}`);
    },
    onSuccess: () => {
      toast({
        title: 'Employee deleted',
        description: 'The employee has been removed.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/employees`] });
      setSelectedEmployeeId(null);
    },
    onError: error => {
      toast({
        title: 'Error',
        description: `Failed to delete employee: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Mutation for uploading employee census
  const uploadCensusMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'employee_census');

      const response = await fetch(`/api/companies/${companyId}/upload-census`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to upload employee census');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Census uploaded',
        description: 'Your employee census has been successfully uploaded.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/employees`] });
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/application`] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: EmployeeFormValues) => {
    createMutation.mutate(values);
  };

  const handleDeleteEmployee = (id: number) => {
    setSelectedEmployeeId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedEmployeeId) {
      deleteMutation.mutate(selectedEmployeeId);
      setDeleteDialogOpen(false);
    }
  };

  const handleContinue = () => {
    if (employees.length === 0) {
      setConfirmDialogOpen(true);
    } else {
      navigate('/enrollment/documents');
    }
  };

  const handleFileUpload = (file: File) => {
    uploadCensusMutation.mutate(file);
  };

  // Helper function to import an eligible owner as an employee
  const importOwnerAsEmployee = (owner: any) => {
    const employeeData = {
      companyId: companyId || 0,
      firstName: owner.firstName,
      lastName: owner.lastName,
      dob: owner.dateOfBirth || '', // Convert if available
      ssn: '', // Removed from owner data as requested
      address: owner.address || '',
      city: owner.city || '',
      state: owner.state || '',
      zip: owner.zip || '',
      email: owner.email || '',
      phone: owner.phone || '',
    };
    createMutation.mutate(employeeData);
  };

  // Helper function to import the authorized contact as an employee
  const importContactAsEmployee = (contact: any) => {
    const employeeData = {
      companyId: companyId || 0,
      firstName: contact.firstName,
      lastName: contact.lastName,
      dob: '', // May not be available in contact data
      ssn: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      email: contact.email || '',
      phone: contact.phone || '',
    };
    createMutation.mutate(employeeData);
  };

  // Loading state
  const isLoading =
    isLoadingCompanies ||
    isLoadingEmployees ||
    isLoadingApplication ||
    isLoadingOwners ||
    isLoadingContact ||
    createMutation.isPending;

  if (!companyId) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <ProgressBar
          steps={steps}
          currentStep="employees"
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
                <CardTitle>Employee Census</CardTitle>
                <CardDescription>
                  Add all employees that will be covered under the health insurance plan.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Employees Table */}
                {employees.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium mb-2">
                      Current Employees ({employees.length})
                    </h3>
                    <div className="border rounded-md overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>DOB</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead className="w-[80px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {employees.map(employee => (
                            <TableRow key={employee.id}>
                              <TableCell>
                                {employee.firstName} {employee.lastName}
                              </TableCell>
                              <TableCell>{employee.dob}</TableCell>
                              <TableCell>
                                {employee.email && <div>{employee.email}</div>}
                                {employee.phone && <div>{employee.phone}</div>}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteEmployee(employee.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-gray-500" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* Add Employee Tabs */}
                <Tabs
                  defaultValue="add-manually"
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="mt-6"
                >
                  <TabsList className="grid grid-cols-3 mb-6">
                    <TabsTrigger value="add-manually">Add Manually</TabsTrigger>
                    <TabsTrigger value="import-eligible">Import Eligible</TabsTrigger>
                    <TabsTrigger value="upload-census">Upload Census</TabsTrigger>
                  </TabsList>

                  <TabsContent value="import-eligible">
                    <div className="space-y-6">
                      <div className="bg-gray-50 p-4 rounded-md border mb-4">
                        <p className="text-sm text-gray-600 mb-2">
                          Import eligible business owners and authorized contacts as employees with
                          a single click. This speeds up the enrollment process by re-using
                          information already in the system.
                        </p>
                      </div>

                      {/* Eligible owners section */}
                      <div className="mb-6">
                        <h3 className="text-sm font-medium mb-3">Eligible Owners</h3>
                        {owners.filter(owner => owner.isEligibleForCoverage).length > 0 ? (
                          <div className="border rounded-md overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Email</TableHead>
                                  <TableHead>Phone</TableHead>
                                  <TableHead>Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {owners
                                  .filter(owner => owner.isEligibleForCoverage)
                                  .map(owner => (
                                    <TableRow key={owner.id}>
                                      <TableCell>
                                        {owner.firstName} {owner.lastName}
                                      </TableCell>
                                      <TableCell>{owner.email || '—'}</TableCell>
                                      <TableCell>{owner.phone || '—'}</TableCell>
                                      <TableCell>
                                        <Button
                                          size="sm"
                                          variant="secondary"
                                          onClick={() => importOwnerAsEmployee(owner)}
                                          disabled={createMutation.isPending}
                                        >
                                          <Plus className="h-4 w-4 mr-1" />
                                          Import
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <div className="text-center p-4 bg-gray-50 border rounded-md">
                            <p className="text-gray-500 text-sm">No eligible owners found</p>
                          </div>
                        )}
                      </div>

                      {/* Authorized Contact */}
                      {authorizedContact && authorizedContact.isEligibleForCoverage && (
                        <div className="mb-6">
                          <h3 className="text-sm font-medium mb-3">Eligible Authorized Contact</h3>
                          <div className="border rounded-md overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Title</TableHead>
                                  <TableHead>Contact</TableHead>
                                  <TableHead>Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                <TableRow>
                                  <TableCell>
                                    {authorizedContact.firstName} {authorizedContact.lastName}
                                  </TableCell>
                                  <TableCell>{authorizedContact.title}</TableCell>
                                  <TableCell>
                                    {authorizedContact.email && (
                                      <div>{authorizedContact.email}</div>
                                    )}
                                    {authorizedContact.phone && (
                                      <div>{authorizedContact.phone}</div>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => importContactAsEmployee(authorizedContact)}
                                      disabled={createMutation.isPending}
                                    >
                                      <Plus className="h-4 w-4 mr-1" />
                                      Import
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}

                      {!owners.some(owner => owner.isEligibleForCoverage) &&
                        (!authorizedContact || !authorizedContact.isEligibleForCoverage) && (
                          <div className="bg-amber-50 p-4 rounded-md border border-amber-200 flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <h4 className="font-medium text-amber-800">
                                No eligible contacts found
                              </h4>
                              <p className="text-sm text-amber-700 mt-1">
                                There are no business owners or authorized contacts marked as
                                eligible for coverage. Go back to the previous sections to mark
                                eligible individuals.
                              </p>
                            </div>
                          </div>
                        )}
                    </div>
                  </TabsContent>

                  <TabsContent value="add-manually">
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

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <FormField
                            control={form.control}
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
                            control={form.control}
                            name="ssn"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Social Security Number</FormLabel>
                                <FormControl>
                                  <Input placeholder="XXX-XX-XXXX" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
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

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="john.doe@example.com" {...field} />
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
                                <FormLabel>Phone (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="(555) 123-4567" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex justify-end">
                          <Button type="submit" disabled={createMutation.isPending}>
                            <Plus className="mr-2 h-4 w-4" />
                            {createMutation.isPending ? 'Adding...' : 'Add Employee'}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </TabsContent>

                  <TabsContent value="upload-census">
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                        <div className="flex">
                          <FileText className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                          <div>
                            <h4 className="text-sm font-medium text-blue-800">
                              Census File Requirements
                            </h4>
                            <p className="text-sm text-blue-700 mt-1">
                              Please upload an Excel or CSV file with the following columns: First
                              Name, Last Name, Date of Birth, SSN, Address, City, State, ZIP, Email
                              (optional), Phone (optional).
                            </p>
                            <div className="mt-2">
                              <Button variant="link" className="text-blue-700 p-0 h-auto text-sm">
                                Download Template
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <FileUpload
                        onFileUpload={handleFileUpload}
                        fileType="employee census"
                        accept=".xlsx,.xls,.csv"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => navigate('/enrollment/ownership')}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous: Ownership
                </Button>
                <Button onClick={handleContinue}>
                  Next: Documents
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80">
            <EnrollmentChecklist companyId={companyId} />
          </div>
        </div>

        {/* Confirm Dialog for No Employees */}
        <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Continue without employees?</AlertDialogTitle>
              <AlertDialogDescription>
                You haven't added any employees. Your enrollment requires employee information. Are
                you sure you want to continue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => navigate('/enrollment/documents')}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Employee Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Employee?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the selected employee.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
