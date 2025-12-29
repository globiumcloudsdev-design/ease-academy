import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import Branch from '@/backend/models/Branch';

// Validation schema for parent signup
const parentSignupSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(1, 'Phone is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  cnic: z.string().min(13, 'CNIC must be at least 13 characters').optional(),
  role: z.literal('parent'),
  address: z.object({
    street: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().default('Pakistan'),
  }).optional(),
  parentProfile: z.object({
    children: z.array(z.object({
      name: z.string().min(1, 'Child name is required'),
      registrationNumber: z.string().optional(),
      className: z.string().min(1, 'Class name is required'),
      section: z.string().optional(),
    })).min(1, 'At least one child is required'),
  }),
});

export async function POST(request) {
  try {
    
    await connectDB();

    const body = await request.json();
    const validatedData = parentSignupSchema.parse(body);

    // Check if email already exists
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      console.log('Signup error: Email already exists:', validatedData.email);
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    // Process children: Store className for admin matching later
    const children = [];
    let branchId;

    if (validatedData.parentProfile.children) {
      // For now, we'll set a default branch. Admin will match children later
      const defaultBranch = await Branch.findOne();
      branchId = defaultBranch ? defaultBranch._id : null;

      for (const childData of validatedData.parentProfile.children) {
        // Store child info with className (admin will match to actual students later)
        children.push({
          name: childData.name,
          registrationNumber: childData.registrationNumber || '',
          className: childData.className,
          section: childData.section || '',
          // These will be populated by admin during approval
          classId: null,
          studentId: null,
        });
      }
    }

    // Create parent user (inactive until approved)
    const parent = new User({
      role: 'parent',
      fullName: validatedData.fullName,
      email: validatedData.email,
      phone: validatedData.phone,
      cnic: validatedData.cnic,
      branchId: branchId,
      passwordHash: validatedData.password,
      isActive: false,
      approved: false,
      status: 'pending',
      address: validatedData.address || {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'Pakistan'
      },
      parentProfile: {
        children: children,
      },
    });

    await parent.save();

    console.log('Parent signup successful:', {
      parentId: parent._id,
      email: validatedData.email,
      childrenCount: children.length
    });

    return NextResponse.json({
      message: 'Parent account created successfully. Please wait for admin approval.',
      user: {
        _id: parent._id,
        fullName: validatedData.fullName,
        email: validatedData.email,
        role: 'parent',
        status: 'pending'
      }
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
