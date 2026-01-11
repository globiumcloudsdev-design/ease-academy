const https = require('https');

// Configuration
const API_BASE_URL = 'https://ease-academy.vercel.app'; // Update if different
const TOKEN = process.env.AUTH_TOKEN || 'YOUR_AUTH_TOKEN_HERE'; // Replace with actual token

// Function to make authenticated API request
function makeAuthenticatedRequest(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, API_BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
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

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Function to get fee voucher statistics
async function getFeePaymentStats() {
  try {
    console.log('🔍 Checking fee payment statistics...\n');

    // Get all fee vouchers (you might need to paginate for large datasets)
    const response = await makeAuthenticatedRequest('/api/super-admin/fee-vouchers?page=1&limit=1000');

    if (response.statusCode !== 200) {
      console.log('❌ API Error:', response.statusCode, response.data);
      return;
    }

    const { feeVouchers, summary } = response.data;

    if (!feeVouchers) {
      console.log('❌ No fee vouchers data found');
      return;
    }

    // Count paid vouchers
    const paidVouchers = feeVouchers.filter(voucher => voucher.status === 'paid');
    const totalPaidAmount = paidVouchers.reduce((sum, voucher) => sum + voucher.paidAmount, 0);
    const totalAmount = paidVouchers.reduce((sum, voucher) => sum + voucher.totalAmount, 0);

    console.log('📊 Fee Payment Statistics:');
    console.log('========================');
    console.log(`Total Fee Vouchers: ${feeVouchers.length}`);
    console.log(`Paid Vouchers: ${paidVouchers.length}`);
    console.log(`Pending Vouchers: ${summary?.pending || 0}`);
    console.log(`Partial Payments: ${summary?.partial || 0}`);
    console.log(`Overdue Vouchers: ${summary?.overdue || 0}`);
    console.log(`Total Paid Amount: Rs. ${totalPaidAmount.toLocaleString()}`);
    console.log(`Total Voucher Amount (Paid): Rs. ${totalAmount.toLocaleString()}`);

    // Group by month/year
    const monthlyStats = {};
    paidVouchers.forEach(voucher => {
      const key = `${voucher.month}/${voucher.year}`;
      if (!monthlyStats[key]) {
        monthlyStats[key] = { count: 0, amount: 0 };
      }
      monthlyStats[key].count++;
      monthlyStats[key].amount += voucher.paidAmount;
    });

    console.log('\n📅 Monthly Breakdown:');
    console.log('===================');
    Object.keys(monthlyStats).sort().forEach(month => {
      console.log(`${month}: ${monthlyStats[month].count} payments, Rs. ${monthlyStats[month].amount.toLocaleString()}`);
    });

    // Recent payments (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentPayments = paidVouchers.filter(voucher => {
      const paymentDate = voucher.paymentHistory?.[voucher.paymentHistory.length - 1]?.paymentDate;
      return paymentDate && new Date(paymentDate) >= sevenDaysAgo;
    });

    console.log(`\n🕒 Recent Payments (Last 7 days): ${recentPayments.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Alternative: Check branch-admin fee vouchers if super-admin access not available
async function getBranchFeePaymentStats() {
  try {
    console.log('🔍 Checking branch fee payment statistics...\n');

    const response = await makeAuthenticatedRequest('/api/branch-admin/fee-vouchers?page=1&limit=1000');

    if (response.statusCode !== 200) {
      console.log('❌ API Error:', response.statusCode, response.data);
      return;
    }

    const { feeVouchers, summary } = response.data;

    if (!feeVouchers) {
      console.log('❌ No fee vouchers data found');
      return;
    }

    const paidVouchers = feeVouchers.filter(voucher => voucher.status === 'paid');
    const totalPaidAmount = paidVouchers.reduce((sum, voucher) => sum + voucher.paidAmount, 0);

    console.log('📊 Branch Fee Payment Statistics:');
    console.log('================================');
    console.log(`Total Fee Vouchers: ${feeVouchers.length}`);
    console.log(`Paid Vouchers: ${paidVouchers.length}`);
    console.log(`Total Paid Amount: Rs. ${totalPaidAmount.toLocaleString()}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the check
async function main() {
  console.log('🚀 Starting fee payment check...\n');

  // Try super-admin first
  await getFeePaymentStats();

  // If that fails, try branch-admin
  console.log('\n🔄 Trying branch-admin endpoint...\n');
  await getBranchFeePaymentStats();
}

main();
