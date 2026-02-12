const http = require('http');

// Test configuration
const BASE_URL = 'localhost';
const PORT = 3000;

// Teacher credentials
const teacherCredentials = {
  email: 'shoaibrazamemon170@gmail.com',
  password: 'Teacher@123'
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

// Test Teacher Check-Out API
async function testTeacherCheckOut(token) {
  console.log('\n🧪 Testing Teacher Check-Out API...');

  const testLocation = {
    latitude: 24.96136,
    longitude: 67.07103
  };

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
  console.log('🚀 Starting Teacher Check-Out Test...');
  console.log('=' .repeat(60));

  // Step 1: Login as Teacher
  const teacherToken = await loginTeacher();

  if (!teacherToken) {
    console.log('\n❌ Login failed. Cannot proceed with check-out test.');
    console.log('=' .repeat(60));
    return;
  }

  // Step 2: Test Check-Out API
  const checkOutSuccess = await testTeacherCheckOut(teacherToken);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results Summary:');
  console.log(`Login: ✅ SUCCESS`);
  console.log(`Check-Out: ${checkOutSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);

  if (checkOutSuccess) {
    console.log('\n🎉 Teacher check-out test completed successfully!');
    console.log('The attendance check-out functionality is working correctly.');
  } else {
    console.log('\n⚠️  Check-out test failed. Please check the errors above.');
  }
}

// Run the test
runTest().catch(console.error);
