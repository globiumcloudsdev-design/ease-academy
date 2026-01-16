// import { NextResponse } from 'next/server';
// import { Expo } from 'expo-server-sdk';
// import mongoose from 'mongoose';
// <<<<<<< HEAD
// import Notification from '@/backend/models/Notification'; // Apne Model ka path confirm karlena
// import User from '@/backend/models/User';
// import connectDB from '@/lib/database';
// =======
// import connectDB from '@/lib/database';
// import User from '@/backend/models/User';
// import Notification from '@/backend/models/Notification';
// import { withAuth, requireRole } from '@/backend/middleware/auth';
// >>>>>>> ca7a24cc2863b76a8c6680ffe9f29dc23140dc0c

// const expo = new Expo();

// async function sendNotification(request, currentUser, userDoc) {
//   try {
//     await connectDB();

// <<<<<<< HEAD
//     const body = await req.json();
//     const { title, message, type, targetRole, targetBranch } = body;

//     // 1. Users Filter Logic (Kisko bhejna hai?)
//     let query = { 
//       role: targetRole, 
//       isActive: true 
//     };

//     // Agar 'All Branches' nahi hai, to Specific Branch filter lagao
//     if (targetBranch && targetBranch !== 'all') {
//       query.branchId = targetBranch;
//     }

//     // 2. Users Dhoondo
//     // Hamein wo users chahiye jinka Token ho (Mobile ke liye) 
//     // Aur wo bhi chahiye jinka Token na ho (Sirf Web ke liye)
//     const users = await User.find(query).select('_id expoPushToken');

//     if (users.length === 0) {
//       return NextResponse.json({ success: false, message: "No users found" }, { status: 404 });
//     }

//     // 3. DATABASE SAVE (Web Dashboard ke liye)
//     // Sab users ke liye entry banao
//     const notificationsToSave = users.map(user => ({
// =======
//     const body = await request.json();
//     const { title, message, type, targetRole, metadata } = body;

//     console.log('📨 Sending notification from:', currentUser.role, currentUser.branchId);

//     // ============================================================
//     // STEP A: LOGIC - Kisko bhejna hai? (Super vs Branch Admin)
//     // ============================================================
    
//     let filter = { role: targetRole }; // e.g. 'student'

//     // Agar BRANCH ADMIN hai, toh filter restrict kro
//     if (currentUser.role === 'branch_admin') {
//       if (!currentUser.branchId) {
//         return NextResponse.json({ success: false, error: "Branch ID missing" }, { status: 400 });
//       }
//       filter.branchId = currentUser.branchId; // Sirf apni branch walo ko dhoondo
//     }
//     // Note: Super admin ke liye filter me branchId nahi lagega, wo sab uthayega

//     // Users dhoondo unke Tokens k sath
//     const users = await User.find(filter).select('_id expoPushToken');

//     if (!users.length) {
//       return NextResponse.json({ success: false, message: "No users found" }, { status: 404 });
//     }

//     console.log(`✅ Found ${users.length} users to notify`);

//     // ============================================================
//     // STEP B: DATABASE MEIN SAVE KRO (In-App List ke liye)
//     // ============================================================
    
//     const dbNotifications = users.map(user => ({
// >>>>>>> ca7a24cc2863b76a8c6680ffe9f29dc23140dc0c
//       type,
//       title,
//       message,
//       targetUser: user._id,
//       isRead: false,
//     }));

//     await Notification.insertMany(notificationsToSave);

//     // 4. MOBILE PUSH (Expo ke liye)
//     // Sirf unko bhejo jinke paas Token hai
//     let messages = [];
//     for (let user of users) {
//       if (user.expoPushToken && Expo.isExpoPushToken(user.expoPushToken)) {
//         messages.push({
//           to: user.expoPushToken,
//           sound: 'default',
//           title: title,
//           body: message,
//           data: { type }, // App click hone par data milega
//         });
//       }
//     }

// <<<<<<< HEAD
//     // Expo ko chunks mein bhejo
// =======
//     console.log(`📱 Sending push to ${messages.length} devices`);

//     // Expo ko chunks me bhejte hain (optimization)
// >>>>>>> ca7a24cc2863b76a8c6680ffe9f29dc23140dc0c
//     let chunks = expo.chunkPushNotifications(messages);
//     for (let chunk of chunks) {
//       try {
//         await expo.sendPushNotificationsAsync(chunk);
//       } catch (error) {
//         console.error("Expo Error:", error);
//       }
//     }

//     return NextResponse.json({ 
//       success: true, 
// <<<<<<< HEAD
//       message: `Sent to ${users.length} users (${messages.length} on Mobile)` 
//     });

