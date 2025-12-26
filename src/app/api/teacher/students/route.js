
import { NextResponse } from 'next/server';
import { withAuth, requireRole } from '@/backend/middleware/auth'; // Middleware Import
import User from '@/backend/models/User';
import mongoose from 'mongoose';
import connectDB from '@/lib/database';
import Class from '@/backend/models/Class';
import Branch from '@/backend/models/Branch';
import Subject from '@/backend/models/Subject';
import Timetable from '@/backend/models/Timetable';

// Main Handler Function
const getClassStudents = async (req, user, userDoc) => {
  try {
    // 1. URL se data nikalo
    const { searchParams } = new URL(req.url);
    const classIdStr = searchParams.get('classId');
    const section = searchParams.get('section');

    console.log("--- FETCHING STUDENTS (SECURE) ---");
    console.log("Requested by:", user.fullName);

    // 2. Validation
    if (!classIdStr || !section) {
      return NextResponse.json({ success: false, error: 'Class ID and Section are required' }, { status: 400 });
    }

    // 3. Security Query Filter Build karo
    // Hum chahty hain teacher sirf Active students dekhy
    // Aur agar wo Super Admin nahi hai, to sirf APNI BRANCH k students dekhy
    const query = {
      role: 'student',
      'studentProfile.classId': new mongoose.Types.ObjectId(classIdStr),
      'studentProfile.section': section,
      isActive: true
    };

    // Agar user Super Admin nahi hai, to Branch Lock laga do
    if (user.role !== 'super_admin') {
      query.branchId = userDoc.branchId; 
    }

    // 4. Database Query
    const students = await User.find(query)
      .select('firstName lastName fullName email profilePhoto studentProfile.rollNumber studentProfile.registrationNumber')
      .sort({ 'studentProfile.rollNumber': 1 });

    console.log(`Students Found: ${students.length}`);

    return NextResponse.json({ 
      success: true, 
      count: students.length, 
      data: students 
    });

  } catch (error) {
    console.error('Student Fetch Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
};

// Export with Auth Protection
export const GET = withAuth(getClassStudents, [requireRole(['teacher', 'branch_admin', 'super_admin'])]); 