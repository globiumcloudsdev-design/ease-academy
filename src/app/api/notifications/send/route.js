import { NextResponse } from 'next/server';
import { Expo } from 'expo-server-sdk';
import mongoose from 'mongoose';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import Notification from '@/backend/models/Notification';
import { withAuth, requireRole } from '@/backend/middleware/auth';

// Expo SDK Initialize
const expo = new Expo();

async function sendNotification(request, currentUser, userDoc) {
  try {
    await connectDB();

    const body = await request.json();
    const { title, message, type, targetRole, targetBranch, metadata } = body;

    console.log('📨 Sending notification from:', currentUser.role, currentUser.branchId);
    console.log('🎯 Target Branch:', targetBranch);

    // ============================================================
    // STEP A: LOGIC - Kisko bhejna hai? (Super vs Branch Admin)
    // ============================================================
    
    let filter = { role: targetRole, isActive: true }; // e.g. 'student'

    // Agar BRANCH ADMIN hai, toh filter restrict kro
    if (currentUser.role === 'branch_admin') {
      if (!currentUser.branchId) {
        return NextResponse.json({ success: false, error: "Branch ID missing" }, { status: 400 });
      }
      filter.branchId = currentUser.branchId; // Sirf apni branch walo ko dhoondo
    }
    // Agar SUPER ADMIN hai aur specific branch select ki hai
    else if (currentUser.role === 'super_admin' && targetBranch && targetBranch !== 'all') {
      filter.branchId = targetBranch; // Specific branch ko target kro
      console.log('🏢 Filtering by specific branch:', targetBranch);
    }
    // Agar 'all' hai toh koi branch filter nahi lagegi

    // Handle Specific Users (e.g. specific students)
    if (body.targetUserIds && Array.isArray(body.targetUserIds) && body.targetUserIds.length > 0) {
      filter._id = { $in: body.targetUserIds };
      console.log(`🎯 Targeting ${body.targetUserIds.length} specific users`);
    }

    // Users dhoondo unke Tokens k sath
    const users = await User.find(filter).select('_id expoPushToken');

    if (!users.length) {
      return NextResponse.json({ success: false, message: "No users found" }, { status: 404 });
    }

    console.log(`✅ Found ${users.length} users to notify`);

    // ============================================================
    // STEP B: DATABASE MEIN SAVE KRO (In-App List ke liye)
    // ============================================================
    
    // Add Sender Info to Metadata for History Tracking
    const senderName = currentUser.fullName || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'Unknown';
    
    const enhancedMetadata = {
      ...metadata,
      senderId: currentUser.userId,
      senderName: senderName,
      senderRole: currentUser.role,
      sentAt: new Date()
    };

    const dbNotifications = users.map(user => ({
      type,
      title,
      message,
      targetUser: user._id,
      metadata: enhancedMetadata,
      isRead: false
    }));

    await Notification.insertMany(dbNotifications);

    // ============================================================
    // STEP C: EXPO PUSH NOTIFICATION BHEJO (Pop-up ke liye)
    // ============================================================

    let messages = [];
    
    for (let user of users) {
      // Check kro token valid hai ya nahi (Expo tokens start with Exponent...)
      if (user.expoPushToken && Expo.isExpoPushToken(user.expoPushToken)) {
        messages.push({
          to: user.expoPushToken,
          sound: 'default',
          title: title,
          body: message,
          data: { type: type, ...metadata }, // Ye data app click hony p kaam ayega
        });
      }
    }

    console.log(`📱 Sending push to ${messages.length} devices`);

    // Expo ko chunks me bhejte hain (optimization)
    let chunks = expo.chunkPushNotifications(messages);
    
    for (let chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        console.error("Error sending chunk:", error);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Notification saved and sent to ${messages.length} devices`,
      totalUsers: users.length,
      devicesNotified: messages.length
    });

  } catch (error) {
    console.error("Notification Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// Export with Auth Protection - Only super_admin and branch_admin can send notifications
export const POST = withAuth(sendNotification, [requireRole(['super_admin', 'branch_admin'])]);