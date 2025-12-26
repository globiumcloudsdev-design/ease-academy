import { NextResponse } from 'next/server';
import Payroll from '@/backend/models/Payroll';
import User from '@/backend/models/User';
import Attendance from '@/backend/models/Attendance';
import EmployeeAttendance from '@/backend/models/EmployeeAttendance';
import Notification from '@/backend/models/Notification';
import { withAuth } from '@/backend/middleware/auth';
import { sendEmail } from '@/lib/utils';
import { generateSalarySlipPDF } from '@/lib/pdf-generator';
import { getPayrollEmailTemplate } from '@/backend/templates/payrollEmail';
import connectDB from '@/lib/database';

/**
 * POST /api/payroll/process
 * Process monthly payroll for teachers
 * Access: Super Admin, Branch Admin
 */
async function processPayrollHandler(request, user, userDoc) {
  try {
    await connectDB();
    
    const {
      teacherIds, // Array of teacher IDs or 'all'
      branchId, // For super admin: specific branch or 'all', For branch admin: their branch
      month,
      year,
      deductionType, // 'percentage' or 'fixed'
      deductionValue, // Amount or percentage
      remarks,
    } = await request.json();

    // Validation
    if (!month || !year) {
      return NextResponse.json(
        { success: false, error: 'Month and year are required' },
        { status: 400 }
      );
    }

    if (month < 1 || month > 12) {
      return NextResponse.json(
        { success: false, error: 'Invalid month' },
        { status: 400 }
      );
    }

    const currentYear = new Date().getFullYear();
    if (year < 2020 || year > currentYear + 1) {
      return NextResponse.json(
        { success: false, error: 'Invalid year' },
        { status: 400 }
      );
    }

    // Get user from request (set by auth middleware)
    const currentUser = user;

    // Build teacher query
    let teacherQuery = { role: 'teacher', status: 'active' };

    // Branch-specific logic
    if (currentUser.role === 'branch_admin') {
      teacherQuery.branchId = currentUser.branchId;
    } else if (currentUser.role === 'super_admin') {
      if (branchId && branchId !== 'all') {
        teacherQuery.branchId = branchId;
      }
    }

    // Teacher-specific logic
    if (teacherIds && teacherIds !== 'all' && Array.isArray(teacherIds)) {
      teacherQuery._id = { $in: teacherIds };
    }

    // Get all teachers matching criteria
    const teachers = await User.find(teacherQuery)
      .select('firstName lastName email phone teacherProfile branchId')
      .lean();

    if (!teachers || teachers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No teachers found matching criteria' },
        { status: 404 }
      );
    }

    // Get working days in the month
    const totalWorkingDays = getWorkingDaysInMonth(month, year);

    const results = {
      success: [],
      failed: [],
      skipped: [],
    };

    // Process each teacher
    for (const teacher of teachers) {
      try {
        // Check if payroll already exists for this teacher, month, year
        const existingPayroll = await Payroll.findOne({
          teacherId: teacher._id,
          month,
          year,
        });

        if (existingPayroll) {
          results.skipped.push({
            teacherId: teacher._id,
            teacherName: `${teacher.firstName} ${teacher.lastName}`,
            reason: 'Payroll already processed for this month',
          });
          continue;
        }

        // Get teacher salary details
        const salaryDetails = teacher.teacherProfile?.salaryDetails;
        if (!salaryDetails || !salaryDetails.basicSalary) {
          results.failed.push({
            teacherId: teacher._id,
            teacherName: `${teacher.firstName} ${teacher.lastName}`,
            reason: 'No salary information found',
          });
          continue;
        }

        // Get attendance data for the month
        const attendanceData = await getTeacherAttendance(teacher._id, month, year);

        // Calculate attendance deduction
        const absentDays = attendanceData.absentDays;
        let calculatedDeduction = 0;

        if (deductionType === 'percentage') {
          // Calculate per day salary
          const perDaySalary = salaryDetails.basicSalary / totalWorkingDays;
          calculatedDeduction = perDaySalary * absentDays * (deductionValue / 100);
        } else if (deductionType === 'fixed') {
          calculatedDeduction = deductionValue * absentDays;
        }

        // Create payroll record
        const payroll = new Payroll({
          teacherId: teacher._id,
          branchId: teacher.branchId,
          month,
          year,
          basicSalary: salaryDetails.basicSalary,
          allowances: {
            houseRent: salaryDetails.allowances?.houseRent || 0,
            medical: salaryDetails.allowances?.medical || 0,
            transport: salaryDetails.allowances?.transport || 0,
            other: salaryDetails.allowances?.other || 0,
          },
          deductions: {
            tax: salaryDetails.deductions?.tax || 0,
            providentFund: salaryDetails.deductions?.providentFund || 0,
            insurance: salaryDetails.deductions?.insurance || 0,
            other: salaryDetails.deductions?.other || 0,
          },
          attendanceDeduction: {
            totalWorkingDays,
            presentDays: attendanceData.presentDays,
            absentDays: attendanceData.absentDays,
            leaveDays: attendanceData.leaveDays,
            deductionType,
            deductionValue,
            calculatedDeduction,
          },
          remarks,
          processedBy: currentUser._id,
          paymentStatus: 'pending',
        });

        // Calculate net salary
        payroll.calculateNetSalary();

        // Save payroll
        await payroll.save();

        // Generate PDF
        const pdfBuffer = await generateSalarySlipPDF(payroll, teacher);

        // Send email with PDF
        const emailTemplate = getPayrollEmailTemplate('SALARY_SLIP', {
          teacher,
          payroll,
          month,
          year,
        });

        await sendEmail({
          to: teacher.email,
          subject: `Salary Slip - ${getMonthName(month)} ${year}`,
          html: emailTemplate,
          attachments: [
            {
              filename: `Salary_Slip_${month}_${year}.pdf`,
              content: pdfBuffer,
            },
          ],
        });

        // Mark email as sent
        payroll.emailSent = true;
        await payroll.save();

        // Create notification
        await Notification.create({
          type: 'general',
          title: 'Salary Slip Generated',
          message: `Your salary slip for ${getMonthName(month)} ${year} has been generated. Net Salary: PKR ${payroll.netSalary.toLocaleString()}`,
          targetUser: teacher._id,
          metadata: {
            payrollId: payroll._id,
            month,
            year,
            netSalary: payroll.netSalary,
          },
        });

        // Mark notification as sent
        payroll.notificationSent = true;
        await payroll.save();

        results.success.push({
          teacherId: teacher._id,
          teacherName: `${teacher.firstName} ${teacher.lastName}`,
          netSalary: payroll.netSalary,
          payrollId: payroll._id,
        });
      } catch (error) {
        console.error(`Error processing payroll for teacher ${teacher._id}:`, error);
        results.failed.push({
          teacherId: teacher._id,
          teacherName: `${teacher.firstName} ${teacher.lastName}`,
          reason: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payroll processing completed',
      results,
    });
  } catch (error) {
    console.error('Payroll processing error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Helper function to get working days in a month
 * Excludes Sundays
 */
function getWorkingDaysInMonth(month, year) {
  const date = new Date(year, month - 1, 1);
  let workingDays = 0;

  while (date.getMonth() === month - 1) {
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0) { // 0 = Sunday
      workingDays++;
    }
    date.setDate(date.getDate() + 1);
  }

  return workingDays;
}

/**
 * Helper function to get teacher attendance for a month
 * Uses EmployeeAttendance model for teachers
 */
async function getTeacherAttendance(teacherId, month, year) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  // Use EmployeeAttendance model for teachers
  const attendanceRecords = await EmployeeAttendance.find({
    userId: teacherId,
    date: { $gte: startDate, $lte: endDate },
  });

  const presentDays = attendanceRecords.filter(a => a.status === 'present' || a.status === 'late').length;
  const absentDays = attendanceRecords.filter(a => a.status === 'absent').length;
  const halfDays = attendanceRecords.filter(a => a.status === 'half-day').length;
  const leaveDays = attendanceRecords.filter(a => a.status === 'leave' || a.status === 'excused').length;

  // Half-days count as 0.5 absent days
  const adjustedAbsentDays = absentDays + (halfDays * 0.5);

  return {
    presentDays,
    absentDays: adjustedAbsentDays,
    leaveDays,
    halfDays,
    totalRecords: attendanceRecords.length,
  };
}

/**
 * Helper function to get month name
 */
function getMonthName(month) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month - 1];
}

export const POST = withAuth(processPayrollHandler, [requireRole(['super_admin', 'branch_admin'])]);
