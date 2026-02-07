import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Notification from '@/backend/models/Notification';
import User from '@/backend/models/User';
import { withAuth } from '@/backend/middleware/auth';

/**
 * 📊 Notification Stats API
 * GET /api/notifications/stats?notificationIds=id1,id2
 */
export const GET = withAuth(async (request, user) => {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const notificationIds = searchParams.get('notificationIds')?.split(',') || [];

        if (notificationIds.length === 0) {
            return NextResponse.json({ success: false, message: 'No IDs provided' }, { status: 400 });
        }

        // Find all notifications and populate user details
        const notifications = await Notification.find({
            _id: { $in: notificationIds }
        }).populate('targetUser', 'fullName email role').lean();

        if (!notifications || notifications.length === 0) {
            return NextResponse.json({ success: false, message: 'Notifications not found' }, { status: 404 });
        }

        const totalRecipients = notifications.length;
        const readUsers = notifications
            .filter(n => n.isRead)
            .map(n => ({
                name: n.targetUser?.fullName || 'Unknown',
                email: n.targetUser?.email || 'N/A',
                role: n.targetUser?.role || 'N/A',
                readAt: n.updatedAt
            }));

        const unreadUsers = notifications
            .filter(n => !n.isRead)
            .map(n => ({
                name: n.targetUser?.fullName || 'Unknown',
                email: n.targetUser?.email || 'N/A',
                role: n.targetUser?.role || 'N/A'
            }));

        return NextResponse.json({
            success: true,
            data: {
                totalRecipients,
                readCount: readUsers.length,
                unreadCount: unreadUsers.length,
                readPercentage: ((readUsers.length / totalRecipients) * 100).toFixed(1),
                readUsers,
                unreadUsers,
                notificationDetails: {
                    title: notifications[0].title,
                    message: notifications[0].message,
                    type: notifications[0].type
                }
            }
        });

    } catch (error) {
        console.error('Stats Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
});
