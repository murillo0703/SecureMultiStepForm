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