import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
// Assuming an email service or support ticket model exists
// import SupportTicket from '@/backend/models/SupportTicket';

export async function POST(request) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subject, message } = body;

    // TODO: Save to SupportTicket model or send email
    // For now, just log and respond
    console.log('Support request:', { userId: session.user.id, subject, message });

    return NextResponse.json({ message: 'Support request submitted successfully' });
  } catch (error) {
    console.error('Support request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
