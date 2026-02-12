const http = require('http');

// Branch Admin JWT Token
const BRANCH_ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTNlZDI0ZjI0NjMxMzhmNmJiYjczODAiLCJlbWFpbCI6ImhhZml6c2hvYWliQGdtYWlsLmNvbSIsInJvbGUiOiJicmFuY2hfYWRtaW4iLCJicmFuY2hJZCI6IntcbiAgYWRkcmVzczoge1xuICAgIHN0cmVldDogJ0hhbGFyaSBNZW1vbiBTY2hlbWUgMzMnLFxuICAgIGNpdHk6ICdLYXJhY2hpJyxcbiAgICBzdGF0ZTogJ1NpbmRoJyxcbiAgICB6aXBDb2RlOiAnNzUwMDAnLFxuICAgIGNvdW50cnk6ICdQYWtpc3RhbidcbiAgfSxcbiAgY29udGFjdDogeyBwaG9uZTogJzAzMDUxMDUyMDU1JywgZW1haWw6ICdoYWxhcmltZW1vbkBnbWFpbC5jb20nIH0sXG4gIF9pZDogbmV3IE9iamVjdElkKCc2OTNkODdlZTRmOTRjOWNkODMwMGRkNTknKSxcbiAgbmFtZTogJ0hhbGFyaSBNZW1vbicsXG4gIGNvZGU6ICdITS0wMDUnXG59IiwiaWF0IjoxNzY5NDMyNTY1LCJleHAiOjE3NzAwMzczNjV9.Z7y9woGTnQ9LQG8qsRx8nVxXGrdOuGe_Z91CtJXZYhc';

// Test data for creating an exam (branch admin)
const examData = {
  title: "Branch Admin Midterm Exam 2025",
  examType: "midterm",
  classId: "693ac762da703aa59c1d0bb9",
  status: "scheduled",
  subjects: [{
    subjectId: "693c4fcdd5761814c5d982d4",
    date: "2025-12-20",
    startTime: "09:00",
    endTime: "11:00",
    duration: 120,
    totalMarks: 100,
    passingMarks: 40,
    room: "Room 101",
    instructions: "Bring your calculator and ID card",
    syllabus: "Chapters 1-5"
  }]
};

function testCreateBranchAdminExam() {
  const data = JSON.stringify(examData);

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/branch-admin/exams',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BRANCH_ADMIN_TOKEN}`,
      'Content-Length': data.length
    }
  };

  console.log('🔄 Testing branch admin exam creation API...');
  console.log('📤 Sending data:', JSON.stringify(examData, null, 2));

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    res.on('end', () => {
      try {
        const response = JSON.parse(body);
        console.log('📊 Response Status:', res.statusCode);
        console.log('📋 Response:', JSON.stringify(response, null, 2));

        if (response.success) {
          console.log('✅ Branch admin exam created successfully!');
          console.log('🆔 Exam ID:', response.data.exam._id);
        } else {
          console.log('❌ Failed to create exam:', response.message);
        }
      } catch (e) {
        console.log('❌ Error parsing response:', body);
      }
    });
  });

  req.on('error', (err) => {
    console.error('❌ Request failed:', err.message);
  });

  req.write(data);
  req.end();
}

// Run the test
testCreateBranchAdminExam();
