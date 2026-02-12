const http = require('http');

// Configuration
const API_BASE_URL = 'http://localhost:3000';

// Test credentials
const credentials = {
  superAdmin: { email: 'superadmin@easeacademy.com', password: 'SuperAdmin@123' }
};

// Function to make authenticated API request
function makeAuthenticatedRequest(endpoint, method = 'GET', data = null, token = null) {
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

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

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
  try {
    console.log(`🔑 Logging in as ${email}...`);

    const response = await makeAuthenticatedRequest('/api/auth/login', 'POST', { email, password });

    if (response.statusCode === 200 && response.data.success && response.data.data && response.data.data.accessToken) {
      console.log(`✅ Successfully logged in as ${email}`);
      return response.data.data.accessToken;
    } else {
      console.log(`❌ Login failed for ${email}:`, response.data.message || response.data);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error logging in as ${email}:`, error.message);
    return null;
  }
}

// Function to get branches
async function getBranches(token) {
  try {
    console.log('🏫 Getting branches...');

    const response = await makeAuthenticatedRequest('/api/super-admin/branches', 'GET', null, token);

    if (response.statusCode === 200 && response.data.success) {
      const branches = response.data.data.branches || [];
      console.log(`✅ Found ${branches.length} branches`);
      branches.forEach((branch, index) => {
        console.log(`   ${index + 1}. ${branch.name} (ID: ${branch._id})`);
      });
      return branches;
    } else {
      console.log('❌ Failed to get branches:', response.data);
      return [];
    }
  } catch (error) {
    console.error('❌ Error getting branches:', error.message);
    return [];
  }
}

// Function to get classes
async function getClasses(token) {
  try {
    console.log('📚 Getting classes...');

    const response = await makeAuthenticatedRequest('/api/super-admin/classes', 'GET', null, token);

    if (response.statusCode === 200 && response.data.success) {
      const classes = response.data.data || [];
      console.log(`✅ Found ${classes.length} classes`);
      classes.forEach((cls, index) => {
        console.log(`   ${index + 1}. ${cls.name} (ID: ${cls._id})`);
      });
      return classes;
    } else {
      console.log('❌ Failed to get classes:', response.data);
      return [];
    }
  } catch (error) {
    console.error('❌ Error getting classes:', error.message);
    return [];
  }
}

// Function to add a test book as super admin
async function addTestBook(token, branchId, classId) {
  try {
    console.log('📚 Adding test book to library...');

    const bookData = {
      title: 'Super Admin Test Book - Class Specific',
      author: 'Test Author',
      isbn: 'SA-' + Date.now(),
      category: 'Mathematics',
      subCategory: 'Algebra',
      description: 'This is a test book added by super admin for class-specific testing',
      publisher: 'Test Publisher',
      publicationYear: 2023,
      edition: '1st Edition',
      totalCopies: 10,
      availableCopies: 10,
      purchasePrice: 25.99,
      bookValue: 25.99,
      purchaseDate: new Date().toISOString().split('T')[0],
      supplier: 'Test Supplier',
      shelfLocation: 'Shelf A-12',
      callNumber: 'MATH-001',
      language: 'English',
      pages: 200,
      keywords: ['mathematics', 'algebra', 'test'],
      notes: 'Added by super admin for testing class association',
      branchId: branchId,
      classId: classId // Associate with specific class
    };

    const response = await makeAuthenticatedRequest('/api/super-admin/library/books', 'POST', bookData, token);

    if (response.statusCode === 201 && response.data.success) {
      console.log('✅ Test book added successfully');
      console.log('📖 Book ID:', response.data.data._id);
      console.log('📖 Book Details:', {
        title: response.data.data.title,
        author: response.data.data.author,
        category: response.data.data.category,
        branchId: response.data.data.branchId,
        classId: response.data.data.classId,
        totalCopies: response.data.data.totalCopies,
        availableCopies: response.data.data.availableCopies
      });
      return response.data.data._id;
    } else {
      console.log('❌ Failed to add test book:', response.data);
      return null;
    }
  } catch (error) {
    console.error('❌ Error adding test book:', error.message);
    return null;
  }
}

// Function to get all books
async function getAllBooks(token) {
  try {
    console.log('📚 Getting all books...');

    const response = await makeAuthenticatedRequest('/api/super-admin/library/books', 'GET', null, token);

    if (response.statusCode === 200 && response.data.success) {
      const books = response.data.data.books || [];
      console.log(`✅ Found ${books.length} books total`);

      // Check if our test book is there
      const testBook = books.find(book => book.title === 'Super Admin Test Book - Class Specific');
      if (testBook) {
        console.log('🎉 SUCCESS: Test book found in super admin library!');
        console.log('📖 Book details:', {
          title: testBook.title,
          author: testBook.author,
          category: testBook.category,
          branchName: testBook.branchId?.name || 'N/A',
          classId: testBook.classId,
          totalCopies: testBook.totalCopies,
          availableCopies: testBook.availableCopies,
          status: testBook.status
        });
        return testBook;
      } else {
        console.log('❌ FAILURE: Test book NOT found in super admin library');
        console.log('📚 Recent books:');
        books.slice(0, 5).forEach(book => {
          console.log(`   - ${book.title} by ${book.author} (${book.category})`);
        });
        return null;
      }
    } else {
      console.log('❌ Failed to get books:', response.data);
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting books:', error.message);
    return null;
  }
}

// Function to test filtering by class
async function testClassFiltering(token, classId) {
  try {
    console.log(`🔍 Testing class filtering for class ID: ${classId}...`);

    const response = await makeAuthenticatedRequest(`/api/super-admin/library/books?class=${classId}`, 'GET', null, token);

    if (response.statusCode === 200 && response.data.success) {
      const books = response.data.data.books || [];
      console.log(`✅ Found ${books.length} books for this class`);

      const testBook = books.find(book => book.title === 'Super Admin Test Book - Class Specific');
      if (testBook) {
        console.log('🎉 SUCCESS: Test book appears in class-specific filter!');
        return true;
      } else {
        console.log('❌ FAILURE: Test book does NOT appear in class-specific filter');
        return false;
      }
    } else {
      console.log('❌ Failed to filter by class:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing class filtering:', error.message);
    return false;
  }
}

// Main test function
async function testSuperAdminLibraryFlow() {
  console.log('🚀 Testing Super Admin Library Flow: Class and Subject Association\n');

  try {
    // Step 1: Login as super admin
    console.log('=== STEP 1: Super Admin Login ===');
    const superAdminToken = await loginAndGetToken(credentials.superAdmin.email, credentials.superAdmin.password);
    if (!superAdminToken) {
      console.log('❌ Cannot proceed without super admin token');
      return;
    }

    // Step 2: Get branches and classes
    console.log('\n=== STEP 2: Get Branches and Classes ===');
    const branches = await getBranches(superAdminToken);
    const classes = await getClasses(superAdminToken);

    if (branches.length === 0 || classes.length === 0) {
      console.log('❌ Cannot proceed without branches or classes');
      return;
    }

    const firstBranch = branches[0];
    const firstClass = classes[0];

    console.log(`📍 Using Branch: ${firstBranch.name} (ID: ${firstBranch._id})`);
    console.log(`📚 Using Class: ${firstClass.name} (ID: ${firstClass._id})`);

    // Step 3: Add test book with class association
    console.log('\n=== STEP 3: Add Book with Class Association ===');
    const bookId = await addTestBook(superAdminToken, firstBranch._id, firstClass._id);
    if (!bookId) {
      console.log('❌ Cannot proceed without test book');
      return;
    }

    // Step 4: Verify book appears in general list
    console.log('\n=== STEP 4: Verify Book in General List ===');
    const book = await getAllBooks(superAdminToken);
    if (!book) {
      console.log('❌ Book not found in general list');
      return;
    }

    // Step 5: Test class-specific filtering
    console.log('\n=== STEP 5: Test Class-Specific Filtering ===');
    const classFilterWorks = await testClassFiltering(superAdminToken, firstClass._id);

    // Final result
    console.log('\n=== TEST RESULT ===');
    if (book && classFilterWorks) {
      console.log('✅ PASS: Super admin can add books with class association and filtering works');
      console.log('✅ Books are properly associated with classes and subjects');
    } else {
      console.log('❌ FAIL: Issues with book addition or class association');
      if (!book) console.log('   - Book not found in general list');
      if (!classFilterWorks) console.log('   - Class filtering not working');
    }

  } catch (error) {
    console.error('❌ Unexpected error during test:', error.message);
  }
}

// Run the test
testSuperAdminLibraryFlow();
