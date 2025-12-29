import Timetable from '../models/Timetable';
import Class from '../models/Class';
import Subject from '../models/Subject';
import User from '../models/User';
import Branch from '../models/Branch';
import connectDB from '@/lib/database';

/**
 * Get all timetables with filters
 */
export async function getTimetables(filters = {}) {
  try {
    await connectDB();

    const {
      branchId,
      classId,
      academicYear,
      status,
      page = 1,
      limit = 50,
    } = filters;

    const query = {};

    if (branchId) query.branchId = branchId;
    if (classId) query.classId = classId;
    if (academicYear) query.academicYear = academicYear;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [timetables, total] = await Promise.all([
      Timetable.find(query)
        .populate('branchId', 'name code')
        .populate('classId', 'name code grade')
        .populate('periods.subjectId', 'name code')
        .populate('periods.teacherId', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName')
        .populate('updatedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Timetable.countDocuments(query),
    ]);

    return {
      success: true,
      data: timetables,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  } catch (error) {
    console.error('Get timetables error:', error);
    throw new Error(error.message || 'Failed to fetch timetables');
  }
}

/**
 * Get timetable by ID
 */
export async function getTimetableById(id, branchId = null) {
  try {
    await connectDB();

    const query = { _id: id };
    if (branchId) {
      query.branchId = branchId;
    }

    const timetable = await Timetable.findOne(query)
      .populate('branchId', 'name code address contact')
      .populate('classId', 'name code grade sections')
      .populate('periods.subjectId', 'name code description')
      .populate('periods.teacherId', 'firstName lastName email phone profilePhoto')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName')
      .lean();

    if (!timetable) {
      return {
        success: false,
        message: branchId ? 'Timetable not found or access denied' : 'Timetable not found',
      };
    }

    return {
      success: true,
      data: timetable,
    };
  } catch (error) {
    console.error('Get timetable error:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch timetable',
    };
  }
}

/**
 * Helper function to check for duplicate periods across all timetables
 */
async function checkDuplicatePeriods(branchId, classId, section, periods, excludeTimetableId = null) {
  const query = {
    branchId,
    classId,
    section,
    status: { $ne: 'archived' },
  };
  
  if (excludeTimetableId) {
    query._id = { $ne: excludeTimetableId };
  }

  const existingTimetables = await Timetable.find(query).lean();

  for (const period of periods) {
    for (const timetable of existingTimetables) {
      for (const existingPeriod of timetable.periods || []) {
        // Check if same day
        if (existingPeriod.day === period.day) {
          // Check for exact duplicate
          if (
            existingPeriod.subjectId?.toString() === period.subjectId?.toString() &&
            existingPeriod.startTime === period.startTime &&
            existingPeriod.endTime === period.endTime
          ) {
            throw new Error(
              `Duplicate period found: ${period.day} ${period.startTime}-${period.endTime} for this subject is already scheduled in timetable "${timetable.name}"`
            );
          }

          // Check for time overlap
          const pStart = existingPeriod.startTime;
          const pEnd = existingPeriod.endTime;
          const periodStart = period.startTime;
          const periodEnd = period.endTime;

          if (
            (periodStart >= pStart && periodStart < pEnd) ||
            (periodEnd > pStart && periodEnd <= pEnd) ||
            (periodStart <= pStart && periodEnd >= pEnd)
          ) {
            throw new Error(
              `Time slot overlap found: ${period.day} ${period.startTime}-${period.endTime} overlaps with existing period ${pStart}-${pEnd} in timetable "${timetable.name}"`
            );
          }
        }
      }
    }
  }
}

/**
 * Create new timetable
 */
export async function createTimetable(data, userId) {
  try {
    await connectDB();

    // Validate branch exists
    const branch = await Branch.findById(data.branchId);
    if (!branch) {
      throw new Error('Branch not found');
    }

    // Validate class exists
    const classData = await Class.findById(data.classId);
    if (!classData) {
      throw new Error('Class not found');
    }

    // Validate subjects and teachers in periods
    if (data.periods && data.periods.length > 0) {
      for (const period of data.periods) {
        if (period.subjectId) {
          const subject = await Subject.findById(period.subjectId);
          if (!subject) {
            throw new Error(`Subject not found: ${period.subjectId}`);
          }
        }

        if (period.teacherId) {
          const teacher = await User.findById(period.teacherId);
          if (!teacher || teacher.role !== 'teacher') {
            throw new Error(`Teacher not found: ${period.teacherId}`);
          }
        }
      }
      
      // Check for duplicate periods across all timetables
      await checkDuplicatePeriods(data.branchId, data.classId, data.section, data.periods);
    }

    // Create timetable
    const timetable = new Timetable({
      ...data,
      createdBy: userId,
      updatedBy: userId,
    });

    await timetable.save();

    // Populate and return
    const populated = await Timetable.findById(timetable._id)
      .populate('branchId', 'name code')
      .populate('classId', 'name code grade')
      .populate('periods.subjectId', 'name code')
      .populate('periods.teacherId', 'firstName lastName email')
      .lean();

    return {
      success: true,
      message: 'Timetable created successfully',
      data: populated,
    };
  } catch (error) {
    console.error('Create timetable error:', error);
    throw new Error(error.message || 'Failed to create timetable');
  }
}

/**
 * Update timetable
 */
export async function updateTimetable(id, data, userId) {
  try {
    await connectDB();

    const timetable = await Timetable.findById(id);
    if (!timetable) {
      throw new Error('Timetable not found');
    }

    // Validate branch if changed
    if (data.branchId && data.branchId !== timetable.branchId.toString()) {
      const branch = await Branch.findById(data.branchId);
      if (!branch) {
        throw new Error('Branch not found');
      }
    }

    // Validate class if changed
    if (data.classId && data.classId !== timetable.classId.toString()) {
      const classData = await Class.findById(data.classId);
      if (!classData) {
        throw new Error('Class not found');
      }
    }

    // Validate subjects and teachers in periods
    if (data.periods && data.periods.length > 0) {
      for (const period of data.periods) {
        if (period.subjectId) {
          const subject = await Subject.findById(period.subjectId);
          if (!subject) {
            throw new Error(`Subject not found: ${period.subjectId}`);
          }
        }

        if (period.teacherId) {
          const teacher = await User.findById(period.teacherId);
          if (!teacher || teacher.role !== 'teacher') {
            throw new Error(`Teacher not found: ${period.teacherId}`);
          }
        }
      }
      
      // Check for duplicate periods across all timetables (excluding current timetable)
      await checkDuplicatePeriods(
        data.branchId || timetable.branchId,
        data.classId || timetable.classId,
        data.section || timetable.section,
        data.periods,
        id
      );
    }

    // Update timetable
    Object.assign(timetable, data);
    timetable.updatedBy = userId;
    await timetable.save();

    // Populate and return
    const populated = await Timetable.findById(timetable._id)
      .populate('branchId', 'name code')
      .populate('classId', 'name code grade')
      .populate('periods.subjectId', 'name code')
      .populate('periods.teacherId', 'firstName lastName email')
      .lean();

    return {
      success: true,
      message: 'Timetable updated successfully',
      data: populated,
    };
  } catch (error) {
    console.error('Update timetable error:', error);
    throw new Error(error.message || 'Failed to update timetable');
  }
}

/**
 * Delete timetable
 */
export async function deleteTimetable(id) {
  try {
    await connectDB();

    const timetable = await Timetable.findById(id);
    if (!timetable) {
      throw new Error('Timetable not found');
    }

    await timetable.deleteOne();

    return {
      success: true,
      message: 'Timetable deleted successfully',
    };
  } catch (error) {
    console.error('Delete timetable error:', error);
    throw new Error(error.message || 'Failed to delete timetable');
  }
}

/**
 * Get timetable for a specific class and section
 */
export async function getClassTimetable(classId, section, academicYear) {
  try {
    await connectDB();

    const query = {
      classId,
      academicYear,
      status: 'active',
    };

    if (section) {
      query.section = section;
    }

    const timetable = await Timetable.findOne(query)
      .populate('branchId', 'name code')
      .populate('classId', 'name code grade')
      .populate('periods.subjectId', 'name code')
      .populate('periods.teacherId', 'firstName lastName email profilePhoto')
      .lean();

    return {
      success: true,
      data: timetable,
    };
  } catch (error) {
    console.error('Get class timetable error:', error);
    throw new Error(error.message || 'Failed to fetch class timetable');
  }
}

/**
 * Get teacher's timetable
 */
export async function getTeacherTimetable(teacherId, academicYear) {
  try {
    await connectDB();

    const timetables = await Timetable.find({
      'periods.teacherId': teacherId,
      academicYear,
      status: 'active',
    })
      .populate('branchId', 'name code')
      .populate('classId', 'name code grade')
      .populate('periods.subjectId', 'name code')
      .lean();

    // Extract only periods for this teacher
    const teacherPeriods = timetables.map(tt => ({
      ...tt,
      periods: tt.periods.filter(p => p.teacherId.toString() === teacherId),
    }));

    return {
      success: true,
      data: teacherPeriods,
    };
  } catch (error) {
    console.error('Get teacher timetable error:', error);
    throw new Error(error.message || 'Failed to fetch teacher timetable');
  }
}
