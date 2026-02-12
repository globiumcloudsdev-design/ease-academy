const https = require('https');

// Configuration
const API_BASE_URL = 'http://localhost:3000';

// Super admin credentials
const superAdminCredentials = {
  email: 'superadmin@easeacademy.com',
  password: 'SuperAdmin@123'
};

// Branch admin data to create
const branchAdminData = {
  fullName: 'Test Branch Admin',
  email: 'testbranchadmin@easeacademy.com',
  phone: '+923001234567',
  password: 'BranchAdmin@123',
  branchId: null, // Will be set after getting branches
  permissions: []
};

// Function to make HTTP/HTTPS request
function makeRequest(endpoint, method = 'GET', headers = {}, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, API_BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ statusCode: res.statusCode, data: response });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Function to login and get token
async function loginAndGetToken(email, password) {
  console.log(`🔑 Logging in as: ${email}`);

  const response = await makeRequest('/api/auth/login', 'POST', {}, { email, password });

  if (response.statusCode !== 200 || !response.data.success) {
    throw new Error(`Login failed: ${response.data.message || response.data}`);
  }

  console.log('✅ Login successful!');
  return response.data.data.accessToken;
}

// Function to get branches
async function getBranches(token) {
  console.log('🏢 Getting branches...');

  const response = await makeRequest('/api/super-admin/branches', 'GET', {
    'Authorization': `Bearer ${token}`
  });

  if (response.statusCode !== 200 || !response.data.success) {
    throw new Error(`Failed to get branches: ${response.data.message || response.data}`);
  }

  const branches = response.data.data || [];
  console.log(`✅ Found ${branches.length} branches`);

  if (branches.length === 0) {
    throw new Error('No branches found');
  }

  return branches[0]._id; // Use first branch
}

// Function to create branch admin
async function createBranchAdmin(token, branchId) {
  console.log('👤 Creating branch admin...');

  const adminData = {
    ...branchAdminData,
    branchId
  };

  const response = await makeRequest('/api/super-admin/admins', 'POST', {
    'Authorization': `Bearer ${token}`
  }, adminData);

  if (response.statusCode !== 201 || !response.data.success) {
    console.log('❌ Failed to create branch admin:', response.data.message || response.data);
    return null;
  }

  console.log('✅ Branch admin created successfully!');
  console.log('📧 Email:', adminData.email);
  console.log('🔒 Password:', adminData.password);
  return response.data.data;
}

// Main function
async function main() {
  try {
    console.log('🚀 Creating branch admin account...\n');

    // Step 1: Login as super admin
    const superAdminToken = await loginAndGetToken(superAdminCredentials.email, superAdminCredentials.password);

    // Step 2: Get branches
    const branchId = await getBranches(superAdminToken);

    // Step 3: Create branch admin
    const branchAdmin = await createBranchAdmin(superAdminToken, branchId);

    if (branchAdmin) {
      console.log('\n🎉 Branch admin created successfully!');
      console.log('📊 Details:');
      console.log(`   Name: ${branchAdmin.fullName}`);
      console.log(`   Email: ${branchAdmin.email}`);
      console.log(`   Branch ID: ${branchAdmin.branchId}`);
      console.log('\n🔑 You can now login as branch admin with:');
      console.log(`   Email: ${branchAdminData.email}`);
      console.log(`   Password: ${branchAdminData.password}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the script
main();
