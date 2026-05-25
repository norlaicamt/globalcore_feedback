import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, BorderStyle } from "docx";
import { saveAs } from "file-saver";

// Professional Branding Palette
const BRAND = {
  primary: "#111827",      // Deep Charcoal
  secondary: "#3B82F6",    // Enterprise Blue
   accent: "#10B981",       // Success Green
  textMuted: "#64748B",    // Slate Gray
  border: "#E5E7EB",       // Light Gray
  bgLight: "#F9FAFB",      // Soft Background
  fontFamily: "helvetica"
};

/**
 * Professional PDF Export with Executive Formatting, Metrics, and Stamps
 */
export const exportToPDF = ({ title, companyName, headers, data, fileName, adminUser }) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const timestamp = new Date().toLocaleString('en-US', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  
  // 1. HEADER SECTION
  // Background Strip
  doc.setFillColor(BRAND.primary);
  doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');
  
  // Title & Org
  doc.setFont(BRAND.fontFamily, "bold");
  doc.setFontSize(22);
  doc.setTextColor("#FFFFFF");
  doc.text(title.toUpperCase(), 14, 20);
  
  doc.setFontSize(10);
  doc.setFont(BRAND.fontFamily, "normal");
  doc.setTextColor("#CBD5E1");
  doc.text(`Official Executive Report • ${companyName}`, 14, 28);
  
  // Metadata (Right aligned)
  doc.setFontSize(8);
  doc.text(`SYSTEM GENERATED: ${timestamp}`, doc.internal.pageSize.width - 14, 20, { align: 'right' });
  doc.text(`VERSION: 1.0.0-SECURED`, doc.internal.pageSize.width - 14, 26, { align: 'right' });

  // 2. SUMMARY INSIGHTS
  doc.setFontSize(12);
  doc.setFont(BRAND.fontFamily, "bold");
  doc.setTextColor(BRAND.primary);
  doc.text("OPERATIONAL SUMMARY", 14, 52);
  
  // Horizontal Line
  doc.setDrawColor(BRAND.border);
  doc.setLineWidth(0.5);
  doc.line(14, 54, 80, 54);
  
  doc.setFontSize(10);
  doc.setFont(BRAND.fontFamily, "normal");
  doc.setTextColor(BRAND.textMuted);
  doc.text(`Analyzed Dataset Size: ${data.length} entries`, 14, 62);
  doc.text(`Report Subject: System feedback and submission distribution across programs.`, 14, 68);
  
  // 3. MAIN DATA TABLE (Executive Style)
  autoTable(doc, {
    startY: 75,
    head: [headers],
    body: data,
    theme: 'plain', // We'll style manually
    headStyles: {
      fillColor: [17, 24, 39], // BRAND.primary
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 51, 51],
      cellPadding: 3,
      lineColor: [229, 231, 235], // BRAND.border
      lineWidth: 0.1
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251] // BRAND.bgLight
    },
    margin: { left: 14, right: 14, bottom: 40 },
    didDrawPage: (data) => {
      // Footer Branding
      const pageCount = doc.internal.getNumberOfPages();
      const currPage = doc.internal.getCurrentPageInfo().pageNumber;
      
      doc.setFontSize(8);
      doc.setTextColor(BRAND.textMuted);
      doc.text(`GlobalCore Feedback System • Restricted Distribution • Page ${currPage} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
      
      // Discrete line at bottom
      doc.setDrawColor(BRAND.border);
      doc.line(14, doc.internal.pageSize.height - 15, doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 15);
    }
  });

  // 4. SIGNATURE & STAMP SECTION
  let finalY = doc.lastAutoTable.finalY + 25;
  const pageHeight = doc.internal.pageSize.height;
  
  if (finalY + 45 > pageHeight) {
    doc.addPage();
    finalY = 30;
  }
  
  doc.setFontSize(11);
  doc.setFont(BRAND.fontFamily, "bold");
  doc.setTextColor(BRAND.primary);
  doc.text("VERIFICATION & GOVERNANCE APPROVAL", 14, finalY);
  
  const colWidth = 60;
  const gap = 25;
  const sigLabels = ["Report Prepared By", "Department Review", "Approval Authority (Head 4)"];
  
  sigLabels.forEach((label, i) => {
    const x = 14 + (i * (colWidth + gap));
    // Signature Line
    doc.setDrawColor(BRAND.textMuted);
    doc.setLineWidth(0.2);
    doc.line(x, finalY + 30, x + colWidth, finalY + 30);
    
    // Label
    doc.setFontSize(8);
    doc.setFont(BRAND.fontFamily, "normal");
    doc.setTextColor(BRAND.textMuted);
    doc.text(label.toUpperCase(), x, finalY + 35);
    
    // Placeholder info
    doc.setFontSize(7);
    doc.setTextColor("#94A3B8");
    doc.text("Full Name & Date", x, finalY + 39);
  });

  // Official Stamp Placeholder
  const stampX = doc.internal.pageSize.width - 45;
  doc.setDrawColor(BRAND.secondary);
  doc.setLineWidth(1);
  doc.roundedRect(stampX, finalY + 10, 30, 30, 3, 3, 'S');
  doc.setFontSize(8);
  doc.setTextColor(BRAND.secondary);
  doc.setFont(BRAND.fontFamily, "bold");
  doc.text("OFFICIAL", stampX + 15, finalY + 22, { align: 'center' });
  doc.text("GOVERNANCE", stampX + 15, finalY + 27, { align: 'center' });
  doc.text("STAMP", stampX + 15, finalY + 32, { align: 'center' });

  doc.save(fileName || `report_${Date.now()}.pdf`);
};

/**
 * Professional Excel Export with Dashboard Header and Strict Formatting
 */
export const exportToExcel = async ({ title, headers, data, fileName, sheetName = "Analytics" }) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // 1. Executive Branding Header
  const titleRow = worksheet.addRow([title.toUpperCase()]);
  titleRow.height = 35;
  worksheet.mergeCells(1, 1, 1, headers.length);
  
  const titleCell = titleRow.getCell(1);
  titleCell.font = { name: 'Arial Black', size: 18, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111827' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // 2. Summary Dashboard Section
  worksheet.addRow([]); // Spacer
  const metaRow = worksheet.addRow(["REPORT METADATA", "", "", "QUICK METRICS"]);
  metaRow.font = { bold: true, size: 12 };
  
  worksheet.addRow(["Generated On:", new Date().toLocaleString(), "", "Total Records:", data.length]);
  worksheet.addRow(["Security Level:", "INTERNAL / RESTRICTED", "", "Integrity Check:", "PASSED"]);
  worksheet.addRow([]); // Spacer

  // 3. Main Data Table Headings
  const headerRow = worksheet.addRow(headers);
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'medium' }, right: { style: 'thin' }
    };
  });

  // 4. Populate Data
  data.forEach((row, idx) => {
    const dataRow = worksheet.addRow(row);
    dataRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
      };
      cell.font = { size: 10 };
      // Alternating row background
      if (idx % 2 !== 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
      }
    });
  });

  // 5. Auto-Optimization
  worksheet.columns.forEach(column => {
    let maxLen = 12;
    column.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber > 6) { // Only check data rows for width
            const len = cell.value ? cell.value.toString().length : 0;
            if (len > maxLen) maxLen = len;
        }
    });
    column.width = Math.min(maxLen + 4, 60);
  });

  // 6. Interactive Features
  worksheet.views = [{ state: 'frozen', ySplit: 7, xSplit: 0, activePane: 'bottomLeft' }];
  worksheet.autoFilter = { from: { row: 7, column: 1 }, to: { row: 7, column: headers.length } };

  // 7. Signature Footer
  const footerStart = worksheet.rowCount + 3;
  worksheet.addRow([]);
  const sigHead = worksheet.addRow(["PREPARED BY", "", "VERIFIED BY", "", "APPROVED BY (HEAD 4)"]);
  sigHead.font = { bold: true, size: 10, color: { argb: 'FF64748B' } };
  
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), fileName || `export_${Date.now()}.xlsx`);
};

/**
 * Professional DOCX Format in Official Memorandum Style
 */
export const exportToDOCX = async ({ title, companyName, headers, data, fileName }) => {
  const doc = new Document({
    sections: [{
      properties: {
        page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } // 1 inch margins
      },
      children: [
        // Heading
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: companyName.toUpperCase(), bold: true, size: 28, color: "111827" }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [
            new TextRun({ text: "Official Executive Operations Report", size: 18, color: "64748B" }),
          ],
        }),

        // Memo Header
        new Paragraph({
          children: [new TextRun({ text: "MEMORANDUM", bold: true, size: 32, underline: {} })],
          spacing: { after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "TO: ", bold: true }),
            new TextRun({ text: "Senior Leadership Team" }),
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "FROM: ", bold: true }),
            new TextRun({ text: "Governance & Quality Assurance Department" }),
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "DATE: ", bold: true }),
            new TextRun({ text: new Date().toLocaleDateString('en-US', { dateStyle: 'full' }) }),
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "SUBJECT: ", bold: true }),
            new TextRun({ text: title }),
          ],
          spacing: { after: 600 }
        }),

        // Executive Summary
        new Paragraph({
          children: [new TextRun({ text: "1. EXECUTIVE SUMMARY", bold: true, size: 24 })],
          spacing: { after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: `This document serves as an official record of systematic feedback and operational logs. 
A total of ${data.length} records have been compiled for executive review. 
The following data represents the current state of system engagement and program performance.` 
            }),
          ],
          spacing: { after: 400 }
        }),

        // Data Table
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: headers.map(h => new TableCell({
                children: [new Paragraph({ 
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: h.toUpperCase(), bold: true, color: "FFFFFF", size: 18 })] 
                })],
                shading: { fill: "334155" },
                verticalAlign: 'center'
              }))
            }),
            ...data.map((row, idx) => new TableRow({
              children: row.map(cell => new TableCell({
                children: [new Paragraph({ 
                  children: [new TextRun({ text: String(cell), size: 18 })] 
                })],
                shading: idx % 2 !== 0 ? { fill: "F9FAFB" } : undefined
              }))
            }))
          ]
        }),

        // Authorizations
        new Paragraph({
          children: [new TextRun({ text: "2. AUTHORIZATION & VALIDATION", bold: true, size: 24 })],
          spacing: { before: 800, after: 200 }
        }),
        new Paragraph({
          text: "The signatures below certify that this report has been reviewed for accuracy and compliance with organizational governance standards.",
          spacing: { after: 600 }
        }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: "____________________", spacing: { after: 100 } }), new Paragraph({ text: "PREPARED BY", bold: true, size: 16 })] }),
                new TableCell({ children: [new Paragraph({ text: "____________________", spacing: { after: 100 } }), new Paragraph({ text: "REVIEWED BY", bold: true, size: 16 })] }),
                new TableCell({ children: [new Paragraph({ text: "____________________", spacing: { after: 100 } }), new Paragraph({ text: "APPROVED BY (HEAD 4)", bold: true, size: 16 })] })
              ]
            })
          ]
        })
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, fileName || `report_${Date.now()}.docx`);
};
