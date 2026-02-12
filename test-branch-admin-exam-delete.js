const http = require('http');

// Branch Admin JWT Token
const BRANCH_ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTNlZDI0ZjI0NjMxMzhmNmJiYjczODAiLCJlbWFpbCI6ImhhZml6c2hvYWliQGdtYWlsLmNvbSIsInJvbGUiOiJicmFuY2hfYWRtaW4iLCJicmFuY2hJZCI6IntcbiAgYWRkcmVzczoge1xuICAgIHN0cmVldDogJ0hhbGFyaSBNZW1vbiBTY2hlbWUgMzMnLFxuICAgIGNpdHk6ICdLYXJhY2hpJyxcbiAgICBzdGF0ZTogJ1NpbmRoJyxcbiAgICB6aXBDb2RlOiAnNzUwMDAnLFxuICAgIGNvdW50cnk6ICdQYWtpc3RhbidcbiAgfSxcbiAgY29udGFjdDogeyBwaG9uZTogJzAzMDUxMDUyMDU1JywgZW1haWw6ICdoYWxhcmltZW1vbkBnbWFpbC5jb20nIH0sXG4gIF9pZDogbmV3IE9iamVjdElkKCc2OTNkODdlZTRmOTRjOWNkODMwMGRkNTknKSxcbiAgbmFtZTogJ0hhbGFyaSBNZW1vbicsXG4gIGNvZGU6ICdITS0wMDUnXG59IiwiaWF0IjoxNzY5NDMyNTY1LCJleHAiOjE3NzAwMzczNjV9.Z7y9woGTnQ9LQG8qsRx8nVxXGrdOuGe_Z91CtJXZYhc';

// Exam ID to delete (replace with actual exam ID from create test)
const examId = 'YOUR_EXAM_ID_HERE';

function testDeleteBranchAdminExam() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/branch-admin/exams/${examId}`,
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${BRANCH_ADMIN_TOKEN}`
    }
  };

  console.log('🔄 Testing branch admin exam delete API...');
  console.log('📤 Deleting exam ID:', examId);

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
          console.log('✅ Branch admin exam deleted successfully!');
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
}

// Run the test
testDeleteBranchAdminExam();
