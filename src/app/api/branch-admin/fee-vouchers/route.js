import { NextResponse } from 'next/server';
import FeeVoucher from '@/backend/models/FeeVoucher';
import FeeTemplate from '@/backend/models/FeeTemplate';
import User from '@/backend/models/User';
import Counter from '@/backend/models/Counter';
import Notification from '@/backend/models/Notification';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import Class from '@/backend/models/Class';
import { sendEmail } from '@/backend/utils/emailService';
import { getStudentEmailTemplate } from '@/backend/templates/studentEmail';
import { getParentEmailTemplate } from '@/backend/templates/parentEmail';

// GET /api/branch-admin/fee-vouchers - Get all vouchers
export const GET = withAuth(async (request, user, userDoc) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const classId = searchParams.get('classId');

    const query = { branchId: user.branchId };

      if (status) {
        query.status = status;
      }

      if (month) {
        query.month = parseInt(month);
      }

      if (year) {
        query.year = parseInt(year);
      }

      if (classId) {
        query.classId = classId;
      }

    if (search) {
      query.$or = [
        { voucherNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [vouchers, total] = await Promise.all([
      FeeVoucher.find(query)
        .populate('studentId', 'fullName firstName lastName email studentProfile.rollNumber')
        .populate('templateId', 'name code category')
        .populate('classId', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      FeeVoucher.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        vouchers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching fee vouchers:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch fee vouchers' },
      { status: 500 }
    );
  }
}, [requireRole(['branch_admin'])]);

// POST /api/branch-admin/fee-vouchers - Generate vouchers (intelligent auto-selection)
export const POST = withAuth(async (request, user, userDoc) => {
  try {
    await connectDB();

      const body = await request.json();
      const { templateId, studentIds, dueDate, month, year, remarks } = body;

      // Validate required fields
      if (!templateId) {
        return NextResponse.json(
          { success: false, message: 'Template is required' },
          { status: 400 }
        );
      }

      if (!dueDate || !month || !year) {
        return NextResponse.json(
          { success: false, message: 'Due date, month, and year are required' },
          { status: 400 }
        );
      }

      // Get template with populated classes
      const template = await FeeTemplate.findById(templateId).populate('classes').lean();
      if (!template) {
        return NextResponse.json(
          { success: false, message: 'Template not found' },
          { status: 404 }
        );
      }

      // Auto-select students based on template applicableTo (if studentIds not provided)
      let students;
      if (studentIds && Array.isArray(studentIds) && studentIds.length > 0) {
        // Manual selection provided (backward compatibility)
        students = await User.find({
          _id: { $in: studentIds },
          role: 'student',
          branchId: user.branchId,
          status: 'active'
        }).lean();
      } else {
        // Auto-select based on template
        let studentQuery = { role: 'student', branchId: user.branchId, status: 'active' };

        if (template.applicableTo === 'class-specific' && template.classes && template.classes.length > 0) {
          const classIds = template.classes.map(c => c._id || c);
          studentQuery['studentProfile.classId'] = { $in: classIds };
        } else if (template.applicableTo === 'student-specific') {
          return NextResponse.json({ success: false, message: 'Student-specific templates require student IDs' }, { status: 400 });
        }
        // else applicableTo === 'all' - all active students

        students = await User.find(studentQuery).lean();
      }

      if (students.length === 0) {
        return NextResponse.json(
          { success: false, message: 'No eligible students found' },
          { status: 400 }
        );
      }

      const createdVouchers = [];
      const errors = [];

      for (const student of students) {
        let studentName = 'Student';
        try {
          studentName = student.fullName || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student';
          // Check if voucher already exists
          const existingVoucher = await FeeVoucher.findOne({
            studentId: student._id,
            templateId,
            month: parseInt(month),
            year: parseInt(year),
          });

          if (existingVoucher) {
            errors.push({
              studentId: student._id,
              studentName,
              message: 'Voucher already exists for this month',
            });
            continue;
          }

          // Check for unpaid previous vouchers to calculate late fee
          const unpaidVouchers = await FeeVoucher.find({
            studentId: student._id,
            branchId: user.branchId,
            status: { $in: ['pending', 'partial', 'overdue'] },
            dueDate: { $lt: new Date(dueDate) }
          }).lean();

          let lateFeeAmount = 0;
          if (template.lateFee?.enabled && unpaidVouchers.length > 0) {
            const totalUnpaid = unpaidVouchers.reduce((sum, v) => sum + (v.remainingAmount || v.totalAmount), 0);
            if (template.lateFee.type === 'percentage') {
              lateFeeAmount = (totalUnpaid * template.lateFee.amount) / 100;
            } else {
              lateFeeAmount = template.lateFee.amount * unpaidVouchers.length;
            }
          }

          // Generate voucher number
          const counter = await Counter.findOneAndUpdate(
            { _id: 'feeVoucher' },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
          );

          const voucherNumber = `FV-${year}-${String(month).padStart(2, '0')}-${String(counter.seq).padStart(6, '0')}`;

          // Calculate amounts
          const baseAmount = template.amount || 0;
          const discountAmount = template.discount?.enabled 
            ? (template.discount.type === 'percentage' 
              ? (baseAmount * template.discount.amount) / 100 
              : template.discount.amount)
            : 0;

          const totalAmount = baseAmount - discountAmount + lateFeeAmount;

          // Create voucher
          const voucher = await FeeVoucher.create({
            voucherNumber,
            studentId: student._id,
            templateId,
            branchId: user.branchId,
            classId: student.studentProfile?.classId,
            month: parseInt(month),
            year: parseInt(year),
            dueDate: new Date(dueDate),
            amount: baseAmount,
            discountAmount,
            lateFeeAmount,
            totalAmount,
            remainingAmount: totalAmount,
            status: 'pending',
            remarks,
            createdBy: user.userId,
          });

          createdVouchers.push(voucher);

          // Create notification for student
          await Notification.create({
            type: 'fee_voucher',
            title: 'Fee Voucher Generated',
            message: `Your fee voucher for ${month}/${year} has been generated. Amount: Rs. ${totalAmount.toLocaleString()}. Due: ${new Date(dueDate).toLocaleDateString()}`,
            targetUser: student._id,
            metadata: {
              voucherNumber,
              voucherId: voucher._id,
              amount: totalAmount,
              dueDate,
              month,
              year
            }
          });

          // Send email to student
          if (student.email) {
            const studentEmailHtml = getStudentEmailTemplate('fee_voucher_generated', {
              studentName,
              name: studentName,
              voucherNumber,
              amount: baseAmount,
              discountAmount,
              lateFeeAmount,
              totalAmount,
              dueDate,
              month,
              year,
              category: template.category
            });
            await sendEmail(student.email, `Fee Voucher Generated - ${voucherNumber}`, studentEmailHtml);
          }

          // Send email to parent/guardian
          const parentEmail = student.studentProfile?.father?.email || student.studentProfile?.mother?.email || student.studentProfile?.guardian?.email;
          const parentName = student.studentProfile?.father?.name || student.studentProfile?.mother?.name || student.studentProfile?.guardian?.name;
          if (parentEmail) {
            const parentEmailHtml = getParentEmailTemplate('CHILD_FEE_VOUCHER', {
              firstName: parentName || 'Parent',
              childName: studentName,
              voucherNumber,
              amount: baseAmount,
              discountAmount,
              lateFeeAmount,
              totalAmount,
              dueDate,
              month,
              year,
              category: template.category,
              className: ''
            });
              await sendEmail(parentEmail, `Fee Voucher for ${studentName} - ${voucherNumber}`, parentEmailHtml);
            
            // Create notification for parent if they have account
            const parentUser = await User.findOne({ email: parentEmail, role: 'parent' });
            if (parentUser) {
              await Notification.create({
                type: 'fee_voucher',
                title: `Fee Voucher - ${studentName}`,
                message: `Fee voucher generated for your child ${studentName}. Amount: Rs. ${totalAmount.toLocaleString()}. Due: ${new Date(dueDate).toLocaleDateString()}`,
                targetUser: parentUser._id,
                childId: student._id,
                metadata: {
                  voucherNumber,
                  voucherId: voucher._id,
                  amount: totalAmount,
                  dueDate,
                  month,
                  year,
                  studentName
                }
              });
            }
          }

        } catch (error) {
          console.error(`Error generating voucher for student ${student._id}:`, error);
          errors.push({
            studentId: student._id,
            studentName,
            message: error.message,
          });
        }
      }

    return NextResponse.json({
      success: true,
      message: `Generated ${createdVouchers.length} vouchers successfully${errors.length > 0 ? ` (${errors.length} failed)` : ''}`,
      data: {
        vouchers: createdVouchers,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    console.error('Error generating fee vouchers:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to generate fee vouchers' },
      { status: 500 }
    );
  }
}, [requireRole(['branch_admin'])]);
