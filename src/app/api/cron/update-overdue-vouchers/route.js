import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import FeeVoucher from '@/backend/models/FeeVoucher';

/**
 * GET /api/cron/update-overdue-vouchers
 * Automatically update overdue vouchers
 * Should be called by a cron job daily
 */
export async function GET(request) {
  try {
    // Security check: Only allow if secret key matches
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Update overdue vouchers
    const result = await FeeVoucher.updateOverdueVouchers();

    return NextResponse.json({
      success: true,
      message: 'Overdue vouchers updated successfully',
      updatedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Error updating overdue vouchers:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
