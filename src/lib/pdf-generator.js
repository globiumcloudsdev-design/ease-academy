import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { KeyIcon } from 'lucide-react';

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

  // Check if we're in a browser environment for responsive detection
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  // Enhanced Professional Color Palette
  const primaryColor = [0, 102, 204]; // Professional Blue
  const secondaryColor = [52, 73, 94]; // Dark Gray
  const accentColor = [34, 197, 94]; // Green for amounts
  const warningColor = [245, 158, 11]; // Amber for warnings
  const borderColor = [229, 231, 235]; // Light Gray for borders
  const highlightColor = [254, 252, 232]; // Soft Yellow for highlights
  const lightGray = [248, 250, 252]; // Very light gray background
  const darkBlue = [23, 37, 84]; // Dark blue for headers

  // Page dimensions
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = isMobile ? 8 : 12; // Reduced margin for better content fit
  const contentWidth = pageWidth - (2 * margin);

  // Responsive font sizes
  const h1Size = isMobile ? 18 : 24;
  const h2Size = isMobile ? 14 : 18;
  const h3Size = isMobile ? 12 : 14;
  const bodySize = isMobile ? 9 : 10;
  const smallSize = isMobile ? 7 : 8;

  // Responsive spacing
  const lineHeight = isMobile ? 6 : 7;
  const sectionGap = isMobile ? 10 : 15;
  const boxPadding = isMobile ? 6 : 8; // Reduced padding

  // Clear background with subtle gradient effect
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Add subtle background pattern
  doc.setFillColor(250, 250, 250);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // ========== HEADER SECTION ==========
  let yPosition = margin;

  // Enhanced School Header with gradient effect
  const headerSectionHeight = isMobile ? 35 : 45;

  // Main header background
  doc.setFillColor(...primaryColor);
  doc.roundedRect(margin, yPosition, contentWidth, headerSectionHeight, 3, 3, 'F');

  // Add gradient effect with lighter blue
  doc.setFillColor(100, 150, 255);
  doc.roundedRect(margin, yPosition, contentWidth, headerSectionHeight * 0.6, 3, 3, 'F');

  // School badge/logo with enhanced styling
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(1.5);
  doc.roundedRect(margin + (isMobile ? 6 : 8), yPosition + (isMobile ? 6 : 8),
                  isMobile ? 20 : 25, isMobile ? 20 : 25, 3, 3, 'FD');
  doc.setTextColor(...primaryColor);
  doc.setFontSize(isMobile ? 12 : 15);
  doc.setFont('helvetica', 'bold');
  doc.text('EA', margin + (isMobile ? 6 : 8) + (isMobile ? 10 : 12.5), 
           yPosition + (isMobile ? 6 : 8) + (isMobile ? 10 : 12.5), 
           { align: 'center', baseline: 'middle' });

  // School name with enhanced positioning
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(h1Size);
  doc.setFont('helvetica', 'bold');
  const schoolName = 'EASE ACADEMY';
  const schoolX = isMobile ? margin + 32 : margin + 40;

  // Add subtle shadow for text
  doc.setTextColor(0, 50, 100, 0.3);
  doc.text(schoolName, schoolX + 1, yPosition + (isMobile ? 14 : 18) + 1);
  doc.setTextColor(255, 255, 255);
  doc.text(schoolName, schoolX, yPosition + (isMobile ? 14 : 18));

  // School motto with better positioning
  if (!isMobile) {
    doc.setFontSize(bodySize - 1);
    doc.setFont('helvetica', 'italic');
    doc.text('Center of Excellence in Education', margin + 40, yPosition + 25);
  }

  // Enhanced Voucher title with background
  const titleY = yPosition + (isMobile ? 26 : 32);
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.8);
  doc.roundedRect(pageWidth / 2 - 50, titleY - 3, 100, isMobile ? 8 : 10, 2, 2, 'FD');

  doc.setTextColor(...primaryColor);
  doc.setFontSize(h2Size);
  doc.setFont('helvetica', 'bold');
  doc.text('FEE VOUCHER', pageWidth / 2, titleY + (isMobile ? 1.5 : 2), 
           { align: 'center', baseline: 'middle' });

  yPosition += headerSectionHeight + (isMobile ? 4 : 6);
  
  // ========== VOUCHER INFO BADGE ==========
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, yPosition, contentWidth, isMobile ? 16 : 20, 2, 2, 'FD');
  
  // Voucher number
  doc.setTextColor(...primaryColor);
  doc.setFontSize(h3Size);
  doc.setFont('helvetica', 'bold');
  const voucherText = isMobile ? `Voucher #${voucher.voucherNumber}` : `Voucher #${voucher.voucherNumber}`;
  doc.text(voucherText, margin + boxPadding, yPosition + (isMobile ? 6 : 8));
  
  // Issue date
  doc.setFontSize(bodySize);
  doc.setFont('helvetica', 'normal');
  const issueDate = new Date().toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  doc.text(`Issued: ${issueDate}`, margin + contentWidth - boxPadding, 
           yPosition + (isMobile ? 6 : 8), 
           { align: 'right', baseline: 'middle' });
  
  yPosition += isMobile ? 18 : 22;
  
  // ========== STUDENT INFORMATION SECTION ==========
  // Section header with enhanced styling
  doc.setFillColor(...primaryColor);
  doc.roundedRect(margin, yPosition, contentWidth, isMobile ? 7 : 9, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(h3Size);
  doc.setFont('helvetica', 'bold');
  doc.text('STUDENT DETAILS', margin + boxPadding, yPosition + (isMobile ? 4 : 5));

  yPosition += (isMobile ? 8 : 10);

  // Enhanced Student info box with gradient background
  const studentBoxHeight = isMobile ? 45 : 50;

  // Main background
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin, yPosition, contentWidth, studentBoxHeight, 3, 3, 'F');

  // Add subtle gradient effect
  doc.setFillColor(240, 245, 250);
  doc.roundedRect(margin, yPosition, contentWidth, studentBoxHeight * 0.4, 3, 3, 'F');

  // Border with primary color
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, yPosition, contentWidth, studentBoxHeight, 3, 3, 'S');
  
  const studentY = yPosition + boxPadding;
  
  // Get student data with fallbacks
  const studentName = voucher.studentId?.fullName ||
                     `${voucher.studentId?.firstName || ''} ${voucher.studentId?.lastName || ''}`.trim() ||
                     'N/A';
  const guardianType = voucher.studentId?.studentProfile?.guardianType || 'parent';
  const parentLabel = guardianType === 'guardian' ? 'Guardian:' : 'Father:';
  const parentName = guardianType === 'guardian'
    ? (voucher.studentId?.studentProfile?.guardian?.name || 'N/A')
    : (voucher.studentId?.fatherName || voucher.studentId?.studentProfile?.father?.name || 'N/A');
  const registrationNumber = voucher.studentId?.studentProfile?.registrationNumber ||
                            voucher.studentId?.registrationNumber || 'N/A';
  const rollNumber = voucher.studentId?.studentProfile?.rollNumber ||
                    voucher.studentId?.rollNumber || 'N/A';
  const className = voucher.classId?.name || 'N/A';
  const section = voucher.studentId?.studentProfile?.section || 'N/A';
  const branchName = voucher.branchId?.name || 'N/A';
  
  doc.setFontSize(bodySize);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  if (isMobile) {
    // Mobile: Stacked layout with proper alignment
    const labelValueGap = 4;
    const rowSpacing = lineHeight + 1;
    
    // First row: Student Name
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...secondaryColor);
    doc.text('Student:', margin + boxPadding, studentY, { baseline: 'middle' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const studentLabelWidth = doc.getTextWidth('Student:');
    // Check if name fits, otherwise truncate
    let displayName = studentName;
    const maxNameWidth = contentWidth - (boxPadding * 2) - studentLabelWidth - labelValueGap;
    if (doc.getTextWidth(displayName) > maxNameWidth) {
      while (doc.getTextWidth(displayName + '...') > maxNameWidth && displayName.length > 3) {
        displayName = displayName.slice(0, -1);
      }
      displayName = displayName + '...';
    }
    doc.text(displayName, margin + boxPadding + studentLabelWidth + labelValueGap, 
             studentY, { baseline: 'middle' });

    // Second row: Class & Section
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...secondaryColor);
    doc.text('Class:', margin + boxPadding, studentY + rowSpacing, { baseline: 'middle' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const classLabelWidth = doc.getTextWidth('Class:');
    doc.text(`${className} - ${section}`, margin + boxPadding + classLabelWidth + labelValueGap, 
             studentY + rowSpacing, { baseline: 'middle' });

    // Third row: Parent/Guardian
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...secondaryColor);
    doc.text(parentLabel, margin + boxPadding, studentY + (rowSpacing * 2), { baseline: 'middle' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const parentLabelWidth = doc.getTextWidth(parentLabel);
    // Check if parent name fits
    let displayParentName = parentName;
    const maxParentWidth = contentWidth - (boxPadding * 2) - parentLabelWidth - labelValueGap;
    if (doc.getTextWidth(displayParentName) > maxParentWidth) {
      while (doc.getTextWidth(displayParentName + '...') > maxParentWidth && displayParentName.length > 3) {
        displayParentName = displayParentName.slice(0, -1);
      }
      displayParentName = displayParentName + '...';
    }
    doc.text(displayParentName, margin + boxPadding + parentLabelWidth + labelValueGap, 
             studentY + (rowSpacing * 2), { baseline: 'middle' });

    // Fourth row: Registration & Roll Number
    const fourthRowY = studentY + (rowSpacing * 3);
    
    // Registration Number
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...secondaryColor);
    doc.text('Reg #:', margin + boxPadding, fourthRowY, { baseline: 'middle' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const regLabelWidth = doc.getTextWidth('Reg #:');
    doc.text(registrationNumber, margin + boxPadding + regLabelWidth + labelValueGap, 
             fourthRowY, { baseline: 'middle' });

    // Fifth row: Roll Number & Branch
    const fifthRowY = studentY + (rowSpacing * 4);
    
    // Roll Number
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...secondaryColor);
    doc.text('Roll #:', margin + boxPadding, fifthRowY, { baseline: 'middle' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const rollLabelWidth = doc.getTextWidth('Roll #:');
    doc.text(rollNumber, margin + boxPadding + rollLabelWidth + labelValueGap, 
             fifthRowY, { baseline: 'middle' });

    // Branch (on same line if space available)
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...secondaryColor);
    const rollEndX = margin + boxPadding + rollLabelWidth + labelValueGap + doc.getTextWidth(rollNumber);
    if (rollEndX + doc.getTextWidth('Branch:') + labelValueGap + doc.getTextWidth(branchName) < margin + contentWidth - boxPadding) {
      doc.text('Branch:', rollEndX + 10, fifthRowY, { baseline: 'middle' });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      const branchLabelWidth = doc.getTextWidth('Branch:');
      doc.text(branchName, rollEndX + 10 + branchLabelWidth + labelValueGap, 
               fifthRowY, { baseline: 'middle' });
    }

  } else {
    // Desktop: Two-column layout with adjusted widths
    const labelWidth = 35; // Reduced for better fit
    const leftColX = margin + boxPadding;
    const rightColX = margin + (contentWidth * 0.55); // Adjusted column split
    const valueOffset = labelWidth + 3; // Reduced space between label and value
    
    // Set font for labels
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...secondaryColor);
    
    // Left Column - Labels
    doc.text('Student Name:', leftColX, studentY, { baseline: 'middle' });
    doc.text('Class & Section:', leftColX, studentY + lineHeight, { baseline: 'middle' });
    doc.text(parentLabel, leftColX, studentY + (lineHeight * 2), { baseline: 'middle' });

    // Right Column - Labels
    doc.text('Registration #:', rightColX, studentY, { baseline: 'middle' });
    doc.text('Roll Number:', rightColX, studentY + lineHeight, { baseline: 'middle' });
    doc.text('Branch:', rightColX, studentY + (lineHeight * 2), { baseline: 'middle' });

    // Set font for values
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    // Calculate available width for values
    const leftValueWidth = rightColX - leftColX - valueOffset - 5;
    const rightValueWidth = margin + contentWidth - rightColX - valueOffset - boxPadding;
    
    // Left Column - Values with text wrapping
    let displayStudentName = studentName;
    if (doc.getTextWidth(displayStudentName) > leftValueWidth) {
      while (doc.getTextWidth(displayStudentName + '...') > leftValueWidth && displayStudentName.length > 3) {
        displayStudentName = displayStudentName.slice(0, -1);
      }
      displayStudentName = displayStudentName + '...';
    }
    doc.text(displayStudentName, leftColX + valueOffset, studentY, { baseline: 'middle' });
    
    doc.text(`${className} - ${section}`, leftColX + valueOffset, studentY + lineHeight, { baseline: 'middle' });
    
    let displayParentName = parentName;
    if (doc.getTextWidth(displayParentName) > leftValueWidth) {
      while (doc.getTextWidth(displayParentName + '...') > leftValueWidth && displayParentName.length > 3) {
        displayParentName = displayParentName.slice(0, -1);
      }
      displayParentName = displayParentName + '...';
    }
    doc.text(displayParentName, leftColX + valueOffset, studentY + (lineHeight * 2), { baseline: 'middle' });

    // Right Column - Values
    doc.text(registrationNumber, rightColX + valueOffset, studentY, { baseline: 'middle' });
    doc.text(rollNumber, rightColX + valueOffset, studentY + lineHeight, { baseline: 'middle' });
    doc.text(branchName, rightColX + valueOffset, studentY + (lineHeight * 2), { baseline: 'middle' });
  }
  
  yPosition += studentBoxHeight + (isMobile ? 4 : 6);
  
  // ========== FEE PERIOD SECTION ==========
  // Section header with enhanced styling
  doc.setFillColor(...primaryColor);
  doc.roundedRect(margin, yPosition, contentWidth, isMobile ? 7 : 9, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(h3Size);
  doc.setFont('helvetica', 'bold');
  doc.text('FEE PERIOD', margin + boxPadding, yPosition + (isMobile ? 4 : 5));

  yPosition += (isMobile ? 8 : 10);

  // Enhanced Fee period box with gradient background
  const periodBoxHeight = isMobile ? 16 : 18;

  // Main background
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin, yPosition, contentWidth, periodBoxHeight, 3, 3, 'F');

  // Add subtle gradient effect
  doc.setFillColor(240, 245, 250);
  doc.roundedRect(margin, yPosition, contentWidth, periodBoxHeight * 0.4, 3, 3, 'F');

  // Border with primary color
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, yPosition, contentWidth, periodBoxHeight, 3, 3, 'S');
  
  const periodY = yPosition + boxPadding;
  
  const monthName = MONTHS.find(m => m.value === voucher.month.toString())?.label || voucher.month;
  const dueDate = voucher.dueDate ? new Date(voucher.dueDate).toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }) : 'N/A';
  
  doc.setFontSize(bodySize);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  if (isMobile) {
    // Mobile: Two lines for better readability
    doc.text(`Month: ${monthName} ${voucher.year}`, 
             margin + boxPadding, periodY, { baseline: 'middle' });
    doc.text(`Due: ${dueDate}`, 
             margin + contentWidth - boxPadding, periodY, 
             { align: 'right', baseline: 'middle' });
  } else {
    // Desktop: Three sections with proper spacing
    const centerY = periodY;
    
    // Left: Month and Year
    doc.text(`For: ${monthName} ${voucher.year}`, 
             margin + boxPadding, centerY, { baseline: 'middle' });
    
    // Center: Due Date
    doc.text(`Due: ${dueDate}`, 
             pageWidth / 2, centerY, 
             { align: 'center', baseline: 'middle' });
    
    // Right: Fee Template (truncated if needed)
    const templateName = voucher.templateId?.name || 'N/A';
    let displayTemplate = `Template: ${templateName}`;
    const maxTemplateWidth = contentWidth * 0.3;
    if (doc.getTextWidth(displayTemplate) > maxTemplateWidth) {
      while (doc.getTextWidth(displayTemplate + '...') > maxTemplateWidth && displayTemplate.length > 10) {
        displayTemplate = displayTemplate.slice(0, -1);
      }
      displayTemplate = displayTemplate + '...';
    }
    doc.text(displayTemplate, 
             margin + contentWidth - boxPadding, centerY, 
             { align: 'right', baseline: 'middle' });
  }
  
  yPosition += periodBoxHeight + (isMobile ? 4 : 6);

  // ========== FEE BREAKDOWN SECTION ==========
  // Section header
  doc.setFillColor(...primaryColor);
  doc.roundedRect(margin, yPosition, contentWidth, isMobile ? 7 : 9, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(h3Size);
  doc.setFont('helvetica', 'bold');
  doc.text('FEE BREAKDOWN', margin + boxPadding, yPosition + (isMobile ? 4 : 5));

  yPosition += (isMobile ? 8 : 10);

  // Prepare fee items
  const feeItems = [
    { description: 'Tuition Fee', amount: voucher.amount || 0 },
    { description: 'Examination Fee', amount: voucher.examinationFee || 0 },
    { description: 'Library Fee', amount: voucher.libraryFee || 0 },
    { description: 'Sports Fee', amount: voucher.sportsFee || 0 },
    { description: 'Computer Fee', amount: voucher.computerFee || 0 },
    { description: 'Science Lab Fee', amount: voucher.scienceLabFee || 0 },
    { description: 'Transport Fee', amount: voucher.transportFee || 0 },
    { description: 'Activity Fee', amount: voucher.activityFee || 0 },
    { description: 'Late Fee Fine', amount: voucher.lateFeeAmount || 0 },
    { description: 'Other Charges', amount: voucher.otherCharges || 0 },
  ];

  // Filter non-zero items
  const nonZeroItems = feeItems.filter(item => item.amount > 0);

  // Add discount if applicable
  if (voucher.discountAmount > 0) {
    nonZeroItems.push({ description: 'Discount', amount: -voucher.discountAmount });
  }

  // Calculate table dimensions
  const headerHeight = isMobile ? 10 : 12;
  const rowHeight = isMobile ? 10 : 12;
  const totalRowHeight = isMobile ? 12 : 15;
  const tableHeight = headerHeight + (nonZeroItems.length * rowHeight) + totalRowHeight;

  // Calculate column widths - optimized for better fit
  const descColWidth = contentWidth * 0.6; // 60% for description
  const amountColWidth = contentWidth * 0.4; // 40% for amount

  // Column positions
  const descHeaderX = margin + boxPadding;
  const amountHeaderX = margin + descColWidth;
  const amountEndX = margin + contentWidth - boxPadding;

  // Table header
  doc.setFillColor(...primaryColor);
  doc.roundedRect(margin, yPosition, contentWidth, headerHeight, 1, 1, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(isMobile ? 9 : 11);
  doc.setFont('helvetica', 'bold');
  doc.text('Description', descHeaderX, yPosition + headerHeight/2, { baseline: 'middle' });
  doc.text('Amount (PKR)', amountEndX, yPosition + headerHeight/2, { align: 'right', baseline: 'middle' });

  let currentY = yPosition + headerHeight;

  // Table rows
  let subTotal = 0;

  nonZeroItems.forEach((item, index) => {
    // Alternate row background
    if (index % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(249, 250, 251);
    }
    doc.rect(margin, currentY, contentWidth, rowHeight, 'F');

    // Description with truncation
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(isMobile ? 8 : 10);

    let description = item.description;
    const maxDescWidth = descColWidth - (boxPadding * 2);
    
    if (doc.getTextWidth(description) > maxDescWidth) {
      while (doc.getTextWidth(description + '...') > maxDescWidth && description.length > 3) {
        description = description.slice(0, -1);
      }
      description = description + '...';
    }

    doc.text(description, descHeaderX, currentY + rowHeight/2, { baseline: 'middle' });

    // Amount
    const amountText = Math.abs(item.amount).toLocaleString('en-PK');
    const amountColor = item.amount < 0 ? warningColor : secondaryColor;
    doc.setTextColor(...amountColor);
    doc.setFont('helvetica', 'bold');

    const formattedAmount = item.amount < 0 ? `-${amountText}` : amountText;
    doc.text(formattedAmount, amountEndX, currentY + rowHeight/2, { align: 'right', baseline: 'middle' });

    subTotal += item.amount;
    currentY += rowHeight;
  });

  // Total row
  const totalAmount = voucher.totalAmount || Math.max(0, subTotal);

  doc.setFillColor(...highlightColor);
  doc.roundedRect(margin, currentY, contentWidth, totalRowHeight, 1, 1, 'F');

  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.5);
  doc.rect(margin, currentY, contentWidth, totalRowHeight);

  doc.setFontSize(isMobile ? 10 : 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(133, 77, 14);

  const totalLabel = 'TOTAL PAYABLE:';
  doc.text(totalLabel, descHeaderX, currentY + totalRowHeight/2, { baseline: 'middle' });

  const totalText = totalAmount.toLocaleString('en-PK');
  doc.text(totalText, amountEndX, currentY + totalRowHeight/2, { align: 'right', baseline: 'middle' });

  // Add vertical line to separate columns
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  doc.line(amountHeaderX, yPosition, amountHeaderX, yPosition + tableHeight);

  // Add border around entire table
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, yPosition, contentWidth, tableHeight, 2, 2, 'S');

  yPosition += tableHeight + (isMobile ? 8 : 12);

  // ========== PAYMENT STATUS SECTION ==========
  if (voucher.paidAmount > 0) {
    const paidAmount = voucher.paidAmount || 0;
    const remainingAmount = Math.max(0, totalAmount - paidAmount);
    
    const statusBoxHeight = isMobile ? 30 : 35;
    
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(margin, yPosition, contentWidth, statusBoxHeight, 2, 2, 'F');
    doc.setDrawColor(34, 197, 94);
    doc.setLineWidth(0.8);
    doc.rect(margin, yPosition, contentWidth, statusBoxHeight);
    
    // Status title
    doc.setTextColor(21, 128, 61);
    doc.setFontSize(isMobile ? 11 : 13);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT STATUS', margin + boxPadding, yPosition + (statusBoxHeight/3), { baseline: 'middle' });
    
    // Amount details
    doc.setFontSize(isMobile ? 9 : 11);
    doc.setFont('helvetica', 'normal');
    
    if (isMobile) {
      doc.setTextColor(21, 128, 61);
      doc.text(`Paid: ${paidAmount.toLocaleString('en-PK')}`, 
               margin + boxPadding, yPosition + (statusBoxHeight * 2/3), { baseline: 'middle' });
      
      if (remainingAmount > 0) {
        doc.setTextColor(220, 38, 38);
        doc.text(`Due: ${remainingAmount.toLocaleString('en-PK')}`, 
                 margin + contentWidth - boxPadding, yPosition + (statusBoxHeight * 2/3), 
                 { align: 'right', baseline: 'middle' });
      } else {
        doc.setTextColor(21, 128, 61);
        doc.text('✓ Fully Paid', margin + contentWidth - boxPadding, yPosition + (statusBoxHeight * 2/3), 
                 { align: 'right', baseline: 'middle' });
      }
    } else {
      doc.setTextColor(21, 128, 61);
      doc.text(`Amount Paid: ${paidAmount.toLocaleString('en-PK')}`, 
               margin + boxPadding, yPosition + (statusBoxHeight * 2/3), { baseline: 'middle' });
      
      if (remainingAmount > 0) {
        doc.setTextColor(220, 38, 38);
        doc.text(`Balance Due: ${remainingAmount.toLocaleString('en-PK')}`, 
                 margin + contentWidth - boxPadding, yPosition + (statusBoxHeight * 2/3), 
                 { align: 'right', baseline: 'middle' });
      } else {
        doc.setTextColor(21, 128, 61);
        doc.text('✓ Fully Paid', margin + contentWidth - boxPadding, yPosition + (statusBoxHeight * 2/3), 
                 { align: 'right', baseline: 'middle' });
      }
    }
    
    yPosition += statusBoxHeight + (isMobile ? 8 : 12);
  }

  // ========== INSTRUCTIONS SECTION ==========
  if (yPosition < pageHeight - 40) {
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(isMobile ? 8 : 9);
    doc.setFont('helvetica', 'italic');
    
    const instructions = [
      '• Pay before due date to avoid late charges',
      '• Keep this voucher for your records',
      '• Contact accounts office for queries'
    ];
    
    instructions.forEach((instruction, index) => {
      const instructionY = yPosition + (index * (isMobile ? 3 : 4));
      doc.text(instruction, margin + 2, instructionY, { baseline: 'middle' });
    });
    
    yPosition += isMobile ? 15 : 20;
  }
  
  // ========== FOOTER SECTION ==========
  const footerY = pageHeight - margin - (isMobile ? 20 : 25);
  
  // Horizontal line
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY, margin + contentWidth, footerY);
  
  // Signature areas
  doc.setFontSize(smallSize);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  
  if (!isMobile) {
    // Desktop: Two signature areas
    doc.text('____________________', margin + 50, footerY + 6, 
             { align: 'center', baseline: 'middle' });
    doc.text('Student/Parent Signature', margin + 50, footerY + 10, 
             { align: 'center', baseline: 'middle' });
    
    doc.text('____________________', margin + contentWidth - 50, footerY + 6, 
             { align: 'center', baseline: 'middle' });
    doc.text('Accounts Officer', margin + contentWidth - 50, footerY + 10, 
             { align: 'center', baseline: 'middle' });
  } else {
    // Mobile: Single signature area centered
    doc.text('____________________', pageWidth / 2, footerY + 6, 
             { align: 'center', baseline: 'middle' });
    doc.text('Student/Parent Signature', pageWidth / 2, footerY + 10, 
             { align: 'center', baseline: 'middle' });
  }
  
  // Footer text
  doc.setFontSize(smallSize);
  doc.setFont('helvetica', 'italic');
  
  const footerNoteY = pageHeight - margin - 3;
  doc.text('Computer Generated Document - No Signature Required', 
           pageWidth / 2, footerNoteY, 
           { align: 'center', baseline: 'middle' });
  
  // Generation timestamp
  doc.setFont('helvetica', 'normal');
  const timestamp = new Date().toLocaleString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  doc.text(`Generated: ${timestamp}`, 
           margin + contentWidth, footerY - 8, 
           { align: 'right', baseline: 'middle' });
  
  // School contact information
  doc.setTextColor(...primaryColor);
  doc.setFontSize(smallSize);
  doc.setFont('helvetica', 'bold');
  
  const contactText = 'EASE Academy • accounts@easeacademy.edu.pk • (042) 123-4567';
  const contactTextWidth = doc.getTextWidth(contactText);
  
  if (contactTextWidth > contentWidth) {
    // Split into two lines if too long
    doc.text('EASE Academy • accounts@easeacademy.edu.pk', 
             margin, footerY - 15, { baseline: 'middle' });
    doc.text('(042) 123-4567', margin, footerY - 10, { baseline: 'middle' });
  } else {
    doc.text(contactText, margin, footerY - 12, { baseline: 'middle' });
  }
  
  return doc.output('arraybuffer');
};