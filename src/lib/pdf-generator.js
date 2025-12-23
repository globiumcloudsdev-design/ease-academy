import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MONTHS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export const generateFeeVoucherPDF = (voucher) => {
  const doc = new jsPDF();

  // Colors and styling
  const primaryColor = [41, 128, 185]; // Blue
  const secondaryColor = [52, 73, 94]; // Dark gray
  const accentColor = [155, 89, 182]; // Purple

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('EASE ACADEMY', 105, 15, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Fee Voucher', 105, 25, { align: 'center' });

  // Voucher Number Badge
  doc.setFillColor(...accentColor);
  doc.rect(150, 35, 40, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`#${voucher.voucherNumber}`, 170, 42, { align: 'center' });

  let yPosition = 55;

  // Student Information Section
  doc.setTextColor(...secondaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Student Information', 20, yPosition);

  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  // Student details
  const studentName = voucher.studentId?.fullName ||
                     `${voucher.studentId?.firstName || ''} ${voucher.studentId?.lastName || ''}`.trim() ||
                     'Student';
  const registrationNumber = voucher.studentId?.studentProfile?.registrationNumber ||
                            voucher.studentId?.registrationNumber ||
                            'N/A';
  const rollNumber = voucher.studentId?.studentProfile?.rollNumber ||
                    voucher.studentId?.rollNumber ||
                    'N/A';
  const className = voucher.classId?.name || 'N/A';
  const section = voucher.studentId?.studentProfile?.section || 'N/A';

  doc.text(`Name: ${studentName}`, 20, yPosition);
  doc.text(`Registration #: ${registrationNumber}`, 110, yPosition);
  yPosition += 8;

  doc.text(`Roll Number: ${rollNumber}`, 20, yPosition);
  doc.text(`Section: ${section}`, 110, yPosition);
  yPosition += 8;

  doc.text(`Class: ${className}`, 20, yPosition);
  doc.text(`Branch: ${voucher.branchId?.name || 'N/A'}`, 110, yPosition);
  yPosition += 15;

  // Fee Details Section
  doc.setTextColor(...secondaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Fee Details', 20, yPosition);

  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  doc.text(`Template: ${voucher.templateId?.name || 'N/A'}`, 20, yPosition);
  const monthName = MONTHS.find(m => m.value === voucher.month.toString())?.label || voucher.month;
  doc.text(`Month/Year: ${monthName} ${voucher.year}`, 110, yPosition);
  yPosition += 8;

  const dueDate = voucher.dueDate ? new Date(voucher.dueDate).toLocaleDateString('en-PK') : 'N/A';
  doc.text(`Due Date: ${dueDate}`, 20, yPosition);
  doc.text(`Status: ${voucher.status.charAt(0).toUpperCase() + voucher.status.slice(1)}`, 110, yPosition);
  yPosition += 15;

  // Amount Breakdown Table
  const tableData = [
    ['Description', 'Amount (PKR)'],
    ['Base Amount', voucher.amount?.toLocaleString() || '0'],
    ['Discount', `-${voucher.discountAmount?.toLocaleString() || '0'}`],
    ['Late Fee', voucher.lateFeeAmount?.toLocaleString() || '0'],
    ['Total Amount', voucher.totalAmount?.toLocaleString() || '0'],
  ];

  const tableEndY = autoTable(doc, {
    startY: yPosition,
    head: [tableData[0]],
    body: tableData.slice(1),
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 10,
      cellPadding: 5,
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right' },
    },
    margin: { left: 20, right: 20 },
  });

  yPosition = tableEndY + 15;

  // Payment Information
  if (voucher.paidAmount > 0) {
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Information', 20, yPosition);

    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    doc.text(`Amount Paid: PKR ${voucher.paidAmount?.toLocaleString() || '0'}`, 20, yPosition);
    const remaining = (voucher.remainingAmount ?? voucher.totalAmount ?? 0) - (voucher.paidAmount ?? 0);
    doc.text(`Remaining Amount: PKR ${Math.max(0, remaining).toLocaleString()}`, 110, yPosition);
    yPosition += 15;
  }

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFillColor(240, 240, 240);
  doc.rect(0, pageHeight - 25, 210, 25, 'F');

  doc.setTextColor(...secondaryColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Generated on: ' + new Date().toLocaleDateString('en-PK'), 20, pageHeight - 15);
  doc.text('This is a computer generated document', 20, pageHeight - 10);

  doc.text('EASE Academy - Fee Management System', 105, pageHeight - 10, { align: 'center' });

  // Return PDF as buffer for download
  return doc.output('arraybuffer');
};