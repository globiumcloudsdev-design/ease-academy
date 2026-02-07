const http = require('http');

// Test configuration
const BASE_URL = 'localhost';
const PORT = 3000;

// Test data
const testTeacherToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTQwNDE0N2U2MjA2ZmZjNTg2ZWEyNDIiLCJlbWFpbCI6InNob2FpYnJhemFtZW1vbjE3MEBnbWFpbC5jb20iLCJyb2xlIjoidGVhY2hlciIsImJyYW5jaElkIjoie1xuICBhZGRyZXNzOiB7XG4gICAgc3RyZWV0OiAnSGFsYXJpIE1lbW9uIFNjaGVtZSAzMycsXG4gICAgY2l0eTogJ0thcmFjaGknLFxuICAgIHN0YXRlOiAnU2luZGgnLFxuICAgIHppcENvZGU6ICc3NTAwMCcsXG4gICAgY291bnRyeTogJ1Bha2lzdGFuJ1xuICB9LFxuICBjb250YWN0OiB7IHBob25lOiAnMDMwNTEwNTIwNTUnLCBlbWFpbDogJ2hhbGFyaW1lbW9uQGdtYWlsLmNvbScgfSxcbiAgX2lkOiBuZXcgT2JqZWN0SWQoJzY5M2Q4N2VlNGY5NGM5Y2Q4MzAwZGQ1OScpLFxuICBuYW1lOiAnSGFsYXJpIE1lbW9uJyxcbiAgY29kZTogJ0hNLTAwNSdcbn0iLCJpYXQiOjE3Njg1NzQ2NzcsImV4cCI6MTc2OTE3OTQ3N30.HUS1xrB8c9IHSpWMGQQ67J1ZHo09CNgZBfbUU1RZCS0';
const testBranchAdminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTNlZDI0ZjI0NjMxMzhmNmJiYjczODAiLCJlbWFpbCI6ImhhZml6c2hvYWliQGdtYWlsLmNvbSIsInJvbGUiOiJicmFuY2hfYWRtaW4iLCJicmFuY2hJZCI6IntcbiAgYWRkcmVzczoge1xuICAgIHN0cmVldDogJ0hhbGFyaSBNZW1vbiBTY2hlbWUgMzMnLFxuICAgIGNpdHk6ICdLYXJhY2hpJyxcbiAgICBzdGF0ZTogJ1NpbmRoJyxcbiAgICB6aXBDb2RlOiAnNzUwMDAnLFxuICAgIGNvdW50cnk6ICdQYWtpc3RhbidcbiAgfSxcbiAgY29udGFjdDogeyBwaG9uZTogJzAzMDUxMDUyMDU1JywgZW1haWw6ICdoYWxhcmltZW1vbkBnbWFpbC5jb20nIH0sXG4gIF9pZDogbmV3IE9iamVjdElkKCc2OTNkODdlZTRmOTRjOWNkODMwMGRkNTknKSxcbiAgbmFtZTogJ0hhbGFyaSBNZW1vbicsXG4gIGNvZGU6ICdITS0wMDUnXG59IiwiaWF0IjoxNzY4NTc2NTkzLCJleHAiOjE3NjkxODEzOTN9.gH4xcpAfs5JREpAtmizH47S3t8rteRWX9_UOW3lVS-o';

// Test location (branch coordinates provided by user)
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

