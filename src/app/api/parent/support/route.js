import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { withAuth, requireRole } from '@/backend/middleware/auth';
// Assuming an email service or support ticket model exists
// import SupportTicket from '@/backend/models/SupportTicket';

export const POST = withAuth(async (request, authenticatedUser) => {
  try {
    await connectDB();

    const body = await request.json();
    const { subject, message } = body;

    // TODO: Save to SupportTicket model or send email
    // For now, just log and respond
    console.log('Support request:', { userId: authenticatedUser.userId, subject, message });

    return NextResponse.json({ message: 'Support request submitted successfully' });
  } catch (error) {
    console.error('Support request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, [requireRole('parent')]);
