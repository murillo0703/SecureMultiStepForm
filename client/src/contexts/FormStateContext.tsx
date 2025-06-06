import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Form state types
export interface FormState {
  currentStep: number;
  totalSteps: number;
  isSubmitting: boolean;
  errors: Record<string, string>;
  
  // Form data sections
  applicationInitiator: {
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    effectiveDate: string;
  };
  
  companyInfo: {
    companyName: string;
    taxId: string;
    industry: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
    employeeCount: string;
  };
  
  ownerInfo: Array<{
    id: string;
    firstName: string;
    lastName: string;
    title: string;
    email: string;
    phone: string;
    ownershipPercentage: number;
    relationshipToCompany: string;
    isEligibleForCoverage: boolean;
    isAuthorizedContact: boolean;
  }>;
  
  employeeInfo: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    dob: string;
    ssn: string;
  }>;
  
  selectedPlans: Record<string, any>;
  contributions: Record<string, number>;
  documents: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
    uploadDate: string;
  }>;
}

// Action types for form state management
type FormAction =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'NEXT_STEP' }
  | { type: 'PREVIOUS_STEP' }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'SET_ERRORS'; payload: Record<string, string> }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'UPDATE_APPLICATION_INITIATOR'; payload: Partial<FormState['applicationInitiator']> }
  | { type: 'UPDATE_COMPANY_INFO'; payload: Partial<FormState['companyInfo']> }
  | { type: 'ADD_OWNER'; payload: FormState['ownerInfo'][0] }
  | { type: 'UPDATE_OWNER'; payload: { id: string; data: Partial<FormState['ownerInfo'][0]> } }
  | { type: 'REMOVE_OWNER'; payload: string }
  | { type: 'ADD_EMPLOYEE'; payload: FormState['employeeInfo'][0] }
  | { type: 'UPDATE_EMPLOYEE'; payload: { id: string; data: Partial<FormState['employeeInfo'][0]> } }
  | { type: 'REMOVE_EMPLOYEE'; payload: string }
  | { type: 'UPDATE_SELECTED_PLANS'; payload: Record<string, any> }
  | { type: 'UPDATE_CONTRIBUTIONS'; payload: Record<string, number> }
  | { type: 'ADD_DOCUMENT'; payload: FormState['documents'][0] }
  | { type: 'REMOVE_DOCUMENT'; payload: string }
  | { type: 'RESET_FORM' };

// Initial state
const initialState: FormState = {
  currentStep: 1,
  totalSteps: 8,
  isSubmitting: false,
  errors: {},
  
  applicationInitiator: {
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    effectiveDate: '',
  },
  
  companyInfo: {
    companyName: '',
    taxId: '',
    industry: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    employeeCount: '',
  },
  
  ownerInfo: [],
  employeeInfo: [],
  selectedPlans: {},
  contributions: {},
  documents: [],
};

// Reducer function with proper error handling
function formReducer(state: FormState, action: FormAction): FormState {
  try {
    switch (action.type) {
      case 'SET_STEP':
        return { ...state, currentStep: Math.max(1, Math.min(action.payload, state.totalSteps)) };
      
      case 'NEXT_STEP':
        return { ...state, currentStep: Math.min(state.currentStep + 1, state.totalSteps) };
      
      case 'PREVIOUS_STEP':
        return { ...state, currentStep: Math.max(state.currentStep - 1, 1) };
      
      case 'SET_SUBMITTING':
        return { ...state, isSubmitting: action.payload };
      
      case 'SET_ERRORS':
        return { ...state, errors: action.payload };
      
      case 'CLEAR_ERRORS':
        return { ...state, errors: {} };
      
      case 'UPDATE_APPLICATION_INITIATOR':
        return {
          ...state,
          applicationInitiator: { ...state.applicationInitiator, ...action.payload }
        };
      
      case 'UPDATE_COMPANY_INFO':
        return {
          ...state,
          companyInfo: { ...state.companyInfo, ...action.payload }
        };
      
      case 'ADD_OWNER':
        return {
          ...state,
          ownerInfo: [...state.ownerInfo, action.payload]
        };
      
      case 'UPDATE_OWNER':
        return {
          ...state,
          ownerInfo: state.ownerInfo.map(owner =>
            owner.id === action.payload.id ? { ...owner, ...action.payload.data } : owner
          )
        };
      
      case 'REMOVE_OWNER':
        return {
          ...state,
          ownerInfo: state.ownerInfo.filter(owner => owner.id !== action.payload)
        };
      
      case 'ADD_EMPLOYEE':
        return {
          ...state,
          employeeInfo: [...state.employeeInfo, action.payload]
        };
      
      case 'UPDATE_EMPLOYEE':
        return {
          ...state,
          employeeInfo: state.employeeInfo.map(employee =>
            employee.id === action.payload.id ? { ...employee, ...action.payload.data } : employee
          )
        };
      
      case 'REMOVE_EMPLOYEE':
        return {
          ...state,
          employeeInfo: state.employeeInfo.filter(employee => employee.id !== action.payload)
        };
      
      case 'UPDATE_SELECTED_PLANS':
        return {
          ...state,
          selectedPlans: { ...state.selectedPlans, ...action.payload }
        };
      
      case 'UPDATE_CONTRIBUTIONS':
        return {
          ...state,
          contributions: { ...state.contributions, ...action.payload }
        };
      
      case 'ADD_DOCUMENT':
        return {
          ...state,
          documents: [...state.documents, action.payload]
        };
      
      case 'REMOVE_DOCUMENT':
        return {
          ...state,
          documents: state.documents.filter(doc => doc.id !== action.payload)
        };
      
      case 'RESET_FORM':
        return initialState;
      
      default:
        return state;
    }
  } catch (error) {
    console.error('FormStateContext reducer error:', error);
    return state;
  }
}

