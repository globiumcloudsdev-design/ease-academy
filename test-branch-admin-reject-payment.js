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

// Test script for Branch Admin Reject Payment API
async function testBranchAdminRejectPaymentAPI() {
  console.log('🚀 Testing Branch Admin Reject Payment API\n');
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

    // First get pending payments to get a voucher ID and payment index
    console.log('\n📋 Getting pending payments...');
    const pendingOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/branch-admin/pending-fees',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    const pendingPayments = await new Promise((resolve, reject) => {
      const req = http.request(pendingOptions, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          try {
            const response = JSON.parse(body);
            resolve(response);
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.end();
    });

    if (!pendingPayments.success || !pendingPayments.data || pendingPayments.data.length === 0) {
      console.log('❌ No pending payments found to test rejection');
      return;
    }

    const firstPayment = pendingPayments.data[0];
    console.log(`📄 Found payment: ${firstPayment.voucherNumber} - ${firstPayment.studentName}`);
    console.log(`🔢 Payment ID: ${firstPayment.paymentId}`);
    console.log(`📋 Voucher ID: ${firstPayment.voucherId}`);
    console.log(`🔢 Payment Index: ${firstPayment.paymentIndex}`);

    // Now test the reject payment API
    console.log('\n🧪 Testing Reject Payment API...');
    const rejectOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/branch-admin/pending-fees/reject',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(JSON.stringify({
          voucherId: firstPayment.voucherId,
          paymentIndex: firstPayment.paymentIndex,
          rejectionReason: 'Test rejection reason'
        }))
      }
    };

    const rejectionResult = await new Promise((resolve, reject) => {
      const req = http.request(rejectOptions, (res) => {
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

      req.write(JSON.stringify({
        voucherId: firstPayment.voucherId,
        paymentIndex: firstPayment.paymentIndex,
        rejectionReason: 'Test rejection reason'
      }));

      req.end();
    });

    console.log(`📊 Response Status: ${rejectionResult.statusCode}`);
    console.log('📄 Response Data:', JSON.stringify(rejectionResult.data, null, 2));

    if (rejectionResult.statusCode === 200 && rejectionResult.data.success) {
      console.log('✅ Payment rejected successfully!');
    } else {
      console.log('❌ Payment rejection failed!');
      console.log('🔍 Error details:', rejectionResult.data.message || rejectionResult.data);
    }

    console.log('\n' + '=' .repeat(50));
    console.log('🎉 Reject Payment API Test completed!');

  } catch (error) {
    console.log(`❌ Unexpected error: ${error.message}`);
    console.log('\n' + '=' .repeat(50));
    console.log('❌ Test failed - Unexpected error');
  }
}

// Run the test
testBranchAdminRejectPaymentAPI();
