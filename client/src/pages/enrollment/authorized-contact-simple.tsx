import { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/layout/header';
import { EnrollmentChecklist } from '@/components/enrollment/checklist';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { ArrowLeft, ArrowRight, UserCheck } from 'lucide-react';

// Authorized contact form validation schema
const authorizedContactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  title: z.string().min(1, 'Title is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Phone number is required'),
  isOwner: z.boolean().default(false),
});

type AuthorizedContactFormData = z.infer<typeof authorizedContactSchema>;

export default function AuthorizedContactSimple() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSaved, setIsSaved] = useState(false);

  const form = useForm<AuthorizedContactFormData>({
    resolver: zodResolver(authorizedContactSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      title: '',
      email: '',
      phone: '',
      isOwner: false,
    },
  });

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

  const onSubmit = (data: AuthorizedContactFormData) => {
    const formattedData = {
      ...data,
      phone: formatPhoneNumber(data.phone),
    };
    
    setIsSaved(true);
    
    toast({
      title: 'Authorized contact saved successfully',
      description: `${data.firstName} ${data.lastName} has been set as the authorized contact.`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
          <div className="p-6">
            <EnrollmentChecklist 
              companyId={1}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Header Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                  </div>
                  Authorized Contact Information
                </CardTitle>
                <p className="text-gray-600">
                  Provide information for the person authorized to make decisions about this enrollment.
                </p>
              </CardHeader>
            </Card>

            {/* Form Card */}
            <Card>
              <CardContent className="pt-6">
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
                              <Input placeholder="CEO, HR Director, etc." {...field} />
                            </FormControl>
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
                              <Input type="email" placeholder="john@company.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
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

                    <FormField
                      control={form.control}
                      name="isOwner"
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
                            This person is also a company owner
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <div className="pt-4">
                      <Button type="submit" className="w-full">
                        Save Authorized Contact
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Success Message */}
            {isSaved && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-green-700">
                    <UserCheck className="w-5 h-5" />
                    <span className="font-medium">Authorized contact information saved successfully!</span>
                  </div>
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
                    onClick={() => setLocation('/enrollment/ownership')}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Ownership
                  </Button>
                  <Button
                    onClick={() => setLocation('/enrollment/employees')}
                    className="flex items-center gap-2"
                    disabled={!isSaved}
                  >
                    Continue to Employees
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
                {!isSaved && (
                  <p className="text-sm text-gray-600 mt-2 text-center">
                    Please save the authorized contact information to continue
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