//   } catch (error) {
//     console.error("Server Error:", error);
//     return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
// =======
//       message: `Notification saved and sent to ${messages.length} devices`,
//       totalUsers: users.length,
//       devicesNotified: messages.length
//     });

//   } catch (error) {
//     console.error("Notification Error:", error);
//     return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
// >>>>>>> ca7a24cc2863b76a8c6680ffe9f29dc23140dc0c
//   }
// }

// // Export with Auth Protection - Only super_admin and branch_admin can send notifications
// export const POST = withAuth(sendNotification, [requireRole(['super_admin', 'branch_admin'])]);





import { NextResponse } from 'next/server';
import { Expo } from 'expo-server-sdk';
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

<<<<<<< HEAD
    // Build query/filter
    const filter = { role: targetRole, isActive: true };
=======
    // ============================================================
    // 🎯 FILTERING LOGIC (Super vs Branch Admin)
    // ============================================================
    
    let filter = { role: targetRole, isActive: true }; // e.g. 'student'
>>>>>>> 0c0e9ba851880523bf2f30d9ee6abca6fdcd2be9

    // Branch admin: restrict to their branch
    if (currentUser.role === 'branch_admin') {
      if (!currentUser.branchId) {
        return NextResponse.json({ success: false, error: 'Your account is not linked to any branch.' }, { status: 400 });
      }
<<<<<<< HEAD
      filter.branchId = currentUser.branchId;
    }

    // Super admin: can target a specific branch
    if (currentUser.role === 'super_admin' && targetBranch && targetBranch !== 'all') {
      filter.branchId = targetBranch;
=======
      filter.branchId = currentUser.branchId; // Sirf apni branch walo ko dhoondo
    }
    // Agar SUPER ADMIN hai aur specific branch select ki hai
    else if (currentUser.role === 'super_admin' && targetBranch && targetBranch !== 'all') {
      filter.branchId = targetBranch; // Specific branch ko target kro
>>>>>>> 0c0e9ba851880523bf2f30d9ee6abca6fdcd2be9
      console.log('🏢 Filtering by specific branch:', targetBranch);
    }

    // Specific user targeting
    if (body.targetUserIds && Array.isArray(body.targetUserIds) && body.targetUserIds.length > 0) {
      filter._id = { $in: body.targetUserIds };
      console.log(`🎯 Targeting ${body.targetUserIds.length} specific users`);
    }

    console.log('🔍 User filter:', filter);

    // Fetch users
    const users = await User.find(filter).select('_id expoPushToken');
<<<<<<< HEAD
=======

>>>>>>> 0c0e9ba851880523bf2f30d9ee6abca6fdcd2be9
    if (!users || users.length === 0) {
      return NextResponse.json({ success: false, message: 'No users found matching criteria' }, { status: 404 });
    }

    console.log(`👥 Total Users Found: ${users.length}`);

    // Prepare metadata (use fullName fallback)
    const senderName = currentUser.fullName || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'Unknown';
    const enhancedMetadata = {
      ...(metadata || {}),
      senderId: currentUser.userId,
      senderName,
      senderRole: currentUser.role,
      sentAt: new Date(),
    };

    // Save notifications for each user
    const dbNotifications = users.map((user) => ({
      type,
      title,
      message,
      targetUser: user._id,
      metadata: enhancedMetadata,
<<<<<<< HEAD
      isRead: false,
=======
      isRead: false
>>>>>>> 0c0e9ba851880523bf2f30d9ee6abca6fdcd2be9
    }));

    await Notification.insertMany(dbNotifications);

    // Prepare Expo push messages
    const messages = [];
    for (const user of users) {
      if (user.expoPushToken && Expo.isExpoPushToken(user.expoPushToken)) {
        messages.push({
          to: user.expoPushToken,
          sound: 'default',
          title: title,
          body: message,
          data: { type, ...enhancedMetadata },
        });
      }
    }

    // Send in chunks
    if (messages.length > 0) {
      console.log(`🚀 Pushing to ${messages.length} mobile devices...`);
      const chunks = expo.chunkPushNotifications(messages);
      for (const chunk of chunks) {
        try {
          await expo.sendPushNotificationsAsync(chunk);
        } catch (err) {
          console.error('Expo Push Error:', err);
        }
      }
    } else {
      console.log('⚠️ No valid Expo tokens found. Skipping mobile push.');
    }

    return NextResponse.json({
      success: true,
      message: `Notification sent successfully to ${users.length} users (${messages.length} on Mobile)`,
      totalUsers: users.length,
      pushedTo: messages.length,
    });
  } catch (error) {
    console.error('Critical Notification Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export const POST = withAuth(sendNotification, [requireRole(['super_admin', 'branch_admin'])]);