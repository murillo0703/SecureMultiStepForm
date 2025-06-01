// Centralized dropdown lists for consistent use across the application

export const INDUSTRY_OPTIONS = [
  { value: "agriculture", label: "Agriculture, Forestry, Fishing and Hunting" },
  { value: "mining", label: "Mining, Quarrying, and Oil and Gas Extraction" },
  { value: "utilities", label: "Utilities" },
  { value: "construction", label: "Construction" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "wholesale", label: "Wholesale Trade" },
  { value: "retail", label: "Retail Trade" },
  { value: "transportation", label: "Transportation and Warehousing" },
  { value: "information", label: "Information" },
  { value: "finance", label: "Finance and Insurance" },
  { value: "realestate", label: "Real Estate and Rental and Leasing" },
  { value: "professional", label: "Professional, Scientific, and Technical Services" },
  { value: "management", label: "Management of Companies and Enterprises" },
  { value: "administrative", label: "Administrative and Support and Waste Management" },
  { value: "educational", label: "Educational Services" },
  { value: "healthcare", label: "Health Care and Social Assistance" },
  { value: "arts", label: "Arts, Entertainment, and Recreation" },
  { value: "accommodation", label: "Accommodation and Food Services" },
  { value: "other", label: "Other Services (except Public Administration)" },
  { value: "public", label: "Public Administration" },
  { value: "technology", label: "Technology" },
  { value: "consulting", label: "Consulting" },
  { value: "nonprofit", label: "Non-Profit Organization" }
];

export const RELATIONSHIP_OPTIONS = [
  { value: "owner", label: "Owner" },
  { value: "partner", label: "Partner" },
  { value: "president", label: "President" },
  { value: "vice-president", label: "Vice President" },
  { value: "ceo", label: "CEO" },
  { value: "cfo", label: "CFO" },
  { value: "coo", label: "COO" },
  { value: "secretary", label: "Secretary" },
  { value: "treasurer", label: "Treasurer" },
  { value: "director", label: "Director" },
  { value: "member", label: "Member" },
  { value: "manager", label: "Manager" },
  { value: "officer", label: "Officer" },
  { value: "employee", label: "Employee" },
  { value: "other", label: "Other" }
];

export const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" }
];

// Phone number formatting utility
export const formatPhoneNumber = (value: string): string => {
  if (!value) return value;
  
  // Remove all non-numeric characters
  const phoneNumber = value.replace(/[^\d]/g, '');
  
  // Don't format if it's not a US phone number length
  if (phoneNumber.length < 4) return phoneNumber;
  
  // Format as (XXX) XXX-XXXX
  if (phoneNumber.length <= 3) {
    return phoneNumber;
  } else if (phoneNumber.length <= 6) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  } else {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  }
};

// Remove formatting from phone number for storage
export const cleanPhoneNumber = (value: string): string => {
  return value.replace(/[^\d]/g, '');
};

