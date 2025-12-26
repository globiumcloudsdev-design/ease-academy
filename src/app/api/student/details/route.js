// import { NextResponse } from 'next/server';
// import connectDB from '@/lib/database';
// import User from '@/backend/models/User';

// export async function GET(req) {
//   await connectDB();

//   // URL se ID nikalo (e.g., ?studentId=12345)
//   const { searchParams } = new URL(req.url);
//   const studentId = searchParams.get('studentId');

//   // Database se dhoondo aur Parent/Class ki detail bhi sath le ao
//   const student = await User.findById(studentId)
//     .populate('studentProfile.classId', 'name') // Class Name
//     .populate('branchId', 'name address');      // Branch Name

//   return NextResponse.json({ success: true, data: student });
// }







import { NextResponse } from 'next/server';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import User from '@/backend/models/User';
// Mongoose Models ko register karne ke liye import zaroori hai
import Class from '@/backend/models/Class'; 
import Branch from '@/backend/models/Branch';

// Main Handler Function
const getStudentDetails = async (req, user, userDoc) => {
  try {
    // 1. URL se Student ID nikalo
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ success: false, error: 'Student ID is required' }, { status: 400 });
    }

    // 2. Database Query (Student dhoondo)
    const student = await User.findById(studentId)
      .select('-passwordHash -refreshToken -verificationToken') // Sensitive info hata di
      .populate('studentProfile.classId', 'name code academicYear')
      .populate('branchId', 'name code address');

    if (!student || student.role !== 'student') {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    // ================= SECURITY CHECK (Branch Lock) =================
    // Agar logged-in user "Super Admin" nahi hai, to Branch match honi chahiye
    if (user.role !== 'super_admin') {
      const userBranch = userDoc.branchId._id?.toString() || userDoc.branchId.toString();
      const studentBranch = student.branchId._id?.toString() || student.branchId.toString();

      if (userBranch !== studentBranch) {
        return NextResponse.json({ 
          success: false, 
          message: 'Access Denied: You cannot view students from other branches' 
        }, { status: 403 });
      }
    }
    // ==================================================================

    return NextResponse.json({ 
      success: true, 
      data: student 
    });

  } catch (error) {
    console.error('Error fetching student details:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
};

// Export with Auth Protection
// Sirf 'teacher', 'branch_admin', 'super_admin' access kar sakte hain
export const GET = withAuth(getStudentDetails, [requireRole(['teacher', 'branch_admin', 'super_admin'])]);