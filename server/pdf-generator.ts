import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox, rgb } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

interface CompanyData {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
  email?: string;
  employeeCount?: number;
  effectiveDate?: string;
  [key: string]: any;
}

interface OwnerData {
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  phone: string;
  ownershipPercentage: number;
  isEligibleForCoverage?: boolean;
  [key: string]: any;
}

interface ApplicationData {
  selectedCarrier?: string;
  signature?: string;
  submittedAt?: Date;
  [key: string]: any;
}

interface FieldMapping {
  fieldName: string;
  dataSource: string;
  dataField: string;
  pageNumber: number;
  xPosition?: number;
  yPosition?: number;
  width?: number;
  height?: number;
  fieldType: string;
}

export class PDFGenerator {
  private ensureUploadsDirectory() {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const pdfsDir = path.join(uploadsDir, 'pdfs');
    const generatedDir = path.join(uploadsDir, 'generated');
    
    return Promise.all([
      fs.mkdir(uploadsDir, { recursive: true }),
      fs.mkdir(pdfsDir, { recursive: true }),
      fs.mkdir(generatedDir, { recursive: true })
    ]);
  }

  async generateCarrierForm(
    templatePath: string,
    fieldMappings: FieldMapping[],
    companyData: CompanyData,
    ownerData: OwnerData,
    applicationData: ApplicationData
  ): Promise<{ filePath: string; fileName: string }> {
    await this.ensureUploadsDirectory();

    // Read the template PDF
    const templateBytes = await fs.readFile(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    
    // Get the form from the PDF
    const form = pdfDoc.getForm();
    
    // Combine all data sources
    const dataMap = {
      company: companyData,
      owner: ownerData,
      application: applicationData
    };

    // Fill form fields based on mappings
    for (const mapping of fieldMappings) {
      try {
        const sourceData = dataMap[mapping.dataSource as keyof typeof dataMap];
        const value = sourceData?.[mapping.dataField];
        
        if (value !== undefined && value !== null) {
          await this.fillField(form, pdfDoc, mapping, value);
        }
      } catch (error) {
        console.warn(`Failed to fill field ${mapping.fieldName}:`, error);
      }
    }

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${companyData.name}_${applicationData.selectedCarrier}_Application_${timestamp}.pdf`;
    const outputPath = path.join(process.cwd(), 'uploads', 'generated', fileName);

    // Save the filled PDF
    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(outputPath, pdfBytes);

    return {
      filePath: outputPath,
      fileName: fileName
    };
  }

  private async fillField(
    form: PDFForm,
    pdfDoc: PDFDocument,
    mapping: FieldMapping,
    value: any
  ) {
    const stringValue = String(value);

    switch (mapping.fieldType) {
      case 'text':
      case 'date':
        try {
          const field = form.getTextField(mapping.fieldName);
          field.setText(stringValue);
        } catch {
          // If form field doesn't exist, try to add text at coordinates
          if (mapping.xPosition && mapping.yPosition) {
            await this.addTextAtPosition(
              pdfDoc,
              stringValue,
              mapping.xPosition,
              mapping.yPosition,
              mapping.pageNumber || 1
            );
          }
        }
        break;

      case 'checkbox':
        try {
          const field = form.getCheckBox(mapping.fieldName);
          if (value === true || value === 'true' || value === 'yes') {
            field.check();
          } else {
            field.uncheck();
          }
        } catch {
          console.warn(`Checkbox field ${mapping.fieldName} not found`);
        }
        break;

      case 'signature':
        if (mapping.xPosition && mapping.yPosition && stringValue) {
          await this.addSignatureAtPosition(
            pdfDoc,
            stringValue,
            mapping.xPosition,
            mapping.yPosition,
            mapping.pageNumber || 1,
            mapping.width || 150,
            mapping.height || 50
          );
        }
        break;

      default:
        console.warn(`Unknown field type: ${mapping.fieldType}`);
    }
  }

  private async addTextAtPosition(
    pdfDoc: PDFDocument,
    text: string,
    x: number,
    y: number,
    pageNumber: number
  ) {
    const pages = pdfDoc.getPages();
    const page = pages[pageNumber - 1];
    
    if (page) {
      page.drawText(text, {
        x: x,
        y: y,
        size: 10,
        color: rgb(0, 0, 0),
      });
    }
  }

  private async addSignatureAtPosition(
    pdfDoc: PDFDocument,
    signatureData: string,
    x: number,
    y: number,
    pageNumber: number,
    width: number,
    height: number
  ) {
    try {
      const pages = pdfDoc.getPages();
      const page = pages[pageNumber - 1];
      
      if (page && signatureData.startsWith('data:image/')) {
        // Extract base64 data
        const base64Data = signatureData.split(',')[1];
        const imageBytes = Buffer.from(base64Data, 'base64');
        
        // Embed the signature image
        let image;
        if (signatureData.includes('png')) {
          image = await pdfDoc.embedPng(imageBytes);
        } else {
          image = await pdfDoc.embedJpg(imageBytes);
        }
        
        // Draw the signature
        page.drawImage(image, {
          x: x,
          y: y,
          width: width,
          height: height,
        });
      } else if (page) {
        // Fallback to text signature
        page.drawText(signatureData, {
          x: x,
          y: y,
          size: 12,
          color: rgb(0, 0, 0),
        });
      }
    } catch (error) {
      console.error('Error adding signature:', error);
      // Fallback to text
      await this.addTextAtPosition(pdfDoc, signatureData, x, y, pageNumber);
    }
  }

  async extractFormFields(templatePath: string): Promise<string[]> {
    try {
      const templateBytes = await fs.readFile(templatePath);
      const pdfDoc = await PDFDocument.load(templateBytes);
      const form = pdfDoc.getForm();
      
      const fields = form.getFields();
      return fields.map(field => field.getName());
    } catch (error) {
      console.error('Error extracting form fields:', error);
      return [];
    }
  }
}