import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { User, Building, Shield, FileText, Mail, Check } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { ProgressSidebar } from '@/components/enrollment/progress-sidebar';

const initiatorSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  title: z.string().min(1, 'Title/Position is required'),
  relationshipToCompany: z.string().min(1, 'Please select your relationship to the company'),
  isOwner: z.boolean().default(false),
  isAuthorizedContact: z.boolean().default(false),
  isPrimaryContact: z.boolean().default(false),
  isAuthorizedToSign: z.boolean().default(false),
  emailVerificationCode: z.string().optional(),
  isEmailVerified: z.boolean().default(false),
});

type InitiatorData = z.infer<typeof initiatorSchema>;

const relationshipOptions = [
  { value: 'owner', label: 'Company Owner/Partner', autoFill: 'owner', requiresSignAuth: true },
  { value: 'cfo', label: 'CFO/Financial Officer', autoFill: 'authorized', requiresSignAuth: true },
  { value: 'hr_manager', label: 'HR Manager', autoFill: 'authorized', requiresSignAuth: false },
  {
    value: 'benefits_admin',
    label: 'Benefits Administrator',
    autoFill: 'authorized',
    requiresSignAuth: false,
  },
  { value: 'office_manager', label: 'Office Manager', autoFill: 'none', requiresSignAuth: false },
  { value: 'employee', label: 'Employee', autoFill: 'none', requiresSignAuth: false },
  { value: 'broker', label: 'Insurance Broker/Agent', autoFill: 'none', requiresSignAuth: false },
  { value: 'consultant', label: 'Benefits Consultant', autoFill: 'none', requiresSignAuth: false },
  { value: 'other', label: 'Other', autoFill: 'none', requiresSignAuth: false },
];

// Phone number formatting function
const formatPhoneNumber = (value: string) => {
  const phoneNumber = value.replace(/[^\d]/g, '');
  const phoneNumberLength = phoneNumber.length;
  if (phoneNumberLength < 4) return phoneNumber;
  if (phoneNumberLength < 7) {
    return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
  }
  return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
};

