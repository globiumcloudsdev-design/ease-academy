const https = require('https');

// Parent credentials to test
const parentCredentials = {
  email: 'arshayn@example.com',
  password: 'password123'
};

const API_BASE_URL = 'http://localhost:3000/';

// Function to login and get token
function loginAndGetToken(email, password) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ email, password });

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

    const req = https.request(options, (res) => {
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

// Function to make authenticated API calls
function makeAuthenticatedRequest(endpoint, method = 'GET', token, data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;

    const options = {
      hostname: 'ease-academy.vercel.app',
      port: 443,
      path: endpoint,
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    };

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
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

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Main test function
async function testParentLoginAndPayment() {
  try {
    console.log('🔑 Testing parent login with credentials:');
    console.log(`   Email: ${parentCredentials.email}`);
    console.log(`   Password: ${parentCredentials.password}\n`);

    // Step 1: Login and get token
    console.log('📝 Step 1: Logging in...');
    const loginResponse = await loginAndGetToken(parentCredentials.email, parentCredentials.password);

    if (loginResponse.statusCode !== 200 || !loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message || loginResponse.data);
      return;
    }

    const token = loginResponse.data.data.accessToken;
    console.log('✅ Login successful! Token obtained.\n');

    // Step 2: Get parent children
    console.log('👨‍👩‍👧‍👦 Step 2: Fetching children...');
    const childrenResponse = await makeAuthenticatedRequest('/api/parent', 'GET', token);

    if (childrenResponse.statusCode !== 200 || !childrenResponse.data.success) {
      console.log('❌ Failed to fetch children:', childrenResponse.data.message || childrenResponse.data);
      return;
    }

    const children = childrenResponse.data.children || [];
    console.log(`✅ Found ${children.length} children:`);
    children.forEach((child, index) => {
      console.log(`   ${index + 1}. ${child.name} (ID: ${child.id})`);
    });

    if (children.length === 0) {
      console.log('❌ No children found for this parent');
      return;
    }

    // Use the first child for testing
    const childId = children[0].id;
    console.log(`\n👶 Using child: ${children[0].name} (ID: ${childId})\n`);

    // Step 3: Get fee vouchers for the child
    console.log('💰 Step 3: Fetching fee vouchers...');
    const feeVouchersResponse = await makeAuthenticatedRequest(`/api/parent/${childId}/fee-vouchers`, 'GET', token);

    if (feeVouchersResponse.statusCode !== 200 || !feeVouchersResponse.data.success) {
      console.log('❌ Failed to fetch fee vouchers:', feeVouchersResponse.data.message || feeVouchersResponse.data);
      return;
    }

    const feeVouchers = feeVouchersResponse.data.feeVouchers || [];
    console.log(`✅ Found ${feeVouchers.length} fee vouchers:`);
    feeVouchers.forEach((voucher, index) => {
      console.log(`   ${index + 1}. ${voucher.voucherNumber} - ${voucher.template?.name || 'Fee'} (${voucher.status}) - Remaining: PKR ${voucher.remainingAmount}`);
    });

    // Find a pending fee voucher to pay
    const pendingVoucher = feeVouchers.find(v => v.status === 'pending' || v.status === 'partial');
    if (!pendingVoucher) {
      console.log('❌ No pending fee vouchers found to test payment');
      return;
    }

    console.log(`\n💳 Step 4: Testing payment for voucher: ${pendingVoucher.voucherNumber} (Remaining: PKR ${pendingVoucher.remainingAmount})`);

    // Step 4: Test payment (we'll simulate a payment without actual file upload)
    // Note: In a real test, you'd need to upload an actual image file
    console.log('⚠️  Note: This test simulates payment but requires a real screenshot file for actual payment.');
    console.log('💡 To complete the full test, you would need to:');
    console.log('   1. Have a real payment screenshot image');
    console.log('   2. Upload it via FormData');
    console.log('   3. Call the payment API');

    console.log('\n✅ Parent login and fee voucher fetching test completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Parent logged in: ✅`);
    console.log(`   - Children fetched: ✅ (${children.length} children)`);
    console.log(`   - Fee vouchers fetched: ✅ (${feeVouchers.length} vouchers)`);
    console.log(`   - Found payable voucher: ✅ (${pendingVoucher.voucherNumber})`);

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testParentLoginAndPayment();
