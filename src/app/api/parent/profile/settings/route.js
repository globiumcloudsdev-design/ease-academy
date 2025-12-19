import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Preferences from '@/backend/models/Preferences';
import { withAuth, requireRole } from '@/backend/middleware/auth';

export const PUT = withAuth(async (request, authenticatedUser) => {
  try {
    await connectDB();

    const body = await request.json();
    const { pushNotifications, emailAlerts, darkMode, biometric } = body;

    let preferences = await Preferences.findOne({ userId: authenticatedUser.userId });
    if (!preferences) {
      preferences = new Preferences({ userId: authenticatedUser.userId });
    }

    if (pushNotifications !== undefined) preferences.pushNotifications = pushNotifications;
    if (emailAlerts !== undefined) preferences.emailAlerts = emailAlerts;
    if (darkMode !== undefined) preferences.darkMode = darkMode;
    if (biometric !== undefined) preferences.biometric = biometric;

    await preferences.save();

    return NextResponse.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, [requireRole('parent')]);
