import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useFormValidation, commonValidations } from '@/hooks/use-form-validation';
import { AccessibleInput, AccessibleCheckbox } from '@/components/ui/accessible-form';
import { ResponsiveContainer, ResponsiveStack, ResponsiveCard } from '@/components/layout/responsive-layout';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, Shield, Users, FileText, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type AuthMode = 'login' | 'register';

export default function EnhancedAuthPage() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { loginMutation, registerMutation } = useAuth();

  // Form validation configuration
  const formConfig = {
    username: commonValidations.required,
    ...(authMode === 'register' && {
      email: commonValidations.email,
      name: commonValidations.name,
      confirmPassword: commonValidations.confirmPassword,
      agreeToTerms: commonValidations.required,
    }),
    password: commonValidations.password,
  };

  const initialValues = {
    username: '',
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  };

  const {
    values,
    errors,
    touched,
    isValidating,
    isValid,
    setValue,
    setTouched,
    handleSubmit,
    reset
  } = useFormValidation(initialValues, formConfig);

  const onSubmit = async (formData: typeof values) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (authMode === 'login') {
        await loginMutation.mutateAsync({
          username: formData.username,
          password: formData.password,
        });
      } else {
        await registerMutation.mutateAsync({
          username: formData.username,
          email: formData.email,
          name: formData.name,
          password: formData.password,
        });
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchAuthMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setSubmitError(null);
    reset();
  };

  const features = [
    {
      icon: Shield,
      title: 'Secure Enrollment',
      description: 'Enterprise-grade security with end-to-end encryption'
    },
    {
      icon: Users,
      title: 'Multi-Step Process',
      description: 'Guided workflow for complete insurance enrollment'
    },
    {
      icon: FileText,
      title: 'Document Management',
      description: 'Secure upload and management of required documents'
    },
    {
      icon: CheckCircle,
      title: 'Compliance Ready',
      description: 'Built to meet insurance industry regulations'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <ResponsiveContainer maxWidth="full" padding="md">
        <div className="flex min-h-screen">
          
          {/* Hero Section - Hidden on small screens */}
          <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-center p-8 xl:p-16">
            <div className="max-w-lg">
              <h1 className="text-4xl xl:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Murillo Insurance
                <span className="block text-blue-600 dark:text-blue-400">
                  Benefits Center
                </span>
              </h1>
              
              <p className="text-lg xl:text-xl text-gray-600 dark:text-gray-300 mb-8">
                Streamline your health insurance enrollment with our secure, 
                user-friendly platform designed for employers and brokers.
              </p>

              <div className="grid gap-6 mb-8">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <feature.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-sm text-gray-500 dark:text-gray-400">
                Trusted by insurance professionals nationwide
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-4 sm:p-8">
            <ResponsiveCard className="w-full max-w-md" padding="lg">
              
              {/* Mobile Hero - Shown only on small screens */}
              <div className="lg:hidden text-center mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Murillo Insurance
                </h1>
                <p className="text-blue-600 dark:text-blue-400 font-semibold mb-4">
                  Benefits Center
                </p>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Secure insurance enrollment platform
                </p>
              </div>

              {/* Auth Mode Toggle */}
              <div className="flex mb-6" role="tablist" aria-label="Authentication mode">
                <button
                  type="button"
                  role="tab"
                  aria-selected={authMode === 'login'}
                  aria-controls="login-panel"
                  className={cn(
                    "flex-1 py-2 px-4 text-sm font-medium rounded-l-lg border transition-colors duration-200",
                    authMode === 'login'
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                  )}
                  onClick={() => switchAuthMode('login')}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={authMode === 'register'}
                  aria-controls="register-panel"
                  className={cn(
                    "flex-1 py-2 px-4 text-sm font-medium rounded-r-lg border-t border-r border-b transition-colors duration-200",
                    authMode === 'register'
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                  )}
                  onClick={() => switchAuthMode('register')}
                >
                  Create Account
                </button>
              </div>

              {/* Error Display */}
              {submitError && (
                <Alert className="mb-6" variant="destructive">
                  <AlertDescription role="alert" aria-live="polite">
                    {submitError}
                  </AlertDescription>
                </Alert>
              )}

              {/* Form */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit(onSubmit);
                }}
                noValidate
                aria-label={authMode === 'login' ? 'Sign in form' : 'Create account form'}
              >
                <ResponsiveStack direction={{ base: 'col' }} gap="md">
                  
                  {/* Username Field */}
                  <AccessibleInput
                    label="Username"
                    type="text"
                    value={values.username}
                    onChange={(e) => setValue('username', e.target.value)}
                    onBlur={() => setTouched('username')}
                    error={touched.username ? errors.username : undefined}
                    required
                    autoComplete="username"
                    placeholder="Enter your username"
                    description="Your unique identifier for the platform"
                  />

                  {/* Registration-only fields */}
                  {authMode === 'register' && (
                    <>
                      <AccessibleInput
                        label="Full Name"
                        type="text"
                        value={values.name}
                        onChange={(e) => setValue('name', e.target.value)}
                        onBlur={() => setTouched('name')}
                        error={touched.name ? errors.name : undefined}
                        required
                        autoComplete="name"
                        placeholder="Enter your full name"
                      />

                      <AccessibleInput
                        label="Email Address"
                        type="email"
                        value={values.email}
                        onChange={(e) => setValue('email', e.target.value)}
                        onBlur={() => setTouched('email')}
                        error={touched.email ? errors.email : undefined}
                        required
                        autoComplete="email"
                        placeholder="Enter your email address"
                        description="We'll use this to send important updates"
                      />
                    </>
                  )}

                  {/* Password Field */}
                  <div className="relative">
                    <AccessibleInput
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      value={values.password}
                      onChange={(e) => setValue('password', e.target.value)}
                      onBlur={() => setTouched('password')}
                      error={touched.password ? errors.password : undefined}
                      required
                      autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                      placeholder="Enter your password"
                      description={authMode === 'register' ? 'Must be at least 8 characters with uppercase, lowercase, number, and special character' : undefined}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Confirm Password for Registration */}
                  {authMode === 'register' && (
                    <div className="relative">
                      <AccessibleInput
                        label="Confirm Password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={values.confirmPassword}
                        onChange={(e) => setValue('confirmPassword', e.target.value)}
                        onBlur={() => setTouched('confirmPassword')}
                        error={touched.confirmPassword ? errors.confirmPassword : undefined}
                        required
                        autoComplete="new-password"
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  )}

                  {/* Terms Agreement for Registration */}
                  {authMode === 'register' && (
                    <AccessibleCheckbox
                      label="I agree to the Terms of Service and Privacy Policy"
                      checked={values.agreeToTerms}
                      onChange={(e) => setValue('agreeToTerms', e.target.checked)}
                      onBlur={() => setTouched('agreeToTerms')}
                      error={touched.agreeToTerms ? errors.agreeToTerms : undefined}
                      required
                      description="By checking this box, you agree to our terms and conditions"
                    />
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting || isValidating || !isValid}
                    aria-describedby="submit-button-description"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {authMode === 'login' ? 'Sign In' : 'Create Account'}
                  </Button>
                  <div id="submit-button-description" className="sr-only">
                    {authMode === 'login' 
                      ? 'Sign in to access your account' 
                      : 'Create a new account to get started'
                    }
                  </div>

                </ResponsiveStack>
              </form>

              {/* Additional Links */}
              <div className="mt-6 text-center space-y-2">
                {authMode === 'login' && (
                  <a
                    href="#forgot-password"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                  >
                    Forgot your password?
                  </a>
                )}
                
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
                  <button
                    type="button"
                    className="text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                    onClick={() => switchAuthMode(authMode === 'login' ? 'register' : 'login')}
                  >
                    {authMode === 'login' ? 'Create one here' : 'Sign in instead'}
                  </button>
                </div>
              </div>

            </ResponsiveCard>
          </div>
        </div>
      </ResponsiveContainer>
    </div>
  );
}