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
  
  // Check if we're in a browser environment for responsive detection
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  
  // Professional Color Palette
  const primaryColor = [0, 102, 204]; // Professional Blue
  const secondaryColor = [52, 73, 94]; // Dark Gray
  const accentColor = [34, 197, 94]; // Green for amounts
  const warningColor = [245, 158, 11]; // Amber for warnings
  const borderColor = [229, 231, 235]; // Light Gray for borders
  const highlightColor = [254, 252, 232]; // Soft Yellow for highlights
  
  // Page dimensions
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = isMobile ? 8 : 12;
  const contentWidth = pageWidth - (2 * margin);
  
  // Responsive font sizes
  const h1Size = isMobile ? 20 : 24;
  const h2Size = isMobile ? 14 : 16;
  const h3Size = isMobile ? 12 : 14;
  const bodySize = isMobile ? 9 : 10;
  const smallSize = isMobile ? 7 : 8;
  
  // Responsive spacing
  const lineHeight = isMobile ? 6 : 7;
  const sectionGap = isMobile ? 12 : 15;
  const boxPadding = isMobile ? 6 : 8;
  
  // Clear background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // ========== HEADER SECTION ==========
  let yPosition = margin;
  
  // School Header with badge
  doc.setFillColor(...primaryColor);
  doc.roundedRect(margin, yPosition, contentWidth, isMobile ? 35 : 40, 3, 3, 'F');
  
  // School badge/logo
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin + (isMobile ? 5 : 10), yPosition + (isMobile ? 8 : 10), 
                  isMobile ? 20 : 25, isMobile ? 20 : 25, 3, 3, 'F');
  doc.setTextColor(...primaryColor);
  doc.setFontSize(isMobile ? 12 : 16);
  doc.setFont('helvetica', 'bold');
  doc.text('EA', margin + (isMobile ? 15 : 22.5), yPosition + (isMobile ? 20 : 23), { align: 'center' });
  
  // School name with responsive positioning
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(h1Size);
  doc.setFont('helvetica', 'bold');
  const schoolName = isMobile ? 'EASE ACADEMY' : 'EASE ACADEMY';
  const schoolX = isMobile ? pageWidth / 2 : margin + (isMobile ? 40 : 50);
  doc.text(schoolName, schoolX, yPosition + (isMobile ? 18 : 22));
  
  // School motto
  if (!isMobile) {
    doc.setFontSize(bodySize);
    doc.setFont('helvetica', 'italic');
    doc.text('Center of Excellence', margin + 50, yPosition + 30);
  }
  
  // Voucher title
  doc.setFontSize(h2Size);
  doc.setFont('helvetica', 'bold');
  doc.text('FEE PAYMENT VOUCHER', pageWidth / 2, yPosition + (isMobile ? 30 : 35), { align: 'center' });
  
  yPosition += isMobile ? 40 : 45;
  
  // ========== VOUCHER INFO BADGE ==========
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, yPosition, contentWidth, isMobile ? 20 : 24, 3, 3, 'FD');
  
  // Voucher number
  doc.setTextColor(...primaryColor);
  doc.setFontSize(h3Size);
  doc.setFont('helvetica', 'bold');
  const voucherText = isMobile ? `Voucher #${voucher.voucherNumber}` : `Fee Voucher #${voucher.voucherNumber}`;
  doc.text(voucherText, margin + boxPadding, yPosition + (isMobile ? 8 : 10));
  
  // Issue date
  doc.setFontSize(bodySize);
  doc.setFont('helvetica', 'normal');
  const issueDate = new Date().toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  doc.text(`Issued: ${issueDate}`, contentWidth - margin - boxPadding, yPosition + (isMobile ? 8 : 10), { align: 'right' });
  
  yPosition += isMobile ? 25 : 28;
  
  // ========== STUDENT INFORMATION SECTION ==========
  // Section header
  doc.setTextColor(...secondaryColor);
  doc.setFontSize(h3Size);
  doc.setFont('helvetica', 'bold');
  doc.text('STUDENT DETAILS', margin, yPosition);
  
  yPosition += (isMobile ? 5 : 7);
  
  // Student info box
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin, yPosition, contentWidth, isMobile ? 45 : 50, 2, 2, 'F');
  doc.setDrawColor(...borderColor);
  doc.rect(margin, yPosition, contentWidth, isMobile ? 45 : 50);
  
  const studentY = yPosition + boxPadding;
  
  // Get student data with fallbacks
  const studentName = voucher.studentId?.fullName ||
                     `${voucher.studentId?.firstName || ''} ${voucher.studentId?.lastName || ''}`.trim() ||
                     'N/A';
  const fatherName = voucher.studentId?.fatherName || 
                    voucher.studentId?.studentProfile?.father?.name || 'N/A';
  const registrationNumber = voucher.studentId?.studentProfile?.registrationNumber ||
                            voucher.studentId?.registrationNumber || 'N/A';
  const rollNumber = voucher.studentId?.studentProfile?.rollNumber ||
                    voucher.studentId?.rollNumber || 'N/A';
  const className = voucher.classId?.name || 'N/A';
  const section = voucher.studentId?.studentProfile?.section || 'N/A';
  
  doc.setFontSize(bodySize);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  if (isMobile) {
    // Mobile: Stacked layout
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...secondaryColor);
    doc.text('Student:', margin + boxPadding, studentY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(studentName, margin + boxPadding + 20, studentY);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...secondaryColor);
    doc.text('Class:', margin + boxPadding, studentY + lineHeight);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`${className} - ${section}`, margin + boxPadding + 20, studentY + lineHeight);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...secondaryColor);
    doc.text('Father:', margin + boxPadding, studentY + (lineHeight * 2));
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(fatherName, margin + boxPadding + 20, studentY + (lineHeight * 2));
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...secondaryColor);
    doc.text('Reg #:', margin + contentWidth/2, studentY + (lineHeight * 3));
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(registrationNumber, margin + contentWidth/2 + 15, studentY + (lineHeight * 3));
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...secondaryColor);
    doc.text('Roll #:', margin + contentWidth/2, studentY + (lineHeight * 4));
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(rollNumber, margin + contentWidth/2 + 15, studentY + (lineHeight * 4));
  } else {
    // Desktop: Two-column layout
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...secondaryColor);
    doc.text('Student Name:', margin + boxPadding, studentY);
    doc.text('Class & Section:', margin + boxPadding, studentY + lineHeight);
    doc.text('Father Name:', margin + boxPadding, studentY + (lineHeight * 2));
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(studentName, margin + boxPadding + 30, studentY);
    doc.text(`${className} - ${section}`, margin + boxPadding + 30, studentY + lineHeight);
    doc.text(fatherName, margin + boxPadding + 30, studentY + (lineHeight * 2));
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...secondaryColor);
    doc.text('Registration #:', margin + contentWidth/2, studentY);
    doc.text('Roll Number:', margin + contentWidth/2, studentY + lineHeight);
    doc.text('Branch:', margin + contentWidth/2, studentY + (lineHeight * 2));
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(registrationNumber, margin + contentWidth/2 + 35, studentY);
    doc.text(rollNumber, margin + contentWidth/2 + 35, studentY + lineHeight);
    doc.text(voucher.branchId?.name || 'N/A', margin + contentWidth/2 + 35, studentY + (lineHeight * 2));
  }
  
  yPosition += isMobile ? 50 : 55;
  
  // ========== FEE PERIOD SECTION ==========
  // Section header
  doc.setTextColor(...secondaryColor);
  doc.setFontSize(h3Size);
  doc.setFont('helvetica', 'bold');
  doc.text('FEE PERIOD', margin, yPosition);
  
  yPosition += (isMobile ? 5 : 7);
  
  // Fee period box
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin, yPosition, contentWidth, isMobile ? 20 : 22, 2, 2, 'F');
  doc.setDrawColor(...borderColor);
  doc.rect(margin, yPosition, contentWidth, isMobile ? 20 : 22);
  
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
    doc.text(`Month: ${monthName} ${voucher.year}`, margin + boxPadding, periodY);
    doc.text(`Due: ${dueDate}`, margin + contentWidth - boxPadding, periodY, { align: 'right' });
  } else {
    doc.text(`For Month: ${monthName} ${voucher.year}`, margin + boxPadding, periodY);
    doc.text(`Due Date: ${dueDate}`, margin + contentWidth/2, periodY);
    doc.text(`Fee Template: ${voucher.templateId?.name || 'N/A'}`, margin + contentWidth - boxPadding, periodY, { align: 'right' });
  }
  
  yPosition += isMobile ? 25 : 28;
  
  // ========== FEE BREAKDOWN SECTION ==========
  // Section header
  doc.setTextColor(...secondaryColor);
  doc.setFontSize(h3Size);
  doc.setFont('helvetica', 'bold');
  doc.text('FEE BREAKDOWN', margin, yPosition);
  
  yPosition += (isMobile ? 5 : 7);
  
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
  
  // Calculate table height based on number of items
  const headerHeight = isMobile ? 8 : 10;
  const rowHeight = isMobile ? 8 : 10;
  const tableHeight = headerHeight + (nonZeroItems.length * rowHeight) + (isMobile ? 12 : 15);
  
  // Table header
  doc.setFillColor(...primaryColor);
  doc.roundedRect(margin, yPosition, contentWidth, headerHeight, 1, 1, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(isMobile ? 9 : 10);
  doc.setFont('helvetica', 'bold');
  doc.text('Description', margin + boxPadding, yPosition + (isMobile ? 5 : 7));
  doc.text('Amount (PKR)', margin + contentWidth - boxPadding, yPosition + (isMobile ? 5 : 7), { align: 'right' });
  
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
    
    // Description
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(item.description, margin + boxPadding, currentY + (isMobile ? 5 : 7));
    
    // Amount
    const amountText = Math.abs(item.amount).toLocaleString('en-PK');
    const amountColor = item.amount < 0 ? warningColor : secondaryColor;
    doc.setTextColor(...amountColor);
    doc.text(amountText, margin + contentWidth - boxPadding, currentY + (isMobile ? 5 : 7), { align: 'right' });
    
    subTotal += item.amount;
    currentY += rowHeight;
  });
  
  // Total row
  const totalAmount = voucher.totalAmount || Math.max(0, subTotal);
  
  doc.setFillColor(...highlightColor);
  doc.roundedRect(margin, currentY, contentWidth, isMobile ? 10 : 12, 1, 1, 'F');
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.5);
  doc.rect(margin, currentY, contentWidth, isMobile ? 10 : 12);
  
  doc.setFontSize(isMobile ? 10 : 11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(133, 77, 14);
  
  const totalLabel = isMobile ? 'TOTAL PAYABLE:' : 'TOTAL AMOUNT PAYABLE:';
  doc.text(totalLabel, margin + boxPadding, currentY + (isMobile ? 6 : 8));
  doc.text(totalAmount.toLocaleString('en-PK'), margin + contentWidth - boxPadding, 
           currentY + (isMobile ? 6 : 8), { align: 'right' });
  
  yPosition += tableHeight + sectionGap;
  
  // ========== PAYMENT STATUS SECTION ==========
  if (voucher.paidAmount > 0) {
    const paidAmount = voucher.paidAmount || 0;
    const remainingAmount = Math.max(0, totalAmount - paidAmount);
    
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(margin, yPosition, contentWidth, isMobile ? 25 : 30, 3, 3, 'F');
    doc.setDrawColor(34, 197, 94);
    doc.rect(margin, yPosition, contentWidth, isMobile ? 25 : 30);
    
    doc.setTextColor(21, 128, 61);
    doc.setFontSize(isMobile ? 11 : 12);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT STATUS', margin + boxPadding, yPosition + (isMobile ? 8 : 10));
    
    doc.setFontSize(bodySize);
    doc.setFont('helvetica', 'normal');
    
    if (isMobile) {
      doc.text(`Paid: PKR ${paidAmount.toLocaleString('en-PK')}`, margin + boxPadding, yPosition + 18);
      if (remainingAmount > 0) {
        doc.setTextColor(220, 38, 38);
        doc.text(`Due: PKR ${remainingAmount.toLocaleString('en-PK')}`, margin + contentWidth - boxPadding, 
                 yPosition + 18, { align: 'right' });
      } else {
        doc.setTextColor(21, 128, 61);
        doc.text('✓ Fully Paid', margin + contentWidth - boxPadding, yPosition + 18, { align: 'right' });
      }
    } else {
      doc.text(`Amount Paid: PKR ${paidAmount.toLocaleString('en-PK')}`, margin + boxPadding, yPosition + 20);
      if (remainingAmount > 0) {
        doc.setTextColor(220, 38, 38);
        doc.text(`Balance Due: PKR ${remainingAmount.toLocaleString('en-PK')}`, 
                 margin + contentWidth - boxPadding, yPosition + 20, { align: 'right' });
      } else {
        doc.setTextColor(21, 128, 61);
        doc.text('✓ Fully Paid', margin + contentWidth - boxPadding, yPosition + 20, { align: 'right' });
      }
    }
    
    yPosition += isMobile ? 30 : 35;
  }
  
  // ========== INSTRUCTIONS SECTION ==========
  if (yPosition < pageHeight - 50) {
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(isMobile ? 9 : 10);
    doc.setFont('helvetica', 'italic');
    
    const instructions = [
      '• Please pay before due date to avoid late fee charges.',
      '• Keep this voucher for your records.',
      '• Contact accounts office for any queries.'
    ];
    
    instructions.forEach((instruction, index) => {
      doc.text(instruction, margin, yPosition + (index * (isMobile ? 4 : 5)));
    });
    
    yPosition += isMobile ? 20 : 25;
  }
  
  // ========== FOOTER SECTION ==========
  const footerY = pageHeight - margin - (isMobile ? 25 : 30);
  
  // Horizontal line
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY, margin + contentWidth, footerY);
  
  // Signature areas
  doc.setFontSize(smallSize);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  
  if (!isMobile) {
    // Desktop: Two signature areas
    doc.text('____________________', margin + 40, footerY + 8);
    doc.text('Student/Parent Signature', margin + 40, footerY + 13, { align: 'center' });
    
    doc.text('____________________', margin + contentWidth - 40, footerY + 8);
    doc.text('Accounts Officer', margin + contentWidth - 40, footerY + 13, { align: 'center' });
  }
  
  // Footer text
  doc.setFontSize(smallSize);
  doc.setFont('helvetica', 'italic');
  doc.text('Computer Generated Document - No Signature Required', pageWidth / 2, pageHeight - margin - 5, { align: 'center' });
  
  // Generation timestamp
  doc.setFont('helvetica', 'normal');
  const timestamp = new Date().toLocaleString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Generated: ${timestamp}`, pageWidth - margin, pageHeight - margin - 10, { align: 'right' });
  
  // School contact
  doc.setTextColor(...primaryColor);
  doc.setFontSize(smallSize);
  doc.setFont('helvetica', 'bold');
  doc.text('EASE Academy • accounts@easeacademy.edu.pk • (042) 123-4567', margin, pageHeight - margin - 10);
  
  return doc.output('arraybuffer');
};