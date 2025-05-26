import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { EnrollmentLayout } from '@/components/layout/enrollment-layout';
import { useAutosave } from '@/hooks/use-autosave';
import { getCarriersByBenefit, getPlansByCarrierAndNetwork } from '@shared/carrier-plans';

import {
  Users,
  Shield,
  Heart,
  Eye,
  Briefcase,
  AlertCircle,
  Activity,
  Stethoscope,
  Glasses,
  LifeBuoy,
  Car,
  PawPrint,
  Lock,
  Scale,
  Calendar,
  Home,
  DollarSign,
  PiggyBank,
  Dumbbell,
  Coffee,
} from 'lucide-react';

const coverageInfoSchema = z.object({
  // Employee counts
  fullTimeEmployees: z.number().min(0),
  partTimeEmployees: z.number().min(0),
  temporaryEmployees: z.number().min(0),

  // Core Benefits
  medical: z.boolean().default(false),
  dental: z.boolean().default(false),
  vision: z.boolean().default(false),
  life: z.boolean().default(false),
  std: z.boolean().default(false),
  ltd: z.boolean().default(false),

  // Voluntary Benefits
  accident: z.boolean().default(false),
  criticalIllness: z.boolean().default(false),
  pet: z.boolean().default(false),
  identityTheft: z.boolean().default(false),
  legal: z.boolean().default(false),

  // Company Policy Benefits
  pto: z.boolean().default(false),
  sickLeave: z.boolean().default(false),
  holidays: z.boolean().default(false),
  remoteWork: z.boolean().default(false),

  // Tax-Advantaged & Wellness
  hsa: z.boolean().default(false),
  fsa: z.boolean().default(false),
  retirement401k: z.boolean().default(false),
  simpleIra: z.boolean().default(false),
  eap: z.boolean().default(false),
  gymSubsidy: z.boolean().default(false),

  // COBRA Logic
  had20PlusEmployees6Months: z.boolean().default(false),
  cobraType: z.string().optional(),

  // Carrier selections (conditional based on benefits selected)
  medicalCarrier: z.string().optional(),
  dentalCarrier: z.string().optional(),
  visionCarrier: z.string().optional(),
  lifeCarrier: z.string().optional(),
});

type CoverageInfoData = z.infer<typeof coverageInfoSchema>;

// Benefits data with icons
const benefitsData = {
  core: [
    { key: 'medical', label: 'Medical', icon: Stethoscope },
    { key: 'dental', label: 'Dental', icon: Heart },
    { key: 'vision', label: 'Vision', icon: Eye },
    { key: 'life', label: 'Life', icon: Shield },
    { key: 'std', label: 'STD', icon: Activity },
    { key: 'ltd', label: 'LTD', icon: LifeBuoy },
  ],
  voluntary: [
    { key: 'accident', label: 'Accident', icon: Car },
    { key: 'criticalIllness', label: 'Critical Illness', icon: AlertCircle },
    { key: 'pet', label: 'Pet', icon: PawPrint },
    { key: 'identityTheft', label: 'Identity Theft', icon: Lock },
    { key: 'legal', label: 'Legal', icon: Scale },
  ],
  companyPolicy: [
    { key: 'pto', label: 'PTO', icon: Calendar },
    { key: 'sickLeave', label: 'Sick Leave', icon: Activity },
    { key: 'holidays', label: 'Holidays', icon: Calendar },
    { key: 'remoteWork', label: 'Remote Work', icon: Home },
  ],
  taxWellness: [
    { key: 'hsa', label: 'HSA', icon: DollarSign },
    { key: 'fsa', label: 'FSA', icon: PiggyBank },
    { key: 'retirement401k', label: '401(k)', icon: PiggyBank },
    { key: 'simpleIra', label: 'SIMPLE IRA', icon: DollarSign },
    { key: 'eap', label: 'EAP', icon: Coffee },
    { key: 'gymSubsidy', label: 'Gym Subsidy', icon: Dumbbell },
  ],
};

