const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTM4NDQ2Y2ZjM2FhYTMwMTQxZTdjNDAiLCJlbWFpbCI6InN1cGVyYWRtaW5AZWFzZWFjYWRlbXkuY29tIiwicm9sZSI6InN1cGVyX2FkbWluIiwiaWF0IjoxNzY5NDIzOTY0LCJleHAiOjE3NzAwMjg3NjR9.u-KIZRuSUWLBIiOB8mz5yx3v2VPs8cGwuhK_kn5mYWI';

const examId = '69776127793852c329c1ab87'; // Use the ID from the created exam

const updateData = {
  title: "Updated Midterm Exam 2025",
  status: "ongoing",
  subjects: [{
    subjectId: "693c4fcdd5761814c5d982d4",
    date: "2025-12-21",
    startTime: "10:00",
    endTime: "12:00",
    duration: 120,
    totalMarks: 100,
    passingMarks: 40,
    room: "Room 102",
    instructions: "Updated instructions",
    syllabus: "Chapters 1-6"
  }]
};

function testUpdateExam() {
  const data = JSON.stringify(updateData);

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/super-admin/exams/${examId}`,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Length': data.length
    }
  };

  console.log('🔄 Testing exam update API...');
  console.log('📤 Sending data:', JSON.stringify(updateData, null, 2));

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
          console.log('✅ Exam updated successfully!');
        } else {
          console.log('❌ Failed to update exam:', response.message);
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

testUpdateExam();
