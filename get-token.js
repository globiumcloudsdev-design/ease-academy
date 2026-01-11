const https = require('https');

// Test credentials from login page
const testCredentials = [
  { email: 'superadmin@easeacademy.com', password: 'SuperAdmin@123', role: 'Super Admin' },
];

const API_BASE_URL = 'https://ease-academy.vercel.app/';

// Function to login and get token
function loginAndGetToken(email, password) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ email, password });

    const options = {
      hostname: 'ease-academy.vercel.app',
      port: 443,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
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

    req.write(data);
    req.end();
  });
}

// Try to get token with different accounts
async function getValidToken() {
  for (const cred of testCredentials) {
    try {
      console.log(`🔑 Trying to login as ${cred.role}: ${cred.email}`);

      const response = await loginAndGetToken(cred.email, cred.password);

      if (response.statusCode === 200 && response.data.success && response.data.data && response.data.data.accessToken) {
        console.log(`✅ Successfully logged in as ${cred.role}`);
        console.log(`🔑 Token: ${response.data.data.accessToken}`);
        return response.data.data.accessToken;
      } else {
        console.log(`❌ Login failed for ${cred.role}:`, response.data.message || response.data);
      }
    } catch (error) {
      console.error(`❌ Error logging in as ${cred.role}:`, error.message);
    }
  }

  console.log('❌ Could not get a valid token with any test account');
  return null;
}

// Run the token retrieval
getValidToken().then(token => {
  if (token) {
    console.log('\n📋 Use this token in your API requests:');
    console.log(token);
    console.log('\n💡 You can now run: AUTH_TOKEN="' + token + '" node check-paid-fees.js');
  }
});
