const http = require('http');

const API_BASE_URL = 'http://localhost:3000';
const credentials = { email: 'hafizshoaib@gmail.com', password: '123456' };

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

async function checkBooksWithAttachments(token) {
  const response = await makeRequest('/api/branch-admin/library/books', 'GET', null, token);
  if (response.statusCode === 200 && response.data.success) {
    const books = response.data.data.books;
    console.log('Books in branch admin API:');
    books.forEach((book, index) => {
      console.log(`${index + 1}. ${book.title} - Attachments: ${book.attachments ? book.attachments.length : 0}`);
      if (book.attachments && book.attachments.length > 0) {
        book.attachments.forEach((att, i) => {
          console.log(`   Attachment ${i + 1}: ${att.filename} (${att.fileType})`);
        });
      }
    });
  } else {
    console.log('Failed to fetch books:', response.data);
  }
}

async function main() {
  const token = await loginAndGetToken(credentials.email, credentials.password);
  if (token) {
    await checkBooksWithAttachments(token);
  } else {
    console.log('Login failed');
  }
}

main();
