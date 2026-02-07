import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import { withAuth } from '@/backend/middleware/auth';
import { generateTeacherQR } from '@/lib/qr-generator';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary';
import { sendEmail } from '@/backend/utils/emailService';
import { getTeacherEmailTemplate } from '@/backend/templates/teacherEmail';
import Branch from '@/backend/models/Branch';
import Department from '@/backend/models/Department';
import Class from '@/backend/models/Class';

// GET - Get single teacher
export const GET = withAuth(async (request, authenticatedUser, userDoc, context) => {
  try {
    await connectDB();

    const params = await context.params;
    const { id } = params;
    
    const teacher = await User.findOne({ _id: id, role: 'teacher' })
      .populate('branchId', 'name code city address')
      .populate('teacherProfile.departmentId', 'name code')
      .populate('teacherProfile.subjects', 'name code')
      .populate('teacherProfile.classes.classId', 'name code grade')
      .populate('teacherProfile.classes.subjectId', 'name code')
      .populate('createdBy', 'fullName email')
      .populate('updatedBy', 'fullName email')
      .lean();

    if (!teacher) {
      return NextResponse.json(
        {
          success: false,
          message: 'Teacher not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: teacher,
    });
  } catch (error) {
    console.error('Error fetching teacher:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch teacher',
        error: error.message,
      },
      { status: 500 }
    );
  }
});

// PUT - Update teacher
export const PUT = withAuth(async (request, authenticatedUser, userDoc, context) => {
  try {
    await connectDB();

    const params = await context.params;
    const { id } = params;
    const body = await request.json();
    
    // Check if teacher exists
    const teacher = await User.findOne({ _id: id, role: 'teacher' });
    
    if (!teacher) {
      return NextResponse.json(
        {
          success: false,
          message: 'Teacher not found',
        },
        { status: 404 }
      );
    }

    // Store old status for comparison
    const oldStatus = teacher.status;
    
    // Check if email/CNIC is being changed and already exists
    if (body.email && body.email !== teacher.email) {
      const existingEmail = await User.findOne({ email: body.email, _id: { $ne: id } });
      if (existingEmail) {
        return NextResponse.json(
          {
            success: false,
            message: 'Email already exists',
          },
          { status: 400 }
        );
      }
    }
    
    if (body.cnic && body.cnic !== teacher.cnic) {
      const existingCnic = await User.findOne({ cnic: body.cnic, _id: { $ne: id } });
      if (existingCnic) {
        return NextResponse.json(
          {
            success: false,
            message: 'CNIC already exists',
          },
          { status: 400 }
        );
      }
    }

    // Verify classes exist if being updated
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

    // Verify subjects exist if being updated
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
    
    // Update basic fields
    if (body.firstName) teacher.firstName = body.firstName;
    if (body.lastName) teacher.lastName = body.lastName;
    if (body.email) teacher.email = body.email.toLowerCase();
    if (body.phone) teacher.phone = body.phone;
    if (body.alternatePhone !== undefined) teacher.alternatePhone = body.alternatePhone;
    if (body.dateOfBirth) teacher.dateOfBirth = body.dateOfBirth;
    if (body.gender) teacher.gender = body.gender;
    if (body.bloodGroup !== undefined) teacher.bloodGroup = body.bloodGroup;
    if (body.nationality !== undefined) teacher.nationality = body.nationality;
    if (body.cnic !== undefined) teacher.cnic = body.cnic;
    if (body.religion !== undefined) teacher.religion = body.religion;
    if (body.address) teacher.address = body.address;
    if (body.branchId) teacher.branchId = body.branchId;
    if (body.profilePhoto) teacher.profilePhoto = body.profilePhoto;
    if (body.status) teacher.status = body.status;
    if (body.remarks !== undefined) teacher.remarks = body.remarks;

    // Update teacher profile fields
    if (body.teacherProfile) {
      if (!teacher.teacherProfile) teacher.teacherProfile = {};
      
      if (body.teacherProfile.joiningDate) teacher.teacherProfile.joiningDate = body.teacherProfile.joiningDate;
      if (body.teacherProfile.designation) teacher.teacherProfile.designation = body.teacherProfile.designation;
      if (body.teacherProfile.departmentId !== undefined) teacher.teacherProfile.departmentId = body.teacherProfile.departmentId;
      if (body.teacherProfile.qualifications) teacher.teacherProfile.qualifications = body.teacherProfile.qualifications;
      if (body.teacherProfile.experience) teacher.teacherProfile.experience = body.teacherProfile.experience;
      if (body.teacherProfile.subjects) teacher.teacherProfile.subjects = body.teacherProfile.subjects;
      if (body.teacherProfile.classes) teacher.teacherProfile.classes = body.teacherProfile.classes;
      if (body.teacherProfile.salaryDetails) teacher.teacherProfile.salaryDetails = body.teacherProfile.salaryDetails;
      if (body.teacherProfile.leaveBalance) teacher.teacherProfile.leaveBalance = body.teacherProfile.leaveBalance;
      if (body.teacherProfile.emergencyContact) teacher.teacherProfile.emergencyContact = body.teacherProfile.emergencyContact;
      if (body.teacherProfile.documents) teacher.teacherProfile.documents = body.teacherProfile.documents;
    }

    teacher.updatedBy = userDoc._id;

    // Check if QR code exists, if not generate it
    const qrExists = teacher.teacherProfile?.qr?.url;
    
    // Check if QR needs regeneration or creation
    const shouldRegenerateQR = !qrExists || // Generate if doesn't exist
      body.regenerateQR || 
      (body.firstName && body.firstName !== teacher.firstName) ||
      (body.lastName && body.lastName !== teacher.lastName) ||
      (body.email && body.email !== teacher.email);

    if (shouldRegenerateQR) {
      try {
        // Initialize teacherProfile if not exists
        if (!teacher.teacherProfile) {
          teacher.teacherProfile = {};
        }

        // Delete old QR if exists
        if (teacher.teacherProfile.qr?.publicId) {
          await deleteFromCloudinary(teacher.teacherProfile.qr.publicId);
        }

        // Generate and upload new QR
        const qrDataURL = await generateTeacherQR(teacher);
        const qrUpload = await uploadToCloudinary(qrDataURL, {
          folder: `ease-academy/teachers/${teacher._id}/qr`,
          resourceType: 'image',
        });

        teacher.teacherProfile.qr = {
          url: qrUpload.url,
          publicId: qrUpload.publicId,
          uploadedAt: new Date(),
        };
        
        console.log(`QR code ${qrExists ? 'regenerated' : 'generated'} for teacher ${teacher._id}`);
      } catch (qrError) {
        console.error('QR regeneration failed:', qrError);
      }
    }
    
    await teacher.save();
    
    // Populate fields before returning
    await teacher.populate([
      { path: 'branchId', select: 'name code city' },
      { path: 'teacherProfile.departmentId', select: 'name code' },
      { path: 'teacherProfile.subjects', select: 'name code' },
      { path: 'teacherProfile.classes.classId', select: 'name code grade' },
      { path: 'teacherProfile.classes.subjectId', select: 'name code' },
      { path: 'updatedBy', select: 'fullName email' },
    ]);

    // Send email notification
    try {
      let emailType = 'TEACHER_UPDATED';
      let emailSubject = 'Profile Updated';

      // If status changed, send status-specific email
      if (oldStatus !== teacher.status) {
        emailType = 'TEACHER_STATUS_CHANGED';
        emailSubject = `Employment Status Updated - ${teacher.status.replace('_', ' ').toUpperCase()}`;
      }

      const emailHtml = getTeacherEmailTemplate(emailType, teacher.toObject());
      await sendEmail(
        teacher.email,
        `${process.env.SCHOOL_NAME || 'Ease Academy'} - ${emailSubject}`,
        emailHtml
      );
    } catch (emailError) {
      console.error('Failed to send update email:', emailError);
      // Continue - email is not critical
    }

    return NextResponse.json({
      success: true,
      message: 'Teacher updated successfully',
      data: teacher,
    });
  } catch (error) {
    console.error('Error updating teacher:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update teacher',
        error: error.message,
      },
      { status: 500 }
    );
  }
});

