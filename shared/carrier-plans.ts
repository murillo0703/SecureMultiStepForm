export interface CarrierPlan {
  carrier: string;
  planType: string;
  metallicLevel: string;
  planTitle: string;
  deductible: string;
  officeVisits: string;
  inpatientHospital: string;
  outOfPocketMax: string;
  rxTiers: string;
  networkType: 'Full Network' | 'Limited Network';
}

export const carrierPlans: CarrierPlan[] = [
  // Aetna Plans
  {
    carrier: 'Aetna',
    planType: 'PPO',
    metallicLevel: 'Bronze',
    planTitle: 'CA Bronze MC Savings Plus 50/50 8300',
    deductible: '$8,300/ $16,600 embedded',
    officeVisits: '$85 (ded waived 1st visit) then 0%/$95',
    inpatientHospital: '50%',
    outOfPocketMax: '$8,900/ $17,800 embedded; includes ded',
    rxTiers: 'MedDed (2-4); $30/$100/$150/50%',
    networkType: 'Limited Network',
  },
  {
    carrier: 'Aetna',
    planType: 'PPO',
    metallicLevel: 'Bronze',
    planTitle: 'CA Bronze MC 50/50 8300',
    deductible: '$8,300/ $16,600 embedded',
    officeVisits: '$85 (ded waived 1st visit) then 0%/$95',
    inpatientHospital: '50%',
    outOfPocketMax: '$8,900/ $17,800 embedded; includes ded',
    rxTiers: 'MedDed (2-4); $30/$100/$150/50%',
    networkType: 'Full Network',
  },
  // Anthem Plans
  {
    carrier: 'Anthem BC',
    planType: 'PPO',
    metallicLevel: 'Bronze',
    planTitle: 'Anthem Bronze Select PPO 70/6600/35%',
    deductible: '$6,600/ $13,200 embedded',
    officeVisits: '$70/$85',
    inpatientHospital: '35%',
    outOfPocketMax: '$8,900/ $17,800 embedded; includes ded',
    rxTiers: 'MedDed (2-4); $20/$80/$120/30%; $20/$90/$130/40%',
    networkType: 'Limited Network',
  },
  {
    carrier: 'Anthem BC',
    planType: 'PPO',
    metallicLevel: 'Bronze',
    planTitle: 'Anthem Bronze PPO 70/6600/35%',
    deductible: '$6,600/ $13,200 embedded',
    officeVisits: '$70/$85',
    inpatientHospital: '35%',
    outOfPocketMax: '$8,900/ $17,800 embedded; includes ded',
    rxTiers: 'MedDed (2-4); $20/$80/$120/30%; $20/$90/$130/40%',
    networkType: 'Full Network',
  },
  // Blue Shield Plans
  {
    carrier: 'Blue Shield',
    planType: 'PPO',
    metallicLevel: 'Bronze',
    planTitle: 'Bronze Tandem PPO 7500/65 OffEx',
    deductible: '$7,500/ $15,000 embedded',
    officeVisits: '$65 (ded waived 10 visits)/50%',
    inpatientHospital: '50%',
    outOfPocketMax: '$8,850/ $17,700 embedded; includes ded',
    rxTiers: 'MED (2-4); $20/50%/50%; $25/50%/50%; T4-50%',
    networkType: 'Limited Network',
  },
  {
    carrier: 'Blue Shield',
    planType: 'PPO',
    metallicLevel: 'Bronze',
    planTitle: 'Bronze Full PPO 7500/65 OffEx',
    deductible: '$7,500/ $15,000 embedded',
    officeVisits: '$65 (ded waived 10 visits)/50%',
    inpatientHospital: '50%',
    outOfPocketMax: '$8,850/ $17,700 embedded; includes ded',
    rxTiers: 'MED (2-4); $20/50%/ 50%/50%',
    networkType: 'Full Network',
  },
  // United HealthCare Plans
  {
    carrier: 'United HealthCare',
    planType: 'PPO',
    metallicLevel: 'Bronze',
    planTitle: 'Core Bronze Plan',
    deductible: '$6,500/ $13,000 embedded',
    officeVisits: '$65/$85',
    inpatientHospital: '40%',
    outOfPocketMax: '$8,500/ $17,000 embedded; includes ded',
    rxTiers: '$20/$80/$120/40%',
    networkType: 'Limited Network',
  },
  {
    carrier: 'United HealthCare',
    planType: 'PPO',
    metallicLevel: 'Silver',
    planTitle: 'Select Plus Silver Plan',
    deductible: '$2,500/ $5,000 embedded',
    officeVisits: '$45/$75',
    inpatientHospital: '30%',
    outOfPocketMax: '$7,500/ $15,000 embedded; includes ded',
    rxTiers: '$15/$60/$100/30%',
    networkType: 'Full Network',
  },
  // HealthNet Plans
  {
    carrier: 'HealthNet',
    planType: 'PPO',
    metallicLevel: 'Bronze',
    planTitle: 'HealthNet Bronze PPO',
    deductible: '$6,000/ $12,000 embedded',
    officeVisits: '$60/$85',
    inpatientHospital: '40%',
    outOfPocketMax: '$8,200/ $16,400 embedded; includes ded',
    rxTiers: '$20/$75/$110/40%',
    networkType: 'Full Network',
  },
];

export const getCarriersByBenefit = (benefit: string) => {
  switch (benefit) {
    case 'medical':
      return ['Aetna', 'Anthem BC', 'Blue Shield', 'United HealthCare', 'HealthNet'];
    case 'dental':
      return ['Delta Dental', 'MetLife', 'Guardian'];
    case 'vision':
      return ['VSP', 'EyeMed', 'Humana Vision'];
    case 'life':
      return ['MetLife', 'Guardian', 'Principal'];
    default:
      return [];
  }
};

export const getPlansByCarrierAndNetwork = (carrier: string, networkType?: string) => {
  let plans = carrierPlans.filter(plan => plan.carrier === carrier);

  if (networkType) {
    plans = plans.filter(plan => plan.networkType === networkType);
  }

  return plans;
};