export default function ApplicationInitiator() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const form = useForm<InitiatorData>({
    resolver: zodResolver(initiatorSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      title: '',
      relationshipToCompany: '',
      isOwner: false,
      isAuthorizedContact: false,
      isPrimaryContact: false,
      isAuthorizedToSign: false,
      emailVerificationCode: '',
      isEmailVerified: false,
    },
  });

  // Email verification mutation
  const sendVerificationMutation = useMutation({
    mutationFn: async (email: string) => {
      // For now, just simulate sending verification code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      console.log(`Verification code for ${email}: ${code}`);
      return { code };
    },
    onSuccess: () => {
      setEmailVerificationSent(true);
      toast({
        title: 'Verification code sent',
        description: 'Please check your email for the verification code.',
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: InitiatorData) => {
      // Add userId to the data before sending
      const dataWithUserId = {
        ...data,
        userId: user?.id,
      };
      const res = await apiRequest('POST', '/api/application-initiator', dataWithUserId);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Information saved',
        description: 'Proceeding to company information...',
      });
      setLocation('/enrollment/company');
    },
    onError: (error: any) => {
      toast({
        title: 'Error saving information',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Auto-fill logic based on relationship selection
  const watchedRelationship = form.watch('relationshipToCompany');
  const watchedEmail = form.watch('email');

  useEffect(() => {
    if (watchedRelationship) {
      const selectedOption = relationshipOptions.find(opt => opt.value === watchedRelationship);
      if (selectedOption) {
        // Auto-set owner/authorized contact flags
        form.setValue('isOwner', selectedOption.autoFill === 'owner');
        form.setValue(
          'isAuthorizedContact',
          selectedOption.autoFill === 'authorized' || selectedOption.autoFill === 'owner'
        );
        form.setValue('isPrimaryContact', selectedOption.autoFill !== 'none');

        // Set authorization to sign for CFO and Owner
        form.setValue('isAuthorizedToSign', selectedOption.requiresSignAuth);
      }
    }
  }, [watchedRelationship, form]);

  const sendVerificationCode = () => {
    if (watchedEmail && watchedEmail.includes('@')) {
      sendVerificationMutation.mutate(watchedEmail);
    } else {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address first.',
        variant: 'destructive',
      });
    }
  };

  const verifyEmail = () => {
    // Simple verification logic for demo
    if (verificationCode.length === 6) {
      form.setValue('isEmailVerified', true);
      toast({
        title: 'Email verified',
        description: 'Your email has been successfully verified.',
      });
    } else {
      toast({
        title: 'Invalid code',
        description: 'Please enter the 6-digit verification code.',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = (data: InitiatorData) => {
    // Validate email verification if required
    if (!data.isEmailVerified) {
      toast({
        title: 'Email verification required',
        description: 'Please verify your email address before continuing.',
        variant: 'destructive',
      });
      return;
    }

    saveMutation.mutate(data);
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8">
            {/* Progress Sidebar */}
            <div className="w-80 flex-shrink-0">
              <ProgressSidebar />
            </div>

            {/* Main Content */}
            <div className="flex-1 max-w-2xl">
              <div className="mb-8 text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Application Initiator Information
                </h1>
                <p className="text-gray-600">
                  First, let's identify who is completing this benefits application submission
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Your Information
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    This information helps us track who submitted the application and may pre-fill
                    sections later if you're also a key contact.
                  </p>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      {/* Personal Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name *</FormLabel>
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
                              <FormLabel>Last Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Smith" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Email with Verification */}
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address *</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="john.smith@company.com"
                                  {...field}
                                  className="flex-1"
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={sendVerificationCode}
                                disabled={!watchedEmail || sendVerificationMutation.isPending}
                                className="shrink-0"
                              >
                                {sendVerificationMutation.isPending ? (
                                  'Sending...'
                                ) : form.watch('isEmailVerified') ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Mail className="h-4 w-4" />
                                )}
                                {!form.watch('isEmailVerified') &&
                                  !sendVerificationMutation.isPending &&
                                  'Verify'}
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Email Verification Code */}
                      {emailVerificationSent && !form.watch('isEmailVerified') && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Mail className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">
                              Email Verification
                            </span>
                          </div>
                          <p className="text-sm text-blue-700 mb-3">
                            We've sent a 6-digit verification code to your email. Please enter it
                            below:
                          </p>
                          <div className="flex gap-2">
                            <Input
                              placeholder="123456"
                              value={verificationCode}
                              onChange={e => setVerificationCode(e.target.value)}
                              maxLength={6}
                              className="w-32"
                            />
                            <Button
                              type="button"
                              onClick={verifyEmail}
                              disabled={verificationCode.length !== 6}
                              size="sm"
                            >
                              Verify
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Phone with Formatting */}
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="555-123-4567"
                                {...field}
                                onChange={e => {
                                  const formatted = formatPhoneNumber(e.target.value);
                                  field.onChange(formatted);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Title and Relationship */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Your Title/Position *</FormLabel>
                              <FormControl>
                                <Input placeholder="HR Manager, Owner, etc." {...field} />
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
                              <FormLabel>Your Relationship to the Company *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select your role" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {relationshipOptions.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Smart Pre-filling Options */}
                      {(watchedRelationship === 'owner' ||
                        watchedRelationship === 'hr_manager' ||
                        watchedRelationship === 'benefits_admin') && (
                        <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-2 text-blue-800">
                            <Shield className="h-4 w-4" />
                            <span className="font-medium">Data Pre-filling Options</span>
                          </div>
                          <p className="text-sm text-blue-700">
                            Based on your role, you may also be a key contact we need information
                            for. Check the boxes below to pre-fill those sections with your
                            information.
                          </p>

                          <div className="space-y-3">
                            <FormField
                              control={form.control}
                              name="isOwner"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel>I am a company owner/partner</FormLabel>
                                    <p className="text-xs text-gray-600">
                                      Check this to pre-fill the ownership information section
                                    </p>
                                  </div>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="isAuthorizedContact"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel>
                                      I am the authorized contact for benefits decisions
                                    </FormLabel>
                                    <p className="text-xs text-gray-600">
                                      Check this to pre-fill the authorized contact section
                                    </p>
                                  </div>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between pt-6">
                        <div /> {/* Spacer */}
                        <Button type="submit" disabled={saveMutation.isPending} className="px-8">
                          {saveMutation.isPending ? 'Saving...' : 'Continue to Company Information'}
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
    </>
  );
}
