import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import User from '@/backend/models/User';
import Assignment from '@/backend/models/Assignment';
import Submission from '@/backend/models/Submission';
import { uploadToCloudinary } from '@/lib/cloudinary';

const handler = withAuth(async (request, user, userDoc, context) => {
  try {
    const { childId } = await context.params || {};
    await connectDB();

    // Verify parent owns child
    const parent = await User.findById(userDoc._id).lean();
    const ownsChild = parent?.parentProfile?.children?.some(c => c.id?.toString() === childId);
    if (!ownsChild) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    // Get child details
    const child = await User.findById(childId).lean();
    if (!child || !child.studentProfile) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const assignmentId = formData.get('assignmentId');
    const content = formData.get('content');
    const files = formData.getAll('files');

    if (!assignmentId) {
      return NextResponse.json({ success: false, message: 'Assignment ID is required' }, { status: 400 });
    }

    // Verify assignment exists and belongs to student's class
    const assignment = await Assignment.findById(assignmentId).lean();
    if (!assignment) {
      return NextResponse.json({ success: false, message: 'Assignment not found' }, { status: 404 });
    }

    if (assignment.classId.toString() !== child.studentProfile.classId?.toString()) {
      return NextResponse.json({ success: false, message: 'Assignment not for this class' }, { status: 403 });
    }

    // Check if already submitted
    const existingSubmission = await Submission.findOne({
      assignmentId,
      studentId: childId,
    });

    if (existingSubmission) {
      return NextResponse.json({ success: false, message: 'Assignment already submitted' }, { status: 400 });
    }

    // Check if late submission
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);
    const isLate = now > dueDate;

    if (isLate && !assignment.allowLateSubmission) {
      return NextResponse.json({ success: false, message: 'Late submission not allowed' }, { status: 400 });
    }

    // Upload attachments to Cloudinary
    const attachments = [];
    for (const file of files) {
      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');
        const dataUrl = `data:${file.type};base64,${base64}`;

        const uploadResult = await uploadToCloudinary(dataUrl, {
          folder: `ease-academy/students/${childId}/assignments/${assignmentId}`,
          resourceType: 'auto',
        });

        attachments.push({
          name: file.name,
          url: uploadResult.url,
          publicId: uploadResult.publicId,
        });
      }
    }

    // Create submission
    const submission = await Submission.create({
      assignmentId,
      studentId: childId,
      content,
      attachments,
      status: isLate ? 'late' : 'submitted',
      submittedAt: now,
    });

    return NextResponse.json({
      success: true,
      message: 'Assignment submitted successfully',
      submission: {
        id: submission._id.toString(),
        status: submission.status,
        submittedAt: submission.submittedAt,
      },
    });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Failed to submit assignment' 
    }, { status: 500 });
  }
});

export async function POST(request, context) {
  return handler(request, context);
}
