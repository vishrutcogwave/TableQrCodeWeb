'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { ApiService } from '@/services/api';
import { OrderSubmitRequest } from '@/types';
import { Download, ChevronDown, ChevronUp } from 'lucide-react';

interface CompanyInfo {
  Company_Name: string;
  Company_code: number;
  StartYear: string;
  Address1: string;
  Address2: string;
  Phone_number: string;
  Mob_number: string;
  OwnerName: string;
  Owner_Number: number;
  Fax_number: number;
  Email_id: string;
  Tin_no: string;
  Licence_number: string | null;
  Branch_code: string;
  STDCODE: string;
  Logo: string;
}

interface TaxItem {
  TaxName: string;
  TaxableAmount: number;
  TaxAmount: number;
}

interface BillDataResponse {
  Cart: OrderSubmitRequest;
  Tax: any;
  BillingType: string;
  SubBillingType: string;
  paymentresponse: {
    success: boolean;
    code: string;
    message: string;
    data: {
      transactionId: string;
      amount: number;
      merchantId: string;
      providerReferenceId: string;
      qrString: string;
    };
  };
  billdetails: {
    Billno: string;
    BillDate: string;
    BillTime: string;
    OutletName: string;
    TokenNo: string | null;
    OrderId: string;
  };
}

export default function BillViewPage() {
  const params = useParams();
  const orderId = params.orderId as string; // OrderId from billdetails
  const [billData, setBillData] = useState<BillDataResponse | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  
  // Collapsible section states
  const [isBrandOpen, setIsBrandOpen] = useState(false);
  const [isBillDetailsOpen, setIsBillDetailsOpen] = useState(false);
  const [isItemDetailsOpen, setIsItemDetailsOpen] = useState(false);

  useEffect(() => {
    const fetchBillData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch bill data and company info in parallel
        const [billResponse, companyResponse] = await Promise.all([
          ApiService.getBillNoByOrderId(orderId),
          ApiService.getCompanyInfoBill()
        ]);

        setBillData(billResponse);
        setCompanyInfo(companyResponse);
      } catch (err) {
        console.error('Error fetching bill data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load bill');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchBillData();
    }
  }, [orderId]);

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;

    setIsGeneratingPDF(true);
    
    // Store original collapsible states
    const originalBrandOpen = isBrandOpen;
    const originalBillDetailsOpen = isBillDetailsOpen;
    const originalItemDetailsOpen = isItemDetailsOpen;
    
    // Expand all sections for PDF generation
    setIsBrandOpen(true);
    setIsBillDetailsOpen(true);
    setIsItemDetailsOpen(true);
    
    // Wait for state updates and DOM re-render
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Declare variables at function scope for error handling
    const disabledSheets: Array<{ node: Node; parent: Node | null }> = [];
    let rgbStyle: HTMLStyleElement | null = null;
    const originalStyles = new Map<HTMLElement, { color?: string; backgroundColor?: string; borderColor?: string }>();
    let originalWidth = '';
    let originalMaxWidth = '';
    
    // Store original dimensions at the start
    if (receiptRef.current) {
      originalWidth = receiptRef.current.style.width || '';
      originalMaxWidth = receiptRef.current.style.maxWidth || '';
    }
    
    try {
      // Dynamically import jspdf and html2canvas
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas')
      ]);

      // Helper function to convert any color format to RGB using canvas
      const colorToRgb = (colorValue: string): string => {
        // If already RGB/RGBA/hex, return as is
        if (colorValue.startsWith('rgb') || colorValue.startsWith('#') || colorValue === 'transparent') {
          return colorValue;
        }
        
        try {
          // Create a temporary element to get computed RGB value
          const tempDiv = document.createElement('div');
          tempDiv.style.color = colorValue;
          tempDiv.style.position = 'absolute';
          tempDiv.style.visibility = 'hidden';
          document.body.appendChild(tempDiv);
          
          const computedColor = window.getComputedStyle(tempDiv).color;
          document.body.removeChild(tempDiv);
          
          // If computed color is RGB, return it
          if (computedColor.startsWith('rgb')) {
            return computedColor;
          }
          
          // Fallback: try canvas method
          const canvas = document.createElement('canvas');
          canvas.width = 1;
          canvas.height = 1;
          const ctx = canvas.getContext('2d');
          if (!ctx) return 'rgb(0, 0, 0)';
          
          ctx.fillStyle = colorValue;
          ctx.fillRect(0, 0, 1, 1);
          const imageData = ctx.getImageData(0, 0, 1, 1);
          const [r, g, b, a] = imageData.data;
          
          if (a === 0) return 'transparent';
          return `rgb(${r}, ${g}, ${b})`;
        } catch (e) {
          // If all else fails, return black
          return 'rgb(0, 0, 0)';
        }
      };

      // Helper function to recursively set explicit RGB colors on all elements
      const setExplicitColors = (element: HTMLElement) => {
        const computedStyle = window.getComputedStyle(element);
        
        // Convert and set color
        try {
          const colorValue = computedStyle.color;
          const rgbColor = colorToRgb(colorValue);
          if (rgbColor !== 'transparent') {
            element.style.setProperty('color', rgbColor, 'important');
          }
        } catch (e) {
          element.style.setProperty('color', 'rgb(0, 0, 0)', 'important');
        }
        
        // Convert and set backgroundColor
        try {
          const bgColorValue = computedStyle.backgroundColor;
          const rgbBgColor = colorToRgb(bgColorValue);
          if (rgbBgColor !== 'transparent') {
            element.style.setProperty('background-color', rgbBgColor, 'important');
          } else if (element.classList.contains('bg-white') || element.getAttribute('data-receipt')) {
            element.style.setProperty('background-color', 'rgb(255, 255, 255)', 'important');
          }
        } catch (e) {
          if (element.classList.contains('bg-white') || element.getAttribute('data-receipt')) {
            element.style.setProperty('background-color', 'rgb(255, 255, 255)', 'important');
          } else if (element.classList.contains('bg-slate-50')) {
            element.style.setProperty('background-color', 'rgb(248, 250, 252)', 'important');
          }
        }
        
        // Convert and set borderColor
        try {
          const borderColorValue = computedStyle.borderColor;
          if (borderColorValue && borderColorValue !== 'rgba(0, 0, 0, 0)') {
            const rgbBorderColor = colorToRgb(borderColorValue);
            if (rgbBorderColor !== 'transparent') {
              element.style.setProperty('border-color', rgbBorderColor, 'important');
            }
          }
        } catch (e) {
          // Ignore border color errors
        }
        
        // Recursively process children
        Array.from(element.children).forEach((child) => {
          if (child instanceof HTMLElement) {
            setExplicitColors(child);
          }
        });
      };

      // Helper to store original styles
      const storeOriginalStyles = (element: HTMLElement) => {
        const computedStyle = window.getComputedStyle(element);
        originalStyles.set(element, {
          color: element.style.color || undefined,
          backgroundColor: element.style.backgroundColor || undefined,
          borderColor: element.style.borderColor || undefined
        });
        Array.from(element.children).forEach((child) => {
          if (child instanceof HTMLElement) {
            storeOriginalStyles(child);
          }
        });
      };

      // Store original styles
      storeOriginalStyles(receiptRef.current);

      // Set explicit colors on the actual element BEFORE calling html2canvas
      // This ensures computed styles return RGB values
      setExplicitColors(receiptRef.current);

      // Temporarily disable stylesheets that might contain lab() colors
      // This prevents html2canvas from parsing them
      try {
        Array.from(document.styleSheets).forEach((sheet) => {
          try {
            if (sheet.ownerNode && sheet.ownerNode.parentNode) {
              disabledSheets.push({ node: sheet.ownerNode, parent: sheet.ownerNode.parentNode });
              sheet.ownerNode.parentNode.removeChild(sheet.ownerNode);
            }
          } catch (e) {
            // Ignore cross-origin errors
          }
        });
      } catch (e) {
        // Ignore errors
      }

      // Inject RGB-only style to replace disabled stylesheets
      rgbStyle = document.createElement('style');
      rgbStyle.id = 'pdf-rgb-override';
      rgbStyle.textContent = `
        * { color: rgb(0, 0, 0) !important; background-color: rgb(255, 255, 255) !important; border-color: rgb(0, 0, 0) !important; }
        [data-receipt] { background-color: rgb(255, 255, 255) !important; }
        .bg-white { background-color: rgb(255, 255, 255) !important; }
        .bg-slate-50 { background-color: rgb(248, 250, 252) !important; }
        .text-slate-600 { color: rgb(71, 85, 105) !important; }
        .text-red-600 { color: rgb(220, 38, 38) !important; }
        .text-green-600 { color: rgb(22, 163, 74) !important; }
        .text-blue-600 { color: rgb(37, 99, 235) !important; }
        .border-slate-200, .border-slate-300, .border-slate-400 { border-color: rgb(148, 163, 184) !important; }
      `;
      document.head.appendChild(rgbStyle);

      // Set fixed width for PDF generation only (original dimensions already stored above)
      receiptRef.current.style.width = '604px';
      receiptRef.current.style.maxWidth = '604px';

      // Wait a bit for styles to apply and ensure layout is stable
      await new Promise(resolve => setTimeout(resolve, 300));

      let canvas;
      try {
        canvas = await html2canvas(receiptRef.current, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          allowTaint: false,
          width: receiptRef.current.offsetWidth,
          height: receiptRef.current.scrollHeight,
          windowWidth: receiptRef.current.offsetWidth,
          windowHeight: receiptRef.current.scrollHeight,
          onclone: (clonedDoc) => {
            // Remove all stylesheets from cloned document to prevent lab() parsing
            try {
              const stylesheets = Array.from(clonedDoc.styleSheets);
              stylesheets.forEach((sheet) => {
                try {
                  if (sheet.ownerNode && sheet.ownerNode.parentNode) {
                    sheet.ownerNode.parentNode.removeChild(sheet.ownerNode);
                  }
                } catch (e) {
                  // Ignore cross-origin errors
                }
              });
            } catch (e) {
              // Ignore errors when removing stylesheets
            }

            // Inject RGB-only style to replace removed stylesheets with exact styling
            const style = clonedDoc.createElement('style');
            style.textContent = `
              * { 
                color: rgb(0, 0, 0) !important; 
                background-color: rgb(255, 255, 255) !important; 
                border-color: rgb(0, 0, 0) !important; 
                box-sizing: border-box !important;
                margin: 0;
                padding: 0;
              }
              body {
                margin: 0 !important;
                padding: 0 !important;
                background-color: rgb(255, 255, 255) !important;
              }
              [data-receipt] { 
                background-color: rgb(255, 255, 255) !important; 
                width: 604px !important;
                max-width: 604px !important;
                margin: 0 auto !important;
                padding: 32px !important;
                font-family: monospace !important;
                color: rgb(0, 0, 0) !important;
              }
              /* Grid system for proper alignment */
              .grid { display: grid !important; }
              .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
              .grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)) !important; }
              .col-span-6 { grid-column: span 6 / span 6 !important; }
              .col-span-5 { grid-column: span 5 / span 5 !important; }
              .col-span-3 { grid-column: span 3 / span 3 !important; }
              .col-span-2 { grid-column: span 2 / span 2 !important; }
              .gap-2 { gap: 0.5rem !important; }
              .gap-x-4 { column-gap: 1rem !important; }
              .gap-y-1 { row-gap: 0.25rem !important; }
              .flex { display: flex !important; }
              .justify-between { justify-content: space-between !important; }
              .justify-end { justify-content: flex-end !important; }
              .text-center { text-align: center !important; }
              .text-right { text-align: right !important; }
              .text-left { text-align: left !important; }
              .text-sm { font-size: 0.875rem !important; line-height: 1.25rem !important; }
              .text-lg { font-size: 1.125rem !important; line-height: 1.75rem !important; }
              .text-xl { font-size: 1.25rem !important; line-height: 1.75rem !important; }
              .text-2xl { font-size: 1.5rem !important; line-height: 2rem !important; }
              .font-bold { font-weight: 700 !important; }
              .font-semibold { font-weight: 600 !important; }
              .mb-2 { margin-bottom: 0.5rem !important; }
              .mb-3 { margin-bottom: 0.75rem !important; }
              .mb-4 { margin-bottom: 1rem !important; }
              .mb-6 { margin-bottom: 1.5rem !important; }
              .mt-1 { margin-top: 0.25rem !important; }
              .mt-2 { margin-top: 0.5rem !important; }
              .my-2 { margin-top: 0.5rem !important; margin-bottom: 0.5rem !important; }
              .my-4 { margin-top: 1rem !important; margin-bottom: 1rem !important; }
              .space-y-1 > * + * { margin-top: 0.25rem !important; }
              .space-y-2 > * + * { margin-top: 0.5rem !important; }
              .border-t { border-top-width: 1px !important; }
              .border-b { border-bottom-width: 1px !important; }
              .border { border-width: 1px !important; }
              .border-dotted { border-style: dotted !important; }
              .border-slate-200 { border-color: rgb(226, 232, 240) !important; }
              .border-slate-300 { border-color: rgb(203, 213, 225) !important; }
              .border-slate-400 { border-color: rgb(148, 163, 184) !important; }
              .pb-2 { padding-bottom: 0.5rem !important; }
              .pb-4 { padding-bottom: 1rem !important; }
              .px-4 { padding-left: 1rem !important; padding-right: 1rem !important; }
              .py-2 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
              .py-3 { padding-top: 0.75rem !important; padding-bottom: 0.75rem !important; }
              .p-4 { padding: 1rem !important; }
              .rounded-lg { border-radius: 0.5rem !important; }
              .overflow-hidden { overflow: hidden !important; }
              .bg-white { background-color: rgb(255, 255, 255) !important; }
              .bg-slate-50 { background-color: rgb(248, 250, 252) !important; }
              .text-slate-600 { color: rgb(71, 85, 105) !important; }
              .text-slate-900 { color: rgb(15, 23, 42) !important; }
              .text-white { color: rgb(255, 255, 255) !important; }
              .text-red-600 { color: rgb(220, 38, 38) !important; }
              .text-green-600 { color: rgb(22, 163, 74) !important; }
              .text-blue-600 { color: rgb(37, 99, 235) !important; }
              .border-slate-200, .border-slate-300, .border-slate-400 { border-color: rgb(148, 163, 184) !important; }
              /* Primary blue for Total Bill Paid header */
              [style*="background-color: rgb(4, 118, 177)"], [style*="background-color:#0476b1"] {
                background-color: rgb(4, 118, 177) !important;
              }
              img { 
                max-width: 100% !important; 
                height: auto !important; 
                object-fit: contain !important; 
              }
              /* Hide collapsible UI elements and PDF download button in PDF */
              [data-collapsible-button], [data-chevron-icon], [data-pdf-download-button] {
                display: none !important;
              }
              /* Ensure collapsible content is visible in PDF */
              [data-collapsible-content] {
                display: block !important;
              }
              /* Convert collapsible sections to simple sections in PDF */
              [data-collapsible-section] {
                border: 1px solid rgb(226, 232, 240) !important;
                border-radius: 0.5rem !important;
                margin-bottom: 0.75rem !important;
              }
            `;
            clonedDoc.head.appendChild(style);
            
            // Force expand all collapsible sections in cloned document
            const clonedButtons = clonedDoc.querySelectorAll('button[data-collapsible-button]');
            clonedButtons.forEach((button) => {
              const nextSibling = button.nextElementSibling;
              if (nextSibling && nextSibling instanceof HTMLElement && nextSibling.hasAttribute('data-collapsible-content')) {
                nextSibling.style.display = 'block';
              }
            });
            
            // Hide all collapsible UI elements (buttons, chevrons, download button) in PDF
            const pdfHideElements = clonedDoc.querySelectorAll('[data-collapsible-button], [data-chevron-icon]');
            pdfHideElements.forEach((el) => {
              if (el instanceof HTMLElement) {
                el.style.display = 'none';
              }
            });
            
            // Hide PDF download button in PDF
            const downloadButtons = clonedDoc.querySelectorAll('[data-pdf-download-button]');
            downloadButtons.forEach((button) => {
              if (button instanceof HTMLElement) {
                button.style.display = 'none';
              }
            });
            
            // Convert collapsible section buttons to simple headers in PDF
            const collapsibleSections = clonedDoc.querySelectorAll('[data-collapsible-section]');
            collapsibleSections.forEach((section) => {
              if (section instanceof HTMLElement) {
                const button = section.querySelector('[data-collapsible-button]');
                if (button) {
                  const title = button.querySelector('span');
                  if (title) {
                    // Create a simple header div to replace the button
                    const header = clonedDoc.createElement('div');
                    header.style.cssText = 'padding: 1rem; font-weight: 600; color: rgb(15, 23, 42); border-bottom: 1px solid rgb(226, 232, 240);';
                    header.textContent = title.textContent || '';
                    button.parentNode?.replaceChild(header, button);
                  }
                }
              }
            });

            // Also set explicit RGB colors on all elements in cloned document
            const clonedElement = clonedDoc.querySelector('[data-receipt]');
            if (clonedElement instanceof HTMLElement) {
              // Ensure fixed width and styling
              clonedElement.style.width = '604px';
              clonedElement.style.maxWidth = '604px';
              clonedElement.style.margin = '0 auto';
              clonedElement.style.padding = '32px';
              clonedElement.style.backgroundColor = 'rgb(255, 255, 255)';
              clonedElement.style.color = 'rgb(0, 0, 0)';
              clonedElement.style.fontFamily = 'monospace';
              setExplicitColors(clonedElement);
            }
          }
        });
      } catch (html2canvasError: any) {
        // If error is related to lab() colors, try with disabled stylesheets
        if (html2canvasError?.message?.includes('lab') || html2canvasError?.message?.includes('color')) {
          console.warn('html2canvas lab() color error detected, trying workaround...');
          
          // Temporarily disable all stylesheets
          const disabledSheets: Array<{ node: Node; parent: Node | null }> = [];
          try {
            Array.from(document.styleSheets).forEach((sheet) => {
              try {
                if (sheet.ownerNode && sheet.ownerNode.parentNode) {
                  disabledSheets.push({ node: sheet.ownerNode, parent: sheet.ownerNode.parentNode });
                  sheet.ownerNode.parentNode.removeChild(sheet.ownerNode);
                }
              } catch (e) {
                // Ignore cross-origin errors
              }
            });
          } catch (e) {
            // Ignore errors
          }

          // Inject RGB-only style with grid system
          const rgbStyle = document.createElement('style');
          rgbStyle.id = 'pdf-rgb-override';
          rgbStyle.textContent = `
            * { 
              color: rgb(0, 0, 0) !important; 
              background-color: rgb(255, 255, 255) !important; 
              box-sizing: border-box !important;
            }
            [data-receipt] { 
              background-color: rgb(255, 255, 255) !important; 
              width: 604px !important;
              max-width: 604px !important;
            }
            .grid { display: grid !important; }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
            .grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)) !important; }
            .col-span-6 { grid-column: span 6 / span 6 !important; }
            .col-span-5 { grid-column: span 5 / span 5 !important; }
            .col-span-3 { grid-column: span 3 / span 3 !important; }
            .col-span-2 { grid-column: span 2 / span 2 !important; }
            .gap-2 { gap: 0.5rem !important; }
            .gap-x-4 { column-gap: 1rem !important; }
            .gap-y-1 { row-gap: 0.25rem !important; }
            .flex { display: flex !important; }
            .justify-between { justify-content: space-between !important; }
            .text-center { text-align: center !important; }
            .text-right { text-align: right !important; }
            .bg-white { background-color: rgb(255, 255, 255) !important; }
            .bg-slate-50 { background-color: rgb(248, 250, 252) !important; }
            .text-slate-600 { color: rgb(71, 85, 105) !important; }
            .text-slate-900 { color: rgb(15, 23, 42) !important; }
            .text-white { color: rgb(255, 255, 255) !important; }
            .text-red-600 { color: rgb(220, 38, 38) !important; }
            .text-green-600 { color: rgb(22, 163, 74) !important; }
            .text-blue-600 { color: rgb(37, 99, 235) !important; }
            .border-slate-200, .border-slate-300, .border-slate-400 { border-color: rgb(148, 163, 184) !important; }
            /* Primary blue for Total Bill Paid header */
            [style*="background-color: rgb(4, 118, 177)"], [style*="background-color:#0476b1"] {
              background-color: rgb(4, 118, 177) !important;
            }
            img { 
              max-width: 100% !important; 
              height: auto !important; 
              object-fit: contain !important; 
            }
            /* Ensure collapsible sections are expanded in PDF */
            button[class*="hover:bg-slate-50"] + div {
              display: block !important;
            }
          `;
          document.head.appendChild(rgbStyle);

          // Wait for styles to apply
          await new Promise(resolve => setTimeout(resolve, 100));

          // Ensure fixed width on receipt element before capturing
          receiptRef.current.style.width = '604px';
          receiptRef.current.style.maxWidth = '604px';
          
          // Wait for styles to apply
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Try again with explicit dimensions
          canvas = await html2canvas(receiptRef.current, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            allowTaint: false,
            width: receiptRef.current.offsetWidth,
            height: receiptRef.current.scrollHeight,
            windowWidth: receiptRef.current.offsetWidth,
            windowHeight: receiptRef.current.scrollHeight
          });

          // Restore stylesheets
          disabledSheets.forEach(({ node, parent }) => {
            if (parent) {
              parent.appendChild(node);
            }
          });
          rgbStyle.remove();
        } else {
          throw html2canvasError;
        }
      }

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      
      // Calculate dimensions maintaining aspect ratio
      // Use a narrower width for the receipt (e.g., 160mm) to leave margins
      const receiptWidth = 160; // Receipt width in mm (leaves ~25mm margins on each side)
      const receiptHeight = (canvas.height * receiptWidth) / canvas.width;
      
      // Center the receipt horizontally
      const xOffset = (pageWidth - receiptWidth) / 2;
      
      let yPosition = 0;
      let heightLeft = receiptHeight;

      // Add first page
      pdf.addImage(imgData, 'PNG', xOffset, yPosition, receiptWidth, receiptHeight);
      heightLeft -= pageHeight;
      yPosition = heightLeft - receiptHeight;

      // Add additional pages if needed
      while (heightLeft > 0) {
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', xOffset, yPosition, receiptWidth, receiptHeight);
        heightLeft -= pageHeight;
        yPosition = heightLeft - receiptHeight;
      }

      pdf.save(`bill-${orderId}.pdf`);

      // Restore original width to make it responsive again
      if (originalWidth) {
        receiptRef.current.style.width = originalWidth;
      } else {
        receiptRef.current.style.removeProperty('width');
      }
      if (originalMaxWidth) {
        receiptRef.current.style.maxWidth = originalMaxWidth;
      } else {
        receiptRef.current.style.removeProperty('max-width');
      }

      // Restore stylesheets
      disabledSheets.forEach(({ node, parent }) => {
        if (parent) {
          parent.appendChild(node);
        }
      });
      if (rgbStyle) {
        rgbStyle.remove();
      }

      // Restore original styles
      originalStyles.forEach((styles, element) => {
        if (styles.color !== undefined) {
          element.style.color = styles.color;
        } else {
          element.style.removeProperty('color');
        }
        if (styles.backgroundColor !== undefined) {
          element.style.backgroundColor = styles.backgroundColor;
        } else {
          element.style.removeProperty('background-color');
        }
        if (styles.borderColor !== undefined) {
          element.style.borderColor = styles.borderColor;
        } else {
          element.style.removeProperty('border-color');
        }
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Please try again.');
      
      // Restore original width on error (if it was different)
      if (receiptRef.current) {
        if (originalWidth) {
          receiptRef.current.style.width = originalWidth;
        } else {
          receiptRef.current.style.removeProperty('width');
        }
        if (originalMaxWidth) {
          receiptRef.current.style.maxWidth = originalMaxWidth;
        } else {
          receiptRef.current.style.removeProperty('max-width');
        }
      }
      
      // Restore stylesheets on error
      disabledSheets.forEach(({ node, parent }: { node: Node; parent: Node | null }) => {
        if (parent) {
          parent.appendChild(node);
        }
      });
      if (rgbStyle) {
        rgbStyle.remove();
      }
      
      // Restore original styles on error
      originalStyles.forEach((styles: { color?: string; backgroundColor?: string; borderColor?: string }, element: HTMLElement) => {
        if (styles.color !== undefined) {
          element.style.color = styles.color;
        } else {
          element.style.removeProperty('color');
        }
        if (styles.backgroundColor !== undefined) {
          element.style.backgroundColor = styles.backgroundColor;
        } else {
          element.style.removeProperty('background-color');
        }
        if (styles.borderColor !== undefined) {
          element.style.borderColor = styles.borderColor;
        } else {
          element.style.removeProperty('border-color');
        }
      });
      
      // Restore original collapsible states on error
      setIsBrandOpen(originalBrandOpen);
      setIsBillDetailsOpen(originalBillDetailsOpen);
      setIsItemDetailsOpen(originalItemDetailsOpen);
    } finally {
      // Restore original collapsible states
      setIsBrandOpen(originalBrandOpen);
      setIsBillDetailsOpen(originalBillDetailsOpen);
      setIsItemDetailsOpen(originalItemDetailsOpen);
      setIsGeneratingPDF(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Loading bill...</p>
      </div>
    );
  }

  if (error || !billData || !companyInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Bill not found'}</p>
          <p className="text-slate-600 text-sm">Order ID: {orderId}</p>
        </div>
      </div>
    );
  }

  const { Cart, Tax, billdetails } = billData;
  const cart = Cart;
  const taxDetails = Tax;
  const subTotal = taxDetails.TotalAmount || 0;
  const grandTotal = taxDetails.GrandTotal || 0;
  const roundOff = taxDetails.RoundOff || 0;
  const taxList = taxDetails.TaxList || [];

  // Use billdetails for date, time, and bill number
  const billNo = billdetails?.Billno || '';
  const billDate = billdetails?.BillDate || '';
  const billTime = billdetails?.BillTime || '';

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Receipt */}
        <div
          ref={receiptRef}
          data-receipt
          className="bg-white p-8 shadow-lg mx-auto w-full max-w-2xl rounded-lg"
          style={{ 
            fontFamily: 'monospace', 
            backgroundColor: '#ffffff', 
            color: '#000000'
          }}
        >
          {/* Receipt Heading with PDF Download */}
          <div className="flex items-center justify-between mb-6" style={{ backgroundColor: '#0476b1', padding: '12px 16px', borderRadius: '8px' }}>
            <h1 className="text-xl font-bold text-white">Receipt</h1>
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{ border: '1px solid rgba(255, 255, 255, 0.3)' }}
              data-pdf-download-button
            >
              <Download size={18} />
              <span className="text-sm font-medium">PDF</span>
            </button>
          </div>

          {/* Logo - Outside and above Brand Information */}
          {companyInfo.Logo && (
            <div className="mb-4 flex justify-center">
              <img
                src={companyInfo.Logo.includes('cogwave.in') 
                  ? `/api/logo?url=${encodeURIComponent(companyInfo.Logo)}`
                  : companyInfo.Logo}
                alt="Restaurant Logo"
                className="max-h-[80px] object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Collapsible Brand Information Section */}
          <div className="bg-white rounded-lg border border-slate-200 mb-3" data-collapsible-section>
            <button 
              onClick={() => setIsBrandOpen(!isBrandOpen)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors rounded-lg"
              data-collapsible-button
            >
              <span className="font-semibold text-slate-900">Brand Information</span>
              {isBrandOpen ? <ChevronUp className="w-5 h-5 text-slate-600" data-chevron-icon /> : <ChevronDown className="w-5 h-5 text-slate-600" data-chevron-icon />}
            </button>
            {isBrandOpen && (
              <div className="px-4 pb-4" data-collapsible-content>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">{companyInfo.Company_Name}</p>
                  <p>{companyInfo.Address1}</p>
                  {companyInfo.Address2 && <p>{companyInfo.Address2}</p>}
                  <p className="mt-2">PH: {companyInfo.Phone_number}</p>
                  {companyInfo.Tin_no && (
                    <p>GSTIN: {companyInfo.Tin_no}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Collapsible Bill Details Section */}
          <div className="bg-white rounded-lg border border-slate-200 mb-3" data-collapsible-section>
            <button 
              onClick={() => setIsBillDetailsOpen(!isBillDetailsOpen)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors rounded-lg"
              data-collapsible-button
            >
              <span className="font-semibold text-slate-900">Bill Details</span>
              {isBillDetailsOpen ? <ChevronUp className="w-5 h-5 text-slate-600" data-chevron-icon /> : <ChevronDown className="w-5 h-5 text-slate-600" data-chevron-icon />}
            </button>
            {isBillDetailsOpen && (
              <div className="px-4 pb-4" data-collapsible-content>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  {cart.GuestName && (
                    <div className="flex justify-between">
                      <span>Guest Name:</span>
                      <span>{cart.GuestName}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Bill No:</span>
                    <span className="font-semibold">{billNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Table:</span>
                    <span>{cart.Table || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Waiter:</span>
                    <span>{cart.WaiterName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{billDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time:</span>
                    <span>{billTime}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Collapsible Item Details Section */}
          <div className="bg-white rounded-lg border border-slate-200 mb-3" data-collapsible-section>
            <button 
              onClick={() => setIsItemDetailsOpen(!isItemDetailsOpen)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors rounded-lg"
              data-collapsible-button
            >
              <span className="font-semibold text-slate-900">Item Details</span>
              {isItemDetailsOpen ? <ChevronUp className="w-5 h-5 text-slate-600" data-chevron-icon /> : <ChevronDown className="w-5 h-5 text-slate-600" data-chevron-icon />}
            </button>
            {isItemDetailsOpen && (
              <div className="px-4 pb-4" data-collapsible-content>
                {/* Items Header */}
                <div className="grid grid-cols-12 gap-2 mb-2 text-sm font-semibold border-b border-slate-300 pb-2">
                  <div className="col-span-5">Item</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-2 text-right">Rate (₹)</div>
                  <div className="col-span-3 text-right">Amount (₹)</div>
                </div>

                {/* Category Header */}
                <div className="text-center my-2">
                  <p className="font-semibold">****FOOD****</p>
                </div>

                {/* Items List */}
                <div className="space-y-2">
                  {cart.Food.map((item, index) => {
                    const amount = (item.Price * item.Qty).toFixed(2);
                    const rate = item.Price.toFixed(2);
                    // Check if amount is 4+ digits (including decimal point)
                    const amountLength = amount.length;
                    const needsWrap = amountLength >= 7; // 4 digits + decimal + 2 decimals = 7 chars (e.g., "1234.00")
                    
                    return (
                      <div key={index} className="text-sm">
                        {needsWrap ? (
                          // Wrapped layout: Amount on next line
                          <>
                            <div className="grid grid-cols-12 gap-2">
                              <div className="col-span-5">{item.Food}</div>
                              <div className="col-span-2 text-center">{item.Qty}</div>
                              <div className="col-span-2 text-right">{rate}</div>
                              <div className="col-span-3"></div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 mt-1">
                              <div className="col-span-9"></div>
                              <div className="col-span-3 text-right">{amount}</div>
                            </div>
                          </>
                        ) : (
                          // Normal layout: All on one line
                          <div className="grid grid-cols-12 gap-2">
                            <div className="col-span-5">{item.Food}</div>
                            <div className="col-span-2 text-center">{item.Qty}</div>
                            <div className="col-span-2 text-right">{rate}</div>
                            <div className="col-span-3 text-right">{amount}</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Always Visible Summary Section */}
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span>Sub-Total</span>
              <span>₹{subTotal.toFixed(2)}</span>
            </div>
            
            {/* Tax List Breakdown */}
            {taxList.map((taxItem: TaxItem, index: number) => (
              <div key={index} className="flex justify-between">
                <span>{taxItem.TaxName} on ₹{taxItem.TaxableAmount.toFixed(2)}</span>
                <span>₹{taxItem.TaxAmount.toFixed(2)}</span>
              </div>
            ))}

            {taxDetails.ServiceCharge > 0 && (
              <div className="flex justify-between">
                <span>Service Charge {taxDetails.ServiceChargePer}%</span>
                <span>₹{taxDetails.ServiceCharge.toFixed(2)}</span>
              </div>
            )}

            {taxDetails.Discount > 0 && (
              <div className="flex justify-between">
                <span>Discount</span>
                <span>-₹{taxDetails.Discount.toFixed(2)}</span>
              </div>
            )}

            {roundOff !== 0 && (
              <div className="flex justify-between">
                <span>Round-off</span>
                <span>{roundOff > 0 ? '+' : ''}₹{Math.abs(roundOff).toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Total Bill Paid Header Strip */}
          <div className="rounded-lg overflow-hidden mb-4" style={{ backgroundColor: '#0476b1' }}>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-white font-semibold text-lg">Total Bill Paid</span>
              <span className="text-white font-bold text-lg">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

