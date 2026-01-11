import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import Class from '@/backend/models/Class';
import Subject from '@/backend/models/Subject';
import Branch from '@/backend/models/Branch';

export const GET = withAuth(async (request, user) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const search = searchParams.get('search') || '';

    console.log('🔍 Fetching users - Role:', role, 'User Branch ID:', user.branchId);

    if (!role) {
      return NextResponse.json({ success: false, message: 'Role is required' }, { status: 400 });
    }

    const branchId = user.branchId?._id || user.branchId;

    if (!branchId) {
      console.error('❌ No branch ID found for user:', user.userId);
      return NextResponse.json({ success: false, message: 'Branch ID not found' }, { status: 403 });
    }

    const query = {
      role: role,
      branchId: branchId,
      isActive: true,
      status: { $in: ['active', 'approved'] } // Include both active and approved users
    };

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'studentProfile.registrationNumber': { $regex: search, $options: 'i' } }
      ];
    }

    console.log('📊 Query:', JSON.stringify(query));

    const users = await User.find(query)
      .select('_id firstName lastName email studentProfile.registrationNumber teacherProfile.employeeId staffProfile.employeeId')
      .limit(50)
      .lean();

    console.log('✅ Found users:', users.length);

    const formattedUsers = users.map(u => ({
      value: u._id.toString(),
      label: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
      subLabel: u.studentProfile?.registrationNumber || u.teacherProfile?.employeeId || u.staffProfile?.employeeId || u.email
    }));

    return NextResponse.json({
      success: true,
      data: formattedUsers
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch users', error: error.message },
      { status: 500 }
    );
  }
});
