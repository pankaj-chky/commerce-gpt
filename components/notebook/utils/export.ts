"use client";

import { saveAs } from "file-saver";

/**
 * Export the notebook content as PDF using browser print or html2canvas+jspdf
 */
export async function exportAsPDF(element: HTMLElement | null, filename: string = "notebook") {
  if (!element) return;
  
  try {
    const { default: html2canvas } = await import("html2canvas");
    const { default: jsPDF } = await import("jspdf");
    
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });
    
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;
    
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;
    
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }
    
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error("PDF export error:", error);
    // Fallback to print
    window.print();
  }
}

/**
 * Export the notebook content as PNG image
 */
export async function exportAsPNG(element: HTMLElement | null, filename: string = "notebook") {
  if (!element) return;
  
  try {
    const { default: html2canvas } = await import("html2canvas");
    
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });
    
    canvas.toBlob((blob) => {
      if (blob) {
        saveAs(blob, `${filename}.png`);
      }
    }, "image/png");
  } catch (error) {
    console.error("PNG export error:", error);
  }
}

/**
 * Export the notebook content as JPG image
 */
export async function exportAsJPG(element: HTMLElement | null, filename: string = "notebook") {
  if (!element) return;
  
  try {
    const { default: html2canvas } = await import("html2canvas");
    
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });
    
    canvas.toBlob((blob) => {
      if (blob) {
        saveAs(blob, `${filename}.jpg`);
      }
    }, "image/jpeg", 0.95);
  } catch (error) {
    console.error("JPG export error:", error);
  }
}

/**
 * Export the notebook content as DOCX (using a simple HTML-to-DOCX approach)
 */
export async function exportAsDOCX(content: string, filename: string = "notebook") {
  // Create a simple HTML document that Word can open
  const html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' 
          xmlns:w='urn:schemas-microsoft-com:office:word' 
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>Notebook</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        body { font-family: 'Caveat', cursive; font-size: 14pt; line-height: 1.5; }
        table { border-collapse: collapse; width: 100%; }
        td, th { border: 1px solid #333; padding: 4px 8px; }
        h1, h2, h3 { font-family: 'Inter', sans-serif; }
      </style>
    </head>
    <body>
      ${content.replace(/\n/g, "<br>")}
    </body>
    </html>
  `;
  
  const blob = new Blob([html], { type: "application/msword" });
  saveAs(blob, `${filename}.doc`);
}

/**
 * Export the notebook content as Excel (CSV format for tabular data)
 */
export async function exportAsExcel(content: string, filename: string = "notebook") {
  // Parse tabular content into CSV
  const lines = content.split("\n").filter((l) => l.trim());
  const csvLines: string[] = [];
  
  for (const line of lines) {
    // Split by pipe or multiple spaces
    const cells = line
      .split(/\s{2,}|\|/)
      .map((c) => c.trim())
      .filter((c) => c);
    
    if (cells.length > 0) {
      // Escape quotes and wrap in quotes
      const csvRow = cells
        .map((c) => `"${c.replace(/"/g, '""')}"`)
        .join(",");
      csvLines.push(csvRow);
    }
  }
  
  const csv = csvLines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  saveAs(blob, `${filename}.csv`);
}

/**
 * Print the notebook content
 */
export function printNotebook() {
  window.print();
}