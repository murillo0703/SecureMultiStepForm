import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Users, 
  Plus, 
  Upload, 
  Download, 
  Trash2, 
  Edit, 
  CalendarIcon,
  FileSpreadsheet,
  UserPlus,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { calculateAge, getDependentRatingRules, getRatingAreaForZip } from '@shared/quote-schema';

const employeeSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.date(),
  gender: z.enum(['male', 'female']),
  zipCode: z.string().length(5, 'ZIP code must be 5 digits'),
  salary: z.number().min(0, 'Salary must be positive'),
  hoursPerWeek: z.number().min(0).max(168, 'Hours per week must be between 0 and 168'),
  eligibleDate: z.date(),
  enrollmentTier: z.enum(['employee', 'employee_spouse', 'employee_children', 'family']),
});

const dependentSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.date(),
  relationship: z.enum(['spouse', 'child']),
  gender: z.enum(['male', 'female']),
});

type EmployeeForm = z.infer<typeof employeeSchema>;
type DependentForm = z.infer<typeof dependentSchema>;

interface Employee extends EmployeeForm {
  id: number;
  age: number;
  county: string;
  ratingArea: number;
  dependents: Array<DependentForm & { id: number; age: number; isEligible: boolean }>;
}

export default function EmployeeManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const quoteId = searchParams.get('quoteId');
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showAddDependent, setShowAddDependent] = useState(false);
  const [importData, setImportData] = useState<string>('');

  const employeeForm = useForm<EmployeeForm>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      enrollmentTier: 'employee',
      hoursPerWeek: 40,
      eligibleDate: new Date(),
    },
  });

  const dependentForm = useForm<DependentForm>({
    resolver: zodResolver(dependentSchema),
  });

  const { data: quote } = useQuery({
    queryKey: ['/api/quotes', quoteId],
    queryFn: async () => {
      if (!quoteId) throw new Error('Quote ID required');
      const response = await apiRequest('GET', `/api/quotes/${quoteId}`);
      return response.json();
    },
    enabled: !!quoteId,
  });

  const { data: existingEmployees } = useQuery({
    queryKey: ['/api/employees', quote?.companyId],
    queryFn: async () => {
      if (!quote?.companyId) return [];
      const response = await apiRequest('GET', `/api/employees?companyId=${quote.companyId}`);
      return response.json();
    },
    enabled: !!quote?.companyId,
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (employee: EmployeeForm) => {
      const age = calculateAge(employee.dateOfBirth);
      const ratingArea = getRatingAreaForZip(employee.zipCode);
      
      const employeeData = {
        ...employee,
        companyId: quote?.companyId,
        age,
        county: 'Unknown', // Would be populated from ZIP lookup
        ratingArea,
        dependents: [],
      };
      
      const response = await apiRequest('POST', '/api/employees', employeeData);
      return response.json();
    },
    onSuccess: (data) => {
      const newEmployee: Employee = {
        ...data,
        dependents: [],
      };
      setEmployees(prev => [...prev, newEmployee]);
      employeeForm.reset();
      setShowAddEmployee(false);
      toast({
        title: 'Employee Added',
        description: `${data.firstName} ${data.lastName} has been added successfully.`,
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

  const addDependentMutation = useMutation({
    mutationFn: async ({ employeeId, dependent }: { employeeId: number; dependent: DependentForm }) => {
      const age = calculateAge(dependent.dateOfBirth);
      const rules = getDependentRatingRules();
      
      // Determine if dependent is eligible for coverage
      const isEligible = dependent.relationship === 'spouse' || 
        (dependent.relationship === 'child' && age <= rules.maxDependentAge);
      
      return {
        ...dependent,
        id: Date.now(), // Mock ID
        age,
        isEligible,
      };
    },
    onSuccess: (data, variables) => {
      setEmployees(prev => prev.map(emp => 
        emp.id === variables.employeeId 
          ? { ...emp, dependents: [...emp.dependents, data] }
          : emp
      ));
      dependentForm.reset();
      setShowAddDependent(false);
      toast({
        title: 'Dependent Added',
        description: `${data.firstName} ${data.lastName} has been added as a dependent.`,
      });
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (employeeId: number) => {
      await apiRequest('DELETE', `/api/employees/${employeeId}`);
      return employeeId;
    },
    onSuccess: (employeeId) => {
      setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
      toast({
        title: 'Employee Removed',
        description: 'Employee has been removed successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove employee',
        variant: 'destructive',
      });
    },
  });

  const processBulkImport = () => {
    try {
      const lines = importData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      if (!headers.includes('firstName') || !headers.includes('lastName') || !headers.includes('dateOfBirth')) {
        throw new Error('CSV must include firstName, lastName, and dateOfBirth columns');
      }
      
      const newEmployees: Employee[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const employee: any = {};
        
        headers.forEach((header, index) => {
          employee[header] = values[index];
        });
        
        // Convert and validate data
        const employeeData: Employee = {
          id: Date.now() + i,
          firstName: employee.firstName,
          lastName: employee.lastName,
          dateOfBirth: new Date(employee.dateOfBirth),
          gender: employee.gender || 'male',
          zipCode: employee.zipCode || '90210',
          salary: parseFloat(employee.salary) || 50000,
          hoursPerWeek: parseFloat(employee.hoursPerWeek) || 40,
          eligibleDate: new Date(employee.eligibleDate || new Date()),
          enrollmentTier: employee.enrollmentTier || 'employee',
          age: calculateAge(new Date(employee.dateOfBirth)),
          county: 'Unknown',
          ratingArea: getRatingAreaForZip(employee.zipCode || '90210'),
          dependents: [],
        };
        
        newEmployees.push(employeeData);
      }
      
      setEmployees(prev => [...prev, ...newEmployees]);
      setImportData('');
      toast({
        title: 'Import Successful',
        description: `${newEmployees.length} employees imported successfully.`,
      });
    } catch (error: any) {
      toast({
        title: 'Import Failed',
        description: error.message || 'Failed to import employees',
        variant: 'destructive',
      });
    }
  };

  const generateCSVTemplate = () => {
    const csvContent = 'firstName,lastName,dateOfBirth,gender,zipCode,salary,hoursPerWeek,eligibleDate,enrollmentTier\n' +
      'John,Doe,1985-06-15,male,90210,65000,40,2024-01-01,employee\n' +
      'Jane,Smith,1990-03-22,female,90210,55000,40,2024-01-01,family';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const calculateRatedDependents = (dependents: Employee['dependents']) => {
    const rules = getDependentRatingRules();
    const children = dependents.filter(d => d.relationship === 'child' && d.age < rules.childCutoffAge);
    const spouse = dependents.find(d => d.relationship === 'spouse');
    
    // Sort children by age (oldest first) and take only the first 3
    const ratedChildren = children
      .sort((a, b) => b.age - a.age)
      .slice(0, rules.maxChildrenRated);
    
    return {
      spouse: spouse ? 1 : 0,
      children: ratedChildren.length,
      totalRated: (spouse ? 1 : 0) + ratedChildren.length,
    };
  };

  const handleContinue = () => {
    if (employees.length === 0) {
      toast({
        title: 'Employees Required',
        description: 'Please add at least one employee to continue.',
        variant: 'destructive',
      });
      return;
    }
    
    // Navigate to carrier selection
    window.location.href = `/quoting/carrier-selection?quoteId=${quoteId}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <Users className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Employee Management</h1>
          <p className="text-xl text-gray-600 mb-4">
            Manage employees and dependents for accurate insurance quoting
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Info className="h-4 w-4" />
            <span>Age-based rating: Only oldest 3 children under 18 are rated, children over 18 rated up to age 26</span>
          </div>
        </div>

        <Tabs defaultValue="employees" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="employees">Employee List ({employees.length})</TabsTrigger>
            <TabsTrigger value="import">Bulk Import</TabsTrigger>
          </TabsList>

          <TabsContent value="employees" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-6 w-6" />
                      Employee Census
                    </CardTitle>
                    <CardDescription>
                      Manage employee and dependent information for quoting
                    </CardDescription>
                  </div>
                  <Dialog open={showAddEmployee} onOpenChange={setShowAddEmployee}>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Employee
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Add New Employee</DialogTitle>
                        <DialogDescription>
                          Enter employee information for insurance quoting
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
                                    <Input {...field} />
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
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={employeeForm.control}
                              name="dateOfBirth"
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel>Date of Birth</FormLabel>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant="outline"
                                          className={cn(
                                            'w-full pl-3 text-left font-normal',
                                            !field.value && 'text-muted-foreground'
                                          )}
                                        >
                                          {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={employeeForm.control}
                              name="gender"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Gender</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select gender" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="male">Male</SelectItem>
                                      <SelectItem value="female">Female</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <FormField
                              control={employeeForm.control}
                              name="zipCode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>ZIP Code</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={employeeForm.control}
                              name="salary"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Annual Salary</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={employeeForm.control}
                              name="hoursPerWeek"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Hours/Week</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                              name="eligibleDate"
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel>Eligible Date</FormLabel>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant="outline"
                                          className={cn(
                                            'w-full pl-3 text-left font-normal',
                                            !field.value && 'text-muted-foreground'
                                          )}
                                        >
                                          {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) => date < new Date('1900-01-01')}
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={employeeForm.control}
                              name="enrollmentTier"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Enrollment Tier</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select tier" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="employee">Employee Only</SelectItem>
                                      <SelectItem value="employee_spouse">Employee + Spouse</SelectItem>
                                      <SelectItem value="employee_children">Employee + Children</SelectItem>
                                      <SelectItem value="family">Family</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => setShowAddEmployee(false)}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={createEmployeeMutation.isPending}>
                              {createEmployeeMutation.isPending ? 'Adding...' : 'Add Employee'}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {employees.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No employees added yet</h3>
                    <p className="text-gray-600 mb-4">Add employees to begin generating quotes</p>
                    <Button onClick={() => setShowAddEmployee(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Your First Employee
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Age</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead>Dependents</TableHead>
                        <TableHead>Rated Deps</TableHead>
                        <TableHead>ZIP</TableHead>
                        <TableHead>Rating Area</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map((employee) => {
                        const ratedDeps = calculateRatedDependents(employee.dependents);
                        return (
                          <TableRow key={employee.id}>
                            <TableCell className="font-medium">
                              {employee.firstName} {employee.lastName}
                            </TableCell>
                            <TableCell>{employee.age}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {employee.enrollmentTier.replace('_', ' + ')}
                              </Badge>
                            </TableCell>
                            <TableCell>{employee.dependents.length}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {ratedDeps.spouse > 0 && <div>Spouse: 1</div>}
                                {ratedDeps.children > 0 && <div>Children: {ratedDeps.children}</div>}
                                {ratedDeps.totalRated === 0 && <span className="text-gray-500">None</span>}
                              </div>
                            </TableCell>
                            <TableCell>{employee.zipCode}</TableCell>
                            <TableCell>{employee.ratingArea}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedEmployee(employee);
                                    setShowAddDependent(true);
                                  }}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="outline">
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Remove Employee</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to remove {employee.firstName} {employee.lastName}? 
                                        This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteEmployeeMutation.mutate(employee.id)}
                                      >
                                        Remove
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="import" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-6 w-6" />
                  Bulk Employee Import
                </CardTitle>
                <CardDescription>
                  Import multiple employees from a CSV file
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button onClick={generateCSVTemplate} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                  <div className="text-sm text-gray-600">
                    Download a CSV template with the required columns
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">CSV Data</label>
                  <textarea
                    className="w-full h-40 p-3 border rounded-md font-mono text-sm"
                    placeholder="Paste your CSV data here or copy from the template..."
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                  />
                </div>
                
                <Button
                  onClick={processBulkImport}
                  disabled={!importData.trim()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import Employees
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Dependent Dialog */}
        <Dialog open={showAddDependent} onOpenChange={setShowAddDependent}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Dependent</DialogTitle>
              <DialogDescription>
                Add a dependent for {selectedEmployee?.firstName} {selectedEmployee?.lastName}
              </DialogDescription>
            </DialogHeader>
            <Form {...dependentForm}>
              <form onSubmit={dependentForm.handleSubmit((data) => 
                addDependentMutation.mutate({ employeeId: selectedEmployee!.id, dependent: data })
              )} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={dependentForm.control}
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
                    control={dependentForm.control}
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={dependentForm.control}
                    name="relationship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relationship</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select relationship" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="spouse">Spouse</SelectItem>
                            <SelectItem value="child">Child</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={dependentForm.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={dependentForm.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date of Birth</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddDependent(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addDependentMutation.isPending}>
                    {addDependentMutation.isPending ? 'Adding...' : 'Add Dependent'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <div className="mt-8 bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Employee Summary</h3>
              <p className="text-sm text-gray-600 mt-1">
                {employees.length} employee{employees.length !== 1 ? 's' : ''} • {employees.reduce((sum, emp) => sum + emp.dependents.length, 0)} dependents
              </p>
            </div>
            
            <Button
              onClick={handleContinue}
              disabled={employees.length === 0}
              size="lg"
              className="px-8"
            >
              Continue to Carrier Selection
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}