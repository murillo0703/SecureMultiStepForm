import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { ApplicationLogger } from './code-quality-utilities';

/**
 * PDF Generation System for Form Submissions
 * Creates professional PDF documents for insurance enrollment forms
 */

interface FormSubmissionData {
  submissionId: string;
  submissionType: string;
  submittedAt: Date;
  formData: Record<string, any>;
  userInfo: {
    name: string;
    email: string;
    phone?: string;
  };
}

interface PDFGenerationOptions {
  includeHeader?: boolean;
  includeFooter?: boolean;
  watermark?: string;
  template?: 'standard' | 'professional' | 'compact';
}

export class PDFGenerator {
  private static readonly FONTS = {
    regular: 'Helvetica',
    bold: 'Helvetica-Bold',
    italic: 'Helvetica-Oblique'
  };

  private static readonly COLORS = {
    primary: '#2563eb',
    secondary: '#64748b',
    text: '#1e293b',
    border: '#e2e8f0',
    background: '#f8fafc'
  };

  /**
   * Generate PDF for form submission
   */
  static async generateSubmissionPDF(
    submissionData: FormSubmissionData,
    options: PDFGenerationOptions = {}
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
          info: {
            Title: `${submissionData.submissionType} Submission - ${submissionData.submissionId}`,
            Author: 'Murillo Insurance Benefits Submission Center',
            Subject: `Insurance ${submissionData.submissionType}`,
            Creator: 'Murillo Insurance System',
            Producer: 'Murillo Insurance System',
            CreationDate: submissionData.submittedAt,
            ModDate: new Date()
          }
        });

        const chunks: Buffer[] = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Generate PDF content
        this.generatePDFContent(doc, submissionData, options);
        
        doc.end();
      } catch (error) {
        ApplicationLogger.error('PDF generation failed', error as Error);
        reject(error);
      }
    });
  }

  /**
   * Generate the main PDF content
   */
  private static generatePDFContent(
    doc: PDFKit.PDFDocument,
    data: FormSubmissionData,
    options: PDFGenerationOptions
  ): void {
    let yPosition = 50;

    // Header
    if (options.includeHeader !== false) {
      yPosition = this.addHeader(doc, data, yPosition);
    }

    // Submission details
    yPosition = this.addSubmissionDetails(doc, data, yPosition);

    // Form data sections
    yPosition = this.addFormDataSections(doc, data, yPosition);

    // Footer
    if (options.includeFooter !== false) {
      this.addFooter(doc, data);
    }

    // Watermark
    if (options.watermark) {
      this.addWatermark(doc, options.watermark);
    }
  }

  /**
   * Add document header
   */
  private static addHeader(
    doc: PDFKit.PDFDocument,
    data: FormSubmissionData,
    yPosition: number
  ): number {
    // Company logo area (placeholder for future logo integration)
    doc.rect(50, yPosition, 100, 60)
       .stroke(this.COLORS.border);

    doc.fontSize(8)
       .fillColor(this.COLORS.secondary)
       .text('LOGO', 75, yPosition + 25);

    // Title
    doc.fontSize(24)
       .fillColor(this.COLORS.primary)
       .font(this.FONTS.bold)
       .text('Murillo Insurance Benefits', 170, yPosition + 10);

    doc.fontSize(16)
       .fillColor(this.COLORS.text)
       .font(this.FONTS.regular)
       .text('Submission Center', 170, yPosition + 40);

    // Submission type
    doc.fontSize(18)
       .fillColor(this.COLORS.primary)
       .font(this.FONTS.bold)
       .text(
         `${data.submissionType.toUpperCase()} SUBMISSION`,
         50,
         yPosition + 80
       );

    return yPosition + 120;
  }

  /**
   * Add submission details section
   */
  private static addSubmissionDetails(
    doc: PDFKit.PDFDocument,
    data: FormSubmissionData,
    yPosition: number
  ): number {
    const startY = yPosition;

    // Section background
    doc.rect(50, yPosition, 495, 100)
       .fillAndStroke(this.COLORS.background, this.COLORS.border);

    yPosition += 15;

    // Details grid
    const leftColumn = 70;
    const rightColumn = 320;

    doc.fontSize(12)
       .fillColor(this.COLORS.text)
       .font(this.FONTS.bold);

    // Left column
    doc.text('Submission ID:', leftColumn, yPosition);
    doc.font(this.FONTS.regular)
       .text(data.submissionId, leftColumn + 90, yPosition);

    doc.font(this.FONTS.bold)
       .text('Submitted By:', leftColumn, yPosition + 20);
    doc.font(this.FONTS.regular)
       .text(data.userInfo.name, leftColumn + 90, yPosition + 20);

    doc.font(this.FONTS.bold)
       .text('Email:', leftColumn, yPosition + 40);
    doc.font(this.FONTS.regular)
       .text(data.userInfo.email, leftColumn + 90, yPosition + 40);

    // Right column
    doc.font(this.FONTS.bold)
       .text('Submission Date:', rightColumn, yPosition);
    doc.font(this.FONTS.regular)
       .text(
         data.submittedAt.toLocaleDateString('en-US', {
           year: 'numeric',
           month: 'long',
           day: 'numeric',
           hour: '2-digit',
           minute: '2-digit'
         }),
         rightColumn + 100,
         yPosition
       );

    doc.font(this.FONTS.bold)
       .text('Type:', rightColumn, yPosition + 20);
    doc.font(this.FONTS.regular)
       .text(data.submissionType, rightColumn + 100, yPosition + 20);

    if (data.userInfo.phone) {
      doc.font(this.FONTS.bold)
         .text('Phone:', rightColumn, yPosition + 40);
      doc.font(this.FONTS.regular)
         .text(data.userInfo.phone, rightColumn + 100, yPosition + 40);
    }

    return startY + 120;
  }

  /**
   * Add form data sections
   */
  private static addFormDataSections(
    doc: PDFKit.PDFDocument,
    data: FormSubmissionData,
    yPosition: number
  ): number {
    const formData = data.formData;
    const sections = this.organizeFormData(formData);

    for (const [sectionTitle, fields] of Object.entries(sections)) {
      // Check if we need a new page
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      yPosition = this.addSection(doc, sectionTitle, fields, yPosition);
      yPosition += 20; // Space between sections
    }

    return yPosition;
  }

  /**
   * Add a data section to the PDF
   */
  private static addSection(
    doc: PDFKit.PDFDocument,
    title: string,
    fields: Array<{ label: string; value: any }>,
    yPosition: number
  ): number {
    const startY = yPosition;

    // Section title
    doc.fontSize(14)
       .fillColor(this.COLORS.primary)
       .font(this.FONTS.bold)
       .text(title, 50, yPosition);

    yPosition += 25;

    // Section border
    const sectionHeight = fields.length * 25 + 20;
    doc.rect(50, yPosition - 5, 495, sectionHeight)
       .stroke(this.COLORS.border);

    // Fields
    doc.fontSize(10)
       .fillColor(this.COLORS.text);

    for (const field of fields) {
      if (yPosition > 750) {
        doc.addPage();
        yPosition = 50;
      }

      doc.font(this.FONTS.bold)
         .text(`${field.label}:`, 70, yPosition, { width: 150 });

      doc.font(this.FONTS.regular)
         .text(this.formatFieldValue(field.value), 230, yPosition, { 
           width: 300,
           lineGap: 2
         });

      yPosition += 25;
    }

    return yPosition + 10;
  }

  /**
   * Add footer to the document
   */
  private static addFooter(
    doc: PDFKit.PDFDocument,
    data: FormSubmissionData
  ): void {
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 80;

    // Footer line
    doc.moveTo(50, footerY)
       .lineTo(545, footerY)
       .stroke(this.COLORS.border);

    // Footer content
    doc.fontSize(8)
       .fillColor(this.COLORS.secondary)
       .font(this.FONTS.regular);

    doc.text(
      'This document was generated automatically by the Murillo Insurance Benefits Submission Center.',
      50,
      footerY + 10
    );

    doc.text(
      `Generated on ${new Date().toLocaleDateString('en-US')} | Submission ID: ${data.submissionId}`,
      50,
      footerY + 25
    );

    doc.text(
      'For questions or support, please contact our team.',
      50,
      footerY + 40
    );

    // Page numbers
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(8)
         .fillColor(this.COLORS.secondary)
         .text(
           `Page ${i + 1} of ${pageCount}`,
           450,
           footerY + 25,
           { align: 'right' }
         );
    }
  }

  /**
   * Add watermark to the document
   */
  private static addWatermark(
    doc: PDFKit.PDFDocument,
    watermarkText: string
  ): void {
    const pageCount = doc.bufferedPageRange().count;
    
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      
      doc.save();
      doc.rotate(45, { origin: [300, 400] });
      doc.fontSize(60)
         .fillColor(this.COLORS.border)
         .font(this.FONTS.bold)
         .text(watermarkText, 150, 350, {
           align: 'center',
           opacity: 0.1
         });
      doc.restore();
    }
  }

  /**
   * Organize form data into logical sections
   */
  private static organizeFormData(formData: Record<string, any>): Record<string, Array<{ label: string; value: any }>> {
    const sections: Record<string, Array<{ label: string; value: any }>> = {};

    // Define section mappings
    const sectionMappings = {
      'Company Information': [
        'companyName', 'companyAddress', 'companyCity', 'companyState', 
        'companyZip', 'companyPhone', 'taxId', 'industry', 'employeeCount'
      ],
      'Contact Information': [
        'contactName', 'contactTitle', 'contactEmail', 'contactPhone',
        'initiatorName', 'initiatorEmail', 'initiatorPhone'
      ],
      'Owner Information': [
        'ownerName', 'ownerEmail', 'ownerPhone', 'ownerAddress',
        'ownershipPercentage', 'isOwner'
      ],
      'Coverage Details': [
        'requestedCoverage', 'coverageType', 'effectiveDate',
        'priorCoverage', 'currentCarrier'
      ],
      'Additional Information': []
    };

    // Populate sections
    for (const [sectionName, fieldNames] of Object.entries(sectionMappings)) {
      const sectionFields: Array<{ label: string; value: any }> = [];

      for (const fieldName of fieldNames) {
        if (formData[fieldName] !== undefined && formData[fieldName] !== null && formData[fieldName] !== '') {
          sectionFields.push({
            label: this.formatFieldLabel(fieldName),
            value: formData[fieldName]
          });
        }
      }

      if (sectionFields.length > 0) {
        sections[sectionName] = sectionFields;
      }
    }

    // Add remaining fields to "Additional Information"
    const usedFields = new Set(Object.values(sectionMappings).flat());
    const additionalFields: Array<{ label: string; value: any }> = [];

    for (const [fieldName, value] of Object.entries(formData)) {
      if (!usedFields.has(fieldName) && value !== undefined && value !== null && value !== '') {
        additionalFields.push({
          label: this.formatFieldLabel(fieldName),
          value
        });
      }
    }

    if (additionalFields.length > 0) {
      sections['Additional Information'] = additionalFields;
    }

    return sections;
  }

  /**
   * Format field labels for display
   */
  private static formatFieldLabel(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Format field values for display
   */
  private static formatFieldValue(value: any): string {
    if (value === null || value === undefined) {
      return 'Not provided';
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }

    if (Array.isArray(value)) {
      return value.join(', ');
    }

    return String(value);
  }

  /**
   * Save PDF to file system
   */
  static async savePDFToFile(
    pdfBuffer: Buffer,
    filename: string,
    directory: string = 'uploads/pdfs'
  ): Promise<string> {
    try {
      // Ensure directory exists
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }

      const filePath = path.join(directory, filename);
      fs.writeFileSync(filePath, pdfBuffer);

      ApplicationLogger.info('PDF saved to file system', { filePath });
      return filePath;
    } catch (error) {
      ApplicationLogger.error('Failed to save PDF to file system', error as Error);
      throw error;
    }
  }
}

export default PDFGenerator;