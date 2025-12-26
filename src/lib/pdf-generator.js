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

const getMonthName = (month) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month - 1];
};

/**
 * Generate Salary Slip PDF for Teachers
 */
export const generateSalarySlipPDF = async (payroll, teacher) => {
  const doc = new jsPDF();

  // Colors
  const primaryColor = [41, 128, 185]; // Blue
  const secondaryColor = [52, 73, 94]; // Dark gray
  const greenColor = [39, 174, 96]; // Green
  const redColor = [231, 76, 60]; // Red

  // Header Section
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('EASE ACADEMY', 105, 15, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Salary Slip', 105, 25, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`${getMonthName(payroll.month)} ${payroll.year}`, 105, 32, { align: 'center' });

  // Employee Information Section
  let yPos = 45;

  doc.setTextColor(...secondaryColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Employee Information', 15, yPos);

  yPos += 8;

  // Employee details table
  const employeeData = [
    ['Employee Name:', `${teacher.firstName} ${teacher.lastName}`],
    ['Employee ID:', teacher.teacherProfile?.employeeId || 'N/A'],
    ['Designation:', teacher.teacherProfile?.designation || 'Teacher'],
    ['Email:', teacher.email],
    ['Phone:', teacher.phone || 'N/A'],
  ];

  doc.autoTable({
    startY: yPos,
    head: [],
    body: employeeData,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 120 },
    },
  });

  yPos = doc.lastAutoTable.finalY + 10;

  // Salary Breakdown Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('Salary Breakdown', 15, yPos);

  yPos += 5;

  // Earnings Table
  const earningsData = [
    ['Basic Salary', '', `PKR ${payroll.basicSalary.toLocaleString()}`],
    ['House Rent Allowance', '', `PKR ${payroll.allowances.houseRent.toLocaleString()}`],
    ['Medical Allowance', '', `PKR ${payroll.allowances.medical.toLocaleString()}`],
    ['Transport Allowance', '', `PKR ${payroll.allowances.transport.toLocaleString()}`],
    ['Other Allowances', '', `PKR ${payroll.allowances.other.toLocaleString()}`],
  ];

  doc.autoTable({
    startY: yPos,
    head: [['Earnings', '', 'Amount']],
    body: earningsData,
    foot: [['Gross Salary', '', `PKR ${payroll.grossSalary.toLocaleString()}`]],
    theme: 'grid',
    headStyles: {
      fillColor: [...primaryColor],
      fontSize: 10,
      fontStyle: 'bold',
    },
    footStyles: {
      fillColor: [...greenColor],
      fontSize: 11,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30 },
      2: { cellWidth: 60, halign: 'right' },
    },
  });

  yPos = doc.lastAutoTable.finalY + 10;

  // Deductions Table
  const deductionsData = [
    ['Tax', '', `PKR ${payroll.deductions.tax.toLocaleString()}`],
    ['Provident Fund', '', `PKR ${payroll.deductions.providentFund.toLocaleString()}`],
    ['Insurance', '', `PKR ${payroll.deductions.insurance.toLocaleString()}`],
    ['Other Deductions', '', `PKR ${payroll.deductions.other.toLocaleString()}`],
  ];

  // Add attendance deduction if applicable
  if (payroll.attendanceDeduction.calculatedDeduction > 0) {
    deductionsData.push([
      `Absence Deduction (${payroll.attendanceDeduction.absentDays} days)`,
      '',
      `PKR ${payroll.attendanceDeduction.calculatedDeduction.toLocaleString()}`,
    ]);
  }

  doc.autoTable({
    startY: yPos,
    head: [['Deductions', '', 'Amount']],
    body: deductionsData,
    foot: [['Total Deductions', '', `PKR ${payroll.totalDeductions.toLocaleString()}`]],
    theme: 'grid',
    headStyles: {
      fillColor: [...secondaryColor],
      fontSize: 10,
      fontStyle: 'bold',
    },
    footStyles: {
      fillColor: [...redColor],
      fontSize: 11,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30 },
      2: { cellWidth: 60, halign: 'right' },
    },
  });

  yPos = doc.lastAutoTable.finalY + 10;

  // Attendance Details (if available)
  if (payroll.attendanceDeduction.totalWorkingDays > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...secondaryColor);
    doc.text('Attendance Summary', 15, yPos);

    yPos += 5;

    const attendanceData = [
      ['Total Working Days', payroll.attendanceDeduction.totalWorkingDays.toString()],
      ['Present Days', payroll.attendanceDeduction.presentDays.toString()],
      ['Absent Days', payroll.attendanceDeduction.absentDays.toString()],
      ['Leave Days', payroll.attendanceDeduction.leaveDays.toString()],
    ];

    doc.autoTable({
      startY: yPos,
      body: attendanceData,
      theme: 'striped',
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 80 },
        1: { cellWidth: 90 },
      },
    });

    yPos = doc.lastAutoTable.finalY + 10;
  }

  // Net Salary Box
  doc.setFillColor(...greenColor);
  doc.rect(15, yPos, 180, 20, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Net Salary:', 25, yPos + 12);
  doc.setFontSize(16);
  doc.text(`PKR ${payroll.netSalary.toLocaleString()}`, 175, yPos + 12, { align: 'right' });

  yPos += 30;

  // Bank Details (if available)
  if (teacher.teacherProfile?.salaryDetails?.bankAccount) {
    const bankAccount = teacher.teacherProfile.salaryDetails.bankAccount;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...secondaryColor);
    doc.text('Bank Account Details', 15, yPos);

    yPos += 5;

    const bankData = [
      ['Bank Name:', bankAccount.bankName || 'N/A'],
      ['Account Number:', bankAccount.accountNumber || 'N/A'],
      ['IBAN:', bankAccount.iban || 'N/A'],
    ];

    doc.autoTable({
      startY: yPos,
      body: bankData,
      theme: 'plain',
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 120 },
      },
    });

    yPos = doc.lastAutoTable.finalY + 10;
  }

  // Remarks (if available)
  if (payroll.remarks) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...secondaryColor);
    doc.text('Remarks:', 15, yPos);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const splitRemarks = doc.splitTextToSize(payroll.remarks, 170);
    doc.text(splitRemarks, 15, yPos + 5);
    
    yPos += 5 + (splitRemarks.length * 5) + 5;
  }

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(128, 128, 128);
  doc.text('This is a computer-generated salary slip and does not require a signature.', 105, pageHeight - 20, { align: 'center' });
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, pageHeight - 15, { align: 'center' });
  doc.text('© Ease Academy - School Management System', 105, pageHeight - 10, { align: 'center' });

  // Return PDF as buffer for email attachment
  return Buffer.from(doc.output('arraybuffer'));
};

