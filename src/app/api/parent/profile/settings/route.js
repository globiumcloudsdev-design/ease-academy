import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Preferences from '@/backend/models/Preferences';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function PUT(request) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pushNotifications, emailAlerts, darkMode, biometric } = body;

    let preferences = await Preferences.findOne({ userId: session.user.id });
    if (!preferences) {
      preferences = new Preferences({ userId: session.user.id });
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
}
