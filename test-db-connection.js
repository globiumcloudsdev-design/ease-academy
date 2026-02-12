const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('🔄 Testing database connection...');

    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/ease-academy', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Test Exam model
    const Exam = require('./src/backend/models/Exam');

    // Count exams
    const count = await Exam.countDocuments();
    console.log(`📊 Total exams in database: ${count}`);

    // List all exams
    const exams = await Exam.find({}, '_id title status').limit(5);
    console.log('📝 Recent exams:');
    exams.forEach(exam => {
      console.log(`  - ${exam._id}: ${exam.title} (${exam.status})`);
    });

    // Test specific exam
    const testExamId = '69774f1c6647a8ee13774d25';
    const exam = await Exam.findById(testExamId);
    if (exam) {
      console.log(`✅ Exam ${testExamId} exists: ${exam.title}`);
    } else {
      console.log(`❌ Exam ${testExamId} not found`);
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Database connection error:', error);
  }
}

testConnection();
