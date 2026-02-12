const axios = require('axios');

// Super Admin Access Token
const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTNlZDI0ZjI0NjMxMzhmNmJiYjczODAiLCJlbWFpbCI6ImhhZml6c2hvYWliQGdtYWlsLmNvbSIsInJvbGUiOiJicmFuY2hfYWRtaW4iLCJicmFuY2hJZCI6IntcbiAgYWRkcmVzczoge1xuICAgIHN0cmVldDogJ0hhbGFyaSBNZW1vbiBTY2hlbWUgMzMnLFxuICAgIGNpdHk6ICdLYXJhY2hpJyxcbiAgICBzdGF0ZTogJ1NpbmRoJyxcbiAgICB6aXBDb2RlOiAnNzUwMDAnLFxuICAgIGNvdW50cnk6ICdQYWtpc3RhbidcbiAgfSxcbiAgY29udGFjdDogeyBwaG9uZTogJzAzMDUxMDUyMDU1JywgZW1haWw6ICdoYWxhcmltZW1vbkBnbWFpbC5jb20nIH0sXG4gIF9pZDogbmV3IE9iamVjdElkKCc2OTNkODdlZTRmOTRjOWNkODMwMGRkNTknKSxcbiAgbmFtZTogJ0hhbGFyaSBNZW1vbicsXG4gIGNvZGU6ICdITS0wMDUnXG59IiwiaWF0IjoxNzY4ODI5NzgyLCJleHAiOjE3Njk0MzQ1ODJ9.NVK5VO2LKBBQAlHXrUIUC5xKLN7rQCX1FlUjH-HjD28';

// Test Employee Attendance APIs
async function testEmployeeAttendanceAPIs() {
  const baseURL = 'http://localhost:3000';

  // Common headers with authentication
  const headers = {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
  };

  try {
    console.log('🔐 Testing Employee Attendance APIs with Super Admin Token...\n');

    // Test 1: Get attendance list
    console.log('1. Testing GET /api/employee-attendance/list');
    try {
      const listResponse = await axios.get(`${baseURL}/api/employee-attendance/list`, {
        headers,
        params: {
          month: 12,
          year: 2024,
          limit: 10
        }
      });
      console.log('✅ List API Response:', {
        success: listResponse.data.success,
        totalRecords: listResponse.data.data?.length || 0,
        pagination: listResponse.data.pagination,
        sampleRecord: listResponse.data.data?.[0] ? {
          id: listResponse.data.data[0]._id,
          employee: `${listResponse.data.data[0].userId?.firstName} ${listResponse.data.data[0].userId?.lastName}`,
          status: listResponse.data.data[0].status,
          date: listResponse.data.data[0].date
        } : null
      });
    } catch (error) {
      console.log('❌ List API Error:', error.response?.data || error.message);
    }

    // Test 2: Get attendance reports
    console.log('\n2. Testing GET /api/employee-attendance/reports');
    try {
      const reportsResponse = await axios.get(`${baseURL}/api/employee-attendance/reports`, {
        headers,
        params: {
          month: 12,
          year: 2024,
          type: 'summary'
        }
      });
      console.log('✅ Reports API Response:', {
        success: reportsResponse.data.success,
        data: reportsResponse.data.data
      });
    } catch (error) {
      console.log('❌ Reports API Error:', error.response?.data || error.message);
    }

    // Test 3: Test different months to see if there's any data
    console.log('\n3. Testing different months for data availability');
    const monthsToTest = [11, 10, 9, 8]; // Current and previous months

    for (const month of monthsToTest) {
      try {
        const monthResponse = await axios.get(`${baseURL}/api/employee-attendance/list`, {
          headers,
          params: {
            month: month,
            year: 2024,
            limit: 5
          }
        });
        console.log(`📅 Month ${month}/2024: ${monthResponse.data.data?.length || 0} records`);
      } catch (error) {
        console.log(`❌ Month ${month}/2024 Error:`, error.response?.data?.message || error.message);
      }
    }

    // Test 4: Check branches and employees endpoints
    console.log('\n4. Testing related endpoints');
    try {
      const branchesResponse = await axios.get(`${baseURL}/api/super-admin/branches`, {
        headers,
        params: { limit: 10, status: 'active' }
      });
      console.log('✅ Branches API:', {
        success: branchesResponse.data.success,
        count: branchesResponse.data.data?.branches?.length || 0
      });
    } catch (error) {
      console.log('❌ Branches API Error:', error.response?.data || error.message);
    }

    try {
      const employeesResponse = await axios.get(`${baseURL}/api/super-admin/employees`, {
        headers
      });
      console.log('✅ Employees API:', {
        success: employeesResponse.data.success,
        count: employeesResponse.data?.length || 0
      });
    } catch (error) {
      console.log('❌ Employees API Error:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEmployeeAttendanceAPIs();
