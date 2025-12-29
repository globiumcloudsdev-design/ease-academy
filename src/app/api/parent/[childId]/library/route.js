import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
// Note: Library model doesn't exist yet. Returning empty for now.

const handler = withAuth(async (request, user, userDoc, context) => {
  try {
    const { childId } = await context.params || {};
    await connectDB();

    const parent = await User.findById(userDoc._id).lean();
    const ownsChild = parent?.parentProfile?.children?.some(c => c.id?.toString() === childId);
    if (!ownsChild) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

    // Placeholder: Library model to be created
    const library = [];

    return NextResponse.json({ success: true, library, message: 'Library feature coming soon' });
  } catch (error) {
    console.error('Error fetching library:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch library' }, { status: 500 });
  }
});

export async function GET(request, context) {
  return handler(request, context);
}
