const https = require('https');

// Configuration
const API_BASE_URL = 'https://ease-academy.vercel.app';

// Mock data for parent and students
const mockData = {
  parent: {
    fullName: 'Arshayn Ahmed',
    email: 'arshayn@example.com',
    phone: '+923001234567',
    password: 'password123',
    cnic: '12345-6789012-3',
    role: 'parent',
    address: {
      street: '123 Main Street',
      city: 'Lahore',
      state: 'Punjab',
      postalCode: '54000',
      country: 'Pakistan'
    },
    parentProfile: {
      children: [
        {
          name: 'Ahmed Arshayn',
          registrationNumber: 'STD001',
          className: 'Class 1',
          section: 'A'
        },
        {
          name: 'Fatima Arshayn',
          registrationNumber: 'STD002',
          className: 'Class 2',
          section: 'B'
        }
      ]
    }
  },
  students: [
    {
      firstName: 'Ahmed',
      lastName: 'Arshayn',
      email: 'ahmed.arshayn@student.com',
      phone: '+923001234568',
      dateOfBirth: '2015-05-15',
      gender: 'male',
      bloodGroup: 'A+',
      religion: 'Islam',
      nationality: 'Pakistani',
      cnic: '',
      password: 'student123',
      status: 'active',
      address: {
        street: '123 Main Street',
        city: 'Lahore',
        state: 'Punjab',
        postalCode: '54000',
        country: 'Pakistan'
      },
      studentProfile: {
        classId: null, // Will be set after creating class
        section: 'A',
        rollNumber: '1',
        admissionDate: '2023-08-01',
        academicYear: '2024',
        previousSchool: {
          name: 'Previous School',
          lastClass: 'KG',
          marks: 85,
          leavingDate: '2023-07-30'
        },
        guardianType: 'parent',
        father: {
          name: 'Arshayn Ahmed',
          occupation: 'Engineer',
          phone: '+923001234567',
          email: 'arshayn@example.com',
          cnic: '12345-6789012-3',
          income: 100000
        },
        mother: {
          name: 'Mrs. Arshayn',
          occupation: 'Teacher',
          phone: '+923001234569',
          email: 'mother.arshayn@example.com',
          cnic: '12345-6789012-4'
        }
      }
    },
    {
      firstName: 'Fatima',
      lastName: 'Arshayn',
      email: 'fatima.arshayn@student.com',
      phone: '+923001234570',
      dateOfBirth: '2014-03-20',
      gender: 'female',
      bloodGroup: 'B+',
      religion: 'Islam',
      nationality: 'Pakistani',
      cnic: '',
      password: 'student123',
      status: 'active',
      address: {
        street: '123 Main Street',
        city: 'Lahore',
        state: 'Punjab',
        postalCode: '54000',
        country: 'Pakistan'
      },
      studentProfile: {
        classId: null, // Will be set after creating class
        section: 'B',
        rollNumber: '1',
        admissionDate: '2023-08-01',
        academicYear: '2024',
        previousSchool: {
          name: 'Previous School',
          lastClass: 'Class 1',
          marks: 90,
          leavingDate: '2023-07-30'
        },
        guardianType: 'parent',
        father: {
          name: 'Arshayn Ahmed',
          occupation: 'Engineer',
          phone: '+923001234567',
          email: 'arshayn@example.com',
          cnic: '12345-6789012-3',
          income: 100000
        },
        mother: {
          name: 'Mrs. Arshayn',
          occupation: 'Teacher',
          phone: '+923001234569',
          email: 'mother.arshayn@example.com',
          cnic: '12345-6789012-4'
        }
      }
    }
  ]
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

    const req = https.request(options, (res) => {
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

// Function to get a branch admin token (for creating students)
async function getBranchAdminToken() {
  // Try common branch admin credentials
  const branchAdminCredentials = [
    { email: 'branchadmin@easeacademy.com', password: 'BranchAdmin@123' },
    { email: 'admin@branch1.com', password: 'admin123' },
    { email: 'branch.admin@example.com', password: 'password123' }
  ];

  for (const cred of branchAdminCredentials) {
    const token = await loginAndGetToken(cred.email, cred.password);
    if (token) return token;
  }

  console.log('❌ Could not get branch admin token. Please ensure a branch admin account exists.');
  return null;
}

// Function to get super admin token (for approving parent)
async function getSuperAdminToken() {
  const superAdminCredentials = [
    { email: 'superadmin@easeacademy.com', password: 'SuperAdmin@123' },
    { email: 'admin@easeacademy.com', password: 'admin123' }
  ];

  for (const cred of superAdminCredentials) {
    const token = await loginAndGetToken(cred.email, cred.password);
    if (token) return token;
  }

  console.log('❌ Could not get super admin token. Will try branch admin token for approval.');
  return null;
}

// Function to create parent account
async function createParentAccount() {
  try {
    console.log('👨‍👩‍👧‍👦 Creating parent account...');

    const response = await makeAuthenticatedRequest('/api/parent/auth/signup', 'POST', mockData.parent);

    if (response.statusCode === 201 && response.data.success !== false) {
      console.log('✅ Parent account created successfully');
      console.log('📧 Email:', mockData.parent.email);
      console.log('🔒 Password:', mockData.parent.password);
      console.log('🔍 Full response:', JSON.stringify(response.data, null, 2));
      return response.data.user || response.data;
    } else {
      console.log('❌ Failed to create parent account:');
      console.log('   Status Code:', response.statusCode);
      console.log('   Response:', JSON.stringify(response.data, null, 2));
      return null;
    }
  } catch (error) {
    console.error('❌ Error creating parent account:', error.message);
    return null;
  }
}

// Function to get or create a class
async function getOrCreateClass(token) {
  try {
    console.log('🏫 Getting or creating class...');

    // First try to get existing classes
    const response = await makeAuthenticatedRequest('/api/branch-admin/classes', 'GET', null, token);

    if (response.statusCode === 200 && response.data.success && response.data.data && response.data.data.length > 0) {
      const class1 = response.data.data.find(cls => cls.name === 'Class 1');
      if (class1) {
        console.log('✅ Found existing Class 1');
        return class1._id;
      }
    }

    // If no classes exist, create one
    console.log('📝 Creating new class...');
    const classData = {
      name: 'Class 1',
      code: 'CLS1',
      academicYear: '2024',
      description: 'First Grade Class',
      capacity: 30,
      status: 'active'
    };

    const createResponse = await makeAuthenticatedRequest('/api/branch-admin/classes', 'POST', classData, token);

    if (createResponse.statusCode === 201 || createResponse.statusCode === 200) {
      console.log('✅ Class created successfully');
      return createResponse.data.data ? createResponse.data.data._id : createResponse.data._id;
    } else {
      console.log('❌ Failed to create class:', createResponse.data);
      return null;
    }
  } catch (error) {
    console.error('❌ Error with class:', error.message);
    return null;
  }
}

// Function to create student records
async function createStudentRecords(token, classId) {
  const createdStudents = [];

  for (const studentData of mockData.students) {
    try {
      console.log(`👨‍🎓 Creating student: ${studentData.firstName} ${studentData.lastName}`);

      // Set the class ID
      studentData.studentProfile.classId = classId;

      const response = await makeAuthenticatedRequest('/api/branch-admin/students', 'POST', studentData, token);

      if (response.statusCode === 201 || response.statusCode === 200) {
        console.log(`✅ Student ${studentData.firstName} created successfully`);
        createdStudents.push({
          id: response.data.data ? response.data.data._id : response.data._id,
          name: `${studentData.firstName} ${studentData.lastName}`,
          registrationNumber: studentData.studentProfile.rollNumber
        });
      } else {
        console.log(`❌ Failed to create student ${studentData.firstName}:`, response.data);
      }
    } catch (error) {
      console.error(`❌ Error creating student ${studentData.firstName}:`, error.message);
    }
  }

  return createdStudents;
}

// Function to approve parent and link children
async function approveParentAndLinkChildren(token, parentId, studentMappings) {
  try {
    console.log('✅ Approving parent and linking children...');

    const childrenMapping = {};
    studentMappings.forEach((student, index) => {
      childrenMapping[index] = student.id;
    });

    const response = await makeAuthenticatedRequest(`/api/branch-admin/approve-parent/${parentId}`, 'POST', { childrenMapping }, token);

    if (response.statusCode === 200 && response.data.success) {
      console.log('✅ Parent approved and children linked successfully');
      return true;
    } else {
      console.log('❌ Failed to approve parent:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Error approving parent:', error.message);
    return false;
  }
}

// Main execution function
async function main() {
  console.log('🚀 Starting mock data creation for parent-student relationship...\n');

  try {
    // Step 1: Create parent account
    const parent = await createParentAccount();
    if (!parent) {
      console.log('❌ Cannot proceed without parent account');
      return;
    }

    // Step 2: Get branch admin token for creating students
    const branchAdminToken = await getBranchAdminToken();
    if (!branchAdminToken) {
      console.log('❌ Cannot proceed without branch admin token');
      return;
    }

    // Step 3: Get or create a class
    const classId = await getOrCreateClass(branchAdminToken);
    if (!classId) {
      console.log('❌ Cannot proceed without class');
      return;
    }

    // Step 4: Create student records
    const createdStudents = await createStudentRecords(branchAdminToken, classId);
    if (createdStudents.length === 0) {
      console.log('❌ No students created');
      return;
    }

    // Step 5: Approve parent and link children
    const approvalSuccess = await approveParentAndLinkChildren(branchAdminToken, parent._id, createdStudents);

    if (approvalSuccess) {
      console.log('\n🎉 Mock data creation completed successfully!');
      console.log('📊 Summary:');
      console.log(`   👨‍👩‍👧‍👦 Parent: ${parent.fullName} (${parent.email})`);
      console.log(`   👨‍🎓 Students: ${createdStudents.length}`);
      createdStudents.forEach(student => {
        console.log(`      - ${student.name} (ID: ${student.id})`);
      });
      console.log('\n🔑 Parent can now login with:');
      console.log(`   Email: ${mockData.parent.email}`);
      console.log(`   Password: ${mockData.parent.password}`);
    } else {
      console.log('⚠️ Mock data created but parent approval failed. You may need to manually approve the parent.');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the script
main();
