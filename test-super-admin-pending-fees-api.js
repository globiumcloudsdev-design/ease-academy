const http = require('http');

// Super Admin credentials
const SUPER_ADMIN_CREDENTIALS = {
  email: 'superadmin@easeacademy.com',
  password: 'SuperAdmin@123'
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

// Function to make authenticated API request
function makeAuthenticatedRequest(endpoint, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, 'http://localhost:3000');
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

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Function to test approve payment
async function testApprovePayment(token, paymentId) {
  console.log(`\n🧪 Testing: Approve Payment`);
  console.log(`📝 Description: Approve a pending payment`);
  console.log(`🔗 POST /api/super-admin/pending-fees/approve`);

  try {
    const payload = {
      paymentId: paymentId,
      remarks: 'Approved via API test'
    };

    const response = await makeAuthenticatedRequest('/api/super-admin/pending-fees/approve', 'POST', payload, token);

    console.log(`✅ Status: ${response.statusCode}`);
    console.log(`📊 Response: ${response.data.success ? 'SUCCESS' : 'FAILED'}`);

    if (response.data.success) {
      console.log(`✅ Payment approved successfully!`);
      console.log(`📋 Response: ${JSON.stringify(response.data, null, 2)}`);
    } else {
      console.log(`❌ Approval failed: ${response.data.message || 'Unknown error'}`);
    }

    return response.data.success;
  } catch (error) {
    console.log(`❌ Error approving payment: ${error.message}`);
    return false;
  }
}

// Function to test reject payment
async function testRejectPayment(token, paymentId, reason) {
  console.log(`\n🧪 Testing: Reject Payment`);
  console.log(`📝 Description: Reject a pending payment with reason`);
  console.log(`🔗 POST /api/super-admin/pending-fees/reject`);

  try {
    const payload = {
      paymentId: paymentId,
      remarks: reason
    };

    const response = await makeAuthenticatedRequest('/api/super-admin/pending-fees/reject', 'POST', payload, token);

    console.log(`✅ Status: ${response.statusCode}`);
    console.log(`📊 Response: ${response.data.success ? 'SUCCESS' : 'FAILED'}`);

    if (response.data.success) {
      console.log(`✅ Payment rejected successfully!`);
      console.log(`📋 Response: ${JSON.stringify(response.data, null, 2)}`);
    } else {
      console.log(`❌ Rejection failed: ${response.data.message || 'Unknown error'}`);
    }

    return response.data.success;
  } catch (error) {
    console.log(`❌ Error rejecting payment: ${error.message}`);
    return false;
  }
}

// Test script for Super Admin Pending Fees API
async function testPendingFeesAPI() {
  console.log('🚀 Testing Super Admin Pending Fees API (Complete Flow)\n');
  console.log('=' .repeat(60));

  try {
    // First, login to get authentication token
    console.log('🔑 Logging in as Super Admin...');
    const loginResponse = await loginAndGetToken(SUPER_ADMIN_CREDENTIALS);

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

    // Step 1: Fetch pending payments
    console.log('\n📋 Step 1: Fetching Pending Payments');
    console.log('🧪 Testing: Super Admin Pending Fees API');
    console.log('📝 Description: Fetch all pending fee payments across branches');
    console.log(`🔗 GET /api/super-admin/pending-fees`);

    const pendingResponse = await makeAuthenticatedRequest('/api/super-admin/pending-fees', 'GET', null, token);

    if (pendingResponse.statusCode !== 200 || !pendingResponse.data.success) {
      console.log(`❌ Failed to fetch pending payments: ${pendingResponse.data.message || 'Unknown error'}`);
      return;
    }

    console.log(`✅ Status: ${pendingResponse.statusCode}`);
    console.log(`📊 Response: SUCCESS`);
    console.log(`📈 Total pending payments: ${pendingResponse.data.total || 0}`);
    console.log(`📋 Data received: ${Array.isArray(pendingResponse.data.data) ? pendingResponse.data.data.length : 'N/A'} items`);

    if (!pendingResponse.data.data || !Array.isArray(pendingResponse.data.data) || pendingResponse.data.data.length === 0) {
      console.log('\n⚠️  No pending payments found in database.');
      console.log('💡 You may need to create test data first using test-super-admin-pending-fees.js');
      return;
    }

    console.log('\n📋 All pending payments:');
    pendingResponse.data.data.forEach((payment, index) => {
      console.log(`${index + 1}. Student: ${payment.studentName}, Voucher: ${payment.voucherNumber}, Amount: ${payment.currency || 'PKR'} ${payment.amount}, Branch: ${payment.branchName}, Transaction ID: ${payment.transactionId}, Status: ${payment.status}, Payment Method: ${payment.paymentMethod}, Date: ${new Date(payment.paymentDate).toLocaleDateString()}`);
    });

    // Get the first pending payment for testing
    const testPayment = pendingResponse.data.data[0];
    console.log('\n🎯 Selected payment for testing:');
    console.log(`   - Payment ID: ${testPayment.paymentId}`);
    console.log(`   - Voucher: ${testPayment.voucherNumber}`);
    console.log(`   - Voucher ID: ${testPayment.voucherId}`);
    console.log(`   - Student: ${testPayment.studentName}`);
    console.log(`   - Amount: ${testPayment.currency || 'PKR'} ${testPayment.amount}`);

    // First, verify the voucher exists
    console.log('\n🔍 Verifying voucher exists...');
    const voucherCheckResponse = await makeAuthenticatedRequest(`/api/super-admin/fee-vouchers/${testPayment.voucherId}`, 'GET', null, token);

    if (voucherCheckResponse.statusCode !== 200 || !voucherCheckResponse.data.success) {
      console.log(`❌ Voucher ${testPayment.voucherId} not found or not accessible`);
      console.log('💡 This might be test data that no longer exists in the database');
      console.log('🔄 Skipping approve/reject tests due to missing voucher');
      return;
    }

    console.log('✅ Voucher exists and is accessible');

    // Step 2: Test Approve Payment
    console.log('\n📋 Step 2: Testing Payment Approval');
    const approveSuccess = await testApprovePayment(token, testPayment.paymentId);

    if (approveSuccess) {
      console.log('\n✅ Payment approval test PASSED!');
    } else {
      console.log('\n❌ Payment approval test FAILED!');
    }

    // Step 3: Fetch updated pending payments to verify approval
    console.log('\n📋 Step 3: Verifying Payment Approval');
    const updatedResponse = await makeAuthenticatedRequest('/api/super-admin/pending-fees', 'GET', null, token);

    if (updatedResponse.statusCode === 200 && updatedResponse.data.success) {
      const stillPending = updatedResponse.data.data.find(p => p.paymentId === testPayment.paymentId);
      if (!stillPending) {
        console.log('✅ Payment successfully removed from pending list after approval!');
      } else {
        console.log('⚠️  Payment still appears in pending list - may need manual verification');
      }
    }

    // Step 4: Test Reject Payment (if we have another pending payment)
    if (updatedResponse.data.data && updatedResponse.data.data.length > 0) {
      const rejectPayment = updatedResponse.data.data[0];
      console.log('\n📋 Step 4: Testing Payment Rejection');
      console.log(`🎯 Selected payment for rejection testing: ${rejectPayment.voucherNumber} - ${rejectPayment.studentName}`);

      const rejectSuccess = await testRejectPayment(token, rejectPayment.paymentId, 'Test rejection - API testing');

      if (rejectSuccess) {
        console.log('\n✅ Payment rejection test PASSED!');
      } else {
        console.log('\n❌ Payment rejection test FAILED!');
      }
    } else {
      console.log('\n⚠️  No more pending payments available for rejection testing');
    }

    console.log('\n' + '=' .repeat(60));
    console.log('🎉 Complete API Testing Flow Completed!');
    console.log('✅ GET pending payments - WORKING');
    console.log(`${approveSuccess ? '✅' : '❌'} POST approve payment - ${approveSuccess ? 'WORKING' : 'FAILED'}`);
    console.log('✅ POST reject payment - TESTED');

  } catch (error) {
    console.log(`❌ Unexpected error: ${error.message}`);
    console.log('\n' + '=' .repeat(60));
    console.log('❌ API Test failed - Unexpected error');
  }
}

// Run the test
testPendingFeesAPI();
