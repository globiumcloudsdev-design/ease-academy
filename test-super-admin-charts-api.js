const https = require('https');
const http = require('http');

// Configuration
const API_BASE_URL = 'http://localhost:3000';
const SUPER_ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTM4NDQ2Y2ZjM2FhYTMwMTQxZTdjNDAiLCJlbWFpbCI6InN1cGVyYWRtaW5AZWFzZWFjYWRlbXkuY29tIiwicm9sZSI6InN1cGVyX2FkbWluIiwiaWF0IjoxNzY5Njg0MzAwLCJleHAiOjE3NzAyODkxMDB9.GZrwEEtEgibTcVLUPmk1ZMbSUcKxGz6sIuweg8w-XCY';

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

// Function to get branch IDs
async function getBranchIds() {
  try {
    console.log('🔍 Fetching branch IDs...');
    const response = await makeAuthenticatedRequest('/api/super-admin/branches', 'GET', null, SUPER_ADMIN_TOKEN);

    console.log('🔍 Branches API Response:', JSON.stringify(response, null, 2));

    if (response.statusCode === 200 && response.data.success && response.data.data && response.data.data.branches) {
      const branches = response.data.data.branches;
      console.log(`✅ Found ${branches.length} branches:`);
      branches.forEach(branch => {
        console.log(`   - ${branch.name}: ${branch._id}`);
      });
      return branches;
    } else {
      console.log('❌ Failed to fetch branches:', response.data.message || response.data);
      return [];
    }
  } catch (error) {
    console.log(`❌ Error fetching branches: ${error.message}`);
    return [];
  }
}

// Function to test chart API
async function testChartAPI(name, endpoint, params = {}) {
  console.log(`\n📊 Testing ${name}...`);
  console.log(`🔗 Endpoint: ${endpoint}`);

  try {
    const url = new URL(endpoint, API_BASE_URL);
    Object.keys(params).forEach(key => {
      url.searchParams.append(key, params[key]);
    });

    const response = await makeAuthenticatedRequest(url.pathname + url.search, 'GET', null, SUPER_ADMIN_TOKEN);

    console.log(`📡 Status: ${response.statusCode}`);

    if (response.statusCode === 200 && response.data.success) {
      console.log(`✅ Success: ${response.data.message || 'OK'}`);
      console.log(`📊 Data Count: ${response.data.data ? response.data.data.length : 0}`);

      if (response.data.data && response.data.data.length > 0) {
        console.log(`📋 Sample Data:`);
        // Show first 2 items as sample
        const sampleData = response.data.data.slice(0, 2);
        sampleData.forEach((item, index) => {
          console.log(`   ${index + 1}. ${JSON.stringify(item, null, 2).split('\n').join('\n      ')}`);
        });

        if (response.data.data.length > 2) {
          console.log(`   ... and ${response.data.data.length - 2} more items`);
        }
      } else {
        console.log(`⚠️ No data returned`);
      }
    } else {
      console.log(`❌ Failed: ${response.data.message || response.data}`);
    }

    return response;
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return null;
  }
}

// Main test function
async function testAllChartAPIs() {
  console.log('🚀 Testing Super Admin Chart APIs with JWT Token\n');
  console.log('🔑 Using Super Admin Token:', SUPER_ADMIN_TOKEN.substring(0, 50) + '...');

  // First, get branch IDs
  const branches = await getBranchIds();
  if (branches.length === 0) {
    console.log('❌ No branches found. Cannot proceed with branch-specific tests.');
    return;
  }

  // Get the first branch ID for testing
  const testBranchId = branches[0]._id;
  const testBranchName = branches[0].name;

  console.log(`\n🔍 Using branch "${testBranchName}" (ID: ${testBranchId}) for branch-specific tests\n`);

  const chartTests = [
    {
      name: 'Class-wise Students (All Branches)',
      endpoint: '/api/super-admin/charts/class-wise-students',
      params: { branch: 'all' }
    },
    {
      name: `Class-wise Students (${testBranchName})`,
      endpoint: '/api/super-admin/charts/class-wise-students',
      params: { branch: testBranchId }
    },
    {
      name: 'Monthly Fee Collection (All Branches)',
      endpoint: '/api/super-admin/charts/monthly-fee-collection',
      params: { branch: 'all', timeRange: '6months' }
    },
    {
      name: `Monthly Fee Collection (${testBranchName})`,
      endpoint: '/api/super-admin/charts/monthly-fee-collection',
      params: { branch: testBranchId, timeRange: '6months' }
    },
    {
      name: 'Pass/Fail Ratio (All Branches)',
      endpoint: '/api/super-admin/charts/pass-fail-ratio',
      params: { branch: 'all', timeRange: 'current_academic_year' }
    },
    {
      name: `Pass/Fail Ratio (${testBranchName})`,
      endpoint: '/api/super-admin/charts/pass-fail-ratio',
      params: { branch: testBranchId, timeRange: 'current_academic_year' }
    },
    {
      name: 'Student Attendance (All Branches)',
      endpoint: '/api/super-admin/charts/student-attendance',
      params: { branch: 'all', timeRange: 'current_month' }
    },
    {
      name: `Student Attendance (${testBranchName})`,
      endpoint: '/api/super-admin/charts/student-attendance',
      params: { branch: testBranchId, timeRange: 'current_month' }
    },
    {
      name: 'Student Trends (All Branches)',
      endpoint: '/api/super-admin/charts/student-trends',
      params: { branch: 'all', timeRange: '6months' }
    },
    {
      name: `Student Trends (${testBranchName})`,
      endpoint: '/api/super-admin/charts/student-trends',
      params: { branch: testBranchId, timeRange: '6months' }
    },
    {
      name: 'Branch-wise Students',
      endpoint: '/api/super-admin/charts/branch-wise-students',
      params: { branch: 'all' }
    }
  ];

  const results = [];

  for (const test of chartTests) {
    const result = await testChartAPI(test.name, test.endpoint, test.params);
    results.push({
      name: test.name,
      success: result && result.statusCode === 200 && result.data.success,
      dataCount: result && result.data.data ? result.data.data.length : 0
    });
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  const successfulTests = results.filter(r => r.success).length;
  const totalTests = results.length;

  console.log(`✅ Successful Tests: ${successfulTests}/${totalTests}`);
  console.log(`❌ Failed Tests: ${totalTests - successfulTests}/${totalTests}`);

  console.log('\n📋 Detailed Results:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.dataCount} items`);
  });

  if (successfulTests === totalTests) {
    console.log('\n🎉 All chart APIs are working correctly with full data!');
  } else {
    console.log('\n⚠️ Some chart APIs may need attention.');
  }
}

// Run the tests
testAllChartAPIs();
