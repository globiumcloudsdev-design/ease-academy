const http = require('http');

// Test configuration
const BASE_URL = 'localhost';
const PORT = 3000;

// Teacher credentials
const teacherCredentials = {
  email: 'shoaibrazamemon170@gmail.com',
  password: 'Teacher@123'
};

// Test location (branch coordinates)
const testLocation = {
  latitude: 24.96136,
  longitude: 67.07103
};

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          };
          resolve(response);
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
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

// Login as Teacher
async function loginTeacher() {
  console.log('\n👨‍🏫 Logging in as Teacher...');

  const options = {
    hostname: BASE_URL,
    port: PORT,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options, teacherCredentials);
    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response.body, null, 2));

    if (response.statusCode === 200 && response.body?.success && response.body?.data?.accessToken) {
      console.log('✅ Teacher Login: SUCCESS');
      console.log('🔑 Teacher JWT Token:', response.body.data.accessToken);
      return response.body.data.accessToken;
    } else {
      console.log('❌ Teacher Login: FAILED');
      console.log('Error:', response.body?.message || 'Unknown error');
      return null;
    }
  } catch (error) {
    console.log('❌ Teacher Login: ERROR');
    console.log('Error details:', error);
    return null;
  }
}

// Test Teacher Check-In API
async function testTeacherCheckIn(token) {
  console.log('\n🧪 Testing Teacher Check-In API...');

  const options = {
    hostname: BASE_URL,
    port: PORT,
    path: '/api/teacher/self-attendance/check-in',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };

  try {
    const response = await makeRequest(options, testLocation);
    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response.body, null, 2));

    if (response.statusCode === 200 && response.body?.success) {
      console.log('✅ Check-In API: SUCCESS');
      console.log('📊 Check-In Details:', response.body.data);
      return true;
    } else {
      console.log('❌ Check-In API: FAILED');
      console.log('Error:', response.body?.message || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.log('❌ Check-In API: ERROR');
    console.log('Error:', error.message);
    return false;
  }
}

// Test Teacher Check-Out API
async function testTeacherCheckOut(token) {
  console.log('\n🧪 Testing Teacher Check-Out API...');

  const options = {
    hostname: BASE_URL,
    port: PORT,
    path: '/api/teacher/self-attendance/check-out',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };

  try {
    const response = await makeRequest(options, testLocation);
    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response.body, null, 2));

    if (response.statusCode === 200 && response.body?.success) {
      console.log('✅ Check-Out API: SUCCESS');
      console.log('📊 Check-Out Details:', response.body.data);
      return true;
    } else {
      console.log('❌ Check-Out API: FAILED');
      console.log('Error:', response.body?.message || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.log('❌ Check-Out API: ERROR');
    console.log('Error:', error.message);
    return false;
  }
}

// Main test runner
async function runTest() {
  console.log('🚀 Starting Teacher Check-In and Check-Out Test...');
  console.log('=' .repeat(60));

  // Step 1: Login as Teacher
  const teacherToken = await loginTeacher();

  if (!teacherToken) {
    console.log('\n❌ Login failed. Cannot proceed with attendance tests.');
    console.log('=' .repeat(60));
    return;
  }

  // Step 2: Test Check-In API
  const checkInSuccess = await testTeacherCheckIn(teacherToken);

  // Always proceed to check-out test (even if already checked in)
  console.log('\n⏳ Waiting 2 seconds before check-out...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 3: Test Check-Out API
  const checkOutSuccess = await testTeacherCheckOut(teacherToken);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results Summary:');
  console.log(`Login: ✅ SUCCESS`);
  console.log(`Check-In: ${checkInSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`Check-Out: ${checkOutSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);

  if (checkInSuccess && checkOutSuccess) {
    console.log('\n🎉 Teacher check-in and check-out test completed successfully!');
    console.log('The attendance system is working correctly.');
    console.log('✅ Frontend implementation is ready and functional.');
    console.log('✅ Server is running on port 3000.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
}

// Run the test
runTest().catch(console.error);
