const https = require('https');
const http = require('http');

// Configuration
const API_BASE_URL = 'http://localhost:3000';

// Sample data for all charts
const sampleData = {
  branches: [
    {
      name: 'Main Campus',
      code: 'MC',
      address: {
        street: '123 Main Street',
        city: 'Lahore',
        state: 'Punjab',
        zipCode: '54000',
        country: 'Pakistan'
      },
      contact: {
        phone: '+923001234567',
        email: 'main@easeacademy.com'
      }
    },
    {
      name: 'North Branch',
      code: 'NB',
      address: {
        street: '456 North Avenue',
        city: 'Lahore',
        state: 'Punjab',
        zipCode: '54000',
        country: 'Pakistan'
      },
      contact: {
        phone: '+923001234568',
        email: 'north@easeacademy.com'
      }
    },
    {
      name: 'South Branch',
      code: 'SB',
      address: {
        street: '789 South Road',
        city: 'Lahore',
        state: 'Punjab',
        zipCode: '54000',
        country: 'Pakistan'
      },
      contact: {
        phone: '+923001234569',
        email: 'south@easeacademy.com'
      }
    }
  ],
  grades: [
    { name: 'Grade 1', gradeNumber: 1 },
    { name: 'Grade 2', gradeNumber: 2 },
    { name: 'Grade 3', gradeNumber: 3 },
    { name: 'Grade 4', gradeNumber: 4 },
    { name: 'Grade 5', gradeNumber: 5 },
    { name: 'Grade 6', gradeNumber: 6 },
    { name: 'Grade 7', gradeNumber: 7 },
    { name: 'Grade 8', gradeNumber: 8 }
  ],
  classes: [
    { name: 'Class 1', code: 'CLS1', capacity: 30, gradeIndex: 0 },
    { name: 'Class 2', code: 'CLS2', capacity: 30, gradeIndex: 1 },
    { name: 'Class 3', code: 'CLS3', capacity: 30, gradeIndex: 2 },
    { name: 'Class 4', code: 'CLS4', capacity: 30, gradeIndex: 3 },
    { name: 'Class 5', code: 'CLS5', capacity: 30, gradeIndex: 4 },
    { name: 'Class 6', code: 'CLS6', capacity: 30, gradeIndex: 5 },
    { name: 'Class 7', code: 'CLS7', capacity: 30, gradeIndex: 6 },
    { name: 'Class 8', code: 'CLS8', capacity: 30, gradeIndex: 7 }
  ],
  students: [
    // Main Campus students
    { firstName: 'Ahmed', lastName: 'Khan', className: 'Class 1', branchName: 'Main Campus' },
    { firstName: 'Fatima', lastName: 'Ahmed', className: 'Class 1', branchName: 'Main Campus' },
    { firstName: 'Muhammad', lastName: 'Ali', className: 'Class 2', branchName: 'Main Campus' },
    { firstName: 'Ayesha', lastName: 'Siddiqui', className: 'Class 2', branchName: 'Main Campus' },
    { firstName: 'Hassan', lastName: 'Raza', className: 'Class 3', branchName: 'Main Campus' },
    { firstName: 'Zara', lastName: 'Malik', className: 'Class 3', branchName: 'Main Campus' },
    { firstName: 'Omar', lastName: 'Farooq', className: 'Class 4', branchName: 'Main Campus' },
    { firstName: 'Maryam', lastName: 'Hussain', className: 'Class 4', branchName: 'Main Campus' },
    { firstName: 'Bilal', lastName: 'Khan', className: 'Class 5', branchName: 'Main Campus' },
    { firstName: 'Sana', lastName: 'Akhtar', className: 'Class 5', branchName: 'Main Campus' },
    { firstName: 'Usman', lastName: 'Shah', className: 'Class 6', branchName: 'Main Campus' },
    { firstName: 'Hina', lastName: 'Bashir', className: 'Class 6', branchName: 'Main Campus' },
    { firstName: 'Asif', lastName: 'Javed', className: 'Class 7', branchName: 'Main Campus' },
    { firstName: 'Nadia', lastName: 'Iqbal', className: 'Class 7', branchName: 'Main Campus' },
    { firstName: 'Tariq', lastName: 'Mahmood', className: 'Class 8', branchName: 'Main Campus' },
    { firstName: 'Sadia', lastName: 'Khalid', className: 'Class 8', branchName: 'Main Campus' },

    // North Branch students
    { firstName: 'Saad', lastName: 'Butt', className: 'Class 1', branchName: 'North Branch' },
    { firstName: 'Amina', lastName: 'Tariq', className: 'Class 1', branchName: 'North Branch' },
    { firstName: 'Hamza', lastName: 'Yousuf', className: 'Class 2', branchName: 'North Branch' },
    { firstName: 'Khadija', lastName: 'Nasir', className: 'Class 2', branchName: 'North Branch' },
    { firstName: 'Fahad', lastName: 'Qureshi', className: 'Class 3', branchName: 'North Branch' },
    { firstName: 'Saima', lastName: 'Waseem', className: 'Class 3', branchName: 'North Branch' },
    { firstName: 'Danish', lastName: 'Abbas', className: 'Class 4', branchName: 'North Branch' },
    { firstName: 'Rabia', lastName: 'Zafar', className: 'Class 4', branchName: 'North Branch' },
    { firstName: 'Imran', lastName: 'Gul', className: 'Class 5', branchName: 'North Branch' },
    { firstName: 'Noreen', lastName: 'Fazal', className: 'Class 5', branchName: 'North Branch' },
    { firstName: 'Kashif', lastName: 'Mehmood', className: 'Class 6', branchName: 'North Branch' },
    { firstName: 'Farah', lastName: 'Saleem', className: 'Class 6', branchName: 'North Branch' },

    // South Branch students
    { firstName: 'Rashid', lastName: 'Latif', className: 'Class 1', branchName: 'South Branch' },
    { firstName: 'Bushra', lastName: 'Anwar', className: 'Class 1', branchName: 'South Branch' },
    { firstName: 'Naveed', lastName: 'Akram', className: 'Class 2', branchName: 'South Branch' },
    { firstName: 'Shazia', lastName: 'Hanif', className: 'Class 2', branchName: 'South Branch' },
    { firstName: 'Javed', lastName: 'Aslam', className: 'Class 3', branchName: 'South Branch' },
    { firstName: 'Tasneem', lastName: 'Rafiq', className: 'Class 3', branchName: 'South Branch' },
    { firstName: 'Salman', lastName: 'Dar', className: 'Class 4', branchName: 'South Branch' },
    { firstName: 'Rukhsana', lastName: 'Bukhari', className: 'Class 4', branchName: 'South Branch' }
  ],
  attendance: [],
  feeVouchers: [],
  exams: []
};

