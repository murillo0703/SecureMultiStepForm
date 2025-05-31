import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation } from 'wouter';
import { ArrowLeft, ArrowRight, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { ProgressSidebar } from '@/components/enrollment/progress-sidebar';
import type { Owner, Company, Application } from '@shared/schema';

const authorizedContactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  title: z.string().min(1, 'Title is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone number is required'),
  relationshipToCompany: z.string().min(1, 'Relationship is required'),
  isEligibleForCoverage: z.boolean(),
  isAuthorizedContact: z.boolean().default(true),
});

type AuthorizedContactFormValues = z.infer<typeof authorizedContactSchema>;

export default function AuthorizedContact() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [useExistingOwner, setUseExistingOwner] = useState<boolean>(false);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('');

  // Get companyId from companies
  const { data: companies } = useQuery<Company[]>({
    queryKey: ['/api/companies'],
  });

  const companyId = companies?.[0]?.id;

  // Fetch existing owners
  const { data: owners = [] } = useQuery<Owner[]>({
    queryKey: [`/api/companies/${companyId}/owners`],
    enabled: !!companyId,
  });

  // Fetch existing authorized contact
  const { data: authorizedContact } = useQuery<Owner>({
    queryKey: [`/api/companies/${companyId}/authorized-contact`],
    enabled: !!companyId,
  });

  // Fetch application data
  const { data: application } = useQuery<Application>({
    queryKey: [`/api/companies/${companyId}/application`],
    enabled: !!companyId,
  });

  const form = useForm<AuthorizedContactFormValues>({
    resolver: zodResolver(authorizedContactSchema),
    defaultValues: {
      firstName: authorizedContact?.firstName || '',
      lastName: authorizedContact?.lastName || '',
      title: authorizedContact?.title || '',
      email: authorizedContact?.email || '',
      phone: authorizedContact?.phone || '',
      relationshipToCompany: authorizedContact?.relationshipToCompany || '',
      isEligibleForCoverage: authorizedContact?.isEligibleForCoverage || false,
      isAuthorizedContact: true,
    },
  });

  const createAuthorizedContactMutation = useMutation({
    mutationFn: async (data: AuthorizedContactFormValues) => {
      if (useExistingOwner && selectedOwnerId) {
        // Update existing owner to be authorized contact
        const response = await apiRequest('PATCH', `/api/companies/${companyId}/owners/${selectedOwnerId}`, {
          isAuthorizedContact: true,
        });
        return response.json();
      } else {
        // Create new authorized contact
        const response = await apiRequest('POST', `/api/companies/${companyId}/authorized-contact`, data);
        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Authorized contact information saved successfully.',
      });
      
      // Invalidate and refetch data
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/authorized-contact`] });
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/application`] });
      
      // Navigate to next step
      setLocation('/enrollment/employees');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save authorized contact information.',
        variant: 'destructive',
      });
    },
  });

  const handleUseExistingOwner = (ownerId: string) => {
    const owner = owners.find(o => o.id === parseInt(ownerId));
    if (owner) {
      setSelectedOwnerId(ownerId);
      setUseExistingOwner(true);
      form.reset({
        firstName: owner.firstName,
        lastName: owner.lastName,
        title: owner.title || '',
        email: owner.email || '',
        phone: owner.phone || '',
        relationshipToCompany: owner.relationshipToCompany,
        isEligibleForCoverage: owner.isEligibleForCoverage || false,
        isAuthorizedContact: true,
      });
    }
  };

  const onSubmit = (data: AuthorizedContactFormValues) => {
    createAuthorizedContactMutation.mutate(data);
  };

  if (!companyId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">No Company Found</h2>
          <p className="text-gray-600 mb-4">Please complete the company information first.</p>
          <Button onClick={() => setLocation('/enrollment/company-information')}>
            Go to Company Information
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <ProgressSidebar />
        
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Authorized Contact</h1>
              <p className="text-gray-600 mt-1">
                Designate the person authorized to make benefits decisions for your company.
              </p>
            </div>

            {/* Existing Owners Option */}
            {owners.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Use Existing Owner
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    You can designate one of your existing business owners as the authorized contact.
                  </p>
                  <div className="space-y-2">
                    {owners.map((owner) => (
                      <div
                        key={owner.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-medium">
                            {owner.firstName} {owner.lastName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {owner.title} • {owner.ownershipPercentage}% ownership
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUseExistingOwner(owner.id.toString())}
                          disabled={createAuthorizedContactMutation.isPending}
                        >
                          Select
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* New Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {useExistingOwner ? 'Review Contact Information' : 'Add New Authorized Contact'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={createAuthorizedContactMutation.isPending} />
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
                              <Input {...field} disabled={createAuthorizedContactMutation.isPending} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={createAuthorizedContactMutation.isPending} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="relationshipToCompany"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Relationship to Company</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select relationship" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Owner">Owner</SelectItem>
                                <SelectItem value="CEO">CEO</SelectItem>
                                <SelectItem value="President">President</SelectItem>
                                <SelectItem value="HR Manager">HR Manager</SelectItem>
                                <SelectItem value="Benefits Administrator">Benefits Administrator</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} disabled={createAuthorizedContactMutation.isPending} />
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
                              <Input {...field} disabled={createAuthorizedContactMutation.isPending} />
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
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={createAuthorizedContactMutation.isPending}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Eligible for coverage</FormLabel>
                            <p className="text-xs text-gray-600">
                              Check if this person is eligible to enroll in the company's health insurance plan
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Navigation */}
                    <div className="flex justify-between pt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setLocation('/enrollment/ownership')}
                        className="flex items-center gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Ownership
                      </Button>
                      <Button
                        type="submit"
                        disabled={createAuthorizedContactMutation.isPending}
                        className="flex items-center gap-2"
                      >
                        Continue to Employees
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}