export const generateFeeVoucherPDF = (voucher) => {
  const doc = new jsPDF();
  
  // Detect mobile device
  const isMobile = window.innerWidth < 768;
  
  // Adjust sizes based on device
  const scaleFactor = isMobile ? 0.85 : 1;
  const mobilePadding = 10;
  
  // Responsive Colors
  const primaryColor = [25, 86, 136]; // Dark Blue
  const secondaryColor = [60, 60, 60]; // Dark Gray
  const accentColor = [220, 53, 69]; // Red
  const successColor = [40, 167, 69]; // Green
  const lightBgColor = [248, 249, 250]; // Light Gray
  const borderColor = [206, 212, 218]; // Border Gray

  // Responsive Dimensions
  const pageWidth = doc.internal.pageSize.width;
  const margin = isMobile ? mobilePadding : 15;
  const contentWidth = pageWidth - (2 * margin);
  
  // Responsive Font Sizes
  const headerFontSize = isMobile ? 18 : 24;
  const titleFontSize = isMobile ? 10 : 12;
  const sectionFontSize = isMobile ? 11 : 12;
  const bodyFontSize = isMobile ? 9 : 10;
  const smallFontSize = isMobile ? 7 : 8;

  // Responsive Spacing
  const lineHeight = isMobile ? 6 : 7;
  const sectionSpacing = isMobile ? 12 : 15;
  const boxPadding = isMobile ? 8 : 10;

  // Header - Mobile Optimized
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, isMobile ? 35 : 40, 'F');
  
  // School Name - Responsive
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(headerFontSize);
  doc.setFont('helvetica', 'bold');
  const headerText = isMobile ? 'EASE' : 'EASE ACADEMY';
  doc.text(headerText, pageWidth / 2, isMobile ? 18 : 20, { align: 'center' });
  
  // Subtitle
  if (!isMobile) {
    doc.setFontSize(titleFontSize);
    doc.setFont('helvetica', 'normal');
    doc.text('OFFICIAL FEE PAYMENT VOUCHER', pageWidth / 2, isMobile ? 25 : 30, { align: 'center' });
  }

  let yPosition = isMobile ? 45 : 50;

  // Voucher Number and Status - Mobile Stacked Layout
  if (isMobile) {
    // Stacked layout for mobile
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, yPosition, contentWidth, 12, 2, 2, 'F');
    doc.setTextColor(...primaryColor);
    doc.setFontSize(bodyFontSize);
    doc.setFont('helvetica', 'bold');
    doc.text(`VOUCHER #${voucher.voucherNumber}`, pageWidth / 2, yPosition + 8, { align: 'center' });
    
    yPosition += 15;
    
    // Status Badge
    const status = voucher.status.charAt(0).toUpperCase() + voucher.status.slice(1);
    const statusBgColor = voucher.status === 'paid' ? successColor : 
                         voucher.status === 'partial' ? [255, 193, 7] : accentColor;
    
    doc.setFillColor(...statusBgColor);
    doc.roundedRect(margin, yPosition, contentWidth, 12, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(status.toUpperCase(), pageWidth / 2, yPosition + 8, { align: 'center' });
    
    yPosition += 20;
  } else {
    // Desktop layout (side by side)
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(pageWidth - 60, yPosition, 50, 15, 2, 2, 'F');
    doc.setTextColor(...primaryColor);
    doc.setFontSize(bodyFontSize);
    doc.setFont('helvetica', 'bold');
    doc.text(`VCH-${voucher.voucherNumber}`, pageWidth - 35, yPosition + 10, { align: 'center' });
    
    const status = voucher.status.charAt(0).toUpperCase() + voucher.status.slice(1);
    const statusBgColor = voucher.status === 'paid' ? successColor : 
                         voucher.status === 'partial' ? [255, 193, 7] : accentColor;
    
    doc.setFillColor(...statusBgColor);
    doc.roundedRect(margin, yPosition, 60, 15, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(status.toUpperCase(), margin + 30, yPosition + 10, { align: 'center' });
    
    yPosition += 20;
  }

  // Section 1: Student Information - Responsive
  doc.setFillColor(...lightBgColor);
  const studentBoxHeight = isMobile ? 60 : 40;
  doc.roundedRect(margin, yPosition, contentWidth, studentBoxHeight, 3, 3, 'F');
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(sectionFontSize);
  doc.setFont('helvetica', 'bold');
  doc.text('STUDENT INFO', margin + boxPadding, yPosition + (isMobile ? 6 : 8));
  
  // Underline
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  const underlineLength = isMobile ? 40 : 50;
  doc.line(margin + boxPadding, yPosition + (isMobile ? 8 : 10), 
           margin + boxPadding + underlineLength, yPosition + (isMobile ? 8 : 10));

  // Student Details - Mobile: Stacked, Desktop: Two Columns
  const studentName = voucher.studentId?.fullName ||
                     `${voucher.studentId?.firstName || ''} ${voucher.studentId?.lastName || ''}`.trim() ||
                     'N/A';
  const fatherName = voucher.studentId?.fatherName || 'N/A';
  const registrationNumber = voucher.studentId?.studentProfile?.registrationNumber ||
                            voucher.studentId?.registrationNumber ||
                            'N/A';
  const rollNumber = voucher.studentId?.studentProfile?.rollNumber ||
                    voucher.studentId?.rollNumber ||
                    'N/A';
  const className = voucher.classId?.name || 'N/A';
  const section = voucher.studentId?.studentProfile?.section || 'N/A';

  doc.setFontSize(bodyFontSize);
  doc.setTextColor(...secondaryColor);
  
  if (isMobile) {
    // Mobile: Stacked Layout
    let detailY = yPosition + 15;
    
    // Name
    doc.setFont('helvetica', 'bold');
    doc.text(studentName, margin + boxPadding, detailY);
    doc.setFont('helvetica', 'normal');
    doc.text(`Father: ${fatherName}`, margin + boxPadding, detailY + lineHeight);
    
    // Class and Section
    detailY += lineHeight * 2;
    doc.text(`Class: ${className}`, margin + boxPadding, detailY);
    doc.text(`Section: ${section}`, margin + boxPadding + (contentWidth/2), detailY);
    
    // Registration and Roll Number
    detailY += lineHeight;
    doc.text(`Reg #: ${registrationNumber}`, margin + boxPadding, detailY);
    doc.text(`Roll #: ${rollNumber}`, margin + boxPadding + (contentWidth/2), detailY);
    
    yPosition += studentBoxHeight + 10;
  } else {
    // Desktop: Two Columns
    yPosition += 15;
    
    // Column 1
    doc.setFont('helvetica', 'normal');
    doc.text(`Name:`, margin + boxPadding, yPosition);
    doc.setFont('helvetica', 'bold');
    doc.text(studentName, margin + boxPadding + 15, yPosition);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Father:`, margin + boxPadding, yPosition + lineHeight);
    doc.setFont('helvetica', 'bold');
    doc.text(fatherName, margin + boxPadding + 15, yPosition + lineHeight);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Reg #:`, margin + boxPadding, yPosition + (lineHeight * 2));
    doc.setFont('helvetica', 'bold');
    doc.text(registrationNumber, margin + boxPadding + 15, yPosition + (lineHeight * 2));

    // Column 2
    doc.setFont('helvetica', 'normal');
    doc.text(`Class:`, margin + boxPadding + 100, yPosition);
    doc.setFont('helvetica', 'bold');
    doc.text(className, margin + boxPadding + 115, yPosition);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Section:`, margin + boxPadding + 100, yPosition + lineHeight);
    doc.setFont('helvetica', 'bold');
    doc.text(section, margin + boxPadding + 115, yPosition + lineHeight);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Roll #:`, margin + boxPadding + 100, yPosition + (lineHeight * 2));
    doc.setFont('helvetica', 'bold');
    doc.text(rollNumber, margin + boxPadding + 115, yPosition + (lineHeight * 2));
    
    yPosition += studentBoxHeight - 10;
  }

  // Section 2: Fee Details - Responsive
  const feeBoxHeight = isMobile ? 50 : 35;
  doc.setFillColor(...lightBgColor);
  doc.roundedRect(margin, yPosition, contentWidth, feeBoxHeight, 3, 3, 'F');
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(sectionFontSize);
  doc.setFont('helvetica', 'bold');
  doc.text('FEE DETAILS', margin + boxPadding, yPosition + (isMobile ? 6 : 8));
  doc.line(margin + boxPadding, yPosition + (isMobile ? 8 : 10), 
           margin + boxPadding + (isMobile ? 40 : 45), yPosition + (isMobile ? 8 : 10));

  const monthName = MONTHS.find(m => m.value === voucher.month.toString())?.label || voucher.month;
  const dueDate = voucher.dueDate ? new Date(voucher.dueDate).toLocaleDateString('en-PK') : 'N/A';
  const issueDate = voucher.createdAt ? new Date(voucher.createdAt).toLocaleDateString('en-PK') : 
                   new Date().toLocaleDateString('en-PK');

  doc.setFontSize(bodyFontSize);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...secondaryColor);

  if (isMobile) {
    // Mobile: Stacked Layout
    let feeY = yPosition + 15;
    
    // Row 1
    doc.text(`Month:`, margin + boxPadding, feeY);
    doc.setFont('helvetica', 'bold');
    doc.text(`${monthName} ${voucher.year}`, margin + boxPadding + 20, feeY);
    
    // Row 2
    feeY += lineHeight;
    doc.setFont('helvetica', 'normal');
    doc.text(`Due Date:`, margin + boxPadding, feeY);
    doc.setFont('helvetica', 'bold');
    doc.text(dueDate, margin + boxPadding + 20, feeY);
    
    // Row 3
    feeY += lineHeight;
    doc.setFont('helvetica', 'normal');
    doc.text(`Branch:`, margin + boxPadding, feeY);
    doc.setFont('helvetica', 'bold');
    doc.text(voucher.branchId?.name || 'N/A', margin + boxPadding + 20, feeY);
    
    // Row 4
    feeY += lineHeight;
    doc.setFont('helvetica', 'normal');
    doc.text(`Template:`, margin + boxPadding, feeY);
    doc.setFont('helvetica', 'bold');
    doc.text(voucher.templateId?.name || 'N/A', margin + boxPadding + 20, feeY);
    
    yPosition += feeBoxHeight + 10;
  } else {
    // Desktop: Two Columns
    yPosition += 15;
    
    // Column 1
    doc.text(`Month:`, margin + boxPadding, yPosition);
    doc.setFont('helvetica', 'bold');
    doc.text(`${monthName} ${voucher.year}`, margin + boxPadding + 15, yPosition);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Due Date:`, margin + boxPadding, yPosition + lineHeight);
    doc.setFont('helvetica', 'bold');
    doc.text(dueDate, margin + boxPadding + 15, yPosition + lineHeight);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Issue Date:`, margin + boxPadding, yPosition + (lineHeight * 2));
    doc.setFont('helvetica', 'bold');
    doc.text(issueDate, margin + boxPadding + 15, yPosition + (lineHeight * 2));

    // Column 2
    doc.setFont('helvetica', 'normal');
    doc.text(`Branch:`, margin + boxPadding + 100, yPosition);
    doc.setFont('helvetica', 'bold');
    doc.text(voucher.branchId?.name || 'N/A', margin + boxPadding + 115, yPosition);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Template:`, margin + boxPadding + 100, yPosition + lineHeight);
    doc.setFont('helvetica', 'bold');
    doc.text(voucher.templateId?.name || 'N/A', margin + boxPadding + 115, yPosition + lineHeight);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Session:`, margin + boxPadding + 100, yPosition + (lineHeight * 2));
    doc.setFont('helvetica', 'bold');
    doc.text(voucher.academicYear || '2024-25', margin + boxPadding + 115, yPosition + (lineHeight * 2));
    
    yPosition += feeBoxHeight - 5;
  }

  // Amount Breakdown - Responsive Table
  doc.setTextColor(...primaryColor);
  doc.setFontSize(isMobile ? 12 : 14);
  doc.setFont('helvetica', 'bold');
  doc.text('AMOUNT BREAKDOWN', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += isMobile ? 6 : 8;

  // Table Header
  doc.setFillColor(...primaryColor);
  const headerHeight = isMobile ? 8 : 10;
  doc.rect(margin, yPosition, contentWidth, headerHeight, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(isMobile ? 10 : 11);
  doc.text('Description', margin + boxPadding, yPosition + (isMobile ? 5 : 7));
  doc.text('Amount (PKR)', margin + contentWidth - boxPadding, yPosition + (isMobile ? 5 : 7), { align: 'right' });
  
  yPosition += headerHeight;

  // Table Rows - Responsive
  const rows = [
    { desc: 'Base Fee', amount: voucher.amount || 0 },
    { desc: 'Discount', amount: -(voucher.discountAmount || 0) },
    { desc: 'Late Fee', amount: voucher.lateFeeAmount || 0 },
    { desc: 'Other Charges', amount: voucher.otherCharges || 0 }
  ];

  const rowHeight = isMobile ? 8 : 10;
  doc.setFontSize(bodyFontSize);
  doc.setFont('helvetica', 'normal');

  let totalBeforePaid = 0;
  rows.forEach((row, index) => {
    // Alternate row colors
    if (index % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(248, 249, 250);
    }
    doc.rect(margin, yPosition, contentWidth, rowHeight, 'F');
    
    doc.setTextColor(...secondaryColor);
    doc.text(row.desc, margin + boxPadding, yPosition + (isMobile ? 5 : 7));
    
    // Format amount
    const formattedAmount = row.amount.toLocaleString('en-PK');
    if (row.amount < 0) {
      doc.setTextColor(220, 53, 69);
    }
    doc.text(formattedAmount, margin + contentWidth - boxPadding, yPosition + (isMobile ? 5 : 7), { align: 'right' });
    
    if (row.amount < 0) {
      doc.setTextColor(...secondaryColor);
    }
    
    totalBeforePaid += row.amount;
    yPosition += rowHeight;
  });

  // Total Amount Row - Responsive
  const totalAmount = voucher.totalAmount || totalBeforePaid;
  const totalRowHeight = isMobile ? 10 : 12;
  
  doc.setFillColor(255, 243, 205);
  doc.rect(margin, yPosition, contentWidth, totalRowHeight, 'F');
  
  doc.setDrawColor(255, 193, 7);
  doc.setLineWidth(0.5);
  doc.rect(margin, yPosition, contentWidth, totalRowHeight);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isMobile ? 10 : 11);
  doc.setTextColor(133, 100, 4);
  
  const totalLabel = isMobile ? 'TOTAL:' : 'TOTAL AMOUNT PAYABLE:';
  doc.text(totalLabel, margin + boxPadding, yPosition + (isMobile ? 6 : 8));
  doc.text(totalAmount.toLocaleString('en-PK'), margin + contentWidth - boxPadding, yPosition + (isMobile ? 6 : 8), { align: 'right' });
  
  yPosition += totalRowHeight + (isMobile ? 12 : 15);

  // Payment Information - Responsive
  if (voucher.paidAmount > 0) {
    const paymentBoxHeight = isMobile ? 30 : 25;
    doc.setFillColor(225, 250, 235);
    doc.roundedRect(margin, yPosition, contentWidth, paymentBoxHeight, 3, 3, 'F');
    
    doc.setTextColor(...successColor);
    doc.setFontSize(isMobile ? 11 : 12);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT INFO', margin + boxPadding, yPosition + (isMobile ? 7 : 8));
    
    const paidAmount = voucher.paidAmount || 0;
    const remainingAmount = totalAmount - paidAmount;
    
    yPosition += isMobile ? 12 : 15;
    
    doc.setFontSize(bodyFontSize);
    
    if (isMobile) {
      // Mobile: Stacked
      doc.setFont('helvetica', 'normal');
      doc.text(`Paid: PKR ${paidAmount.toLocaleString('en-PK')}`, margin + boxPadding, yPosition);
      
      yPosition += lineHeight;
      
      if (remainingAmount > 0) {
        doc.setTextColor(accentColor);
        doc.text(`Due: PKR ${remainingAmount.toLocaleString('en-PK')}`, margin + boxPadding, yPosition);
      } else {
        doc.setTextColor(...successColor);
        doc.text('FULLY PAID ✓', margin + boxPadding, yPosition);
      }
      
      yPosition += lineHeight + 5;
    } else {
      // Desktop: Side by side
      doc.setFont('helvetica', 'normal');
      doc.text(`Paid Amount:`, margin + boxPadding, yPosition);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...successColor);
      doc.text(`PKR ${paidAmount.toLocaleString('en-PK')}`, margin + boxPadding + 30, yPosition);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...secondaryColor);
      doc.text(`Remaining:`, margin + boxPadding + 100, yPosition);
      
      if (remainingAmount > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(accentColor);
        doc.text(`PKR ${remainingAmount.toLocaleString('en-PK')}`, margin + boxPadding + 130, yPosition);
      } else {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...successColor);
        doc.text(`FULLY PAID`, margin + boxPadding + 130, yPosition);
      }
      
      yPosition += 20;
    }
  }

  // Footer - Responsive
  const pageHeight = doc.internal.pageSize.height;
  
  // Mobile: Simpler footer
  if (isMobile) {
    // Small note at bottom
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(smallFontSize);
    doc.setFont('helvetica', 'italic');
    doc.text('Keep this voucher for your records', pageWidth / 2, pageHeight - 15, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString('en-PK')}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  } else {
    // Desktop: Full footer with signatures
    // Signature Line
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.5);
    const signatureY = pageHeight - 50;
    doc.line(margin, signatureY, pageWidth - margin, signatureY);
    
    // Signatures
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(smallFontSize);
    doc.setFont('helvetica', 'normal');
    
    // Left Signature
    doc.text('___________________', margin + 25, signatureY + 10);
    doc.text('Student/Parent', margin + 35, signatureY + 15);
    
    // Right Signature
    doc.text('___________________', pageWidth - margin - 65, signatureY + 10);
    doc.text('Accounts Officer', pageWidth - margin - 60, signatureY + 15);
    
    // Footer Bar
    doc.setFillColor(248, 249, 250);
    doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
    
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString('en-PK')}`, margin, pageHeight - 12);
    doc.text('EASE Academy FMS', pageWidth / 2, pageHeight - 12, { align: 'center' });
    doc.text('Computer Generated', pageWidth - margin, pageHeight - 12, { align: 'right' });
  }

  // Return PDF as buffer
  return doc.output('arraybuffer');
};