// Function to make authenticated API request
function makeAuthenticatedRequest(endpoint, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, API_BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    // Use HTTP for localhost, HTTPS for others
    const client = url.hostname === 'localhost' ? http : https;
    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ statusCode: res.statusCode, data: response });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Function to login and get token
async function loginAndGetToken(email, password) {
  try {
    console.log(`🔑 Logging in as ${email}...`);

    const response = await makeAuthenticatedRequest('/api/auth/login', 'POST', { email, password });

    if (response.statusCode === 200 && response.data.success && response.data.data && response.data.data.accessToken) {
      console.log(`✅ Successfully logged in as ${email}`);
      return response.data.data.accessToken;
    } else {
      console.log(`❌ Login failed for ${email}:`, response.data.message || response.data);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error logging in as ${email}:`, error.message);
    return null;
  }
}

// Function to get super admin token
async function getSuperAdminToken() {
  // Use the provided JWT token
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTM4NDQ2Y2ZjM2FhYTMwMTQxZTdjNDAiLCJlbWFpbCI6InN1cGVyYWRtaW5AZWFzZWFjYWRlbXkuY29tIiwicm9sZSI6InN1cGVyX2FkbWluIiwiaWF0IjoxNzY5Njg0MzAwLCJleHAiOjE3NzAyODkxMDB9.GZrwEEtEgibTcVLUPmk1ZMbSUcKxGz6sIuweg8w-XCY';

  console.log('✅ Using provided super admin JWT token');
  return token;
}

// Function to create branches
async function createBranches(token) {
  const createdBranches = [];

  for (const branchData of sampleData.branches) {
    try {
      console.log(`🏫 Creating branch: ${branchData.name}`);

      const response = await makeAuthenticatedRequest('/api/super-admin/branches', 'POST', branchData, token);

      if (response.statusCode === 201 || response.statusCode === 200) {
        console.log(`✅ Branch ${branchData.name} created successfully`);
        const branch = response.data.data || response.data;
        createdBranches.push({
          id: branch._id,
          name: branch.name,
          code: branch.code
        });
      } else {
        console.log(`❌ Failed to create branch ${branchData.name}:`, response.data);
      }
    } catch (error) {
      console.error(`❌ Error creating branch ${branchData.name}:`, error.message);
    }
  }

  return createdBranches;
}

// Function to create grades
async function createGrades(token) {
  const createdGrades = [];

  for (const gradeData of sampleData.grades) {
    try {
      console.log(`📊 Creating grade: ${gradeData.name}`);

      const gradePayload = {
        ...gradeData,
        academicYear: '2024'
      };

      const response = await makeAuthenticatedRequest('/api/super-admin/grades', 'POST', gradePayload, token);

      if (response.statusCode === 201 || response.statusCode === 200) {
        console.log(`✅ Grade ${gradeData.name} created successfully`);
        const grade = response.data.data || response.data;
        createdGrades.push({
          id: grade._id,
          name: grade.name,
          gradeNumber: grade.gradeNumber
        });
      } else {
        console.log(`❌ Failed to create grade ${gradeData.name}:`, response.data);
      }
    } catch (error) {
      console.error(`❌ Error creating grade ${gradeData.name}:`, error.message);
    }
  }

  return createdGrades;
}

// Function to create classes for each branch
async function createClasses(token, branches, grades) {
  const createdClasses = [];

  for (const branch of branches) {
    for (const classData of sampleData.classes) {
      try {
        console.log(`📚 Creating class: ${classData.name} for ${branch.name}`);

        const classPayload = {
          name: classData.name,
          code: classData.code,
          grade: grades[classData.gradeIndex].id,
          branchId: branch.id,
          academicYear: '2024',
          status: 'active',
          sections: [
            {
              name: 'A',
              capacity: classData.capacity / 2,
              roomNumber: `${classData.code}-A`
            },
            {
              name: 'B',
              capacity: classData.capacity / 2,
              roomNumber: `${classData.code}-B`
            }
          ]
        };

        const response = await makeAuthenticatedRequest('/api/super-admin/classes', 'POST', classPayload, token);

        if (response.statusCode === 201 || response.statusCode === 200) {
          console.log(`✅ Class ${classData.name} created for ${branch.name}`);
          const cls = response.data.data || response.data;
          createdClasses.push({
            id: cls._id,
            name: cls.name,
            branchId: branch.id,
            branchName: branch.name,
            gradeId: grades[classData.gradeIndex].id
          });
        } else {
          console.log(`❌ Failed to create class ${classData.name} for ${branch.name}:`, response.data);
        }
      } catch (error) {
        console.error(`❌ Error creating class ${classData.name} for ${branch.name}:`, error.message);
      }
    }
  }

  return createdClasses;
}

// Function to create students
async function createStudents(token, classes) {
  const createdStudents = [];

  for (const studentData of sampleData.students) {
    try {
      console.log(`👨‍🎓 Creating student: ${studentData.firstName} ${studentData.lastName}`);

      // Find the matching class
      const studentClass = classes.find(cls =>
        cls.name === studentData.className && cls.branchName === studentData.branchName
      );

      if (!studentClass) {
        console.log(`⚠️ Could not find class ${studentData.className} for branch ${studentData.branchName}`);
        continue;
      }

      const studentPayload = {
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        email: `${studentData.firstName.toLowerCase()}.${studentData.lastName.toLowerCase()}@student.com`,
        phone: `+92300${Math.floor(Math.random() * 9000000) + 1000000}`,
        dateOfBirth: new Date(2010 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
        gender: Math.random() > 0.5 ? 'male' : 'female',
        bloodGroup: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'][Math.floor(Math.random() * 8)],
        religion: 'Islam',
        nationality: 'Pakistani',
        password: 'student123',
        status: 'active',
        address: {
          street: `${Math.floor(Math.random() * 1000) + 1} ${['Main', 'Park', 'Garden', 'Model'][Math.floor(Math.random() * 4)]} Street`,
          city: 'Lahore',
          state: 'Punjab',
          postalCode: '54000',
          country: 'Pakistan'
        },
        studentProfile: {
          classId: studentClass.id,
          section: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
          rollNumber: `${Math.floor(Math.random() * 30) + 1}`,
          admissionDate: '2024-01-15',
          academicYear: '2024'
        }
      };

      const response = await makeAuthenticatedRequest('/api/super-admin/students', 'POST', studentPayload, token);

      if (response.statusCode === 201 || response.statusCode === 200) {
        console.log(`✅ Student ${studentData.firstName} ${studentData.lastName} created successfully`);
        const student = response.data.data || response.data;
        createdStudents.push({
          id: student._id,
          name: `${studentData.firstName} ${studentData.lastName}`,
          classId: studentClass.id,
          branchId: studentClass.branchId
        });
      } else {
        console.log(`❌ Failed to create student ${studentData.firstName} ${studentData.lastName}:`, response.data);
      }
    } catch (error) {
      console.error(`❌ Error creating student ${studentData.firstName} ${studentData.lastName}:`, error.message);
    }
  }

  return createdStudents;
}

// Function to create attendance records
async function createAttendanceRecords(token, students) {
  const createdAttendance = [];
  const today = new Date();

  for (const student of students) {
    try {
      // Create attendance for the last 30 days
      for (let i = 0; i < 30; i++) {
        const attendanceDate = new Date(today);
        attendanceDate.setDate(today.getDate() - i);

        // Random attendance status (80% present, 20% absent)
        const isPresent = Math.random() > 0.2;

        const attendancePayload = {
          studentId: student.id,
          classId: student.classId,
          date: attendanceDate.toISOString().split('T')[0],
          status: isPresent ? 'present' : 'absent',
          markedBy: token, // This should be a teacher/branch admin ID
          notes: isPresent ? '' : 'Sick leave'
        };

        const response = await makeAuthenticatedRequest('/api/super-admin/attendance', 'POST', attendancePayload, token);

        if (response.statusCode === 201 || response.statusCode === 200) {
          createdAttendance.push(response.data.data || response.data);
        }
      }
    } catch (error) {
      console.error(`❌ Error creating attendance for student ${student.name}:`, error.message);
    }
  }

  console.log(`✅ Created attendance records for ${students.length} students`);
  return createdAttendance;
}

// Function to create fee vouchers
async function createFeeVouchers(token, students) {
  const createdFeeVouchers = [];
  const months = ['January', 'February', 'March', 'April', 'May', 'June'];

  for (const student of students) {
    for (const month of months) {
      try {
        const feeAmount = Math.floor(Math.random() * 10000) + 5000; // 5000-15000 PKR

        const feeVoucherPayload = {
          studentId: student.id,
          classId: student.classId,
          academicYear: '2024',
          month: month,
          dueDate: new Date(2024, months.indexOf(month) + 1, 10).toISOString().split('T')[0],
          feeBreakdown: {
            tuitionFee: Math.floor(feeAmount * 0.7),
            examFee: Math.floor(feeAmount * 0.15),
            otherFee: Math.floor(feeAmount * 0.15)
          },
          totalAmount: feeAmount,
          status: Math.random() > 0.3 ? 'paid' : 'pending', // 70% paid, 30% pending
          paymentDate: Math.random() > 0.3 ? new Date(2024, months.indexOf(month), Math.floor(Math.random() * 25) + 5).toISOString().split('T')[0] : null
        };

        const response = await makeAuthenticatedRequest('/api/super-admin/fee-vouchers', 'POST', feeVoucherPayload, token);

        if (response.statusCode === 201 || response.statusCode === 200) {
          createdFeeVouchers.push(response.data.data || response.data);
        }
      } catch (error) {
        console.error(`❌ Error creating fee voucher for student ${student.name}:`, error.message);
      }
    }
  }

  console.log(`✅ Created fee vouchers for ${students.length} students`);
  return createdFeeVouchers;
}

// Function to create exam records
async function createExamRecords(token, classes) {
  const createdExams = [];
  const subjects = ['Mathematics', 'English', 'Science', 'Social Studies', 'Urdu', 'Islamiyat'];

  for (const cls of classes) {
    try {
      const examPayload = {
        classId: cls.id,
        branchId: cls.branchId,
        name: `Mid Term Exam ${cls.name}`,
        type: 'mid_term',
        academicYear: '2024',
        subjects: subjects.map(subject => ({
          subjectId: `subject_${subject.toLowerCase().replace(' ', '_')}`, // Mock subject IDs
          subjectName: subject,
          date: new Date(2024, 3, Math.floor(Math.random() * 20) + 10).toISOString().split('T')[0], // April 2024
          totalMarks: 100,
          passingMarks: 40
        })),
        status: 'completed'
      };

      const response = await makeAuthenticatedRequest('/api/super-admin/exams', 'POST', examPayload, token);

      if (response.statusCode === 201 || response.statusCode === 200) {
        const exam = response.data.data || response.data;
        createdExams.push(exam);

        // Create results for this exam
        await createExamResults(token, exam._id, cls);
      }
    } catch (error) {
      console.error(`❌ Error creating exam for class ${cls.name}:`, error.message);
    }
  }

  console.log(`✅ Created exams for ${classes.length} classes`);
  return createdExams;
}

// Function to create exam results
async function createExamResults(token, examId, classInfo) {
  // Get students in this class
  try {
    const studentsResponse = await makeAuthenticatedRequest(`/api/super-admin/students?classId=${classInfo.id}`, 'GET', null, token);

    if (studentsResponse.statusCode === 200 && studentsResponse.data.success && studentsResponse.data.data) {
      const students = studentsResponse.data.data;

      for (const student of students) {
        const results = [];

        // Create results for each subject
        for (let i = 0; i < 6; i++) { // 6 subjects
          const marksObtained = Math.floor(Math.random() * 61) + 40; // 40-100 marks
          results.push({
            studentId: student._id,
            subjectId: `subject_${i}`,
            marksObtained: marksObtained,
            isAbsent: false,
            grade: marksObtained >= 80 ? 'A' : marksObtained >= 60 ? 'B' : marksObtained >= 40 ? 'C' : 'F'
          });
        }

        const resultsPayload = {
          examId: examId,
          results: results
        };

        await makeAuthenticatedRequest('/api/super-admin/exam-results', 'POST', resultsPayload, token);
      }

      console.log(`✅ Created exam results for ${students.length} students in ${classInfo.name}`);
    }
  } catch (error) {
    console.error('❌ Error creating exam results:', error.message);
  }
}

// Function to check if chart APIs return data
async function checkChartDataStatus(token) {
  console.log('🔍 Checking current chart data status...\n');

  const chartEndpoints = [
    { name: 'Class-wise Students', endpoint: '/api/super-admin/charts/class-wise-students' },
    { name: 'Monthly Fee Collection', endpoint: '/api/super-admin/charts/monthly-fee-collection' },
    { name: 'Pass/Fail Ratio', endpoint: '/api/super-admin/charts/pass-fail-ratio' },
    { name: 'Student Attendance', endpoint: '/api/super-admin/charts/student-attendance' },
    { name: 'Student Trends', endpoint: '/api/super-admin/charts/student-trends' },
    { name: 'Branch-wise Students', endpoint: '/api/super-admin/charts/branch-wise-students' }
  ];

  const status = {};

  for (const chart of chartEndpoints) {
    try {
      const response = await makeAuthenticatedRequest(chart.endpoint, 'GET', null, token);
      const hasData = response.statusCode === 200 &&
                     response.data.success &&
                     response.data.data &&
                     response.data.data.length > 0;

      status[chart.name] = hasData;
      console.log(`${hasData ? '✅' : '❌'} ${chart.name}: ${hasData ? 'Has data' : 'No data'}`);
    } catch (error) {
      status[chart.name] = false;
      console.log(`❌ ${chart.name}: Error checking data - ${error.message}`);
    }
  }

  return status;
}

// Main execution function
async function main() {
  console.log('🚀 Checking super admin chart APIs and adding data where needed...\n');

  try {
    // Step 1: Get super admin token
    const token = await getSuperAdminToken();
    if (!token) {
      console.log('❌ Cannot proceed without super admin token');
      return;
    }

    // Step 2: Check current data status
    const dataStatus = await checkChartDataStatus(token);

    // Check if any charts need data
    const chartsNeedingData = Object.values(dataStatus).filter(status => !status).length;

    if (chartsNeedingData === 0) {
      console.log('\n🎉 All chart APIs already have data! No action needed.');
      return;
    }

    console.log(`\n📊 ${chartsNeedingData} chart(s) need data. Creating sample data...\n`);

    // Step 3: Create branches
    console.log('🏫 Creating branches...');
    const branches = await createBranches(token);
    if (branches.length === 0) {
      console.log('❌ No branches created');
      return;
    }

    // Step 4: Create grades
    console.log('\n📊 Creating grades...');
    const grades = await createGrades(token);
    if (grades.length === 0) {
      console.log('❌ No grades created');
      return;
    }

    // Step 5: Create classes
    console.log('\n📚 Creating classes...');
    const classes = await createClasses(token, branches, grades);
    if (classes.length === 0) {
      console.log('❌ No classes created');
      return;
    }

    // Step 6: Create students
    console.log('\n👨‍🎓 Creating students...');
    const students = await createStudents(token, classes);
    if (students.length === 0) {
      console.log('❌ No students created');
      return;
    }

    // Step 7: Create attendance records
    console.log('\n📊 Creating attendance records...');
    await createAttendanceRecords(token, students);

    // Step 8: Create fee vouchers
    console.log('\n💰 Creating fee vouchers...');
    await createFeeVouchers(token, students);

    // Step 9: Create exam records and results
    console.log('\n📝 Creating exam records and results...');
    await createExamRecords(token, classes);

    console.log('\n🎉 Sample data creation completed successfully!');
    console.log('📊 Summary:');
    console.log(`   🏫 Branches: ${branches.length}`);
    console.log(`   📚 Classes: ${classes.length}`);
    console.log(`   👨‍🎓 Students: ${students.length}`);

    // Step 10: Verify data was added
    console.log('\n🔍 Verifying chart data after creation...');
    const finalStatus = await checkChartDataStatus(token);
    const chartsWithData = Object.values(finalStatus).filter(status => status).length;

    console.log(`\n📈 ${chartsWithData}/${Object.keys(finalStatus).length} charts now have data!`);

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the script
main();
