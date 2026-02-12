const http = require('http');

// Test configuration
const BASE_URL = 'localhost';
const PORT = 3000;

// Credentials provided by user
const teacherCredentials = {
  email: 'shoaibrazamemon170@gmail.com',
  password: 'Teacher@123'
};

const branchAdminCredentials = {
  email: 'hafizshoaib@gmail.com',
  password: '123456'
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

    if (response.statusCode === 200 && response.body?.success && response.body?.token) {
      console.log('✅ Teacher Login: SUCCESS');
      console.log('🔑 Teacher JWT Token:', response.body.token);
      return response.body.token;
    } else {
      console.log('❌ Teacher Login: FAILED');
      console.log('Error:', response.body?.message || 'Unknown error');
      return null;
    }
  } catch (error) {
    console.log('❌ Teacher Login: ERROR');
    console.log('Error:', error.message);
    return null;
  }
}

// Login as Branch Admin
async function loginBranchAdmin() {
  console.log('\n👔 Logging in as Branch Admin...');

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
    const response = await makeRequest(options, branchAdminCredentials);
    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response.body, null, 2));

    if (response.statusCode === 200 && response.body?.success && response.body?.token) {
      console.log('✅ Branch Admin Login: SUCCESS');
      console.log('🔑 Branch Admin JWT Token:', response.body.token);
      return response.body.token;
    } else {
      console.log('❌ Branch Admin Login: FAILED');
      console.log('Error:', response.body?.message || 'Unknown error');
      return null;
    }
  } catch (error) {
    console.log('❌ Branch Admin Login: ERROR');
    console.log('Error:', error.message);
    return null;
  }
}

// Main test runner
async function runLoginTests() {
  console.log('🚀 Starting Login Tests for Teacher Attendance System...');
  console.log('=' .repeat(60));

  const teacherToken = await loginTeacher();
  const branchAdminToken = await loginBranchAdmin();

  console.log('\n' + '='.repeat(60));
  console.log('📊 Login Results:');

  if (teacherToken) {
    console.log('✅ Teacher Token:', teacherToken.substring(0, 50) + '...');
  } else {
    console.log('❌ Teacher login failed');
  }

  if (branchAdminToken) {
    console.log('✅ Branch Admin Token:', branchAdminToken.substring(0, 50) + '...');
  } else {
    console.log('❌ Branch Admin login failed');
  }

  if (teacherToken && branchAdminToken) {
    console.log('\n🎉 Both logins successful! Ready to test attendance APIs.');
    console.log('\n📋 Copy these tokens to test-teacher-attendance.js:');
    console.log(`Teacher Token: ${teacherToken}`);
    console.log(`Branch Admin Token: ${branchAdminToken}`);
  } else {
    console.log('\n⚠️  Some logins failed. Please check credentials and try again.');
  }

  return { teacherToken, branchAdminToken };
}

// Run tests
runLoginTests().catch(console.error);
