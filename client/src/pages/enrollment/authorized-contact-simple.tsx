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
import { ArrowLeft, ArrowRight, UserCheck, Plus, Edit, Trash2 } from 'lucide-react';

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
  const [contacts, setContacts] = useState<(AuthorizedContactFormData & { id: string; isPrimary: boolean })[]>([]);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [editingContact, setEditingContact] = useState<string | null>(null);

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
    const newContact = {
      ...data,
      id: editingContact || Date.now().toString(),
      phone: formatPhoneNumber(data.phone),
      isPrimary: contacts.length === 0, // First contact is automatically primary
    };
    
    if (editingContact) {
      // Update existing contact
      setContacts(contacts.map(contact => 
        contact.id === editingContact 
          ? { ...newContact, isPrimary: contact.isPrimary } 
          : contact
      ));
      setEditingContact(null);
      toast({
        title: 'Contact updated successfully',
        description: `${data.firstName} ${data.lastName} has been updated.`,
      });
    } else {
      // Add new contact
      setContacts([...contacts, newContact]);
      toast({
        title: 'Contact added successfully',
        description: `${data.firstName} ${data.lastName} has been added as an authorized contact.`,
      });
    }
    
    form.reset();
    setIsAddingContact(false);
  };

  const removeContact = (id: string) => {
    const contactToRemove = contacts.find(c => c.id === id);
    const updatedContacts = contacts.filter(contact => contact.id !== id);
    
    // If we're removing the primary contact and there are others, make the first one primary
    if (contactToRemove?.isPrimary && updatedContacts.length > 0) {
      updatedContacts[0].isPrimary = true;
    }
    
    setContacts(updatedContacts);
    toast({
      title: 'Contact removed',
      description: 'The authorized contact has been removed.',
    });
  };

  const editContact = (contact: AuthorizedContactFormData & { id: string; isPrimary: boolean }) => {
    form.reset({
      firstName: contact.firstName,
      lastName: contact.lastName,
      title: contact.title,
      email: contact.email,
      phone: contact.phone,
      isOwner: contact.isOwner,
    });
    setEditingContact(contact.id);
    setIsAddingContact(true);
  };

  const setPrimaryContact = (id: string) => {
    setContacts(contacts.map(contact => ({
      ...contact,
      isPrimary: contact.id === id
    })));
    
    const contact = contacts.find(c => c.id === id);
    toast({
      title: 'Primary contact updated',
      description: `${contact?.firstName} ${contact?.lastName} is now the primary contact.`,
    });
  };

  const canContinue = true; // Allow continuing without contacts

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
                  Add authorized contacts who can make decisions about this enrollment.
                </p>
              </CardHeader>
            </Card>

            {/* Current Contacts List */}
            {contacts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Current Authorized Contacts</CardTitle>
                  <p className="text-sm text-gray-600">
                    {contacts.length === 1 ? '1 contact' : `${contacts.length} contacts`} • 
                    Primary contact: {contacts.find(c => c.isPrimary)?.firstName} {contacts.find(c => c.isPrimary)?.lastName}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {contacts.map((contact) => (
                      <div key={contact.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="font-medium">{contact.firstName} {contact.lastName}</h4>
                            {contact.isPrimary && (
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Primary</span>
                            )}
                            {contact.isOwner && (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Owner</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{contact.title}</p>
                          <p className="text-sm text-gray-600">{contact.email} • {contact.phone}</p>
                          
                          {/* Primary Contact Selection */}
                          {!contact.isPrimary && contacts.length > 1 && (
                            <div className="mt-2">
                              <label className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={false}
                                  onChange={() => setPrimaryContact(contact.id)}
                                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                                />
                                Set as primary contact
                              </label>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => editContact(contact)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeContact(contact.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Add Contact Form */}
            {isAddingContact ? (
              <Card>
                <CardHeader>
                  <CardTitle>{editingContact ? 'Edit Contact' : 'Add New Authorized Contact'}</CardTitle>
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

                      <div className="flex gap-3 pt-4">
                        <Button type="submit">
                          {editingContact ? 'Update Contact' : 'Add Contact'}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setIsAddingContact(false);
                            setEditingContact(null);
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
                    onClick={() => setIsAddingContact(true)}
                    className="w-full"
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Authorized Contact
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
                    onClick={() => setLocation('/enrollment/ownership')}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Ownership
                  </Button>
                  <Button
                    onClick={() => setLocation('/enrollment/document-upload')}
                    className="flex items-center gap-2"
                    disabled={!canContinue}
                  >
                    Continue to Documents
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
                {contacts.length === 0 && (
                  <p className="text-sm text-gray-600 mt-2 text-center">
                    Authorized contacts are optional - you can continue without adding any
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