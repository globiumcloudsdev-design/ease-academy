const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTM4NDQ2Y2ZjM2FhYTMwMTQxZTdjNDAiLCJlbWFpbCI6InN1cGVyYWRtaW5AZWFzZWFjYWRlbXkuY29tIiwicm9sZSI6InN1cGVyX2FkbWluIiwiaWF0IjoxNzY5NDIzOTY0LCJleHAiOjE3NzAwMjg3NjR9.u-KIZRuSUWLBIiOB8mz5yx3v2VPs8cGwuhK_kn5mYWI';

const examId = '69776127793852c329c1ab87';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: `/api/super-admin/exams/${examId}`,
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
};

console.log(`🗑️  Attempting to delete exam with ID: ${examId}`);

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    try {
      const response = JSON.parse(body);
      console.log('📊 Response Status:', res.statusCode);
      console.log('📋 Response:', JSON.stringify(response, null, 2));

      if (response.success) {
        console.log('✅ Exam deleted successfully!');
      } else {
        console.log('❌ Failed to delete exam:', response.message);
      }
    } catch (e) {
      console.log('❌ Error parsing response:', body);
    }
  });
});

req.on('error', (err) => {
  console.error('❌ Request failed:', err.message);
});

req.end();
