import { NextResponse } from 'next/server';
import { Expo } from 'expo-server-sdk';
import mongoose from 'mongoose';
import Notification from '@/models/Notification'; // Tumhara Notification Model
import User from '@/models/User'; // Tumhara User Model
import connectDB from '@/lib/database';

// middleware auth.js mein se currentUser milna chahiye or middleware ke folder mein hai

// Expo SDK Initialize
const expo = new Expo();

export async function POST(req) {
  try {
    // 1. Admin verify kro (Session/Token check)
    // Maan lo tumhe 'currentUser' mil gya auth check se
    // const currentUser = ... (get user from session/token)
    
    // DEMO DATA (Isy replace krna real auth user se)
    const currentUser = { 
        _id: "admin_id_123", 
        role: "branch_admin", // Ya "super_admin"
        branchId: "branch_xyz_123" 
    };

    const body = await req.json();
    const { title, message, type, targetRole, metadata } = body;

    // ============================================================
    // STEP A: LOGIC - Kisko bhejna hai? (Super vs Branch Admin)
    // ============================================================
    
    let filter = { role: targetRole }; // e.g. 'student'

    // Agar BRANCH ADMIN hai, toh filter restrict kro
    if (currentUser.role === 'branch_admin') {
      if (!currentUser.branchId) {
        return NextResponse.json({ error: "Branch ID missing" }, { status: 400 });
      }
      filter.branchId = currentUser.branchId; // Sirf apni branch walo ko dhoondo
    }
    // Note: Super admin ke liye filter me branchId nahi lagega, wo sab uthayega

    // Users dhoondo unke Tokens k sath
    const users = await User.find(filter).select('_id expoPushToken');

    if (!users.length) {
      return NextResponse.json({ message: "No users found" }, { status: 404 });
    }

    // ============================================================
    // STEP B: DATABASE MEIN SAVE KRO (In-App List ke liye)
    // ============================================================
    
    const dbNotifications = users.map(user => ({
      type,
      title,
      message,
      targetUser: user._id,
      metadata,
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
      message: `Notification saved and sent to ${messages.length} devices` 
    });

  } catch (error) {
    console.error("Notification Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}