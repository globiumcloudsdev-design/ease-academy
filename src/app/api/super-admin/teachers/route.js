import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import { withAuth } from '@/backend/middleware/auth';
import { generateTeacherQR } from '@/lib/qr-generator';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { sendEmail } from '@/backend/utils/emailService';
import { getTeacherEmailTemplate } from '@/backend/templates/teacherEmail';
import Branch from '@/backend/models/Branch';
import Department from '@/backend/models/Department';
import Class from '@/backend/models/Class';

// GET - List all teachers with filters
export const GET = withAuth(async (request, authenticatedUser, userDoc) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;
    
    // Filters
    const search = searchParams.get('search') || '';
    const branchId = searchParams.get('branchId');
    const status = searchParams.get('status');
    const designation = searchParams.get('designation');
    const departmentId = searchParams.get('departmentId');
    
    // Build query for teachers
    const query = { role: 'teacher' };
    
    // Search across multiple fields
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { 'teacherProfile.employeeId': { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { cnic: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (branchId) query.branchId = branchId;
    if (status) query.status = status;
    if (designation) query['teacherProfile.designation'] = designation;
    if (departmentId) query['teacherProfile.departmentId'] = departmentId;
    
    // Execute query
    const [teachers, total] = await Promise.all([
      User.find(query)
        .populate('branchId', 'name code city')
        .populate('teacherProfile.departmentId', 'name code')
        .populate('teacherProfile.subjects', 'name code')
        .populate('teacherProfile.classes.classId', 'name code grade')
        .populate('teacherProfile.classes.subjectId', 'name code')
        .populate('createdBy', 'fullName email')
        .populate('updatedBy', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: teachers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch teachers',
        error: error.message,
      },
      { status: 500 }
    );
  }
});

// POST - Create new teacher with QR generation
export const POST = withAuth(async (request, authenticatedUser, userDoc) => {
  try {
    await connectDB();

    const body = await request.json();
    
    // Validate required fields
    const requiredFields = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'dateOfBirth',
      'gender',
      'branchId',
    ];
    
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`,
        },
        { status: 400 }
      );
    }
    
    // Check if email already exists
    const existingUser = await User.findOne({
      $or: [
        { email: body.email },
        ...(body.cnic ? [{ cnic: body.cnic }] : []),
      ],
    });
    
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: existingUser.email === body.email
            ? 'Email already exists'
            : 'CNIC already exists',
        },
        { status: 400 }
      );
    }
    
    // Verify branch exists
    const Branch = (await import('@/backend/models/Branch')).default;
    const branch = await Branch.findById(body.branchId);
    
    if (!branch) {
      return NextResponse.json(
        {
          success: false,
          message: 'Branch not found',
        },
        { status: 404 }
      );
    }

    // Verify classes exist if provided
    if (body.teacherProfile?.classes && body.teacherProfile.classes.length > 0) {
      const Class = (await import('@/backend/models/Class')).default;
      const classIds = body.teacherProfile.classes.map(c => c.classId);
      const classes = await Class.find({ _id: { $in: classIds } });
      
      if (classes.length !== classIds.length) {
        return NextResponse.json(
          {
            success: false,
            message: 'One or more classes not found',
          },
          { status: 404 }
        );
      }
    }

    // Verify subjects exist if provided
    if (body.teacherProfile?.subjects && body.teacherProfile.subjects.length > 0) {
      const Subject = (await import('@/backend/models/Subject')).default;
      const subjects = await Subject.find({ _id: { $in: body.teacherProfile.subjects } });
      
      if (subjects.length !== body.teacherProfile.subjects.length) {
        return NextResponse.json(
          {
            success: false,
            message: 'One or more subjects not found',
          },
          { status: 404 }
        );
      }
    }

    // Prepare teacher profile
    const teacherProfile = {
      joiningDate: body.teacherProfile?.joiningDate || new Date(),
      designation: body.teacherProfile?.designation || 'Teacher',
      departmentId: body.teacherProfile?.departmentId || null,
      department: body.teacherProfile?.department || null,
      qualifications: body.teacherProfile?.qualifications || [],
      experience: body.teacherProfile?.experience || { totalYears: 0, previousInstitutions: [] },
      subjects: body.teacherProfile?.subjects || [],
      classes: body.teacherProfile?.classes || [],
      salaryDetails: body.teacherProfile?.salaryDetails || {
        basicSalary: 0,
        allowances: { houseRent: 0, medical: 0, transport: 0, other: 0 },
        deductions: { tax: 0, providentFund: 0, insurance: 0, other: 0 },
      },
      leaveBalance: body.teacherProfile?.leaveBalance || { casual: 15, sick: 10, annual: 20 },
      emergencyContact: body.teacherProfile?.emergencyContact || {},
      documents: body.teacherProfile?.documents || [],
    };

    // Always require a password for teacher login
    const password = body.password || 'Teacher@123';
    // Create teacher user
    const teacher = new User({
      role: 'teacher',
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email.toLowerCase(),
      phone: body.phone,
      alternatePhone: body.alternatePhone || '',
      dateOfBirth: body.dateOfBirth,
      gender: body.gender,
      bloodGroup: body.bloodGroup || '',
      nationality: body.nationality || 'Pakistani',
      cnic: body.cnic || '',
      religion: body.religion || '',
      address: body.address || {},
      branchId: body.branchId,
      profilePhoto: body.profilePhoto || {},
      teacherProfile,
      status: body.status || 'active',
      remarks: body.remarks || '',
      passwordHash: password, // Will be hashed by pre-save middleware
      emailVerified: true,
      createdBy: userDoc._id,
      updatedBy: userDoc._id,
    });
    
    // Save teacher to get ID and generate employeeId
    await teacher.save();

    // Generate QR code
    try {
      const qrDataURL = await generateTeacherQR(teacher);
      
      // Upload QR to Cloudinary
      const qrUpload = await uploadToCloudinary(qrDataURL, {
        folder: `ease-academy/teachers/${teacher._id}/qr`,
        resourceType: 'image',
      });

      // Update teacher with QR details
      teacher.teacherProfile.qr = {
        url: qrUpload.url,
        publicId: qrUpload.publicId,
        uploadedAt: new Date(),
      };

      await teacher.save();
    } catch (qrError) {
      console.error('QR generation failed:', qrError);
      // Continue without QR - can be generated later
    }
    
    // Populate fields before returning
    await teacher.populate([
      { path: 'branchId', select: 'name code city' },
      { path: 'teacherProfile.departmentId', select: 'name code' },
      { path: 'teacherProfile.subjects', select: 'name code' },
      { path: 'teacherProfile.classes.classId', select: 'name code grade' },
      { path: 'teacherProfile.classes.subjectId', select: 'name code' },
      { path: 'createdBy', select: 'fullName email' },
    ]);

    // Send welcome email to teacher
    try {
      const emailHtml = getTeacherEmailTemplate('TEACHER_CREATED', teacher);
      await sendEmail(
        teacher.email,
        `Welcome to ${process.env.SCHOOL_NAME || 'Ease Academy'} - Account Created`,
        emailHtml
      );
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Continue - email is not critical
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Teacher created successfully',
        data: teacher,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating teacher:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create teacher',
        error: error.message,
      },
      { status: 500 }
    );
  }
});
