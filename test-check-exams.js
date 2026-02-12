const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTM4NDQ2Y2ZjM2FhYTMwMTQxZTdjNDAiLCJlbWFpbCI6InN1cGVyYWRtaW5AZWFzZWFjYWRlbXkuY29tIiwicm9sZSI6InN1cGVyX2FkbWluIiwiaWF0IjoxNzY5NDIzOTY0LCJleHAiOjE3NzAwMjg3NjR9.u-KIZRuSUWLBIiOB8mz5yx3v2VPs8cGwuhK_kn5mYWI';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/super-admin/exams',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
};

console.log('🔍 Checking existing exams...');

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    try {
      const response = JSON.parse(body);
      console.log('📊 Status:', res.statusCode);
      console.log('📋 Exams found:', response.exams?.length || 0);

      if (response.exams?.length > 0) {
        response.exams.forEach((exam, index) => {
          console.log(`📝 Exam ${index + 1} details:`);
          console.log('  - ID:', exam._id);
          console.log('  - Title:', exam.title);
          console.log('  - Status:', exam.status);
          console.log('  ---');
        });
      } else {
        console.log('❌ No exams found in database');
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