// Carrier options
const carrierOptions = {
  medicalStatewide: [
    'Aetna',
    'Anthem',
    'Blue Shield',
    'Covered California',
    'Cal Choice',
    'Kaiser',
    'Health Net',
    'UnitedHealthcare',
    'Western Growers',
  ],
  medicalRegional: [
    'Community Care Health',
    'Sharp Health Plan',
    'Sutter Health Plus',
    'Western Health Advantage',
  ],
  otherBenefits: [
    'Principal',
    'MetLife',
    'Humana',
    'Guardian',
    'Lincoln Financial',
    'Aetna',
    'Anthem',
    'Blue Shield',
    'HealthNet',
    'United HealthCare',
    'Beam Benefits',
    'Choice Builder',
    'Cal Choice',
  ],
};

export default function CoverageInformation() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<CoverageInfoData>({
    resolver: zodResolver(coverageInfoSchema),
    defaultValues: {
      fullTimeEmployees: 0,
      partTimeEmployees: 0,
      temporaryEmployees: 0,
      medical: false,
      dental: false,
      vision: false,
      life: false,
      std: false,
      ltd: false,
      accident: false,
      criticalIllness: false,
      pet: false,
      identityTheft: false,
      legal: false,
      pto: false,
      sickLeave: false,
      holidays: false,
      remoteWork: false,
      hsa: false,
      fsa: false,
      retirement401k: false,
      simpleIra: false,
      eap: false,
      gymSubsidy: false,
      had20PlusEmployees6Months: false,
      cobraType: '',
      medicalCarrier: '',
      dentalCarrier: '',
      visionCarrier: '',
      lifeCarrier: '',
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: CoverageInfoData) => {
      const res = await apiRequest('POST', '/api/coverage-information', data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Coverage information saved',
        description: 'Proceeding to ownership information...',
      });
      setLocation('/enrollment/ownership-info');
    },
    onError: (error: any) => {
      toast({
        title: 'Error saving coverage information',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: CoverageInfoData) => {
    // Auto-determine COBRA type based on employee count logic
    if (data.had20PlusEmployees6Months) {
      data.cobraType = 'federal';
    } else {
      data.cobraType = 'cal-cobra';
    }

    saveMutation.mutate(data);
  };

  // Watch for benefits selection to show carrier options
  const watchedBenefits = form.watch(['medical', 'dental', 'vision', 'life']);

  const [medical, dental, vision, life] = watchedBenefits;

  // Auto-save functionality for data persistence
  const formData = form.watch();
  useAutosave({
    endpoint: '/api/coverage-information',
    data: formData,
    delay: 3000, // Save after 3 seconds of inactivity
    enabled: Object.keys(formData).some(
      key =>
        formData[key as keyof CoverageInfoData] !==
        form.formState.defaultValues?.[key as keyof CoverageInfoData]
    ),
  });

  return (
    <EnrollmentLayout
      title="Coverage Information"
      subtitle="Tell us about your employee count and which benefits you're applying for"
      icon={<Users className="w-6 h-6 text-blue-600" />}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Employee Count Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Employee Count
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="fullTimeEmployees"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full-Time Employees</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>Employees working 30+ hours per week</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="partTimeEmployees"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Part-Time Employees</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Employees working less than 30 hours per week
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="temporaryEmployees"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temporary Employees</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>Seasonal or contract employees</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Benefits Selection - Four Column Layout */}
          <Card>
            <CardHeader>
              <CardTitle>Benefits Selection</CardTitle>
              <CardDescription>
                Select all benefits you're applying for. Each benefit will have specific carrier
                options.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Core Benefits Column */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-blue-600 border-b pb-2">
                    Core Benefits
                  </h3>
                  {benefitsData.core.map(benefit => {
                    const IconComponent = benefit.icon;
                    return (
                      <FormField
                        key={benefit.key}
                        control={form.control}
                        name={benefit.key as keyof CoverageInfoData}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value as boolean}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4 text-gray-600" />
                              <FormLabel className="text-sm font-normal">{benefit.label}</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    );
                  })}
                </div>

                {/* Voluntary Benefits Column */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-green-600 border-b pb-2">
                    Voluntary Benefits
                  </h3>
                  {benefitsData.voluntary.map(benefit => {
                    const IconComponent = benefit.icon;
                    return (
                      <FormField
                        key={benefit.key}
                        control={form.control}
                        name={benefit.key as keyof CoverageInfoData}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value as boolean}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4 text-gray-600" />
                              <FormLabel className="text-sm font-normal">{benefit.label}</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    );
                  })}
                </div>

                {/* Company Policy Benefits Column */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-purple-600 border-b pb-2">
                    Company Policy Benefits
                  </h3>
                  {benefitsData.companyPolicy.map(benefit => {
                    const IconComponent = benefit.icon;
                    return (
                      <FormField
                        key={benefit.key}
                        control={form.control}
                        name={benefit.key as keyof CoverageInfoData}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value as boolean}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4 text-gray-600" />
                              <FormLabel className="text-sm font-normal">{benefit.label}</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    );
                  })}
                </div>

                {/* Tax-Advantaged & Wellness Column */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-orange-600 border-b pb-2">
                    Tax-Advantaged & Wellness
                  </h3>
                  {benefitsData.taxWellness.map(benefit => {
                    const IconComponent = benefit.icon;
                    return (
                      <FormField
                        key={benefit.key}
                        control={form.control}
                        name={benefit.key as keyof CoverageInfoData}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value as boolean}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4 text-gray-600" />
                              <FormLabel className="text-sm font-normal">{benefit.label}</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* COBRA Logic Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                COBRA Eligibility
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="had20PlusEmployees6Months"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Has your company had 20 or more employees for 6 or more months in the past
                        year?
                      </FormLabel>
                      <FormDescription>
                        If checked, Federal COBRA applies. If unchecked, Cal-COBRA applies.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Carrier Selection - Conditional based on benefits selected */}
          {(medical || dental || vision || life) && (
            <Card>
              <CardHeader>
                <CardTitle>Carrier Selection</CardTitle>
                <CardDescription>
                  Select your preferred carriers for the benefits you've chosen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {medical && (
                  <div>
                    <FormField
                      control={form.control}
                      name="medicalCarrier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Medical Carrier</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select medical carrier" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <div className="px-2 py-1 text-xs font-semibold text-gray-500">
                                CA Statewide
                              </div>
                              {carrierOptions.medicalStatewide.map(carrier => (
                                <SelectItem key={carrier} value={carrier}>
                                  {carrier}
                                </SelectItem>
                              ))}
                              <div className="px-2 py-1 text-xs font-semibold text-gray-500 border-t mt-2 pt-2">
                                Regional
                              </div>
                              {carrierOptions.medicalRegional.map(carrier => (
                                <SelectItem key={carrier} value={carrier}>
                                  {carrier}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {dental && (
                  <FormField
                    control={form.control}
                    name="dentalCarrier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dental Carrier</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select dental carrier" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {carrierOptions.otherBenefits.map(carrier => (
                              <SelectItem key={carrier} value={carrier}>
                                {carrier}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {vision && (
                  <FormField
                    control={form.control}
                    name="visionCarrier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vision Carrier</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select vision carrier" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {carrierOptions.otherBenefits.map(carrier => (
                              <SelectItem key={carrier} value={carrier}>
                                {carrier}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {life && (
                  <FormField
                    control={form.control}
                    name="lifeCarrier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Life Insurance Carrier</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select life insurance carrier" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {carrierOptions.otherBenefits.map(carrier => (
                              <SelectItem key={carrier} value={carrier}>
                                {carrier}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation('/enrollment/company-information')}
            >
              Back to Company Information
            </Button>
            <Button type="submit" disabled={saveMutation.isPending} className="px-8">
              {saveMutation.isPending ? 'Saving...' : 'Continue to Ownership Information'}
            </Button>
          </div>
        </form>
      </Form>
    </EnrollmentLayout>
  );
}
