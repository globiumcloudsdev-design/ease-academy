//src/app/api/users/students/route.js
import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import User from '@/backend/models/User';
import connectDB from '@/lib/database';
import QRCode from 'qrcode';
import { uploadToCloudinary } from '@/lib/cloudinary';
import Counter from '@/backend/models/Counter';
import { sendEmail } from '@/backend/utils/emailService';
import { getStudentEmailTemplate } from '@/backend/templates/studentEmail';
import Branch from '@/backend/models/Branch';
import Department from '@/backend/models/Department';
import Class from '@/backend/models/Class';
import bcrypt from 'bcryptjs';

// POST - Create a new student, generate roll number (if missing), create QR and upload to Cloudinary
export const POST = withAuth(async (request, authenticatedUser, userDoc) => {
  try {
    await connectDB();

    const body = await request.json();

    // Ensure role is student
    const role = 'student';

    // Basic validation
    const required = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'branchId'];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json({ success: false, message: `${field} is required` }, { status: 400 });
      }
    }

    if (!body.studentProfile || !body.studentProfile.classId) {
      return NextResponse.json({ success: false, message: 'Class is required for students' }, { status: 400 });
    }

    // Prevent duplicate email
    const exists = await User.findOne({ email: body.email?.toLowerCase() });
    if (exists) {
      return NextResponse.json({ success: false, message: 'Email already exists' }, { status: 400 });
    }

    // Create user record
    const defaultPassword = body.password || 'Password@123';
    const newUser = new User({
      role,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      dateOfBirth: body.dateOfBirth,
      gender: body.gender,
      bloodGroup: body.bloodGroup,
      nationality: body.nationality,
      cnic: body.cnic,
      address: body.address,
      branchId: body.branchId,
      status: body.status || 'active',
      remarks: body.remarks,
      passwordHash: defaultPassword, // hashed in model pre-save
      studentProfile: {
        classId: body.studentProfile.classId,
        departmentId: body.studentProfile.departmentId,
        section: body.studentProfile.section,
        rollNumber: body.studentProfile.rollNumber,
        admissionDate: body.studentProfile.admissionDate,
        academicYear: body.studentProfile.academicYear,
        previousSchool: body.studentProfile.previousSchool,
        father: body.studentProfile.father,
        mother: body.studentProfile.mother,
        guardian: body.studentProfile.guardian,
        feeDiscount: body.studentProfile.feeDiscount,
        transportFee: body.studentProfile.transportFee,
      },
      createdBy: userDoc._id,
      updatedBy: userDoc._id,
    });

    await newUser.save();

    // If roll number wasn't provided, generate one automically using Counter per branch+class+year
    try {
      if (!newUser.studentProfile?.rollNumber && newUser.studentProfile?.classId) {
        const yearKey = newUser.studentProfile.academicYear || new Date().getFullYear().toString();
        const counterKey = `roll_${newUser.branchId}_${newUser.studentProfile.classId}_${yearKey}`;

        const counterDoc = await Counter.findOneAndUpdate(
          { _id: counterKey },
          { $inc: { seq: 1 } },
          { new: true, upsert: true }
        );

        const seq = counterDoc.seq || 1;
        // Assign roll as zero-padded sequence
        newUser.studentProfile.rollNumber = String(seq).padStart(6, '0');
        await newUser.save();
      }
    } catch (err) {
      console.error('Error generating atomic roll number:', err);
    }

    // Generate QR code containing minimal student data and upload to Cloudinary
    try {
      const qrPayload = {
        id: newUser._id,
        registrationNumber: newUser.studentProfile?.registrationNumber,
        rollNumber: newUser.studentProfile?.rollNumber,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        branchId: newUser.branchId,
        classId: newUser.studentProfile?.classId,
      };

      const qrDataUrl = await QRCode.toDataURL(JSON.stringify(qrPayload), { errorCorrectionLevel: 'H', type: 'image/png', width: 350 });

      // Upload data URL to Cloudinary
      const uploadResult = await uploadToCloudinary(qrDataUrl, {
        folder: `ease-academy/students/${newUser._id}/qr`,
        resourceType: 'image',
      });

      // Save QR info into dedicated studentProfile.qr
      newUser.studentProfile = newUser.studentProfile || {};
      newUser.studentProfile.qr = {
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        uploadedAt: new Date(),
      };

      await newUser.save();
    } catch (err) {
      console.error('QR generation/upload failed:', err);
      // proceed without failing the whole request
    }

    // Populate before return
    await newUser.populate([
      { path: 'branchId', select: 'name code city' },
      { path: 'studentProfile.classId', select: 'name grade' },
      { path: 'studentProfile.departmentId', select: 'name code' },
      { path: 'createdBy', select: 'fullName email' },
    ]);

    // Send welcome email asynchronously (don't block response)
    if (newUser.email) {
      try {
        const emailHtml = getStudentEmailTemplate('STUDENT_CREATED', newUser.toObject());
        await sendEmail(newUser.email, '🎓 Welcome to Ease Academy - Enrollment Confirmation', emailHtml);
      } catch (emailErr) {
        console.error('Email sending failed (non-blocking):', emailErr);
        // Don't fail the response if email fails
      }
    }

    return NextResponse.json({ success: true, message: 'Student created successfully', data: newUser }, { status: 201 });
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json({ success: false, message: 'Failed to create student', error: error.message }, { status: 500 });
  }
});
