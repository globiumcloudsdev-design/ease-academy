const axios = require('axios');

// Branch Admin JWT Token
const BRANCH_ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTNlZDI0ZjI0NjMxMzhmNmJiYjczODAiLCJlbWFpbCI6ImhhZml6c2hvYWliQGdtYWlsLmNvbSIsInJvbGUiOiJicmFuY2hfYWRtaW4iLCJicmFuY2hJZCI6IntcbiAgYWRkcmVzczoge1xuICAgIHN0cmVldDogJ0hhbGFyaSBNZW1vbiBTY2hlbWUgMzMnLFxuICAgIGNpdHk6ICdLYXJhY2hpJyxcbiAgICBzdGF0ZTogJ1NpbmRoJyxcbiAgICB6aXBDb2RlOiAnNzUwMDAnLFxuICAgIGNvdW50cnk6ICdQYWtpc3RhbidcbiAgfSxcbiAgY29udGFjdDogeyBwaG9uZTogJzAzMDUxMDUyMDU1JywgZW1haWw6ICdoYWxhcmltZW1vbkBnbWFpbC5jb20nIH0sXG4gIF9pZDogbmV3IE9iamVjdElkKCc2OTNkODdlZTRmOTRjOWNkODMwMGRkNTknKSxcbiAgbmFtZTogJ0hhbGFyaSBNZW1vbicsXG4gIGNvZGU6ICdITS0wMDUnXG59IiwiaWF0IjoxNzY4OTA2ODM2LCJleHAiOjE3Njk1MTE2MzZ9.WcQlvevtU9fTNgwNjV0nxMBJiAMBlthMxMxc0hNytJY';

// Base URL for API
const BASE_URL = 'http://localhost:3000';

// Axios instance with auth header
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${BRANCH_ADMIN_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Test functions for each chart API
async function testStudentTrends() {
  console.log('\n=== Testing Student Trends API ===');

  const filters = ['monthly', 'weekly', 'yearly'];

  for (const filter of filters) {
    console.log(`\n--- Testing filter: ${filter} ---`);
    try {
      const response = await apiClient.get(`/api/branch-admin/charts/student-trends?filter=${filter}`);
      console.log(`✅ Student Trends API Success for ${filter}`);
      console.log('Data length:', response.data.data?.length || 0);
    } catch (error) {
      console.log(`❌ Student Trends API Failed for ${filter}`);
      console.log('Error:', error.response?.data || error.message);
    }
  }
}

async function testFeesCollectedPending() {
  console.log('\n=== Testing Fees Collected vs Pending API ===');

  const filters = ['monthly', 'weekly', 'yearly'];

  for (const filter of filters) {
    console.log(`\n--- Testing filter: ${filter} ---`);
    try {
      const response = await apiClient.get(`/api/branch-admin/charts/fees-collected-pending?filter=${filter}`);
      console.log(`✅ Fees Collected vs Pending API Success for ${filter}`);
      console.log('Data length:', response.data.data?.length || 0);
    } catch (error) {
      console.log(`❌ Fees Collected vs Pending API Failed for ${filter}`);
      console.log('Error:', error.response?.data || error.message);
    }
  }
}

async function testMonthlyFeeCollection() {
  console.log('\n=== Testing Monthly Fee Collection API ===');

  const filters = ['monthly', 'weekly', 'yearly'];

  for (const filter of filters) {
    console.log(`\n--- Testing filter: ${filter} ---`);
    try {
      const response = await apiClient.get(`/api/branch-admin/charts/monthly-fee-collection?filter=${filter}`);
      console.log(`✅ Monthly Fee Collection API Success for ${filter}`);
      console.log('Data length:', response.data.data?.length || 0);
    } catch (error) {
      console.log(`❌ Monthly Fee Collection API Failed for ${filter}`);
      console.log('Error:', error.response?.data || error.message);
    }
  }
}

async function testRevenueExpense() {
  console.log('\n=== Testing Revenue vs Expense API ===');

  const filters = ['monthly', 'weekly', 'yearly'];

  for (const filter of filters) {
    console.log(`\n--- Testing filter: ${filter} ---`);
    try {
      const response = await apiClient.get(`/api/branch-admin/charts/revenue-expense?filter=${filter}`);
      console.log(`✅ Revenue vs Expense API Success for ${filter}`);
      console.log('Data length:', response.data.data?.length || 0);
    } catch (error) {
      console.log(`❌ Revenue vs Expense API Failed for ${filter}`);
      console.log('Error:', error.response?.data || error.message);
    }
  }
}

async function testPassFailRatio() {
  console.log('\n=== Testing Pass/Fail Ratio API ===');

  const filters = ['monthly', 'weekly', 'yearly'];

  for (const filter of filters) {
    console.log(`\n--- Testing filter: ${filter} ---`);
    try {
      const response = await apiClient.get(`/api/branch-admin/charts/pass-fail-ratio?filter=${filter}`);
      console.log(`✅ Pass/Fail Ratio API Success for ${filter}`);
      console.log('Data length:', response.data.data?.length || 0);
    } catch (error) {
      console.log(`❌ Pass/Fail Ratio API Failed for ${filter}`);
      console.log('Error:', error.response?.data || error.message);
    }
  }
}

async function testClassWiseStudents() {
  console.log('\n=== Testing Class-wise Students API ===');
  try {
    const response = await apiClient.get('/api/branch-admin/charts/class-wise-students');
    console.log('✅ Class-wise Students API Success');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Class-wise Students API Failed');
    console.log('Error:', error.response?.data || error.message);
  }
}

async function testStudentAttendance() {
  console.log('\n=== Testing Student Attendance API ===');
  try {
    const response = await apiClient.get('/api/branch-admin/charts/student-attendance');
    console.log('✅ Student Attendance API Success');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Student Attendance API Failed');
    console.log('Error:', error.response?.data || error.message);
  }
}

async function testFeesCollectedPending() {
  console.log('\n=== Testing Fees Collected vs Pending API ===');
  try {
    const response = await apiClient.get('/api/branch-admin/charts/fees-collected-pending');
    console.log('✅ Fees Collected vs Pending API Success');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Fees Collected vs Pending API Failed');
    console.log('Error:', error.response?.data || error.message);
  }
}

async function testMonthlyFeeCollection() {
  console.log('\n=== Testing Monthly Fee Collection API ===');
  try {
    const response = await apiClient.get('/api/branch-admin/charts/monthly-fee-collection');
    console.log('✅ Monthly Fee Collection API Success');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Monthly Fee Collection API Failed');
    console.log('Error:', error.response?.data || error.message);
  }
}

async function testPassFailRatio() {
  console.log('\n=== Testing Pass/Fail Ratio API ===');
  try {
    const response = await apiClient.get('/api/branch-admin/charts/pass-fail-ratio');
    console.log('✅ Pass/Fail Ratio API Success');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Pass/Fail Ratio API Failed');
    console.log('Error:', error.response?.data || error.message);
  }
}

// Main test function
async function runAllTests() {
  console.log('🚀 Starting Branch Admin Charts API Tests');
  console.log('Token:', BRANCH_ADMIN_TOKEN.substring(0, 50) + '...');
  console.log('Base URL:', BASE_URL);

  try {
    await testStudentTrends();
    await testFeesCollectedPending();
    await testMonthlyFeeCollection();
    await testRevenueExpense();
    await testPassFailRatio();
    await testClassWiseStudents();
    await testStudentAttendance();

    console.log('\n🎉 All API tests completed!');
  } catch (error) {
    console.log('\n💥 Test execution failed:', error.message);
  }
}

// Run the tests
runAllTests();
