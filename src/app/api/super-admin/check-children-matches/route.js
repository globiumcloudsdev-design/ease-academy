import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import { withAuth, requireRole } from '@/backend/middleware/auth';
import Branch from '@/backend/models/Branch';
import Class from '@/backend/models/Class';

export const POST = withAuth(async (request, user) => {
  try {
    await connectDB();
    const { parentId } = await request.json();

    // Get parent details
    const parent = await User.findById(parentId);
    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    }

    const childrenMatches = [];

    // Check each child
    for (const child of parent.parentProfile?.children || []) {
      const matchQuery = {
        role: 'student',
        $or: []
      };

      // Match by name (case insensitive)
      if (child.name) {
        matchQuery.$or.push({
          fullName: { $regex: new RegExp(`^${child.name}$`, 'i') }
        });
      }

      // Match by registration number
      if (child.registrationNumber) {
        matchQuery.$or.push({
          'studentProfile.registrationNumber': child.registrationNumber
        });
      }

      // If no search criteria, skip
      if (matchQuery.$or.length === 0) {
        childrenMatches.push({
          childInfo: child,
          matched: false,
          matchedStudents: []
        });
        continue;
      }

      // Find matching students
      const matchedStudents = await User.find(matchQuery)
        .populate('studentProfile.classId', 'name')
        .populate('branchId', 'name')
        .select('fullName email phone studentProfile branchId guardianName guardianPhone')
        .limit(10);

      // Further filter by guardian name if provided
      let filteredMatches = matchedStudents;
      if (parent.fullName) {
        filteredMatches = matchedStudents.filter(student => {
          const guardianName = student.guardianName || '';
          return guardianName.toLowerCase().includes(parent.fullName.toLowerCase()) ||
                 parent.fullName.toLowerCase().includes(guardianName.toLowerCase());
        });
      }

      childrenMatches.push({
        childInfo: child,
        matched: filteredMatches.length > 0,
        matchedStudents: filteredMatches.map(s => ({
          _id: s._id,
          fullName: s.fullName,
          email: s.email,
          phone: s.phone,
          registrationNumber: s.studentProfile?.registrationNumber,
          classId: s.studentProfile?.classId,
          className: s.studentProfile?.classId?.name,
          branchId: s.branchId?._id,
          branchName: s.branchId?.name,
          guardianName: s.guardianName,
          guardianPhone: s.guardianPhone,
          matchScore: calculateMatchScore(child, s, parent)
        }))
      });
    }

    return NextResponse.json({ 
      success: true, 
      childrenMatches,
      totalMatched: childrenMatches.filter(c => c.matched).length
    });
  } catch (error) {
    console.error('Check children matches error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, [requireRole('super_admin')]);

// Helper function to calculate match score
function calculateMatchScore(childInfo, student, parent) {
  let score = 0;
  
  // Name match (case insensitive)
  if (childInfo.name && student.fullName) {
    const childName = childInfo.name.toLowerCase();
    const studentName = student.fullName.toLowerCase();
    if (childName === studentName) score += 50;
    else if (studentName.includes(childName) || childName.includes(studentName)) score += 30;
  }
  
  // Registration number exact match
  if (childInfo.registrationNumber && student.studentProfile?.registrationNumber) {
    if (childInfo.registrationNumber === student.studentProfile.registrationNumber) score += 40;
  }
  
  // Guardian name match
  if (parent.fullName && student.guardianName) {
    const parentName = parent.fullName.toLowerCase();
    const guardianName = student.guardianName.toLowerCase();
    if (parentName === guardianName) score += 30;
    else if (guardianName.includes(parentName) || parentName.includes(guardianName)) score += 15;
  }
  
  // Phone match
  if (parent.phone && student.guardianPhone) {
    if (parent.phone === student.guardianPhone) score += 20;
  }
  
  return score;
}
