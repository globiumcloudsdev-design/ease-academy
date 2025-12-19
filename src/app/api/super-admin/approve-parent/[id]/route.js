import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { verifyToken } from '@/backend/middleware/auth';
import User from '@/backend/models/User';

export async function POST(request, { params }) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    await connectDB();

    const parent = await User.findById(id);
    if (!parent || parent.role !== 'parent') {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    }

    if (parent.approved || parent.status === 'approved' || parent.status === 'active') {
      return NextResponse.json({ error: 'Parent already approved' }, { status: 400 });
    }

    parent.approved = true;
    parent.isActive = true;
    parent.status = 'approved';
    parent.approvedBy = decoded.userId;
    parent.approvedAt = new Date();
    await parent.save();

    return NextResponse.json({
      success: true,
      message: 'Parent approved successfully',
      parent: {
        _id: parent._id,
        fullName: parent.fullName,
        email: parent.email,
        status: parent.status,
        approvedAt: parent.approvedAt,
      }
    });

  } catch (error) {
    console.error('Error approving parent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
