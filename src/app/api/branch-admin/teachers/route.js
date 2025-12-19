import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import { sendEmail } from '@/backend/utils/emailService';
import { getTeacherEmailTemplate } from '@/backend/templates/teacherEmail';
import { generateTeacherQR } from '@/lib/qr-generator';
import { uploadToCloudinary } from '@/lib/cloudinary';
import Department from '@/backend/models/Department';
import Subject from '@/backend/models/Subject';

// GET - Get all teachers for branch admin's branch
async function getTeachers(request, authenticatedUser, userDoc) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    if (!authenticatedUser.branchId) {
      return NextResponse.json(
        { success: false, message: 'No branch assigned' },
        { status: 400 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const departmentId = searchParams.get('departmentId');

    // Build query - only for this branch, role = teacher
    const query = { 
      role: 'teacher',
      branchId: authenticatedUser.branchId 
    };
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'teacherProfile.employeeId': { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      query.status = status;
    }

    if (departmentId) {
      query['teacherProfile.departmentId'] = departmentId;
    }

    const skip = (page - 1) * limit;

    const [teachers, total] = await Promise.all([
      User.find(query)
        .populate('teacherProfile.departmentId', 'name code')
        .populate('teacherProfile.subjects', 'name code')
        .populate('teacherProfile.classes.classId', 'name code grade')
        .populate('teacherProfile.classes.subjectId', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        teachers,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get teachers error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch teachers' },
      { status: 500 }
    );
  }
}

// POST - Create new teacher (only for branch admin's branch)
async function createTeacher(request, authenticatedUser, userDoc) {
  try {
    if (authenticatedUser.role !== 'branch_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    if (!authenticatedUser.branchId) {
      return NextResponse.json(
        { success: false, message: 'No branch assigned' },
        { status: 400 }
      );
    }

    await connectDB();

    const body = await request.json();

    // Prepare teacher user data
    // Always require a password for teacher login
    const password = body.password || 'Teacher@123';
    const userData = {
      role: 'teacher',
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone || '',
      alternatePhone: body.alternatePhone || '',
      dateOfBirth: body.dateOfBirth || null,
      gender: body.gender || 'male',
      bloodGroup: body.bloodGroup || '',
      religion: body.religion || '',
      nationality: body.nationality || 'Pakistani',
      cnic: body.cnic || '',
      passwordHash: password, // Will be hashed by pre-save hook
      branchId: authenticatedUser.branchId,
      createdBy: authenticatedUser.userId,
      isActive: true,
      status: body.status || 'active',
    };

    // Set address
    if (body.address) {
      userData.address = body.address;
    }

    // Set profile photo
    if (body.profilePhoto && typeof body.profilePhoto === 'object') {
      userData.profilePhoto = {
        url: body.profilePhoto.url || '',
        publicId: body.profilePhoto.publicId || '',
        uploadedAt: body.profilePhoto.uploadedAt || new Date(),
      };
    }

    // Map teacher-specific fields to teacherProfile
    userData.teacherProfile = {
      joiningDate: body.joiningDate || new Date(),
      designation: body.designation || 'Teacher',
      qualifications: body.teacherProfile?.qualifications || body.qualifications || [],
      experience: body.teacherProfile?.experience || body.experience || { totalYears: 0, previousInstitutions: [] },
      subjects: body.teacherProfile?.subjects || body.subjects || [],
      classes: body.teacherProfile?.classes || body.classes || [],
      salaryDetails: {
        basicSalary: body.basicSalary || body.salaryDetails?.basicSalary || 0,
        allowances: {
          houseRent: body.allowances?.houseRent || body.salaryDetails?.allowances?.houseRent || 0,
          medical: body.allowances?.medical || body.salaryDetails?.allowances?.medical || 0,
          transport: body.allowances?.transport || body.salaryDetails?.allowances?.transport || 0,
          other: body.allowances?.other || body.salaryDetails?.allowances?.other || 0,
        },
        deductions: body.salaryDetails?.deductions || {
          tax: 0,
          providentFund: 0,
          insurance: 0,
          other: 0,
        },
      },
      emergencyContact: body.emergencyContact || {},
      documents: body.documents || [],
      bankAccount: {
        bankName: body.bankAccount?.bankName || '',
        accountNumber: body.bankAccount?.accountNumber || '',
        iban: body.bankAccount?.iban || '',
        branchCode: body.bankAccount?.branchCode || '',
      },
    };

    // Optional: map departmentId/department from nested teacherProfile if provided
    if (body.teacherProfile?.departmentId) {
      userData.teacherProfile.departmentId = body.teacherProfile.departmentId;
    } else if (body.departmentId) {
      userData.teacherProfile.departmentId = body.departmentId;
    }

    if (typeof body.teacherProfile?.department === 'string' && body.teacherProfile.department.trim()) {
      userData.teacherProfile.department = body.teacherProfile.department;
    } else if (typeof body.department === 'string' && body.department.trim()) {
      userData.teacherProfile.department = body.department;
    }

    // Create user with teacherProfile
    // Remove any empty-string values to avoid enum/ObjectId cast errors
    const removeEmptyStrings = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      Object.keys(obj).forEach((k) => {
        const v = obj[k];
        if (v === '') {
          delete obj[k];
        } else if (Array.isArray(v)) {
          obj[k] = v.map((item) => (typeof item === 'object' ? removeEmptyStrings(item) : item)).filter((item) => item !== undefined);
          if (obj[k].length === 0) delete obj[k];
        } else if (v && typeof v === 'object') {
          removeEmptyStrings(v);
          if (Object.keys(v).length === 0) delete obj[k];
        }
      });
      return obj;
    };

    removeEmptyStrings(userData);

    const teacher = new User(userData);
    await teacher.save();

    // Try to generate QR code for teacher (non-blocking)
    try {
      const qrDataURL = await generateTeacherQR(teacher);
      const qrUpload = await uploadToCloudinary(qrDataURL, {
        folder: `ease-academy/teachers/${teacher._id}/qr`,
        resourceType: 'image',
      });
      teacher.teacherProfile = teacher.teacherProfile || {};
      teacher.teacherProfile.qr = {
        url: qrUpload.url,
        publicId: qrUpload.publicId,
        uploadedAt: new Date(),
      };
      await teacher.save();
    } catch (qrErr) {
      console.error('Branch-admin QR generation failed:', qrErr);
    }

    // Send welcome email to teacher if email provided
    try {
      if (teacher.email) {
        const html = getTeacherEmailTemplate('TEACHER_CREATED', teacher);
        await sendEmail(teacher.email, 'Welcome to School', html);
      }
    } catch (err) {
      console.error('Failed to send teacher created email:', err);
    }

    return NextResponse.json({
      success: true,
      data: teacher,
      message: 'Teacher created successfully',
    });
  } catch (error) {
    console.error('Create teacher error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create teacher' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getTeachers);
export const POST = withAuth(createTeacher);
