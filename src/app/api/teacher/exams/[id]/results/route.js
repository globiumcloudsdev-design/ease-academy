import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middleware/auth';
import connectDB from '@/lib/database';
import Exam from '@/backend/models/Exam';
import Timetable from '@/backend/models/Timetable';
import User from '@/backend/models/User';
import Branch from '@/backend/models/Branch';
import Class from '@/backend/models/Class';
import Subject from '@/backend/models/Subject';
import { uploadToCloudinary } from '@/lib/cloudinary';

// POST - Add or update results for an exam
export const POST = withAuth(async (request, user, userDoc, context) => {
  try {
    const { id } = await context.params || {};
    await connectDB();

    const exam = await Exam.findById(id);
    if (!exam) {
      return NextResponse.json({ success: false, message: 'Exam not found' }, { status: 404 });
    }

    // Verify access
    if (userDoc.role === 'teacher') {
      const teacherClasses = userDoc.teacherProfile?.classes?.map(c => c.classId.toString()) || [];
      if (!teacherClasses.includes(exam.classId.toString())) {
        return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
      }
    }

    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Handle single student result with potential file uploads
      const formData = await request.formData();
      const studentId = formData.get('studentId');
      const subjectId = formData.get('subjectId');
      const marksObtained = parseFloat(formData.get('marksObtained') || '0');
      const grade = formData.get('grade');
      const remarks = formData.get('remarks');
      const isAbsent = formData.get('isAbsent') === 'true';
      const files = formData.getAll('files');

      if (!studentId || !subjectId) {
        return NextResponse.json({ success: false, message: 'Student ID and Subject ID are required' }, { status: 400 });
      }

      // Upload attachments
      const attachments = [];
      for (const file of files) {
        if (file && file.size > 0) {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const base64 = buffer.toString('base64');
          const dataUrl = `data:${file.type};base64,${base64}`;

          const uploadResult = await uploadToCloudinary(dataUrl, {
            folder: `ease-academy/exams/${id}/results/${studentId}`,
            resourceType: 'auto',
          });

          attachments.push({
            name: file.name,
            url: uploadResult.url,
            publicId: uploadResult.publicId,
          });
        }
      }

      // Find existing result or create new (match both student and subject)
      const resultIndex = exam.results.findIndex(r => 
        r.studentId.toString() === studentId && 
        r.subjectId.toString() === subjectId
      );
      
      const resultData = {
        studentId,
        subjectId,
        marksObtained,
        grade,
        remarks,
        isAbsent,
        attachments: attachments.length > 0 ? attachments : undefined
      };

      if (resultIndex > -1) {
        // Update existing
        if (attachments.length > 0) {
          const existingAttachments = exam.results[resultIndex].attachments || [];
          resultData.attachments = [...existingAttachments, ...attachments];
        }
        exam.results[resultIndex] = { ...exam.results[resultIndex].toObject(), ...resultData };
      } else {
        // Add new
        exam.results.push(resultData);
      }

      await exam.save();
      return NextResponse.json({ success: true, message: 'Result updated successfully', exam });

    } else {
      // Handle bulk results update (JSON)
      const { results, subjectId } = await request.json();
      if (!results || !Array.isArray(results) || !subjectId) {
        return NextResponse.json({ success: false, message: 'Results array and Subject ID are required' }, { status: 400 });
      }

      // Update results array
      results.forEach(newResult => {
        const index = exam.results.findIndex(r => 
          r.studentId.toString() === newResult.studentId && 
          r.subjectId.toString() === subjectId
        );
        
        const resultData = { ...newResult, subjectId };

        if (index > -1) {
          exam.results[index] = { ...exam.results[index].toObject(), ...resultData };
        } else {
          exam.results.push(resultData);
        }
      });

      await exam.save();
      return NextResponse.json({ success: true, message: 'Results updated successfully', exam });
    }

  } catch (error) {
    console.error('Error updating results:', error);
    return NextResponse.json({ success: false, message: 'Failed to update results' }, { status: 500 });
  }
});
