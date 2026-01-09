import { NextResponse } from 'next/server';
import Notification from '@/backend/models/Notification';
import connectDB from '@/lib/database';

export async function GET(req) {
  try {
    await connectDB();

    // URL se UserID lo (Fronted se hum bhejenge)
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId'); 

    if (!userId) {
       return NextResponse.json({ success: false, message: "User ID missing" }, { status: 400 });
    }

    // Notifications fetch karo (Latest pehle)
    const notifications = await Notification.find({ targetUser: userId })
      .sort({ createdAt: -1 })
      .limit(15);

    // Unread count bhi nikalo (Badge ke liye)
    const unreadCount = await Notification.countDocuments({ 
      targetUser: userId, 
      isRead: false 
    });

    return NextResponse.json({ 
      success: true, 
      data: { notifications, unreadCount } 
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: "Error fetching" }, { status: 500 });
  }
}