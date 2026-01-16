import { NextResponse } from 'next/server';
import User from '@/backend/models/User';
import connectDB from '@/lib/database';

export async function POST(req) {
  try {
    await connectDB();
    const { userId, token } = await req.json();

    console.log(`📥 Mobile Token Request for User: ${userId}`);

    if (!userId || !token) {
        return NextResponse.json({ success: false, message: "Missing Data" }, { status: 400 });
    }

    // Token Update Karo
    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      { expoPushToken: token },
      { new: true } // Return updated doc
    );

    if (!updatedUser) {
        return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    console.log("✅ Token Saved Successfully:", token);
    return NextResponse.json({ success: true, message: "Token Saved" });

  } catch (error) {
    console.error("❌ Token Save Error:", error);
    return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
  }
}