// Context creation
interface FormContextType {
  state: FormState;
  dispatch: React.Dispatch<FormAction>;
  
  // Helper functions for common operations
  nextStep: () => void;
  previousStep: () => void;
  setStep: (step: number) => void;
  setSubmitting: (submitting: boolean) => void;
  setErrors: (errors: Record<string, string>) => void;
  clearErrors: () => void;
  updateApplicationInitiator: (data: Partial<FormState['applicationInitiator']>) => void;
  updateCompanyInfo: (data: Partial<FormState['companyInfo']>) => void;
  addOwner: (owner: FormState['ownerInfo'][0]) => void;
  updateOwner: (id: string, data: Partial<FormState['ownerInfo'][0]>) => void;
  removeOwner: (id: string) => void;
  addEmployee: (employee: FormState['employeeInfo'][0]) => void;
  updateEmployee: (id: string, data: Partial<FormState['employeeInfo'][0]>) => void;
  removeEmployee: (id: string) => void;
  resetForm: () => void;
}

const FormStateContext = createContext<FormContextType | undefined>(undefined);

// Provider component
export function FormStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(formReducer, initialState);

  // Helper functions to simplify component usage
  const contextValue: FormContextType = {
    state,
    dispatch,
    
    nextStep: () => dispatch({ type: 'NEXT_STEP' }),
    previousStep: () => dispatch({ type: 'PREVIOUS_STEP' }),
    setStep: (step: number) => dispatch({ type: 'SET_STEP', payload: step }),
    setSubmitting: (submitting: boolean) => dispatch({ type: 'SET_SUBMITTING', payload: submitting }),
    setErrors: (errors: Record<string, string>) => dispatch({ type: 'SET_ERRORS', payload: errors }),
    clearErrors: () => dispatch({ type: 'CLEAR_ERRORS' }),
    
    updateApplicationInitiator: (data) => dispatch({ type: 'UPDATE_APPLICATION_INITIATOR', payload: data }),
    updateCompanyInfo: (data) => dispatch({ type: 'UPDATE_COMPANY_INFO', payload: data }),
    
    addOwner: (owner) => dispatch({ type: 'ADD_OWNER', payload: owner }),
    updateOwner: (id, data) => dispatch({ type: 'UPDATE_OWNER', payload: { id, data } }),
    removeOwner: (id) => dispatch({ type: 'REMOVE_OWNER', payload: id }),
    
    addEmployee: (employee) => dispatch({ type: 'ADD_EMPLOYEE', payload: employee }),
    updateEmployee: (id, data) => dispatch({ type: 'UPDATE_EMPLOYEE', payload: { id, data } }),
    removeEmployee: (id) => dispatch({ type: 'REMOVE_EMPLOYEE', payload: id }),
    
    resetForm: () => dispatch({ type: 'RESET_FORM' }),
  };

  return (
    <FormStateContext.Provider value={contextValue}>
      {children}
    </FormStateContext.Provider>
  );
}

// Custom hook for using the context
export function useFormState() {
  const context = useContext(FormStateContext);
  if (context === undefined) {
    throw new Error('useFormState must be used within a FormStateProvider');
  }
  return context;
}