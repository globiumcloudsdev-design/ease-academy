const http = require('http');

// Branch Admin credentials
const BRANCH_ADMIN_CREDENTIALS = {
  email: 'hafizshoaib@gmail.com',
  password: '123456'
};

// Function to login and get token
function loginAndGetToken(credentials) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(credentials);

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
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

    req.write(data);
    req.end();
  });
}

// Test script for Branch Admin Pending Fees API
async function testBranchAdminPendingFeesAPI() {
  console.log('🚀 Testing Branch Admin Pending Fees API\n');
  console.log('=' .repeat(50));

  try {
    // First, login to get authentication token
    console.log('🔑 Logging in as Branch Admin...');
    const loginResponse = await loginAndGetToken(BRANCH_ADMIN_CREDENTIALS);

    if (loginResponse.statusCode !== 200 || !loginResponse.data.success) {
      console.log(`❌ Login failed: ${loginResponse.data.message || 'Unknown error'}`);
      console.log('🔍 Check if the server is running and credentials are correct');
      return;
    }

    const token = loginResponse.data.data.accessToken;
    const userData = loginResponse.data.data.user;
    console.log('✅ Successfully logged in and got token');
    console.log(`👤 User: ${userData.fullName} (${userData.email})`);
    console.log(`🔰 Role: ${userData.role}`);
    console.log(`🏢 Branch: ${userData.branchName || 'N/A'}`);

    // Now test the pending fees API with authentication
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/branch-admin/pending-fees',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    console.log('\n🧪 Testing: Branch Admin Pending Fees API');
    console.log('📝 Description: Fetch all pending fee payments for branch admin\'s branch');
    console.log('🔗 GET /api/branch-admin/pending-fees');

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
          console.log(`📈 Total pending payments: ${response.total || 0}`);

          if (response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
            console.log('\n📋 All pending payments for this branch:');
            response.data.forEach((payment, index) => {
              console.log(`${index + 1}. Student: ${payment.studentName}, Voucher: ${payment.voucherNumber}, Amount: ${payment.currency || 'PKR'} ${payment.amount}, Class: ${payment.className}, Transaction ID: ${payment.transactionId}, Status: ${payment.status}`);
            });

            console.log('\n📋 Sample pending payment (first one):');
            const sample = response.data[0];
            console.log(`   - Payment ID: ${sample.paymentId}`);
            console.log(`   - Voucher: ${sample.voucherNumber}`);
            console.log(`   - Student: ${sample.studentName}`);
            console.log(`   - Class: ${sample.className}`);
            console.log(`   - Amount: ${sample.currency || 'PKR'} ${sample.amount}`);
            console.log(`   - Status: ${sample.status}`);
            console.log(`   - Transaction ID: ${sample.transactionId}`);
            console.log(`   - Payment Method: ${sample.paymentMethod}`);
            console.log(`   - Payment Date: ${new Date(sample.paymentDate).toLocaleDateString()}`);
            console.log(`   - Screenshot URL: ${sample.screenshotUrl || 'N/A'}`);

            console.log('\n✅ API is working correctly with real data!');
            console.log('🎯 Ready to implement in the frontend page.');
          } else {
            console.log('\n⚠️  No pending payments found for this branch.');
            console.log('💡 You may need to create test data first or check if there are payments for this branch.');
          }

          console.log('\n' + '=' .repeat(50));
          console.log('🎉 API Test completed!');

        } catch (e) {
          console.log(`❌ Status: ${res.statusCode}`);
          console.log(`📄 Raw Response: ${data.substring(0, 200)}...`);
          console.log(`🔍 JSON Parse Error: ${e.message}`);
          console.log('\n' + '=' .repeat(50));
          console.log('❌ API Test failed - Invalid JSON response');
        }
      });
    });

    req.on('error', (e) => {
      console.log(`❌ Network Error: ${e.message}`);
      console.log('🔍 Check if the server is running on localhost:3000');
      console.log('\n' + '=' .repeat(50));
      console.log('❌ API Test failed - Server not reachable');
    });

    req.setTimeout(15000, () => {
      console.log(`⏰ Timeout: Request took too long (15 seconds)`);
      req.destroy();
      console.log('🔍 Check if the database connection is working');
      console.log('\n' + '=' .repeat(50));
      console.log('❌ API Test failed - Timeout');
    });

    req.end();

  } catch (error) {
    console.log(`❌ Unexpected error: ${error.message}`);
    console.log('\n' + '=' .repeat(50));
    console.log('❌ API Test failed - Unexpected error');
  }
}

// Run the test
testBranchAdminPendingFeesAPI();
