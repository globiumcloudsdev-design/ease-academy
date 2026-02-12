import EmployeeAttendance from '../models/EmployeeAttendance.js';
import User from '../models/User.js';
import Branch from '../models/Branch.js';

// Haversine formula to calculate distance between two points
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
};

// Check if location is within allowed radius
const validateLocation = (teacherLat, teacherLng, branchLat, branchLng, radiusMeters = 100) => {
  const distance = calculateDistance(teacherLat, teacherLng, branchLat, branchLng);
  return {
    distance,
    isValid: distance <= radiusMeters
  };
};

// Check if check-in is late
const isLateCheckIn = (checkInTime, workStartTime = '09:00', lateAfterMin = 15) => {
  const [startHour, startMin] = workStartTime.split(':').map(Number);
  // Create late threshold for the same day as check-in
  const lateThreshold = new Date(checkInTime);
  lateThreshold.setHours(startHour, startMin + lateAfterMin, 0, 0);

  return checkInTime > lateThreshold;
};

// Check if check-out is early
const isEarlyCheckOut = (checkOutTime, workEndTime = '17:00') => {
  const [endHour, endMin] = workEndTime.split(':').map(Number);
  // Create end threshold for the same day as check-out
  const endThreshold = new Date(checkOutTime);
  endThreshold.setHours(endHour, endMin, 0, 0);

  return checkOutTime < endThreshold;
};

