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

// Test approve payment API
async function testApprovePaymentAPI() {
  console.log('🚀 Testing Approve Payment API\n');
  console.log('=' .repeat(50));

  try {
    // First, login to get authentication token
    console.log('🔑 Logging in as Super Admin...');
    const loginResponse = await loginAndGetToken(SUPER_ADMIN_CREDENTIALS);

    if (loginResponse.statusCode !== 200 || !loginResponse.data.success) {
      console.log(`❌ Login failed: ${loginResponse.data.message || 'Unknown error'}`);
      return;
    }

    const token = loginResponse.data.data.accessToken;
    console.log('✅ Successfully logged in and got token');

    // First get pending payments to get a voucher ID and payment index
    console.log('\n📋 Getting pending payments...');
    const pendingOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/super-admin/pending-fees',
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
      console.log('❌ No pending payments found to test approval');
      return;
    }

    const firstPayment = pendingPayments.data[0];
    console.log(`📄 Found payment: ${firstPayment.voucherNumber} - ${firstPayment.studentName}`);
    console.log(`🔢 Payment ID: ${firstPayment.paymentId}`);
    console.log(`📋 Voucher ID: ${firstPayment.voucherId}`);
    console.log(`🔢 Payment Index: ${firstPayment.paymentIndex}`);

    // Now test the approve payment API
    console.log('\n🧪 Testing Approve Payment API...');
    const approveOptions = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/super-admin/fee-vouchers/${firstPayment.voucherId}/approve-payment`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(JSON.stringify({
          paymentId: firstPayment.paymentIndex.toString(),
          action: 'approve',
          remarks: 'Approved via test script'
        }))
      }
    };

    const approvalResult = await new Promise((resolve, reject) => {
      const req = http.request(approveOptions, (res) => {
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
        paymentId: firstPayment.paymentIndex.toString(),
        action: 'approve',
        remarks: 'Approved via test script'
      }));

      req.end();
    });

    console.log(`📊 Response Status: ${approvalResult.statusCode}`);
    console.log('📄 Response Data:', JSON.stringify(approvalResult.data, null, 2));

    if (approvalResult.statusCode === 200 && approvalResult.data.success) {
      console.log('✅ Payment approved successfully!');
    } else {
      console.log('❌ Payment approval failed!');
      console.log('🔍 Error details:', approvalResult.data.message || approvalResult.data);
    }

    console.log('\n' + '=' .repeat(50));
    console.log('🎉 Approve Payment API Test completed!');

  } catch (error) {
    console.log(`❌ Unexpected error: ${error.message}`);
    console.log('\n' + '=' .repeat(50));
    console.log('❌ Test failed - Unexpected error');
  }
}

// Run the test
testApprovePaymentAPI();
