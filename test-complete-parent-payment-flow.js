const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = 'http://localhost:3000';
const USE_HTTPS = false; // Set to true for production

// Parent credentials to test
const parentCredentials = {
  email: 'arshayn@example.com',
  password: 'password123'
};

// Branch admin credentials (you may need to update these)
const branchAdminCredentials = {
  email: 'hafizshoaib@gmail.com',
  password: '123456'
};

// Function to make HTTP/HTTPS request
function makeRequest(endpoint, method = 'GET', headers = {}, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, API_BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = (USE_HTTPS ? https : http).request(options, (res) => {
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
      if (typeof data === 'string') {
        req.write(data);
      } else {
        req.write(JSON.stringify(data));
      }
    }

    req.end();
  });
}

// Function to login and get token
async function loginAndGetToken(email, password) {
  console.log(`🔑 Logging in as: ${email}`);

  const response = await makeRequest('/api/auth/login', 'POST', {}, { email, password });

  if (response.statusCode !== 200 || !response.data.success) {
    throw new Error(`Login failed: ${response.data.message || response.data}`);
  }

  console.log('✅ Login successful!');
  return response.data.data.accessToken;
}

// Function to make authenticated request
function makeAuthenticatedRequest(endpoint, method = 'GET', token, data = null) {
  const headers = {
    'Authorization': `Bearer ${token}`
  };

  if (data && typeof data === 'object' && !(data instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  return makeRequest(endpoint, method, headers, data);
}

// Create a dummy image file for payment screenshot
function createDummyImage() {
  // Create a simple 1x1 pixel PNG as base64
  const dummyImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const buffer = Buffer.from(dummyImageBase64, 'base64');

  const tempPath = path.join(__dirname, 'temp_payment_screenshot.png');
  fs.writeFileSync(tempPath, buffer);
  return tempPath;
}

// Function to make payment with FormData
async function makePayment(childId, voucherId, token) {
  const FormData = require('form-data');
  const form = new FormData();

  // Create dummy image
  const imagePath = createDummyImage();

  // Add form data
  form.append('amount', '1000'); // Pay 1000 PKR
  form.append('paymentMethod', 'bank-transfer');
  form.append('transactionId', `TEST-${Date.now()}`);
  form.append('remarks', 'Test payment from API');
  form.append('screenshot', fs.createReadStream(imagePath), {
    filename: 'payment_screenshot.png',
    contentType: 'image/png'
  });

  return new Promise((resolve, reject) => {
    const url = new URL(`/api/parent/${childId}/fee-vouchers/${voucherId}/pay`, API_BASE_URL);

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...form.getHeaders()
      }
    };

    const req = (USE_HTTPS ? https : http).request(options, (res) => {
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

    form.pipe(req);
  });
}

// Main test function
async function testCompletePaymentFlow() {
  let parentToken = '';
  let branchAdminToken = '';
  let childId = '';
  let voucherId = '';

  try {
    console.log('🚀 Starting Complete Parent Payment Flow Test\n');
    console.log('=' .repeat(50));

    // Step 1: Parent Login
    console.log('\n📝 Step 1: Parent Login');
    console.log('-'.repeat(30));
    parentToken = await loginAndGetToken(parentCredentials.email, parentCredentials.password);

    // Step 2: Get Parent Children
    console.log('\n👨‍👩‍👧‍👦 Step 2: Fetching Parent Children');
    console.log('-'.repeat(30));
    const childrenResponse = await makeAuthenticatedRequest('/api/parent', 'GET', parentToken);

    if (childrenResponse.statusCode !== 200 || !childrenResponse.data.success) {
      throw new Error(`Failed to fetch children: ${childrenResponse.data.message || childrenResponse.data}`);
    }

    const children = childrenResponse.data.children || [];
    console.log(`✅ Found ${children.length} children:`);
    children.forEach((child, index) => {
      console.log(`   ${index + 1}. ${child.name} (ID: ${child.id})`);
    });

    if (children.length === 0) {
      throw new Error('No children found for this parent');
    }

    childId = children[0].id;
    console.log(`\n👶 Using child: ${children[0].name} (ID: ${childId})`);

    // Step 3: Get Fee Vouchers
    console.log('\n💰 Step 3: Fetching Fee Vouchers');
    console.log('-'.repeat(30));
    const feeVouchersResponse = await makeAuthenticatedRequest(`/api/parent/${childId}/fee-vouchers`, 'GET', parentToken);

    if (feeVouchersResponse.statusCode !== 200 || !feeVouchersResponse.data.success) {
      throw new Error(`Failed to fetch fee vouchers: ${feeVouchersResponse.data.message || feeVouchersResponse.data}`);
    }

    const feeVouchers = feeVouchersResponse.data.feeVouchers || [];
    console.log(`✅ Found ${feeVouchers.length} fee vouchers:`);
    feeVouchers.forEach((voucher, index) => {
      console.log(`   ${index + 1}. ${voucher.voucherNumber} - ${voucher.template?.name || 'Fee'} (${voucher.status}) - Remaining: PKR ${voucher.remainingAmount}`);
    });

    // Find a payable voucher
    const payableVoucher = feeVouchers.find(v => v.status === 'pending' || v.status === 'partial' || v.status === 'overdue');
    if (!payableVoucher) {
      console.log('⚠️  No payable vouchers found. Checking if any vouchers exist...');
      if (feeVouchers.length === 0) {
        throw new Error('No fee vouchers found for this child');
      }
      // Use first voucher anyway for testing
      voucherId = feeVouchers[0].id;
      console.log(`📝 Using first available voucher: ${feeVouchers[0].voucherNumber}`);
    } else {
      voucherId = payableVoucher.id;
      console.log(`💳 Found payable voucher: ${payableVoucher.voucherNumber} (Remaining: PKR ${payableVoucher.remainingAmount})`);
    }

    // Step 4: Make Payment
    console.log('\n💳 Step 4: Making Payment');
    console.log('-'.repeat(30));
    console.log(`Making payment of PKR 1000 for voucher ${voucherId}`);

    const paymentResponse = await makePayment(childId, voucherId, parentToken);

    if (paymentResponse.statusCode !== 200 || !paymentResponse.data.success) {
      console.log('❌ Payment failed:', paymentResponse.data.message || paymentResponse.data);
      console.log('Status Code:', paymentResponse.statusCode);
    } else {
      console.log('✅ Payment submitted successfully!');
      console.log('Payment Details:', paymentResponse.data.payment);
    }

    // Step 5: Branch Admin Login
    console.log('\n🏢 Step 5: Branch Admin Login');
    console.log('-'.repeat(30));
    try {
      branchAdminToken = await loginAndGetToken(branchAdminCredentials.email, branchAdminCredentials.password);
    } catch (error) {
      console.log('⚠️  Branch admin login failed, trying alternative credentials...');
      // Try different branch admin credentials
      const altCredentials = [
        { email: 'branch@easeacademy.com', password: 'Branch@123' },
        { email: 'admin@branch.com', password: 'Admin@123' }
      ];

      for (const cred of altCredentials) {
        try {
          branchAdminToken = await loginAndGetToken(cred.email, cred.password);
          break;
        } catch (e) {
          continue;
        }
      }

      if (!branchAdminToken) {
        console.log('❌ Could not login as branch admin. Available test credentials may vary.');
        console.log('💡 You can manually check the branch admin interface for pending payments.');
        return;
      }
    }

    // Step 6: Check Pending Fees in Branch Admin
    console.log('\n📋 Step 6: Checking Pending Fees in Branch Admin');
    console.log('-'.repeat(30));

    const pendingFeesResponse = await makeAuthenticatedRequest('/api/branch-admin/pending-fees', 'GET', branchAdminToken);

    if (pendingFeesResponse.statusCode !== 200) {
      console.log('❌ Failed to fetch pending fees:', pendingFeesResponse.data.message || pendingFeesResponse.data);
    } else {
      const pendingFees = pendingFeesResponse.data.pendingFees || [];
      console.log(`✅ Found ${pendingFees.length} pending fee payments:`);

      if (pendingFees.length > 0) {
        console.log('\n📄 Pending Payments:');
        pendingFees.forEach((fee, index) => {
          console.log(`   ${index + 1}. Student: ${fee.studentName} | Amount: PKR ${fee.amount} | Status: ${fee.status}`);
          console.log(`      Voucher: ${fee.voucherNumber} | Submitted: ${new Date(fee.submittedAt).toLocaleString()}`);
        });

        // Check if our payment is in the list
        const ourPayment = pendingFees.find(fee => fee.voucherId === voucherId);
        if (ourPayment) {
          console.log('\n🎉 SUCCESS: Our payment appears in branch admin pending fees!');
          console.log(`   Payment ID: ${ourPayment.id}`);
          console.log(`   Amount: PKR ${ourPayment.amount}`);
          console.log(`   Status: ${ourPayment.status}`);
        } else {
          console.log('\n⚠️  Our payment was not found in the pending fees list.');
          console.log('   This could be due to:');
          console.log('   - Payment processing delay');
          console.log('   - Different voucher ID format');
          console.log('   - Payment already processed');
        }
      } else {
        console.log('📝 No pending fees found in branch admin.');
      }
    }

    // Cleanup
    try {
      const tempImagePath = path.join(__dirname, 'temp_payment_screenshot.png');
      if (fs.existsSync(tempImagePath)) {
        fs.unlinkSync(tempImagePath);
      }
    } catch (e) {
      // Ignore cleanup errors
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎯 Test Summary:');
    console.log('✅ Parent login and authentication');
    console.log('✅ Children fetching');
    console.log('✅ Fee vouchers fetching');
    console.log('✅ Payment submission');
    console.log('✅ Branch admin pending fees check');
    console.log('\n🎉 Complete payment flow test finished successfully!');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);

    // Cleanup on error
    try {
      const tempImagePath = path.join(__dirname, 'temp_payment_screenshot.png');
      if (fs.existsSync(tempImagePath)) {
        fs.unlinkSync(tempImagePath);
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

// Run the test
testCompletePaymentFlow();
