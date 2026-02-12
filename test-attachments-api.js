const http = require('http');

const API_BASE_URL = 'http://localhost:3000';
const credentials = {
  superAdmin: { email: 'superadmin@easeacademy.com', password: '123456' },
  branchAdmin: { email: 'hafizshoaib@gmail.com', password: '123456' },
  parent: { email: 'arshayn@example.com', password: '123456' }
};

async function makeRequest(endpoint, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, API_BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ statusCode: res.statusCode, data: response });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: body });
        }
      });
    });
    req.on('error', (err) => reject(err));
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function loginAndGetToken(email, password) {
  const response = await makeRequest('/api/auth/login', 'POST', { email, password });
  if (response.statusCode === 200 && response.data.success) {
    return response.data.data.accessToken;
  }
  return null;
}

async function testSuperAdminBooks(token) {
  console.log('\n=== Testing Super Admin Library Books API ===');
  const response = await makeRequest('/api/super-admin/library/books', 'GET', null, token);
  if (response.statusCode === 200 && response.data.success) {
    const books = response.data.data.books;
    console.log(`✅ Found ${books.length} books`);
    if (books.length > 0) {
      const firstBook = books[0];
      console.log(`📖 First book: ${firstBook.title}`);
      console.log(`   - hasAttachments: ${firstBook.hasAttachments}`);
      console.log(`   - attachmentCount: ${firstBook.attachmentCount}`);
      console.log(`   - attachments array: ${firstBook.attachments ? firstBook.attachments.length : 0} items`);
      if (firstBook.attachments && firstBook.attachments.length > 0) {
        console.log(`   - Sample attachment: ${firstBook.attachments[0].filename} (${firstBook.attachments[0].fileType})`);
      }
    }
    return true;
  } else {
    console.log('❌ Failed to fetch books:', response.data);
    return false;
  }
}

async function testBranchAdminBooks(token) {
  console.log('\n=== Testing Branch Admin Library Books API ===');
  const response = await makeRequest('/api/branch-admin/library/books', 'GET', null, token);
  if (response.statusCode === 200 && response.data.success) {
    const books = response.data.data.books;
    console.log(`✅ Found ${books.length} books`);
    if (books.length > 0) {
      const firstBook = books[0];
      console.log(`📖 First book: ${firstBook.title}`);
      console.log(`   - hasAttachments: ${firstBook.hasAttachments}`);
      console.log(`   - attachmentCount: ${firstBook.attachmentCount}`);
      console.log(`   - attachments array: ${firstBook.attachments ? firstBook.attachments.length : 0} items`);
      if (firstBook.attachments && firstBook.attachments.length > 0) {
        console.log(`   - Sample attachment: ${firstBook.attachments[0].filename} (${firstBook.attachments[0].fileType})`);
      }
    }
    return true;
  } else {
    console.log('❌ Failed to fetch books:', response.data);
    return false;
  }
}

async function testParentLibrary(token, childId) {
  console.log('\n=== Testing Parent Library API ===');
  const response = await makeRequest(`/api/parent/${childId}/library`, 'GET', null, token);
  if (response.statusCode === 200 && response.data.success) {
    const books = response.data.data.availableBooks;
    console.log(`✅ Found ${books.length} available books`);
    if (books.length > 0) {
      const firstBook = books[0];
      console.log(`📖 First book: ${firstBook.title}`);
      console.log(`   - hasAttachments: ${firstBook.hasAttachments}`);
      console.log(`   - attachmentCount: ${firstBook.attachmentCount}`);
      console.log(`   - attachments array: ${firstBook.attachments ? firstBook.attachments.length : 0} items`);
      if (firstBook.attachments && firstBook.attachments.length > 0) {
        console.log(`   - Sample attachment: ${firstBook.attachments[0].filename} (${firstBook.attachments[0].fileType})`);
      }
    }
    return true;
  } else {
    console.log('❌ Failed to fetch library:', response.data);
    return false;
  }
}

async function main() {
  try {
    // Test Super Admin API
    console.log('🔑 Testing Super Admin API...');
    const superAdminToken = await loginAndGetToken(credentials.superAdmin.email, credentials.superAdmin.password);
    if (superAdminToken) {
      await testSuperAdminBooks(superAdminToken);
    } else {
      console.log('❌ Super Admin login failed');
    }

    // Test Branch Admin API
    console.log('\n🔑 Testing Branch Admin API...');
    const branchAdminToken = await loginAndGetToken(credentials.branchAdmin.email, credentials.branchAdmin.password);
    if (branchAdminToken) {
      await testBranchAdminBooks(branchAdminToken);
    } else {
      console.log('❌ Branch Admin login failed');
    }

    // Test Parent API (skip if no children)
    console.log('\n🔑 Testing Parent API...');
    const parentToken = await loginAndGetToken(credentials.parent.email, credentials.parent.password);
    if (parentToken) {
      // Get parent profile to find children
      const profileResponse = await makeRequest('/api/auth/profile', 'GET', null, parentToken);
      if (profileResponse.statusCode === 200 && profileResponse.data.success) {
        const children = profileResponse.data.data.parentProfile?.children;
        if (children && children.length > 0) {
          const firstChildId = children[0].id;
          await testParentLibrary(parentToken, firstChildId);
        } else {
          console.log('⚠️ Parent has no children, skipping parent library test');
        }
      } else {
        console.log('❌ Failed to get parent profile');
      }
    } else {
      console.log('❌ Parent login failed');
    }

    console.log('\n🎉 API Testing Complete!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

main();
