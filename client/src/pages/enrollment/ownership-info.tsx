import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Owner } from "@shared/schema";
import { ownerValidationSchema, validateOwnersPercentage } from "@/utils/form-validators";
import { FormattedInputField } from "@/components/ui/form-formatted-input";
import { getEnabledEnrollmentSteps } from "@/utils/enrollment-steps";
import { EnrollmentLayout } from "@/components/layout/enrollment-layout";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle, ArrowRight, ArrowLeft, Plus, Trash2, AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

// Form schema
type OwnerFormValues = z.infer<typeof ownerValidationSchema>;

export default function OwnershipInfo() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, navigate] = useLocation();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOwnerId, setSelectedOwnerId] = useState<number | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Fetch companies for this user
  const { data: companies = [], isLoading: isLoadingCompanies } = useQuery({
    queryKey: ["/api/companies"],
  });

  // Get the first company
  const companyId = companies.length > 0 ? companies[0].id : null;

  // Redirect if no company exists
  useEffect(() => {
    if (!isLoadingCompanies && !companyId) {
      navigate("/enrollment/company");
    }
  }, [companyId, isLoadingCompanies, navigate]);

  // Fetch owners for this company
  const { data: owners = [], isLoading: isLoadingOwners } = useQuery<Owner[]>({
    queryKey: [`/api/companies/${companyId}/owners`],
    enabled: !!companyId,
  });

  // Fetch application data and initiator information
  const { data: application, isLoading: isLoadingApplication } = useQuery({
    queryKey: [`/api/companies/${companyId}/application`],
    enabled: !!companyId,
  });

  // Fetch application initiator data for auto-population
  const { data: initiator } = useQuery({
    queryKey: ["/api/application-initiator"],
    enabled: !!companyId,
  });

  // Use the enabled enrollment steps (without the Employee step)
  const steps = getEnabledEnrollmentSteps();

  // Form setup
  const form = useForm<OwnerFormValues>({
    resolver: zodResolver(ownerValidationSchema),
    defaultValues: {
      companyId: companyId || 0,
      firstName: "",
      lastName: "",
      title: "",
      ownershipPercentage: 100,
      email: "",
      phone: "",
      isEligibleForCoverage: false,
    },
  });

  // Update companyId when it's available
  useEffect(() => {
    if (companyId) {
      form.setValue("companyId", companyId);
    }
  }, [companyId, form]);

  // Auto-populate owner information if initiator is an owner
  useEffect(() => {
    if (initiator && initiator.isOwner && owners.length === 0) {
      // Check if initiator is an owner and no owners exist yet
      form.setValue("firstName", initiator.firstName);
      form.setValue("lastName", initiator.lastName);
      form.setValue("email", initiator.email);
      form.setValue("phone", initiator.phone);
      form.setValue("title", initiator.title);
      form.setValue("ownershipPercentage", 100); // Default to 100% for first owner
    }
  }, [initiator, owners, form]);

  // Mutation for creating an owner
  const createMutation = useMutation({
    mutationFn: async (values: OwnerFormValues) => {
      const res = await apiRequest("POST", `/api/companies/${companyId}/owners`, values);
      return res.json();
    },
    onSuccess: () => {
      form.reset({
        companyId: companyId || 0,
        firstName: "",
        lastName: "",
        title: "",
        ownershipPercentage: 0,
        email: "",
        phone: "",
        isEligibleForCoverage: false,
      });
      toast({
        title: "Owner added",
        description: "The business owner has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/owners`] });
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/application`] });
      setValidationError(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add owner: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting an owner
  const deleteMutation = useMutation({
    mutationFn: async (ownerId: number) => {
      await apiRequest("DELETE", `/api/companies/${companyId}/owners/${ownerId}`);
    },
    onSuccess: () => {
      toast({
        title: "Owner deleted",
        description: "The business owner has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/owners`] });
      setSelectedOwnerId(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete owner: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: OwnerFormValues) => {
    createMutation.mutate(values);
  };

  const handleDeleteOwner = (id: number) => {
    setSelectedOwnerId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedOwnerId) {
      deleteMutation.mutate(selectedOwnerId);
      setDeleteDialogOpen(false);
    }
  };

  const handleContinue = () => {
    // Validate that total ownership is 100%
    if (!validateOwnersPercentage(owners)) {
      setValidationError("Total ownership percentage must equal 100%");
      return;
    }

    // Clear validation error and open confirm dialog if owners exist
    setValidationError(null);
    if (owners.length === 0) {
      setConfirmDialogOpen(true);
    } else {
      navigate("/enrollment/authorized-contact");
    }
  };

  // Calculate total ownership percentage
  const totalPercentage = owners.reduce((sum, owner) => sum + owner.ownershipPercentage, 0);

  // Loading state
  const isLoading = isLoadingCompanies || isLoadingOwners || isLoadingApplication || createMutation.isPending;

  if (!companyId) return null;

  return (
    <EnrollmentLayout
      title="Business Ownership"
      subtitle="Add all owners with 5% or more ownership in the company."
      icon={<Users className="w-6 h-6 text-blue-600" />}
    >
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
                          {owners.map((owner) => (
                            <TableRow key={owner.id}>
                              <TableCell>
                                {owner.firstName} {owner.lastName}
                              </TableCell>
                              <TableCell>{owner.title}</TableCell>
                              <TableCell>{owner.ownershipPercentage}%</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteOwner(owner.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-gray-500" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell colSpan={2} className="font-medium">
                              Total
                            </TableCell>
                            <TableCell className="font-medium">
                              {totalPercentage}%
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>

                    {totalPercentage !== 100 && (
                      <div className="flex items-center mt-2 text-sm text-amber-600">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        <span>Total ownership must equal 100%</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Add Owner Form */}
                <div>
                  <h3 className="text-sm font-medium mb-4">Add Business Owner</h3>
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
                          control={form.control}
                          name="ownershipPercentage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ownership Percentage</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min={1} 
                                  max={100} 
                                  placeholder="100" 
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormattedInputField
                          control={form.control}
                          name="phone"
                          label="Cell Phone Number"
                          placeholder="(555) 555-5555"
                          formatType="phone"
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input placeholder="name@example.com" {...field} />
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
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Eligible for Coverage</FormLabel>
                              <p className="text-sm text-gray-500">
                                Check this if this owner is eligible for health insurance coverage
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end">
                        <Button type="submit" disabled={createMutation.isPending}>
                          <Plus className="mr-2 h-4 w-4" />
                          {createMutation.isPending ? "Adding..." : "Add Owner"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>

                {validationError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                    <AlertCircle className="inline-block mr-2 h-4 w-4" />
                    {validationError}
                  </div>
                )}

                <div className="flex justify-between mt-8">
                  <Button variant="outline" onClick={() => navigate("/enrollment/company")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous: Company
                  </Button>
                  <Button onClick={handleContinue}>
                    Next: Authorized Contact
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
    </EnrollmentLayout>
  );
}

function OwnershipDialogs({ 
  confirmDialogOpen, 
  setConfirmDialogOpen, 
  deleteDialogOpen, 
  setDeleteDialogOpen, 
  selectedOwnerId, 
  deleteMutation, 
  navigate 
}: any) {
  return (
    <>
        {/* Confirm Dialog for No Owners */}
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
              <AlertDialogAction onClick={() => navigate("/enrollment/authorized-contact")}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Owner Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Owner?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the selected owner.
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
    </>
  );
}