// DELETE - Delete/Deactivate teacher
export const DELETE = withAuth(async (request, authenticatedUser, userDoc, context) => {
  try {
    await connectDB();

    const params = await context.params;
    const { id } = params;
    
    // Check if teacher exists
    const teacher = await User.findOne({ _id: id, role: 'teacher' });
    
    if (!teacher) {
      return NextResponse.json(
        {
          success: false,
          message: 'Teacher not found',
        },
        { status: 404 }
      );
    }
    
    // Soft delete - change status to terminated
    teacher.status = 'terminated';
    teacher.updatedBy = userDoc._id;
    await teacher.save();

    // Populate for email
    await teacher.populate([
      { path: 'branchId', select: 'name code city' },
      { path: 'teacherProfile.departmentId', select: 'name code' },
    ]);

    // Send termination email
    try {
      const emailHtml = getTeacherEmailTemplate('TEACHER_STATUS_CHANGED', teacher.toObject());
      await sendEmail(
        teacher.email,
        `${process.env.SCHOOL_NAME || 'Ease Academy'} - Employment Status Updated`,
        emailHtml
      );
    } catch (emailError) {
      console.error('Failed to send termination email:', emailError);
      // Continue - email is not critical
    }

    return NextResponse.json({
      success: true,
      message: 'Teacher deactivated successfully',
    });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete teacher',
        error: error.message,
      },
      { status: 500 }
    );
  }
});
