# API Client Usage Guide

## Overview
The API client provides a comprehensive set of tools for making HTTP requests with automatic token management, error handling, and loading states.

## Installation
Axios is already installed. The API client is available at `@/lib/api-client`.

## Basic Usage

### Import the API Client
```javascript
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
```

### Making Requests

#### GET Request
```javascript
// Simple GET
const users = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.USERS.LIST);

// GET with query parameters
const students = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.STUDENTS.LIST, {
  page: 1,
  limit: 10,
  search: 'John',
});
```

#### POST Request
```javascript
// Login example
const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
  email: 'admin@easeacademy.com',
  password: 'password123',
});

// Access token is automatically stored
console.log(response.data);
```

#### PUT Request
```javascript
// Update user
const updated = await apiClient.put(
  buildUrl(API_ENDPOINTS.SUPER_ADMIN.USERS.UPDATE, { id: '123' }),
  {
    name: 'John Doe',
    email: 'john@example.com',
  }
);
```

#### DELETE Request
```javascript
const result = await apiClient.delete(
  buildUrl(API_ENDPOINTS.SUPER_ADMIN.USERS.DELETE, { id: '123' })
);
```

## Token Management

### Set Access Token
```javascript
import { setAccessToken } from '@/lib/api-client';

// After login
setAccessToken(response.data.token);
```

### Get Access Token
```javascript
import { getAccessToken } from '@/lib/api-client';

const token = getAccessToken();
```

### Clear Access Token (Logout)
```javascript
import { clearAccessToken } from '@/lib/api-client';

clearAccessToken();
```

## File Uploads

### Single File Upload
```javascript
const file = event.target.files[0];

const response = await apiClient.upload(
  API_ENDPOINTS.COMMON.UPLOAD.IMAGE,
  file,
  (progress) => {
    console.log(`Upload progress: ${progress}%`);
  }
);
```

### Multiple Files Upload
```javascript
const files = Array.from(event.target.files);

const response = await apiClient.uploadMultiple(
  API_ENDPOINTS.COMMON.UPLOAD.BULK,
  files,
  (progress) => {
    console.log(`Upload progress: ${progress}%`);
  }
);
```

### File Download
```javascript
await apiClient.download(
  API_ENDPOINTS.BRANCH_ADMIN.STUDENTS.EXPORT,
  'students.xlsx'
);
```

## Using Custom Hooks

### useApi Hook
```javascript
'use client';

import { useApi } from '@/hooks/useApi';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

function StudentsList() {
  const { data, loading, error, refetch } = useApi(
    API_ENDPOINTS.BRANCH_ADMIN.STUDENTS.LIST,
    { immediate: true }
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {data?.map((student) => (
        <div key={student.id}>{student.name}</div>
      ))}
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

### useFormSubmit Hook
```javascript
'use client';

import { useFormSubmit } from '@/hooks/useApi';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

function CreateStudentForm() {
  const { submit, submitting, error, success } = useFormSubmit(
    API_ENDPOINTS.BRANCH_ADMIN.STUDENTS.CREATE,
    {
      onSuccess: (data) => {
        console.log('Student created:', data);
      },
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    await submit({
      name: formData.get('name'),
      email: formData.get('email'),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" required />
      <input name="email" type="email" required />
      <button disabled={submitting}>
        {submitting ? 'Creating...' : 'Create Student'}
      </button>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">Student created successfully!</p>}
    </form>
  );
}
```

### useFileUpload Hook
```javascript
'use client';

import { useFileUpload } from '@/hooks/useApi';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

function FileUploadForm() {
  const { upload, uploading, progress, error } = useFileUpload(
    API_ENDPOINTS.COMMON.UPLOAD.IMAGE
  );

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const response = await upload(file);
        console.log('Upload successful:', response);
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} disabled={uploading} />
      {uploading && <div>Upload progress: {progress}%</div>}
      {error && <div className="error">{error}</div>}
    </div>
  );
}
```

### usePagination Hook
```javascript
'use client';

import { usePagination } from '@/hooks/useApi';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

function PaginatedStudentsList() {
  const {
    data,
    loading,
    page,
    totalPages,
    nextPage,
    prevPage,
    goToPage,
  } = usePagination(API_ENDPOINTS.BRANCH_ADMIN.STUDENTS.LIST, {
    pageSize: 10,
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {data.map((student) => (
        <div key={student.id}>{student.name}</div>
      ))}
      
      <div className="pagination">
        <button onClick={prevPage} disabled={page === 1}>
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button onClick={nextPage} disabled={page === totalPages}>
          Next
        </button>
      </div>
    </div>
  );
}
```

## Error Handling

The API client automatically handles common errors:
- **401 Unauthorized**: Attempts token refresh, redirects to login if failed
- **Network Errors**: Returns friendly error message
- **Other Errors**: Returns error message from server

```javascript
try {
  const data = await apiClient.get('/some-endpoint');
} catch (error) {
  console.error('Error:', error.message);
  console.error('Status:', error.status);
  console.error('Validation errors:', error.errors);
}
```

## Building URLs with Parameters

```javascript
import { buildUrl } from '@/constants/api-endpoints';

// Replace path parameters
const url = buildUrl(API_ENDPOINTS.BRANCH_ADMIN.STUDENTS.GET, { id: '123' });
// Result: '/branch-admin/students/123'
```

## Authentication Flow Example

```javascript
'use client';

import { useState } from 'react';
import apiClient, { setAccessToken, clearAccessToken } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

function LoginForm() {
  const [credentials, setCredentials] = useState({ email: '', password: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials
      );
      
      // Save token
      setAccessToken(response.data.token);
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Login failed:', error.message);
    }
  };

  const handleLogout = () => {
    clearAccessToken();
    window.location.href = '/login';
  };

  return (
    <form onSubmit={handleLogin}>
      {/* Form fields */}
    </form>
  );
}
```

## Best Practices

1. **Always use constants for endpoints** - Import from `@/constants/api-endpoints`
2. **Handle errors gracefully** - Use try-catch or error states
3. **Show loading states** - Improve user experience
4. **Use custom hooks** - Simplify component logic
5. **Implement retry logic** - For failed requests (built-in)
6. **Cache responses** - Use React Query or SWR for advanced caching

## Advanced Features

### Retry Configuration
The client automatically retries failed requests up to 3 times with 1-second delay.

### Timeout
Default timeout is 30 seconds (configurable in `API_CONFIG`).

### Request Interceptors
Authentication token is automatically added to all requests.

### Response Interceptors
- Automatic token refresh on 401 errors
- Consistent error format
- Data extraction from response

---

For more information, check the API client source code at `src/lib/api-client.js`.
