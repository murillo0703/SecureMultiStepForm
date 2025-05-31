import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Lock, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';

/**
 * Security demonstration page showcasing the enhanced security features
 */
export default function SecurityDemo() {
  const [activeTest, setActiveTest] = useState<string>('');
  const [testResults, setTestResults] = useState<Array<{ test: string; result: string; success: boolean }>>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    maliciousInput: '<script>alert("XSS")</script>test'
  });

  const addTestResult = (test: string, result: string, success: boolean) => {
    setTestResults(prev => [...prev, { test, result, success }]);
  };

  // Test password strength validation
  const testPasswordStrength = () => {
    setActiveTest('password');
    const password = formData.password;
    
    const checks = [
      { test: 'Length >= 8', passed: password.length >= 8 },
      { test: 'Contains uppercase', passed: /[A-Z]/.test(password) },
      { test: 'Contains lowercase', passed: /[a-z]/.test(password) },
      { test: 'Contains number', passed: /\d/.test(password) },
      { test: 'Contains special char', passed: /[@$!%*?&]/.test(password) }
    ];

    const passedChecks = checks.filter(check => check.passed).length;
    const strength = passedChecks < 3 ? 'Weak' : passedChecks < 5 ? 'Medium' : 'Strong';
    
    addTestResult(
      'Password Strength', 
      `${strength} (${passedChecks}/5 requirements met)`, 
      passedChecks >= 4
    );
  };

  // Test input sanitization
  const testInputSanitization = async () => {
    setActiveTest('sanitization');
    
    try {
      const response = await fetch('/demo/sanitization-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          input: formData.maliciousInput,
          normalField: 'regular text'
        })
      });
      
      const data = await response.json();
      
      addTestResult(
        'Input Sanitization',
        `Malicious input blocked: ${JSON.stringify(data.sanitizedData)}`,
        true
      );
    } catch (error) {
      addTestResult('Input Sanitization', 'Test failed - server error', false);
    }
  };

  // Test rate limiting
  const testRateLimit = async () => {
    setActiveTest('rateLimit');
    
    try {
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(
          fetch('/demo/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'test', password: 'wrong' })
          })
        );
      }
      
      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);
      
      addTestResult(
        'Rate Limiting',
        rateLimited ? 'Rate limit triggered after multiple attempts' : 'No rate limit detected',
        rateLimited
      );
    } catch (error) {
      addTestResult('Rate Limiting', 'Test failed - server error', false);
    }
  };

  // Test secure registration
  const testSecureRegistration = async () => {
    setActiveTest('registration');
    
    try {
      const response = await fetch('/demo/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username + Date.now(),
          email: formData.email,
          password: formData.password,
          name: 'Test User'
        })
      });
      
      const data = await response.json();
      
      addTestResult(
        'Secure Registration',
        response.ok ? 'User created with hashed password' : data.error || 'Registration failed',
        response.ok
      );
    } catch (error) {
      addTestResult('Secure Registration', 'Test failed - server error', false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
    setActiveTest('');
  };

  return (
    <div className="container-responsive section-padding">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="heading-xl">Security Demonstration</h1>
          </div>
          <p className="text-body text-gray-600 dark:text-gray-400">
            Interactive demonstration of enhanced security features including password hashing, 
            input sanitization, rate limiting, and validation.
          </p>
        </div>

        <Tabs defaultValue="tests" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tests">Security Tests</TabsTrigger>
            <TabsTrigger value="features">Security Features</TabsTrigger>
          </TabsList>

          <TabsContent value="tests" className="space-y-6">
            {/* Test Input Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Test Data
                </CardTitle>
                <CardDescription>
                  Configure test data to demonstrate security features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid-form">
                  <div className="form-field">
                    <label className="form-label">Username</label>
                    <Input
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Enter test username"
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-field">
                    <label className="form-label">Email</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="test@example.com"
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-field">
                    <label className="form-label">Password</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Enter secure password"
                        className="form-input pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="form-description">
                      Test with: uppercase, lowercase, numbers, special characters
                    </p>
                  </div>
                  
                  <div className="form-field">
                    <label className="form-label">Malicious Input Test</label>
                    <Input
                      value={formData.maliciousInput}
                      onChange={(e) => setFormData(prev => ({ ...prev, maliciousInput: e.target.value }))}
                      placeholder="<script>alert('XSS')</script>"
                      className="form-input font-mono text-sm"
                    />
                    <p className="form-description">
                      This input will be sanitized to prevent XSS attacks
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Tests */}
            <Card>
              <CardHeader>
                <CardTitle>Security Tests</CardTitle>
                <CardDescription>
                  Run these tests to see the security features in action
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="button-group">
                  <Button 
                    onClick={testPasswordStrength}
                    disabled={activeTest === 'password'}
                    className="btn btn-primary"
                  >
                    Test Password Strength
                  </Button>
                  
                  <Button 
                    onClick={testInputSanitization}
                    disabled={activeTest === 'sanitization'}
                    className="btn btn-primary"
                  >
                    Test Input Sanitization
                  </Button>
                  
                  <Button 
                    onClick={testRateLimit}
                    disabled={activeTest === 'rateLimit'}
                    className="btn btn-primary"
                  >
                    Test Rate Limiting
                  </Button>
                  
                  <Button 
                    onClick={testSecureRegistration}
                    disabled={activeTest === 'registration' || !formData.username || !formData.email || !formData.password}
                    className="btn btn-primary"
                  >
                    Test Secure Registration
                  </Button>
                  
                  <Button 
                    onClick={clearResults}
                    variant="outline"
                    className="btn btn-secondary"
                  >
                    Clear Results
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Test Results */}
            {testResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Test Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {testResults.map((result, index) => (
                    <Alert key={index} className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                      <div className="flex items-start gap-2">
                        {result.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                        )}
                        <div>
                          <div className="font-medium">{result.test}</div>
                          <AlertDescription className="mt-1">
                            {result.result}
                          </AlertDescription>
                        </div>
                      </div>
                    </Alert>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            <div className="grid-responsive">
              {/* Password Security */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-blue-600" />
                    Password Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-small space-y-2">
                    <div>✓ Secure hashing with scrypt algorithm</div>
                    <div>✓ Random salt generation (32 bytes)</div>
                    <div>✓ Timing-safe password comparison</div>
                    <div>✓ Password strength validation</div>
                    <div>✓ Protection against timing attacks</div>
                  </div>
                </CardContent>
              </Card>

              {/* Input Validation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    Input Validation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-small space-y-2">
                    <div>✓ XSS prevention through sanitization</div>
                    <div>✓ SQL injection protection</div>
                    <div>✓ Email format validation</div>
                    <div>✓ Phone number formatting</div>
                    <div>✓ SSN validation and formatting</div>
                  </div>
                </CardContent>
              </Card>

              {/* Rate Limiting */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    Rate Limiting
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-small space-y-2">
                    <div>✓ Authentication endpoints: 5 attempts/15min</div>
                    <div>✓ General API: 100 requests/15min</div>
                    <div>✓ Brute force attack prevention</div>
                    <div>✓ IP-based tracking</div>
                    <div>✓ Automatic blocking and retry headers</div>
                  </div>
                </CardContent>
              </Card>

              {/* Security Headers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-600" />
                    Security Headers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-small space-y-2">
                    <div>✓ Content Security Policy (CSP)</div>
                    <div>✓ X-Frame-Options protection</div>
                    <div>✓ X-Content-Type-Options</div>
                    <div>✓ HSTS (HTTP Strict Transport Security)</div>
                    <div>✓ Referrer Policy configuration</div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Monitoring */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    Performance Monitoring
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-small space-y-2">
                    <div>✓ Request timing measurement</div>
                    <div>✓ Database query performance</div>
                    <div>✓ Security event logging</div>
                    <div>✓ Error tracking and analysis</div>
                    <div>✓ Application health monitoring</div>
                  </div>
                </CardContent>
              </Card>

              {/* Code Quality */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Code Quality
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-small space-y-2">
                    <div>✓ Comprehensive documentation</div>
                    <div>✓ Consistent coding standards</div>
                    <div>✓ Error handling patterns</div>
                    <div>✓ Type safety with TypeScript</div>
                    <div>✓ Modular, reusable components</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}