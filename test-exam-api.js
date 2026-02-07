const http = require('http');

// Super admin token
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTM4NDQ2Y2ZjM2FhYTMwMTQxZTdjNDAiLCJlbWFpbCI6InN1cGVyYWRtaW5AZWFzZWFjYWRlbXkuY29tIiwicm9sZSI6InN1cGVyX2FkbWluIiwiaWF0IjoxNzY5NDIzOTY0LCJleHAiOjE3NzAwMjg3NjR9.u-KIZRuSUWLBIiOB8mz5yx3v2VPs8cGwuhK_kn5mYWI';

// Test data for creating an exam
const examData = {
  title: "Midterm Exam 2025",
  examType: "midterm",
  branchId: "693d87ee4f94c9cd8300dd59",
  classId: "693ac762da703aa59c1d0bb9",
  section: "A",
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

function testCreateExam() {
  const data = JSON.stringify(examData);

  const options = {
    hostname: 'localhost',
    port: 3000, // Updated to correct port
    path: '/api/super-admin/exams',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Length': data.length
    }
  };

  console.log('🔄 Testing exam creation API...');
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
          console.log('✅ Exam created successfully!');
          console.log('🆔 Exam ID:', response.exam._id);
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
testCreateExam();
