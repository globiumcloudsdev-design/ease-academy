import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import User from '@/models/User';
import { getServerSession } from "next-auth"; 
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Tumhara auth path

export async function POST(req) {
  try {
    // 1. Check kro kaun user login hai
    // Agar next-auth use kr rhy ho:
    const session = await getServerSession(authOptions); 
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // 2. DB connect (agar nahi hai)
    if (mongoose.connection.readyState === 0) await mongoose.connect(process.env.MONGODB_URI);

    // 3. User ke record me token update kro
    // session.user.id ya session.user.email se user dhundo
    const userEmail = session.user.email; 

    const updatedUser = await User.findOneAndUpdate(
      { email: userEmail },
      { expoPushToken: token }, // Token save kr dia
      { new: true }
    );

    return NextResponse.json({ success: true, message: "Token saved successfully" });

  } catch (error) {
    console.error("Save Token Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}