// Hierarchical industry categories with subcategories
export const INDUSTRY_CATEGORIES = [
  { 
    value: "10-14", 
    label: "Mining, Quarrying, and Oil and Gas Extraction",
    subcategories: [
      { value: "10", label: "Metal Mining" },
      { value: "12", label: "Coal Mining" },
      { value: "13", label: "Oil and Gas Extraction" },
      { value: "14", label: "Nonmetallic Mineral Mining and Quarrying" }
    ]
  },
  {
    value: "15-17",
    label: "Construction",
    subcategories: [
      { value: "15", label: "Building Construction" },
      { value: "16", label: "Heavy and Civil Engineering Construction" },
      { value: "17", label: "Specialty Trade Contractors" }
    ]
  },
  {
    value: "20-39",
    label: "Manufacturing",
    subcategories: [
      { value: "20", label: "Food Manufacturing" },
      { value: "21", label: "Beverage and Tobacco Product Manufacturing" },
      { value: "22", label: "Textile Mills" },
      { value: "23", label: "Apparel Manufacturing" },
      { value: "31", label: "Chemical Manufacturing" },
      { value: "32", label: "Plastics and Rubber Products Manufacturing" },
      { value: "33", label: "Primary Metal Manufacturing" },
      { value: "34", label: "Fabricated Metal Product Manufacturing" },
      { value: "35", label: "Machinery Manufacturing" },
      { value: "36", label: "Computer and Electronic Product Manufacturing" },
      { value: "37", label: "Transportation Equipment Manufacturing" },
      { value: "39", label: "Miscellaneous Manufacturing" }
    ]
  },
  {
    value: "40-49",
    label: "Transportation and Warehousing",
    subcategories: [
      { value: "40", label: "Rail Transportation" },
      { value: "41", label: "Water Transportation" },
      { value: "42", label: "Truck Transportation" },
      { value: "43", label: "Transit and Ground Passenger Transportation" },
      { value: "44", label: "Air Transportation" },
      { value: "45", label: "Pipeline Transportation" },
      { value: "46", label: "Scenic and Sightseeing Transportation" },
      { value: "47", label: "Support Activities for Transportation" },
      { value: "49", label: "Warehousing and Storage" }
    ]
  },
  {
    value: "50-59",
    label: "Information",
    subcategories: [
      { value: "51", label: "Publishing Industries" },
      { value: "52", label: "Motion Picture and Sound Recording Industries" },
      { value: "53", label: "Broadcasting and Telecommunications" },
      { value: "54", label: "Data Processing, Hosting, and Related Services" }
    ]
  },
  {
    value: "60-69",
    label: "Finance and Insurance",
    subcategories: [
      { value: "60", label: "Credit Intermediation and Related Activities" },
      { value: "61", label: "Securities, Commodity Contracts, and Other Financial Investments" },
      { value: "62", label: "Insurance Carriers and Related Activities" },
      { value: "63", label: "Funds, Trusts, and Other Financial Vehicles" }
    ]
  },
  {
    value: "70-79",
    label: "Real Estate and Rental and Leasing",
    subcategories: [
      { value: "70", label: "Real Estate" },
      { value: "71", label: "Rental and Leasing Services" },
      { value: "72", label: "Lessors of Nonfinancial Intangible Assets" }
    ]
  },
  {
    value: "80-89",
    label: "Professional, Scientific, and Technical Services",
    subcategories: [
      { value: "80", label: "Professional, Scientific, and Technical Services" },
      { value: "81", label: "Management of Companies and Enterprises" },
      { value: "82", label: "Administrative and Support Services" },
      { value: "83", label: "Waste Management and Remediation Services" }
    ]
  },
  {
    value: "90-99",
    label: "Educational Services, Health Care, and Social Assistance",
    subcategories: [
      { value: "90", label: "Educational Services" },
      { value: "91", label: "Ambulatory Health Care Services" },
      { value: "92", label: "Hospitals" },
      { value: "93", label: "Nursing and Residential Care Facilities" },
      { value: "94", label: "Social Assistance" }
    ]
  },
  {
    value: "100-109",
    label: "Arts, Entertainment, and Recreation",
    subcategories: [
      { value: "100", label: "Performing Arts, Spectator Sports, and Related Industries" },
      { value: "101", label: "Museums, Historical Sites, and Similar Institutions" },
      { value: "102", label: "Amusement, Gambling, and Recreation Industries" }
    ]
  },
  {
    value: "110-119",
    label: "Accommodation and Food Services",
    subcategories: [
      { value: "110", label: "Accommodation" },
      { value: "111", label: "Food Services and Drinking Places" }
    ]
  },
  {
    value: "120-129",
    label: "Other Services",
    subcategories: [
      { value: "120", label: "Repair and Maintenance" },
      { value: "121", label: "Personal and Laundry Services" },
      { value: "122", label: "Religious, Grantmaking, Civic, Professional, and Similar Organizations" }
    ]
  },
  {
    value: "130-139",
    label: "Public Administration",
    subcategories: [
      { value: "130", label: "Executive, Legislative, and Other General Government Support" },
      { value: "131", label: "Justice, Public Order, and Safety Activities" },
      { value: "132", label: "Administration of Human Resource Programs" },
      { value: "133", label: "Administration of Environmental Quality Programs" },
      { value: "134", label: "Administration of Housing Programs, Urban Planning, and Community Development" },
      { value: "135", label: "Administration of Economic Programs" },
      { value: "136", label: "Space Research and Technology" },
      { value: "137", label: "National Security and International Affairs" }
    ]
  }
];

// Tax ID formatting utility (EIN format: XX-XXXXXXX)
export const formatTaxId = (value: string): string => {
  if (!value) return value;
  
  // Remove all non-numeric characters
  const taxId = value.replace(/[^\d]/g, '');
  
  // Don't format if it's not a valid EIN length
  if (taxId.length < 3) return taxId;
  
  // Format as XX-XXXXXXX
  if (taxId.length <= 2) {
    return taxId;
  } else {
    return `${taxId.slice(0, 2)}-${taxId.slice(2, 9)}`;
  }
};

// Remove formatting from tax ID for storage
export const cleanTaxId = (value: string): string => {
  return value.replace(/[^\d]/g, '');
};