// Test Teacher Check-In API
async function testTeacherCheckIn() {
  console.log('\n🧪 Testing Teacher Check-In API...');

  const options = {
    hostname: BASE_URL,
    port: PORT,
    path: '/api/teacher/self-attendance/check-in',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${testTeacherToken}`
    }
  };

  try {
    const response = await makeRequest(options, testLocation);
    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response.body, null, 2));

    if (response.statusCode === 200 && response.body?.success) {
      console.log('✅ Check-In API: SUCCESS');
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
async function testTeacherCheckOut() {
  console.log('\n🧪 Testing Teacher Check-Out API...');

  const options = {
    hostname: BASE_URL,
    port: PORT,
    path: '/api/teacher/self-attendance/check-out',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${testTeacherToken}`
    }
  };

  try {
    const response = await makeRequest(options, testLocation);
    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response.body, null, 2));

    if (response.statusCode === 200 && response.body?.success) {
      console.log('✅ Check-Out API: SUCCESS');
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

// Test Branch Admin Teacher Attendance API
async function testBranchAdminTeacherAttendance() {
  console.log('\n🧪 Testing Branch Admin Teacher Attendance API...');

  const options = {
    hostname: BASE_URL,
    port: PORT,
    path: '/api/branch-admin/teacher-attendance',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${testBranchAdminToken}`
    }
  };

  try {
    const response = await makeRequest(options);
    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response.body, null, 2));

    if (response.statusCode === 200 && response.body?.success) {
      console.log('✅ Branch Admin API: SUCCESS');
      console.log(`Found ${response.body.data?.total || 0} attendance records`);
      return true;
    } else {
      console.log('❌ Branch Admin API: FAILED');
      console.log('Error:', response.body?.message || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.log('❌ Branch Admin API: ERROR');
    console.log('Error:', error.message);
    return false;
  }
}

// Test Branch Admin API with date filter
async function testBranchAdminTeacherAttendanceWithDate() {
  console.log('\n🧪 Testing Branch Admin Teacher Attendance API (with date filter)...');

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const options = {
    hostname: BASE_URL,
    port: PORT,
    path: `/api/branch-admin/teacher-attendance?date=${today}`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${testBranchAdminToken}`
    }
  };

  try {
    const response = await makeRequest(options);
    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response.body, null, 2));

    if (response.statusCode === 200 && response.body?.success) {
      console.log('✅ Branch Admin API (with date): SUCCESS');
      console.log(`Found ${response.body.data?.total || 0} attendance records for today`);
      return true;
    } else {
      console.log('❌ Branch Admin API (with date): FAILED');
      console.log('Error:', response.body?.message || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.log('❌ Branch Admin API (with date): ERROR');
    console.log('Error:', error.message);
    return false;
  }
}

// Test invalid location (should fail)
async function testInvalidLocation() {
  console.log('\n🧪 Testing Invalid Location (should fail)...');

  const farLocation = {
    latitude: 25.0, // Far from Karachi
    longitude: 68.0
  };

  const options = {
    hostname: BASE_URL,
    port: PORT,
    path: '/api/teacher/self-attendance/check-in',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${testTeacherToken}`
    }
  };

  try {
    const response = await makeRequest(options, farLocation);
    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response.body, null, 2));

    if (response.statusCode === 400 && !response.body?.success) {
      console.log('✅ Invalid Location Test: SUCCESS (correctly rejected)');
      return true;
    } else {
      console.log('❌ Invalid Location Test: FAILED (should have been rejected)');
      return false;
    }
  } catch (error) {
    console.log('❌ Invalid Location Test: ERROR');
    console.log('Error:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Teacher Attendance API Tests...');
  console.log('=' .repeat(50));

  // Check if tokens are set
  if (testTeacherToken === 'your-teacher-jwt-token-here') {
    console.log('❌ Please set a valid teacher JWT token in the script');
    return;
  }

  if (testBranchAdminToken === 'your-branch-admin-jwt-token-here') {
    console.log('❌ Please set a valid branch admin JWT token in the script');
    return;
  }

  const results = [];

  // Run all tests
  results.push(await testTeacherCheckIn());
  results.push(await testTeacherCheckOut());
  results.push(await testBranchAdminTeacherAttendance());
  results.push(await testBranchAdminTeacherAttendanceWithDate());
  results.push(await testInvalidLocation());

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results Summary:');
  console.log(`✅ Passed: ${results.filter(r => r).length}`);
  console.log(`❌ Failed: ${results.filter(r => !r).length}`);
  console.log(`📈 Success Rate: ${((results.filter(r => r).length / results.length) * 100).toFixed(1)}%`);

  if (results.every(r => r)) {
    console.log('🎉 All tests passed! Teacher attendance APIs are working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above and fix the issues.');
  }
}

// Run tests
runTests().catch(console.error);
