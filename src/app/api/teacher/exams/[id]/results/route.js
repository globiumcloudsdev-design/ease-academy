import { NextResponse } from 'next/server';
import { withAuth, requireRole } from '@/backend/middleware/auth';
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

    const contentType = request.headers.get('content-type') || '';
    let bodyData = {};
    let formData = null;

    if (contentType.includes('multipart/form-data')) {
      formData = await request.formData();
    } else {
      bodyData = await request.json();
    }

    // Verify access for teachers
    if (userDoc.role === 'teacher') {
      const teacherId = userDoc._id;
      
      // Get the target subject ID first
      const targetSubjectId = formData ? formData.get('subjectId') : bodyData.subjectId;
      
      if (!targetSubjectId) {
        return NextResponse.json({ 
          success: false, 
          message: 'Subject ID is required' 
        }, { status: 400 });
      }

      // Check if exam belongs to a class the teacher teaches
      const timetables = await Timetable.find({
        'periods.teacherId': teacherId,
        classId: exam.classId
      });

      if (timetables.length === 0) {
        console.log(`Teacher ${teacherId} has no timetable for class ${exam.classId}`);
        return NextResponse.json({ 
          success: false, 
          message: 'Access denied. You are not assigned to teach this class.' 
        }, { status: 403 });
      }

      // Collect all subjects this teacher teaches in this class
      const teacherSubjects = new Set();
      timetables.forEach(tt => {
        // If exam is for a specific section, teacher must teach in that section
        if (exam.section && tt.section && tt.section !== exam.section) return;
        
        tt.periods.forEach(p => {
          if (p.teacherId?.toString() === teacherId.toString() && p.subjectId) {
            teacherSubjects.add(p.subjectId.toString());
          }
        });
      });

      console.log(`Teacher subjects for class ${exam.classId}:`, Array.from(teacherSubjects));
      console.log(`Target subject:`, targetSubjectId.toString());
      
      if (teacherSubjects.size === 0) {
        console.log('No subjects found for teacher');
        return NextResponse.json({ 
          success: false, 
          message: 'Access denied. You have no subjects assigned in this class.' 
        }, { status: 403 });
      }
      
      if (!teacherSubjects.has(targetSubjectId.toString())) {
        console.log('Target subject not in teacher subjects');
        return NextResponse.json({ 
          success: false, 
          message: 'Access denied. You do not teach this subject in this class.' 
        }, { status: 403 });
      }

      console.log('Subject access granted');

      // If exam is for all sections, verify teacher only edits students in their assigned sections
      if (!exam.section) {
        console.log('Exam has no specific section, checking teacher sections...');
        const teacherSections = new Set();
        timetables.forEach(tt => {
          if (tt.section) teacherSections.add(tt.section);
        });

        console.log('Teacher sections:', Array.from(teacherSections));

        if (teacherSections.size > 0) {
          if (formData) {
            const studentId = formData.get('studentId');
            const student = await User.findById(studentId).select('studentProfile.section').lean();
            console.log('Student section:', student?.studentProfile?.section);
            if (!teacherSections.has(student?.studentProfile?.section)) {
              console.log('Student section not in teacher sections');
              return NextResponse.json({ success: false, message: 'Access denied to this student' }, { status: 403 });
            }
          } else {
            const studentIds = bodyData.results.map(r => r.studentId);
            const students = await User.find({ _id: { $in: studentIds } }).select('studentProfile.section').lean();
            console.log('Students sections:', students.map(s => s.studentProfile?.section));
            const invalidStudent = students.find(s => !teacherSections.has(s.studentProfile?.section));
            if (invalidStudent) {
              console.log('Invalid student found:', invalidStudent._id, 'section:', invalidStudent.studentProfile?.section);
              return NextResponse.json({ 
                success: false, 
                message: 'Access denied. Some students are not in your assigned sections.' 
              }, { status: 403 });
            }
          }
        }
      }
      
      console.log('All access checks passed for teacher');
    }

    if (formData) {
      // Handle single student result with potential file uploads
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
      const { results, subjectId } = bodyData;
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

