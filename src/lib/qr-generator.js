import QRCode from 'qrcode';

/**
 * Generate QR code as Data URL
 * @param {string} data - Data to encode in QR code
 * @param {Object} options - QR code options
 * @returns {Promise<string>} QR code as base64 data URL
 */
export async function generateQRCode(data, options = {}) {
  try {
    const defaultOptions = {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 7,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      ...options,
    };

    const qrDataURL = await QRCode.toDataURL(data, defaultOptions);
    return qrDataURL;
  } catch (error) {
    console.error('QR Code generation error:', error);
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
}

/**
 * Generate QR code for teacher with encoded data
 * @param {Object} teacher - Teacher object
 * @returns {Promise<string>} QR code data URL
 */
export async function generateTeacherQR(teacher) {
  const qrData = JSON.stringify({
    id: teacher._id || teacher.id,
    employeeId: teacher.teacherProfile?.employeeId || teacher.employeeId,
    name: teacher.fullName || `${teacher.firstName} ${teacher.lastName}`,
    email: teacher.email,
    type: 'teacher',
    generatedAt: new Date().toISOString(),
  });

  return generateQRCode(qrData, {
    width: 400,
    margin: 2,
  });
}

/**
 * Generate QR code for student with encoded data
 * @param {Object} student - Student object
 * @returns {Promise<string>} QR code data URL
 */
export async function generateStudentQR(student) {
  const qrData = JSON.stringify({
    id: student._id || student.id,
    registrationNumber: student.studentProfile?.registrationNumber || student.registrationNumber,
    name: student.fullName || `${student.firstName} ${student.lastName}`,
    class: student.studentProfile?.classId?.name || '',
    type: 'student',
    generatedAt: new Date().toISOString(),
  });

  return generateQRCode(qrData, {
    width: 400,
    margin: 2,
  });
}

/**
 * Generate QR code for staff with encoded data
 * @param {Object} staff - Staff object
 * @returns {Promise<string>} QR code data URL
 */
export async function generateStaffQR(staff) {
  const qrData = JSON.stringify({
    id: staff._id || staff.id,
    employeeId: staff.staffProfile?.employeeId || staff.employeeId,
    name: staff.fullName || `${staff.firstName} ${staff.lastName}`,
    email: staff.email,
    type: 'staff',
    generatedAt: new Date().toISOString(),
  });

  return generateQRCode(qrData, {
    width: 400,
    margin: 2,
  });
}

/**
 * Decode QR code data
 * @param {string} qrData - QR code data string
 * @returns {Object} Decoded QR data object
 */
export function decodeQRData(qrData) {
  try {
    return JSON.parse(qrData);
  } catch (error) {
    console.error('QR decode error:', error);
    return null;
  }
}

export default {
  generateQRCode,
  generateTeacherQR,
  generateStudentQR,
  generateStaffQR,
  decodeQRData,
};
