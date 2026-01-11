const mongoose = require('mongoose');
require('./src/backend/models/FeeVoucher.js');
require('./src/backend/models/User.js');
require('./src/backend/models/Branch.js');

async function createTestPendingPayment() {
  try {
    console.log('🔄 Connecting to database...');
    await mongoose.connect('mongodb://localhost:27017/ease-academy');

    const FeeVoucher = mongoose.model('FeeVoucher');
    const User = mongoose.model('User');
    const Branch = mongoose.model('Branch');

    // Find an existing student and parent
    console.log('👨‍👩‍👧‍👦 Finding existing student and parent...');
    const parent = await User.findOne({ role: 'parent' }).populate('parentProfile.children').lean();
    if (!parent || !parent.parentProfile?.children?.length) {
      console.log('❌ No parent with children found. Please create test data first.');
      return;
    }

    const student = parent.parentProfile.children[0];
    console.log(`✅ Found student: ${student.name} (ID: ${student.id})`);

    // Find a branch
    const branch = await Branch.findOne().lean();
    if (!branch) {
      console.log('❌ No branch found.');
      return;
    }
    console.log(`✅ Found branch: ${branch.name} (ID: ${branch._id})`);

    // Find or create a fee voucher for this student
    let voucher = await FeeVoucher.findOne({
      studentId: student.id,
      status: { $in: ['pending', 'partial'] }
    }).lean();

    if (!voucher) {
      console.log('📄 Creating a new fee voucher...');
      // Create a simple fee voucher
      voucher = new FeeVoucher({
        voucherNumber: `TEST-${Date.now()}`,
        studentId: student.id,
        branchId: branch._id,
        templateId: null, // We'll skip template for simplicity
        classId: null,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        amount: 5000,
        lateFeeAmount: 0,
        discountAmount: 0,
        totalAmount: 5000,
        paidAmount: 0,
        remainingAmount: 5000,
        status: 'pending',
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        paymentHistory: [],
        remarks: 'Test voucher for super admin pending fees',
        createdBy: parent._id,
        updatedBy: parent._id
      });

      await voucher.save();
      console.log(`✅ Created voucher: ${voucher.voucherNumber}`);
    } else {
      console.log(`✅ Using existing voucher: ${voucher.voucherNumber}`);
    }

    // Add a pending payment to the voucher
    console.log('💳 Adding pending payment...');
    const paymentEntry = {
      amount: 2000,
      paymentDate: new Date(),
      paymentMethod: 'bank-transfer',
      transactionId: `TEST-TXN-${Date.now()}`,
      remarks: 'Test payment for super admin approval',
      status: 'pending',
      submittedBy: parent._id,
      screenshot: {
        url: 'https://via.placeholder.com/300x200?text=Payment+Receipt',
        publicId: 'test-screenshot'
      }
    };

    // Update the voucher with the pending payment
    await FeeVoucher.findByIdAndUpdate(voucher._id, {
      $push: { paymentHistory: paymentEntry },
      updatedBy: parent._id
    });

    console.log('✅ Pending payment added successfully!');
    console.log(`📄 Voucher: ${voucher.voucherNumber}`);
    console.log(`👨‍🎓 Student: ${student.name}`);
    console.log(`🏢 Branch: ${branch.name}`);
    console.log(`💰 Amount: ₹${paymentEntry.amount}`);
    console.log(`🔄 Status: ${paymentEntry.status}`);
    console.log(`🆔 Transaction ID: ${paymentEntry.transactionId}`);

    console.log('\n🎯 Test data created! You can now:');
    console.log('1. Login to super admin dashboard');
    console.log('2. Navigate to "Pending Fees" in the sidebar');
    console.log('3. See the pending payment and test approve/reject functionality');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
  }
}

// Function to test super admin approval
async function testSuperAdminApproval() {
  try {
    console.log('🔄 Testing super admin approval functionality...');
    await mongoose.connect('mongodb://localhost:27017/ease-academy');

    const FeeVoucher = mongoose.model('FeeVoucher');

    // Find vouchers with pending payments
    const vouchersWithPending = await FeeVoucher.find({
      'paymentHistory.status': 'pending'
    }).populate('studentId', 'fullName firstName lastName').populate('branchId', 'name').lean();

    console.log(`📋 Found ${vouchersWithPending.length} vouchers with pending payments`);

    if (vouchersWithPending.length > 0) {
      vouchersWithPending.forEach((voucher, index) => {
        console.log(`\n${index + 1}. Voucher: ${voucher.voucherNumber}`);
        console.log(`   Student: ${voucher.studentId?.fullName || 'Unknown'}`);
        console.log(`   Branch: ${voucher.branchId?.name || 'Unknown'}`);

        const pendingPayments = voucher.paymentHistory.filter(p => p.status === 'pending');
        pendingPayments.forEach((payment, pIndex) => {
          console.log(`   Payment ${pIndex + 1}: ₹${payment.amount} (${payment.paymentMethod}) - ${payment.transactionId}`);
        });
      });

      console.log('\n✅ Super admin can now approve/reject these payments via the dashboard!');
    } else {
      console.log('❌ No pending payments found. Run createTestPendingPayment() first.');
    }

  } catch (error) {
    console.error('❌ Error testing approval:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Main execution
async function main() {
  console.log('🚀 Super Admin Pending Fees Test\n');
  console.log('=' .repeat(50));

  const args = process.argv.slice(2);

  if (args.includes('--create')) {
    console.log('📝 Creating test pending payment...');
    await createTestPendingPayment();
  } else if (args.includes('--test')) {
    console.log('🧪 Testing super admin approval...');
    await testSuperAdminApproval();
  } else {
    console.log('📝 Creating test data first...');
    await createTestPendingPayment();
    console.log('\n🧪 Now testing the data...');
    await testSuperAdminApproval();
  }
}

main();
