import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { 
  Company, 
  Owner,
  Employee,
  Document,
  Plan
} from "@shared/schema";

interface PdfFormGeneratorProps {
  companyId: number;
  carrier: string;
}

export function PdfFormGenerator({ companyId, carrier }: PdfFormGeneratorProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Fetch company data
  const { data: company } = useQuery<Company>({
    queryKey: [`/api/companies/${companyId}`],
    enabled: !!companyId,
  });
  
  // Fetch owners
  const { data: owners = [] } = useQuery<Owner[]>({
    queryKey: [`/api/companies/${companyId}/owners`],
    enabled: !!companyId,
  });
  
  // Fetch employees
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: [`/api/companies/${companyId}/employees`],
    enabled: !!companyId,
  });
  
  // Fetch documents
  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: [`/api/companies/${companyId}/documents`],
    enabled: !!companyId,
  });
  
  // Fetch selected plans
  const { data: selectedPlans = [] } = useQuery<(Plan & { id: number })[]>({
    queryKey: [`/api/companies/${companyId}/plans`],
    enabled: !!companyId,
  });

  const generateAnthemForm = () => {
    try {
      setIsGenerating(true);
      
      // Create a new PDF
      const doc = new jsPDF();
      
      // Add header
      doc.setFontSize(18);
      doc.text("Anthem Application Form", 105, 15, { align: "center" });
      
      // Add company information
      doc.setFontSize(12);
      doc.text("Company Information", 20, 30);
      
      doc.setFontSize(10);
      if (company) {
        doc.text(`Legal Name: ${company.name}`, 20, 40);
        doc.text(`Address: ${company.address}`, 20, 50);
        doc.text(`City: ${company.city}`, 20, 55);
        doc.text(`State: ${company.state}`, 20, 60);
        doc.text(`ZIP: ${company.zip}`, 20, 65);
        doc.text(`Federal Tax ID: ${company.taxId}`, 20, 70);
        doc.text(`Industry: ${company.industry}`, 20, 75);
      }
      
      // Add owners information
      doc.text("Ownership Information", 20, 90);
      let yPos = 100;
      
      owners.forEach((owner, index) => {
        doc.text(`Owner ${index + 1}: ${owner.firstName} ${owner.lastName}`, 20, yPos);
        doc.text(`Ownership %: ${owner.ownershipPercentage}%`, 20, yPos + 5);
        yPos += 15;
      });
      
      // Add employee information
      doc.text("Employee Information", 20, yPos + 10);
      yPos += 20;
      
      employees.forEach((employee, index) => {
        doc.text(`Employee ${index + 1}: ${employee.firstName} ${employee.lastName}`, 20, yPos);
        doc.text(`DOB: ${new Date(employee.dob).toLocaleDateString()}`, 20, yPos + 5);
        doc.text(`SSN: XXX-XX-${employee.ssn ? employee.ssn.slice(-4) : 'XXXX'}`, 110, yPos + 5);
        yPos += 15;
        
        // Add page if needed
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
      });
      
      // Add selected Anthem plans
      const anthemPlans = selectedPlans.filter(plan => plan.carrier === "Anthem");
      
      if (anthemPlans.length > 0) {
        doc.text("Selected Anthem Plans", 20, yPos + 10);
        yPos += 20;
        
        anthemPlans.forEach((plan, index) => {
          doc.text(`Plan ${index + 1}: ${plan.name}`, 20, yPos);
          doc.text(`Type: ${plan.type}`, 20, yPos + 5);
          yPos += 15;
        });
      }
      
      // Save the PDF
      doc.save(`${company?.name.replace(/[^a-z0-9]/gi, '_')}_Anthem_Application.pdf`);
      
      toast({
        title: "Form Generated",
        description: "Anthem application form has been generated successfully.",
      });
    } catch (error) {
      console.error("Error generating Anthem form:", error);
      toast({
        title: "Error",
        description: "Failed to generate the Anthem application form.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const generateCCSBForm = () => {
    try {
      setIsGenerating(true);
      
      // Create a new PDF
      const doc = new jsPDF();
      
      // Add header
      doc.setFontSize(18);
      doc.text("CCSB Application Form", 105, 15, { align: "center" });
      
      // Add company information
      doc.setFontSize(12);
      doc.text("Employer Information", 20, 30);
      
      doc.setFontSize(10);
      if (company) {
        doc.text(`Legal Business Name: ${company.name}`, 20, 40);
        doc.text(`Physical Address: ${company.address}`, 20, 50);
        doc.text(`City, State, ZIP: ${company.city}, ${company.state} ${company.zip}`, 20, 55);
        doc.text(`Federal Tax ID #: ${company.taxId}`, 20, 60);
        doc.text(`Industry: ${company.industry}`, 20, 65);
        doc.text(`Number of Eligible Employees: ${employees.length}`, 20, 70);
        // All employees are considered enrolling for now
        doc.text(`Number of Employees Enrolling: ${employees.length}`, 20, 75);
      }
      
      // Add owners information
      doc.text("Business Owner Information", 20, 90);
      let yPos = 100;
      
      owners.forEach((owner, index) => {
        doc.text(`Owner Name: ${owner.firstName} ${owner.lastName}`, 20, yPos);
        doc.text(`Title: ${owner.title}`, 110, yPos);
        doc.text(`Ownership %: ${owner.ownershipPercentage}%`, 20, yPos + 5);
        yPos += 15;
      });
      
      // Add selected CCSB plans
      const ccsbPlans = selectedPlans.filter(plan => plan.carrier === "CCSB");
      
      if (ccsbPlans.length > 0) {
        doc.text("Selected CCSB Health Plans", 20, yPos + 10);
        yPos += 20;
        
        ccsbPlans.forEach((plan, index) => {
          doc.text(`Plan ${index + 1}: ${plan.name}`, 20, yPos);
          doc.text(`Metal Tier: ${plan.metalTier || 'N/A'}`, 110, yPos);
          doc.text(`Plan Type: ${plan.type}`, 20, yPos + 5);
          yPos += 15;
        });
      }
      
      // Add page for employee roster
      doc.addPage();
      doc.setFontSize(12);
      doc.text("Employee Roster", 105, 15, { align: "center" });
      
      doc.setFontSize(10);
      yPos = 30;
      
      // Headers
      doc.text("Employee Name", 20, yPos);
      doc.text("DOB", 90, yPos);
      doc.text("Last 4 SSN", 120, yPos);
      doc.text("Status", 160, yPos);
      yPos += 10;
      
      employees.forEach((employee, index) => {
        doc.text(`${employee.firstName} ${employee.lastName}`, 20, yPos);
        doc.text(`${new Date(employee.dob).toLocaleDateString()}`, 90, yPos);
        doc.text(`XXX-XX-${employee.ssn ? employee.ssn.slice(-4) : 'XXXX'}`, 120, yPos);
        doc.text(`Enrolling`, 160, yPos);
        yPos += 10;
        
        // Add page if needed
        if (yPos > 270) {
          doc.addPage();
          doc.text("Employee Roster (continued)", 105, 15, { align: "center" });
          
          // Headers
          yPos = 30;
          doc.text("Employee Name", 20, yPos);
          doc.text("DOB", 90, yPos);
          doc.text("Last 4 SSN", 120, yPos);
          doc.text("Status", 160, yPos);
          yPos += 10;
        }
      });
      
      // Save the PDF
      doc.save(`${company?.name.replace(/[^a-z0-9]/gi, '_')}_CCSB_Application.pdf`);
      
      toast({
        title: "Form Generated",
        description: "CCSB application form has been generated successfully.",
      });
    } catch (error) {
      console.error("Error generating CCSB form:", error);
      toast({
        title: "Error",
        description: "Failed to generate the CCSB application form.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleGenerateForm = () => {
    if (carrier === "Anthem") {
      generateAnthemForm();
    } else if (carrier === "CCSB") {
      generateCCSBForm();
    } else {
      toast({
        title: "Not Implemented",
        description: `Form generation for ${carrier} is not yet implemented.`,
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="mt-4">
      <Button 
        onClick={handleGenerateForm} 
        disabled={isGenerating}
        variant="secondary"
      >
        {isGenerating ? "Generating..." : `Generate ${carrier} Application Form`}
      </Button>
      <p className="text-sm text-muted-foreground mt-2">
        This will generate a pre-populated PDF application form based on the data you've entered so far.
      </p>
    </div>
  );
}