// import { NextResponse } from 'next/server';
// import connectDB from '@/lib/database';
// import Timetable from '@/backend/models/Timetable';

// export async function GET() {
//   await connectDB();

//   // Sab kuch le ao (Periods ke andar teacherId check krny k liye)
//   const allTimetables = await Timetable.find({}).lean();

//   return NextResponse.json({
//     totalTimetables: allTimetables.length,
//     data: allTimetables.map(t => ({
//       timetableName: t.name,
//       classId: t.classId,
//       periods: t.periods.map(p => ({
//         day: p.day,
//         teacherId: p.teacherId, // <-- Ye check krna hai humein
//         subjectId: p.subjectId
//       }))
//     }))
//   });
// }







import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import mongoose from 'mongoose';

export async function GET(req) {
  try {
    await connectDB();

    // URL se Class ID aur Section uthao
    const { searchParams } = new URL(req.url);
    const classIdStr = searchParams.get('classId');
    const section = searchParams.get('section') || 'A';

    if (!classIdStr) {
      return NextResponse.json({ error: 'Please provide ?classId=...' }, { status: 400 });
    }

    // Fake Student Data
    const randomNum = Math.floor(Math.random() * 1000);
    const newStudent = await User.create({
      role: 'student',
      firstName: 'Test',
      lastName: `Student ${randomNum}`,
      email: `student${randomNum}@school.com`,
      passwordHash: '123456', // Dummy
      isActive: true, // Zaroori hai kyu k API active dhoond rhi hai
      branchId: new mongoose.Types.ObjectId(), // Fake Branch ID
      studentProfile: {
        classId: new mongoose.Types.ObjectId(classIdStr), // <--- Ye Link karega Class se
        section: section,
        rollNumber: `R-${randomNum}`,
        registrationNumber: `REG-${randomNum}`
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Student Created Successfully!',
      studentName: newStudent.fullName,
      classId: classIdStr,
      section: section
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}




// import { NextResponse } from 'next/server';
// // import connectDB from '@/lib/db';
// import Class from '@/backend/models/Class';

// export async function GET() {
//   try {
//     await connectDB();

//     // Database se SARI classes le ao (Newest pehly)
//     const allClasses = await Class.find({})
//       .select('name code sections academicYear') // Sirf kaam ki cheezein select ki hain
//       .sort({ createdAt: -1 });

//     return NextResponse.json({ 
//       success: true, 
//       count: allClasses.length, 
//       data: allClasses 
//     });

//   } catch (error) {
//     return NextResponse.json({ success: false, error: error.message }, { status: 500 });
//   }
// }