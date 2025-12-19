import { NextResponse } from 'next/server';
import FeeVoucher from '@/backend/models/FeeVoucher';
import FeeTemplate from '@/backend/models/FeeTemplate';
import User from '@/backend/models/User';
import Counter from '@/backend/models/Counter';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';

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
        .populate('studentId', 'name email rollNumber')
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

// POST /api/branch-admin/fee-vouchers - Generate vouchers
export const POST = withAuth(async (request, user, userDoc) => {
  try {
    await connectDB();

      const body = await request.json();
      const { templateId, studentIds, dueDate, month, year, remarks } = body;

      // Validate required fields
      if (!templateId || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Template and students are required' },
          { status: 400 }
        );
      }

      if (!dueDate || !month || !year) {
        return NextResponse.json(
          { success: false, message: 'Due date, month, and year are required' },
          { status: 400 }
        );
      }

      // Get template
      const template = await FeeTemplate.findById(templateId);
      if (!template) {
        return NextResponse.json(
          { success: false, message: 'Template not found' },
          { status: 404 }
        );
      }

      // Get students
      const students = await User.find({
        _id: { $in: studentIds },
        role: 'student',
        branchId: user.branchId,
      }).lean();

      if (students.length === 0) {
        return NextResponse.json(
          { success: false, message: 'No valid students found' },
          { status: 400 }
        );
      }

      const createdVouchers = [];
      const errors = [];

      for (const student of students) {
        try {
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
              studentName: student.name,
              message: 'Voucher already exists for this month',
            });
            continue;
          }

          // Generate voucher number
          const counter = await Counter.findOneAndUpdate(
            { name: 'feeVoucher' },
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

          const totalAmount = baseAmount - discountAmount;

          // Create voucher
          const voucher = await FeeVoucher.create({
            voucherNumber,
            studentId: student._id,
            templateId,
            branchId: user.branchId,
            classId: student.classId,
            month: parseInt(month),
            year: parseInt(year),
            dueDate: new Date(dueDate),
            amount: baseAmount,
            discountAmount,
            totalAmount,
            remainingAmount: totalAmount,
            status: 'pending',
            remarks,
            createdBy: user.userId,
          });

          createdVouchers.push(voucher);
        } catch (error) {
          errors.push({
            studentId: student._id,
            studentName: student.name,
            message: error.message,
          });
        }
      }

    return NextResponse.json({
      success: true,
      message: `Generated ${createdVouchers.length} vouchers successfully`,
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