// Teacher Check-In
export const teacherCheckIn = async (req, res, body = null) => {
  try {
    const requestBody = body || req.body || {};
    const { latitude, longitude } = requestBody;
    const teacherId = req.user.userId;

    // Validate required fields
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // Get teacher and branch info
    const teacher = await User.findById(teacherId).populate('branchId');
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    const branch = teacher.branchId;
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch information not found'
      });
    }

    // Create check-in time and calculate today's date
    const checkInTime = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if already checked in today
    const existingAttendance = await EmployeeAttendance.findOne({
      userId: teacherId,
      date: { $gte: today, $lt: tomorrow }
    });

    if (existingAttendance && existingAttendance.checkIn?.time) {
      return res.status(400).json({
        success: false,
        message: 'Already checked in today'
      });
    }

    // Location validation is optional for check-in (warning only)
    let locationValidation = null;
    let locationWarning = null;
    if (latitude && longitude) {
      const branchLat = parseFloat(process.env.BRANCH_LATITUDE) || 24.96136; // Default Karachi coordinates
      const branchLng = parseFloat(process.env.BRANCH_LONGITUDE) || 67.07103;
      const radius = parseInt(process.env.LOCATION_RADIUS_METERS || '100');

      locationValidation = validateLocation(
        parseFloat(latitude),
        parseFloat(longitude),
        branchLat,
        branchLng,
        radius
      );

      if (!locationValidation.isValid) {
        locationWarning = `Warning: You are not within the branch location. Distance: ${Math.round(locationValidation.distance)} meters. Allowed radius: ${radius} meters.`;
      }
    }

    // Calculate if late
    const workStartTime = process.env.WORK_START_TIME || '09:00';
    const lateAfterMin = parseInt(process.env.LATE_AFTER_MIN || '15');
    const isLate = isLateCheckIn(checkInTime, workStartTime, lateAfterMin);

    let attendance;
    if (existingAttendance) {
      // Update existing record
      attendance = await EmployeeAttendance.findByIdAndUpdate(
        existingAttendance._id,
        {
          checkIn: {
            time: checkInTime,
            location: {
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude)
            }
          },
          status: isLate ? 'late' : 'present'
        },
        { new: true }
      );
    } else {
      // Create new record
      attendance = new EmployeeAttendance({
        userId: teacherId,
        branchId: branch._id,
        date: today,
        checkIn: {
          time: checkInTime,
          location: {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude)
          }
        },
        status: isLate ? 'late' : 'present'
      });
      await attendance.save();
    }

    res.status(200).json({
      success: true,
      message: `Checked in successfully${isLate ? ' (Late)' : ''}${locationWarning ? ' - ' + locationWarning : ''}`,
      data: {
        attendance: {
          id: attendance._id,
          checkInTime: attendance.checkIn.time,
          status: attendance.status,
          distance: locationValidation ? Math.round(locationValidation.distance) : null,
          locationWarning
        }
      }
    });

  } catch (error) {
    console.error('Teacher check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Teacher Check-Out
export const teacherCheckOut = async (req, res, body = null) => {
  try {
    const requestBody = body || req.body || {};
    const { latitude, longitude } = requestBody;
    const teacherId = req.user.userId;

    // Validate required fields
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // Find today's attendance record
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await EmployeeAttendance.findOne({
      userId: teacherId,
      date: { $gte: today, $lt: tomorrow }
    });

    if (!existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'No check-in record found for today'
      });
    }

    if (existingAttendance.checkOut?.time) {
      return res.status(400).json({
        success: false,
        message: 'Already checked out today'
      });
    }

    // Location validation (warning only for check-out)
    let locationValidation = null;
    let locationWarning = null;
    if (latitude && longitude) {
      const branchLat = parseFloat(process.env.BRANCH_LATITUDE) || 24.96136; // Default Karachi coordinates
      const branchLng = parseFloat(process.env.BRANCH_LONGITUDE) || 67.07103;
      const radius = parseInt(process.env.LOCATION_RADIUS_METERS || '100');

      locationValidation = validateLocation(
        parseFloat(latitude),
        parseFloat(longitude),
        branchLat,
        branchLng,
        radius
      );

      if (!locationValidation.isValid) {
        locationWarning = `Warning: You are not within the branch location. Distance: ${Math.round(locationValidation.distance)} meters. Allowed radius: ${radius} meters.`;
      }
    }

    // Update attendance record with check-out
    const checkOutTime = new Date();
    const workEndTime = process.env.WORK_END_TIME || '17:00';

    const isEarly = isEarlyCheckOut(checkOutTime, workEndTime);

    // Determine final status - preserve both late and early checkout conditions
    let finalStatus = existingAttendance.status;
    if (isEarly) {
      if (existingAttendance.status === 'present') {
        finalStatus = 'early_checkout';
      } else if (existingAttendance.status === 'late') {
        finalStatus = 'late_early_checkout'; // Preserve both late check-in and early checkout
      }
    }

    const updateData = {
      checkOut: {
        time: checkOutTime,
        ...(latitude && longitude && {
          location: {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude)
          }
        })
      },
      status: finalStatus
    };

    const attendance = await EmployeeAttendance.findByIdAndUpdate(
      existingAttendance._id,
      updateData,
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: `Checked out successfully${isEarly ? ' (Early Checkout)' : ''}${locationWarning ? ' - ' + locationWarning : ''}`,
      data: {
        attendance: {
          id: attendance._id,
          checkOutTime: attendance.checkOut.time,
          status: attendance.status,
          distance: locationValidation ? Math.round(locationValidation.distance) : null,
          locationWarning
        }
      }
    });

  } catch (error) {
    console.error('Teacher check-out error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get Teacher Self Attendance Status
export const teacherAttendanceStatus = async (req, res) => {
  try {
    const teacherId = req.user.userId;

    // Get today's attendance record
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await EmployeeAttendance.findOne({
      userId: teacherId,
      date: { $gte: today, $lt: tomorrow }
    });

    if (!attendance) {
      return res.status(200).json({
        success: true,
        data: {
          isCheckedIn: false,
          todayRecord: null
        }
      });
    }

    // Format the response
    const todayRecord = {
      id: attendance._id,
      checkInTime: attendance.checkIn?.time,
      checkOutTime: attendance.checkOut?.time,
      status: attendance.status,
      location: attendance.checkIn?.location
    };

    res.status(200).json({
      success: true,
      data: {
        isCheckedIn: !!attendance.checkIn?.time,
        todayRecord
      }
    });

  } catch (error) {
    console.error('Teacher attendance status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get Teacher Attendance History and Statistics
export const teacherAttendanceHistory = async (req, res) => {
  try {
    console.log('🔍 Teacher Attendance History API called');
    console.log('📊 Query params:', req.query);
    console.log('👤 User ID:', req.user?.userId);

    const teacherId = req.user.userId;
    const { filterType = 'monthly', month, year, date, weekStart } = req.query;

    console.log('📅 Filter type:', filterType);

    let startDate, endDate, queryMonth, queryYear;

    // Calculate date range based on filter type
    const currentDate = new Date();

    if (filterType === 'daily') {
      // Daily filter - show records for today
      startDate = new Date(currentDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(currentDate);
      endDate.setHours(23, 59, 59, 999);
      queryMonth = currentDate.getMonth() + 1;
      queryYear = currentDate.getFullYear();
    } else if (filterType === 'weekly') {
      // Weekly filter - show records for current week (Monday to Sunday)
      const currentDay = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // Adjust to get Monday

      startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() + mondayOffset);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);

      queryMonth = startDate.getMonth() + 1;
      queryYear = startDate.getFullYear();
    } else if (filterType === 'monthly') {
      // Monthly filter - default behavior
      queryMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
      queryYear = year ? parseInt(year) : currentDate.getFullYear();

      // Validate month and year
      if (queryMonth < 1 || queryMonth > 12) {
        return res.status(400).json({
          success: false,
          message: 'Invalid month. Must be between 1 and 12.'
        });
      }

      if (queryYear < 2020 || queryYear > 2030) {
        return res.status(400).json({
          success: false,
          message: 'Invalid year. Must be between 2020 and 2030.'
        });
      }

      startDate = new Date(queryYear, queryMonth - 1, 1);
      endDate = new Date(queryYear, queryMonth - 1, new Date(queryYear, queryMonth, 0).getDate(), 23, 59, 59);
    } else if (filterType === 'date') {
      // Specific date filter
      if (!date) {
        return res.status(400).json({
          success: false,
          message: 'Date parameter is required for date filter type.'
        });
      }

      const selectedDate = new Date(date);
      if (isNaN(selectedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Use YYYY-MM-DD format.'
        });
      }

      startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);
      queryMonth = selectedDate.getMonth() + 1;
      queryYear = selectedDate.getFullYear();
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid filter type. Must be one of: daily, weekly, monthly, date.'
      });
    }

    console.log('📅 Date range:', startDate.toISOString(), 'to', endDate.toISOString());

    // Get all attendance records for the date range
    const attendanceRecords = await EmployeeAttendance.find({
      userId: teacherId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    console.log('📊 Found attendance records:', attendanceRecords.length);

    // Calculate statistics
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(record => record.status === 'present').length;
    const lateDays = attendanceRecords.filter(record => record.status === 'late').length;
    const absentDays = attendanceRecords.filter(record => record.status === 'absent').length;
    const halfDays = attendanceRecords.filter(record => record.status === 'half-day').length;
    const leaveDays = attendanceRecords.filter(record => record.status === 'leave').length;
    const earlyCheckoutDays = attendanceRecords.filter(record => record.status === 'early_checkout').length;

    console.log('📈 Statistics:', { totalDays, presentDays, lateDays, absentDays });

    // Calculate working days (excluding weekends) for percentage calculation
    const workingDays = [];
    const tempDate = new Date(startDate);
    while (tempDate <= endDate) {
      const dayOfWeek = tempDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude Sunday (0) and Saturday (6)
        workingDays.push(new Date(tempDate));
      }
      tempDate.setDate(tempDate.getDate() + 1);
    }

    const totalWorkingDays = workingDays.length;
    const attendancePercentage = totalWorkingDays > 0 ? ((presentDays + lateDays + halfDays) / totalWorkingDays * 100).toFixed(1) : 0;

    console.log('📊 Working days:', totalWorkingDays, 'Attendance %:', attendancePercentage);

    // Format attendance records for response
    const formattedRecords = attendanceRecords.map(record => ({
      id: record._id,
      date: record.date,
      status: record.status,
      checkInTime: record.checkIn?.time,
      checkOutTime: record.checkOut?.time,
      workingHours: record.workingHours || 0,
      lateBy: record.lateBy || 0,
      earlyLeaveBy: record.earlyLeaveBy || 0,
      location: record.checkIn?.location
    }));

    console.log('✅ Sending response with', formattedRecords.length, 'records');

    res.status(200).json({
      success: true,
      data: {
        filterType,
        month: queryMonth,
        year: queryYear,
        date: filterType === 'date' ? date : null,
        weekStart: filterType === 'weekly' ? startDate.toISOString().split('T')[0] : null,
        statistics: {
          totalDays,
          workingDays: totalWorkingDays,
          presentDays,
          lateDays,
          absentDays,
          halfDays,
          leaveDays,
          earlyCheckoutDays,
          attendancePercentage: parseFloat(attendancePercentage)
        },
        records: formattedRecords
      }
    });

  } catch (error) {
    console.error('❌ Teacher attendance history error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get Teacher Attendance for Branch Admin
export const getTeacherAttendance = async (req, res) => {
  try {
    const { date, teacherId } = req.query;
    const branchAdminId = req.user.userId;

    // Get branch admin's branch
    const branchAdmin = await User.findById(branchAdminId);
    if (!branchAdmin || !branchAdmin.branchId) {
      return res.status(403).json({
        success: false,
        message: 'Branch admin access required'
      });
    }

    // Build query
    const query = {
      branchId: branchAdmin.branchId
    };

    // Filter by date if provided
    if (date) {
      const queryDate = new Date(date);
      queryDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(queryDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query.date = { $gte: queryDate, $lt: nextDay };
    }

    // Filter by teacher if provided
    if (teacherId) {
      query.userId = teacherId;
    }

    // Get attendance records with teacher details
    const attendanceRecords = await EmployeeAttendance.find(query)
      .populate('userId', 'firstName lastName email')
      .sort({ date: -1, 'checkIn.time': -1 });

    // Format response
    const formattedRecords = attendanceRecords.map(record => {
      // Calculate early/late status for check-in
      let checkInStatus = 'on-time';
      if (record.checkIn?.time) {
        const workStartTime = process.env.WORK_START_TIME || '09:00';
        const lateAfterMin = parseInt(process.env.LATE_AFTER_MIN || '15');
        const isLate = isLateCheckIn(record.checkIn.time, workStartTime, lateAfterMin);
        checkInStatus = isLate ? 'late' : 'on-time';
      }

      // Calculate early/late status for check-out
      let checkOutStatus = 'on-time';
      if (record.checkOut?.time) {
        const workEndTime = process.env.WORK_END_TIME || '17:00';
        const isEarly = isEarlyCheckOut(record.checkOut.time, workEndTime);
        checkOutStatus = isEarly ? 'early' : 'on-time';
      }

      return {
        id: record._id,
        teacherId: record.userId._id,
        teacherName: `${record.userId.firstName} ${record.userId.lastName}`,
        teacherEmail: record.userId.email,
        date: record.date,
        checkInTime: record.checkIn?.time,
        checkOutTime: record.checkOut?.time,
        checkInLocation: record.checkIn?.location,
        checkOutLocation: record.checkOut?.location,
        status: record.status,
        checkInStatus,
        checkOutStatus,
        distanceFromBranch: record.distanceFromBranch
      };
    });

    res.status(200).json({
      success: true,
      data: {
        attendance: formattedRecords,
        total: formattedRecords.length
      }
    });

  } catch (error) {
    console.error('Get teacher attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};