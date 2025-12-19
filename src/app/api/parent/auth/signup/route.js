import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Validation schema for parent signup
const parentSignupSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(1, 'Phone is required'),
  gender: z.enum(['male', 'female', 'other']),
  address: z.string().min(1, 'Address is required'),
  cnic: z.string().min(1, 'CNIC is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  children: z.array(z.object({
    name: z.string().min(1, 'Child name is required'),
    registrationNumber: z.string().min(1, 'Registration number is required'),
    dateOfBirth: z.string().transform((str) => new Date(str)),
    bFormNumber: z.string().optional(),
    class: z.string().min(1, 'Class is required'),
  })).optional(),
});

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const validatedData = parentSignupSchema.parse(body);

    // Check if email already exists
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    // Process children: Find students by registrationNumber
    const children = [];
    let branchId;
    if (validatedData.children) {
      for (const childData of validatedData.children) {
        const student = await User.findOne({
          role: 'student',
          'studentProfile.registrationNumber': childData.registrationNumber,
        });
        if (!student) {
          return NextResponse.json({ error: `Student with registration number ${childData.registrationNumber} not found` }, { status: 400 });
        }
        // Set branchId from first student (assuming all children from same branch)
        if (!branchId) {
          branchId = student.branchId;
        }
        // Populate child object
        children.push({
          id: student._id,
          name: childData.name,
          registrationNumber: childData.registrationNumber,
          dateOfBirth: childData.dateOfBirth,
          cnic: student.cnic,
          bFormNumber: childData.bFormNumber,
          gender: student.gender,
          classId: student.studentProfile.classId,
          section: student.studentProfile.section,
        });
      }
    }
    // If no children, set default branchId (for testing)
    if (!branchId) {
      // Find a default branch
      const Branch = (await import('@/backend/models/Branch')).default;
      const defaultBranch = await Branch.findOne();
      branchId = defaultBranch ? defaultBranch._id : null;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Convert address string to object
    const addressObject = { street: validatedData.address };

    // Create parent user (inactive until approved)
    const parent = new User({
      role: 'parent',
      fullName: validatedData.fullName,
      email: validatedData.email,
      phone: validatedData.phone,
      gender: validatedData.gender,
      address: addressObject,
      branchId: branchId,
      cnic: validatedData.cnic,
      passwordHash: hashedPassword,
      isActive: false,
      approved: false,
      status: 'pending',
      parentProfile: {
        children: children,
        occupation: '', // Optional, can be updated later
        income: 0,
        fullName: validatedData.fullName,
        phone: validatedData.phone,
        email: validatedData.email,
        cnic: validatedData.cnic,
        address: addressObject,
      },
    });

    await parent.save();

    return NextResponse.json({ message: 'Parent account created successfully', userId: parent._id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
