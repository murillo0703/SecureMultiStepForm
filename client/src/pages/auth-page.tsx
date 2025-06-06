import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Mail, AlertTriangle, Check, X } from 'lucide-react';
// Login and registration schemas
const loginValidationSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

const registrationValidationSchema = z
  .object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
    email: z.string().email('Invalid email format'),
    companyName: z.string().min(1, 'Company name is required'),
    acceptTerms: z.boolean().refine(val => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });
import { getBrandConfig, getAppName } from '@/lib/brand-config';

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState('login');
  const [location, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();

  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Email verification states
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

  // Magic link states
  const [magicLinkEmail, setMagicLinkEmail] = useState('');
  const [showMagicLinkForm, setShowMagicLinkForm] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<z.infer<typeof loginValidationSchema>>({
    resolver: zodResolver(loginValidationSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // Registration form
  const registerForm = useForm<z.infer<typeof registrationValidationSchema>>({
    resolver: zodResolver(registrationValidationSchema),
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
      email: '',
      companyName: '',
      acceptTerms: false,
    },
  });

  // Availability checking states
  const [usernameStatus, setUsernameStatus] = useState<'checking' | 'available' | 'taken' | null>(
    null
  );
  const [emailStatus, setEmailStatus] = useState<'checking' | 'available' | 'taken' | null>(null);

  // Password matching state
  const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null);

  // Availability checking mutation
  const checkAvailabilityMutation = useMutation({
    mutationFn: async (data: { username?: string; email?: string }) => {
      const response = await apiRequest('POST', '/api/check-availability', data);
      return response.json();
    },
  });

  // Debounced availability checking
  const checkAvailability = useCallback(
    (field: 'username' | 'email', value: string) => {
      if (!value || value.length < 3) {
        if (field === 'username') setUsernameStatus(null);
        if (field === 'email') setEmailStatus(null);
        return;
      }

      if (field === 'username') setUsernameStatus('checking');
      if (field === 'email') setEmailStatus('checking');

      const checkData = field === 'username' ? { username: value } : { email: value };

      checkAvailabilityMutation.mutate(checkData, {
        onSuccess: result => {
          if (field === 'username' && result.usernameAvailable !== undefined) {
            setUsernameStatus(result.usernameAvailable ? 'available' : 'taken');
          }
          if (field === 'email' && result.emailAvailable !== undefined) {
            setEmailStatus(result.emailAvailable ? 'available' : 'taken');
          }
        },
        onError: () => {
          if (field === 'username') setUsernameStatus(null);
          if (field === 'email') setEmailStatus(null);
        },
      });
    },
    [checkAvailabilityMutation]
  );

  const onLoginSubmit = (values: z.infer<typeof loginValidationSchema>) => {
    loginMutation.mutate(values);
  };

  const onRegisterSubmit = (values: z.infer<typeof registrationValidationSchema>) => {
    // Capture the email for verification
    setVerificationEmail(values.email);

    // Remove confirmPassword before sending to API
    const { confirmPassword, ...registrationData } = values;

    registerMutation.mutate(registrationData as any, {
      onSuccess: () => {
        // Show email verification notification
        setEmailVerificationSent(true);
        toast({
          title: 'Registration successful',
          description: 'Please check your email to verify your account.',
        });
      },
    });
  };

  const sendMagicLink = () => {
    if (!magicLinkEmail || !magicLinkEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    // In production, this would connect to your backend API
    // to generate a secure token and send a real email

    // Store the email for verification messaging
    setVerificationEmail(magicLinkEmail);

    toast({
      title: 'Magic link sent',
      description: `Check your email (${magicLinkEmail}) for a secure login link.`,
    });

    // Reset form and hide magic link input
    setMagicLinkEmail('');
    setShowMagicLinkForm(false);
  };

  // Debounced availability checking with refs to prevent spam
  const usernameTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const emailTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUsernameRef = useRef<string>('');
  const lastEmailRef = useRef<string>('');

  // Create debounced checker functions
  const debouncedCheckUsername = useCallback(
    (value: string) => {
      if (usernameTimeoutRef.current) {
        clearTimeout(usernameTimeoutRef.current);
      }

      if (value && value.length >= 3 && value !== lastUsernameRef.current) {
        setUsernameStatus('checking');
        lastUsernameRef.current = value;

        usernameTimeoutRef.current = setTimeout(() => {
          checkAvailability('username', value);
        }, 1200);
      } else if (!value || value.length < 3) {
        setUsernameStatus(null);
        lastUsernameRef.current = '';
      }
    },
    [checkAvailability]
  );

  const debouncedCheckEmail = useCallback(
    (value: string) => {
      if (emailTimeoutRef.current) {
        clearTimeout(emailTimeoutRef.current);
      }

      // Basic email validation - must contain @ and a dot after @
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        value &&
        value.length >= 5 &&
        emailPattern.test(value) &&
        value !== lastEmailRef.current
      ) {
        setEmailStatus('checking');
        lastEmailRef.current = value;

        emailTimeoutRef.current = setTimeout(() => {
          checkAvailability('email', value);
        }, 1200);
      } else if (!value || value.length < 5 || !emailPattern.test(value)) {
        setEmailStatus(null);
        lastEmailRef.current = '';
      }
    },
    [checkAvailability]
  );

  // Use form subscription instead of watch to avoid re-renders
  useEffect(() => {
    const subscription = registerForm.watch((values, { name }) => {
      if (name === 'username' && values.username !== undefined) {
        debouncedCheckUsername(values.username);
      }
      if (name === 'email' && values.email !== undefined) {
        debouncedCheckEmail(values.email);
      }

      // Check password matching
      if (
        (name === 'password' || name === 'confirmPassword') &&
        values.password &&
        values.confirmPassword
      ) {
        if (values.password === values.confirmPassword) {
          setPasswordsMatch(true);
        } else {
          setPasswordsMatch(false);
        }
      } else if (name === 'password' || name === 'confirmPassword') {
        setPasswordsMatch(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [registerForm, debouncedCheckUsername, debouncedCheckEmail]);

  // Return null if redirecting
  if (user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          {/* Using dynamic branding from configuration */}
          {getBrandConfig().logo ? (
            <img
              src={getBrandConfig().logo}
              alt={getAppName()}
              className="mx-auto mb-4 h-12 w-auto"
            />
          ) : (
            <svg
              viewBox="0 0 24 24"
              width="48"
              height="48"
              className="mx-auto mb-4 text-primary"
              fill="currentColor"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
          )}
          <h1 className="text-2xl font-bold text-primary">{getAppName()}</h1>
          <p className="text-gray-600 mt-2">Complete your health insurance enrollment securely</p>
          <div className="text-xs text-gray-500 mt-1">Powered by {getBrandConfig().brandName}</div>
        </div>

        <Card>
          <CardContent className="pt-6">
            {emailVerificationSent && (
              <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
                <AlertTriangle className="h-4 w-4 text-green-500" />
                <AlertDescription>
                  <div className="flex flex-col space-y-2">
                    <p className="font-medium">Verification email sent!</p>
                    <p className="text-sm">
                      We've sent a verification link to{' '}
                      <span className="font-medium">{verificationEmail}</span>. Please check your
                      inbox and verify your email before proceeding.
                    </p>
                    <Button
                      variant="link"
                      className="self-start p-0 text-green-700 hover:text-green-900"
                      onClick={() => setActiveTab('login')}
                    >
                      Return to login
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username or Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Username or email address" {...field} type="text" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                placeholder="••••••••"
                                {...field}
                                type={showLoginPassword ? 'text' : 'password'}
                                className="pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowLoginPassword(!showLoginPassword)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                              >
                                {showLoginPassword ? (
                                  <EyeOff className="h-5 w-5" />
                                ) : (
                                  <Eye className="h-5 w-5" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="remember" />
                        <label
                          htmlFor="remember"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Remember me
                        </label>
                      </div>
                      <Button type="button" variant="link" className="px-0 text-primary">
                        Forgot password?
                      </Button>
                    </div>

                    <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                      {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
                    </Button>

                    <div className="text-center mt-4">
                      <span className="text-sm text-gray-600">Or sign in with</span>
                      {!showMagicLinkForm ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full mt-3"
                          onClick={() => setShowMagicLinkForm(true)}
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          Magic Link Email
                        </Button>
                      ) : (
                        <div className="mt-3 space-y-3">
                          <Input
                            type="email"
                            placeholder="Enter your email address"
                            value={magicLinkEmail}
                            onChange={e => setMagicLinkEmail(e.target.value)}
                          />
                          <div className="flex space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="flex-1"
                              onClick={() => setShowMagicLinkForm(false)}
                            >
                              Cancel
                            </Button>
                            <Button type="button" className="flex-1" onClick={sendMagicLink}>
                              Send Link
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register">
                <Form {...registerForm}>
                  <form
                    onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                placeholder="username"
                                {...field}
                                className={`pr-10 ${
                                  usernameStatus === 'taken'
                                    ? 'border-red-500 focus-visible:ring-red-500'
                                    : usernameStatus === 'available'
                                      ? 'border-green-500 focus-visible:ring-green-500'
                                      : ''
                                }`}
                              />
                              {usernameStatus && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                  {usernameStatus === 'checking' && (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
                                  )}
                                  {usernameStatus === 'available' && (
                                    <Check className="h-4 w-4 text-green-600" />
                                  )}
                                  {usernameStatus === 'taken' && (
                                    <X className="h-4 w-4 text-red-600" />
                                  )}
                                </div>
                              )}
                            </div>
                          </FormControl>
                          {usernameStatus === 'taken' && (
                            <p className="text-sm text-red-600">This username is already taken</p>
                          )}
                          {usernameStatus === 'available' && (
                            <p className="text-sm text-green-600">Username is available</p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                placeholder="yourname@company.com"
                                {...field}
                                type="email"
                                className={`pr-10 ${
                                  emailStatus === 'taken'
                                    ? 'border-red-500 focus-visible:ring-red-500'
                                    : emailStatus === 'available'
                                      ? 'border-green-500 focus-visible:ring-green-500'
                                      : ''
                                }`}
                              />
                              {emailStatus && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                  {emailStatus === 'checking' && (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
                                  )}
                                  {emailStatus === 'available' && (
                                    <Check className="h-4 w-4 text-green-600" />
                                  )}
                                  {emailStatus === 'taken' && (
                                    <X className="h-4 w-4 text-red-600" />
                                  )}
                                </div>
                              )}
                            </div>
                          </FormControl>
                          {emailStatus === 'taken' && (
                            <p className="text-sm text-red-600">This email is already registered</p>
                          )}
                          {emailStatus === 'available' && (
                            <p className="text-sm text-green-600">Email is available</p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                placeholder="••••••••"
                                {...field}
                                type={showRegisterPassword ? 'text' : 'password'}
                                className="pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                              >
                                {showRegisterPassword ? (
                                  <EyeOff className="h-5 w-5" />
                                ) : (
                                  <Eye className="h-5 w-5" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs text-gray-500">
                            Password must have at least 8 characters, including an uppercase letter,
                            lowercase letter, number, and special character.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                placeholder="••••••••"
                                {...field}
                                type={showConfirmPassword ? 'text' : 'password'}
                                className={`pr-16 ${
                                  passwordsMatch === false
                                    ? 'border-red-500 focus-visible:ring-red-500'
                                    : passwordsMatch === true
                                      ? 'border-green-500 focus-visible:ring-green-500'
                                      : ''
                                }`}
                              />
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                                {passwordsMatch !== null && (
                                  <div>
                                    {passwordsMatch === true && (
                                      <Check className="h-4 w-4 text-green-600" />
                                    )}
                                    {passwordsMatch === false && (
                                      <X className="h-4 w-4 text-red-600" />
                                    )}
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  className="text-gray-500 hover:text-gray-800"
                                >
                                  {showConfirmPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                  ) : (
                                    <Eye className="h-5 w-5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </FormControl>
                          {passwordsMatch === false && (
                            <p className="text-sm text-red-600">Passwords do not match</p>
                          )}
                          {passwordsMatch === true && (
                            <p className="text-sm text-green-600">Passwords match</p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Acme Corp" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="acceptTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-4">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I accept the{' '}
                              <a href="#" className="text-primary hover:underline">
                                terms and conditions
                              </a>
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                      {registerMutation.isPending ? 'Creating account...' : 'Create account'}
                    </Button>

                    {/* Password strength indicator */}
                    {registerForm.watch('password') && (
                      <div className="mt-2 space-y-2">
                        <p className="text-sm font-medium">Password strength:</p>
                        <div className="space-y-1">
                          <div className="flex items-center">
                            {/[A-Z]/.test(registerForm.watch('password')) ? (
                              <Check className="h-4 w-4 text-green-500 mr-2" />
                            ) : (
                              <X className="h-4 w-4 text-red-500 mr-2" />
                            )}
                            <span className="text-sm">Uppercase letter</span>
                          </div>
                          <div className="flex items-center">
                            {/[a-z]/.test(registerForm.watch('password')) ? (
                              <Check className="h-4 w-4 text-green-500 mr-2" />
                            ) : (
                              <X className="h-4 w-4 text-red-500 mr-2" />
                            )}
                            <span className="text-sm">Lowercase letter</span>
                          </div>
                          <div className="flex items-center">
                            {/[0-9]/.test(registerForm.watch('password')) ? (
                              <Check className="h-4 w-4 text-green-500 mr-2" />
                            ) : (
                              <X className="h-4 w-4 text-red-500 mr-2" />
                            )}
                            <span className="text-sm">Number</span>
                          </div>
                          <div className="flex items-center">
                            {/[^A-Za-z0-9]/.test(registerForm.watch('password')) ? (
                              <Check className="h-4 w-4 text-green-500 mr-2" />
                            ) : (
                              <X className="h-4 w-4 text-red-500 mr-2" />
                            )}
                            <span className="text-sm">Special character</span>
                          </div>
                          <div className="flex items-center">
                            {registerForm.watch('password').length >= 8 ? (
                              <Check className="h-4 w-4 text-green-500 mr-2" />
                            ) : (
                              <X className="h-4 w-4 text-red-500 mr-2" />
                            )}
                            <span className="text-sm">8+ characters</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-600">
          Having trouble? Contact support at{' '}
          <a
            href="mailto:support@murilloinsuranceagency.com"
            className="font-medium text-primary hover:text-primary-light"
          >
            support@murilloinsuranceagency.com
          </a>
        </div>
      </div>
    </div>
  );
}
