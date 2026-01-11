const http = require('http');

// Test cases for Super Admin APIs
const testCases = [
  {
    name: 'System Overview',
    method: 'GET',
    path: '/api/super-admin?action=system-overview',
    description: 'Get comprehensive system statistics'
  },
  {
    name: 'User Management',
    method: 'GET',
    path: '/api/super-admin?action=user-management',
    description: 'Get all users with management capabilities'
  },
  {
    name: 'Branch Management',
    method: 'GET',
    path: '/api/super-admin?action=branch-management',
    description: 'Get all branches with management capabilities'
  },
  {
    name: 'Financial Overview',
    method: 'GET',
    path: '/api/super-admin?action=financial-overview',
    description: 'Get financial statistics and analytics'
  },
  {
    name: 'Academic Overview',
    method: 'GET',
    path: '/api/super-admin?action=academic-overview',
    description: 'Get academic statistics and performance'
  },
  {
    name: 'System Health',
    method: 'GET',
    path: '/api/super-admin?action=system-health',
    description: 'Get system health and performance metrics'
  },
  {
    name: 'Recent Activities',
    method: 'GET',
    path: '/api/super-admin?action=recent-activities',
    description: 'Get recent system activities'
  },
  {
    name: 'System Settings',
    method: 'GET',
    path: '/api/super-admin?action=system-settings',
    description: 'Get system configuration settings'
  }
];

function runTest(testCase, callback) {
  console.log(`\n🧪 Testing: ${testCase.name}`);
  console.log(`📝 Description: ${testCase.description}`);
  console.log(`🔗 ${testCase.method} ${testCase.path}`);

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: testCase.path,
    method: testCase.method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log(`✅ Status: ${res.statusCode}`);
        console.log(`📊 Response: ${response.success ? 'SUCCESS' : 'FAILED'}`);

        if (response.success) {
          console.log(`📈 Data keys: ${Object.keys(response.data || {}).join(', ')}`);
        } else {
          console.log(`❌ Error: ${response.message || 'Unknown error'}`);
        }

        callback(null, { status: res.statusCode, success: response.success });
      } catch (e) {
        console.log(`❌ Status: ${res.statusCode}`);
        console.log(`📄 Raw Response: ${data.substring(0, 200)}...`);
        callback(null, { status: res.statusCode, success: false });
      }
    });
  });

  req.on('error', (e) => {
    console.log(`❌ Error: ${e.message}`);
    callback(e, { status: 0, success: false });
  });

  req.setTimeout(10000, () => {
    console.log(`⏰ Timeout: Request took too long`);
    req.destroy();
    callback(new Error('Timeout'), { status: 0, success: false });
  });

  req.end();
}

function runAllTests() {
  console.log('🚀 Starting Super Admin API Tests\n');
  console.log('=' .repeat(50));

  let completed = 0;
  let passed = 0;
  const total = testCases.length;

  function nextTest() {
    if (completed >= total) {
      console.log('\n' + '=' .repeat(50));
      console.log(`📊 Test Results: ${passed}/${total} tests passed`);
      console.log('🎉 Testing completed!');
      return;
    }

    const testCase = testCases[completed];
    runTest(testCase, (error, result) => {
      if (result.success) passed++;
      completed++;
      setTimeout(nextTest, 500); // Small delay between tests
    });
  }

  nextTest();
}

// Run the tests
runAllTests();
