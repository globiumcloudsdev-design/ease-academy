import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Notification from '@/backend/models/Notification';
import { withAuth, requireRole } from '@/backend/middleware/auth';

export const GET = withAuth(async (request, authenticatedUser, userDoc, context) => {
  try {
    await connectDB();

    const paramsObj = (context && await context.params) || {};
    const id = paramsObj?.id || (request.nextUrl && request.nextUrl.pathname.split('/').pop());

    const notification = await Notification.findOne({
      _id: id,
      targetUser: authenticatedUser.userId,
    }).populate('childId', 'fullName studentProfile.registrationNumber');

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({ notification });
  } catch (error) {
    console.error('Get notification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, [requireRole('parent')]);

export const PUT = withAuth(async (request, authenticatedUser, userDoc, context) => {
  try {
    await connectDB();

    const paramsObj = (context && await context.params) || {};
    const id = paramsObj?.id || (request.nextUrl && request.nextUrl.pathname.split('/').pop());
    const body = await request.json();
    const { isRead } = body;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, targetUser: authenticatedUser.userId },
      { isRead },
      { new: true }
    );

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Notification updated', notification });
  } catch (error) {
    console.error('Update notification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, [requireRole('parent')]);
