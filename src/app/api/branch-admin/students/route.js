//src/app/api/branch-admin/students/[id]/route.js
import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import { sendEmail } from '@/backend/utils/emailService';
import { getStudentEmailTemplate } from '@/backend/templates/studentEmail';
import { generateQRCode } from '@/lib/qr-generator';
import { uploadToCloudinary } from '@/lib/cloudinary';
import Class from '@/backend/models/Class';

// GET - Get all students for branch admin's branch
async function getStudents(request, authenticatedUser, userDoc) {
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
    const classId = searchParams.get('classId');
    const status = searchParams.get('status');

    // Build query - only for this branch, role = student
    const query = { 
      role: 'student',
      branchId: authenticatedUser.branchId 
    };
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'studentProfile.registrationNumber': { $regex: search, $options: 'i' } },
      ];
    }

    if (classId) {
      query['studentProfile.classId'] = classId;
    }

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [students, total] = await Promise.all([
      User.find(query)
        .populate('studentProfile.classId', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    console.log(`Fetched ${students.length} students for branch ${authenticatedUser.branchId}`);
    console.log(`Total students matching query: ${total}`);

    return NextResponse.json({
      success: true,
      data: {
        students,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get students error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

// POST - Create new student (only for branch admin's branch)
async function createStudent(request, authenticatedUser, userDoc) {
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

    // Prepare student user data
    const userData = {
      role: 'student',
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
      passwordHash: body.password || `temp${Date.now()}`,
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

    // Handle medical info
    if (body.medicalInfo) {
      // Store in remarks or a separate field if needed
      userData.remarks = userData.remarks || '';
    }

    // Handle emergency contact
    if (body.emergencyContact) {
      // Store in remarks or studentProfile if needed
    }

    // Map student-specific fields to studentProfile
    // Support both nested studentProfile and flat structure
    const studentProfileData = body.studentProfile || {};
    
    userData.studentProfile = {
      classId: studentProfileData.classId || body.classId || null,
      departmentId: studentProfileData.departmentId || body.departmentId || null,
      section: studentProfileData.section || body.section || '',
      rollNumber: studentProfileData.rollNumber || body.rollNumber || '',
      admissionDate: studentProfileData.admissionDate || body.admissionDate || body.enrollmentDate || new Date(),
      academicYear: studentProfileData.academicYear || body.academicYear || new Date().getFullYear().toString(),
      
      previousSchool: studentProfileData.previousSchool || {
        name: body.academicInfo?.previousSchool || body.previousSchool?.name || '',
        lastClass: body.academicInfo?.previousClass || body.previousSchool?.lastClass || '',
        marks: body.previousSchool?.marks || 0,
        leavingDate: body.previousSchool?.leavingDate || null,
      },
      
      guardianType: studentProfileData.guardianType || body.guardianType || 'parent',
      
      father: studentProfileData.father || {
        name: body.parentInfo?.fatherName || body.father?.name || '',
        occupation: body.parentInfo?.fatherOccupation || body.father?.occupation || '',
        phone: body.parentInfo?.fatherPhone || body.father?.phone || '',
        email: body.parentInfo?.fatherEmail || body.father?.email || '',
        cnic: body.parentInfo?.fatherCnic || body.father?.cnic || '',
        income: body.father?.income || 0,
      },
      
      mother: studentProfileData.mother || {
        name: body.parentInfo?.motherName || body.mother?.name || '',
        occupation: body.parentInfo?.motherOccupation || body.mother?.occupation || '',
        phone: body.parentInfo?.motherPhone || body.mother?.phone || '',
        email: body.parentInfo?.motherEmail || body.mother?.email || '',
        cnic: body.parentInfo?.motherCnic || body.mother?.cnic || '',
      },
      
      guardian: studentProfileData.guardian || {
        name: body.guardianInfo?.name || body.guardian?.name || '',
        relation: body.guardianInfo?.relationship || body.guardian?.relation || '',
        phone: body.guardianInfo?.phone || body.guardian?.phone || '',
        email: body.guardianInfo?.email || body.guardian?.email || '',
        cnic: body.guardianInfo?.cnic || body.guardian?.cnic || '',
      },
      
      feeDiscount: studentProfileData.feeDiscount || body.feeDiscount || {
        type: 'fixed',
        amount: 0,
        reason: '',
      },
      
      transportFee: studentProfileData.transportFee || body.transportFee || {
        enabled: false,
        routeId: null,
        amount: 0,
      },
      
      documents: studentProfileData.documents || body.documents || [],
    };

    // Validate class belongs to this branch if classId provided
    if (userData.studentProfile.classId) {
      const classDoc = await Class.findById(userData.studentProfile.classId);
      if (!classDoc || classDoc.branchId.toString() !== authenticatedUser.branchId.toString()) {
        return NextResponse.json(
          { success: false, message: 'Invalid class for this branch' },
          { status: 400 }
        );
      }
    }

    const student = new User(userData);
    await student.save();

    // Send enrollment email to student's email if available
    try {
      if (student.email) {
        const html = getStudentEmailTemplate('STUDENT_CREATED', student);
        await sendEmail(student.email, 'Enrollment Confirmation', html);
      }
    } catch (err) {
      console.error('Failed to send student created email:', err);
    }

    // Generate QR payload and upload to Cloudinary
    try {
      const qrPayload = {
        id: student._id,
        registrationNumber: student.studentProfile?.registrationNumber || null,
        rollNumber: student.studentProfile?.rollNumber || null,
        firstName: student.firstName,
        lastName: student.lastName,
        branchId: student.branchId,
        classId: student.studentProfile?.classId || null,
      };

      const qrDataUrl = await generateQRCode(JSON.stringify(qrPayload), {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 350,
      });

      const uploadResult = await uploadToCloudinary(qrDataUrl, {
        folder: `ease-academy/students/${student._id}/qr`,
        resourceType: 'image',
      });

      student.studentProfile = student.studentProfile || {};
      student.studentProfile.qr = {
        url: uploadResult.url || uploadResult.secure_url || '',
        publicId: uploadResult.publicId || uploadResult.public_id || '',
        uploadedAt: new Date(),
      };
      await student.save();
    } catch (err) {
      console.error('Failed to generate/upload QR for student:', err);
    }

    return NextResponse.json({
      success: true,
      data: student,
      message: 'Student created successfully',
    });
  } catch (error) {
    console.error('Create student error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create student' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getStudents);
export const POST = withAuth(createStudent);
