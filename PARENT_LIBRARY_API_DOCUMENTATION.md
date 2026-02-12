# Parent Library API Documentation

## Overview
The Parent Library API allows parents to view their children's library resources and available books from their children's respective school branches. This API provides read-only access to library information, enabling parents to stay informed about their children's library activities.

**Recent Updates (January 2026):**
- ✅ Fixed attachment data not being returned in API responses
- ✅ Branch admin can now add books with attachments that are properly displayed to parents
- ✅ Attachments include file URLs, metadata, and download links
- ✅ Added convenience fields `hasAttachments` and `attachmentCount` for easier frontend handling
- ✅ Enhanced data processing to ensure attachments are always included in responses

---

## API Endpoint

### Get Child's Library Information
**Endpoint:** `GET /api/parent/:childId/library`

**Description:** Retrieves available books and library information for a specific child, showing books available in the child's branch that match their class level.

---

## Request Details

### URL Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `childId` | String (MongoDB ObjectId) | Yes | The unique identifier of the child/student |

### Headers
| Header | Value | Required | Description |
|--------|-------|----------|-------------|
| `Authorization` | `Bearer {token}` | Yes | JWT authentication token for the parent user |
| `Content-Type` | `application/json` | Yes | Request content type |

### Query Parameters
None required

### Request Body
No request body needed

### Example Request
```bash
curl -X GET http://localhost:3000/api/parent/507f1f77bcf86cd799439011/library \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

---

## Response Details

### Success Response (200 OK)

**Response Format:**
```json
{
  "success": true,
  "data": {
    "availableBooks": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "title": "Introduction to Physics",
        "author": "Stephen Hawking",
        "category": "Science",
        "isbn": "978-0553380163",
        "description": "A comprehensive guide to physics for students",
        "availableCopies": 5,
        "totalCopies": 10,
        "shelfLocation": "SCI-001",
        "classId": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Class 10A",
          "grade": 10,
          "level": "Senior Secondary",
          "stream": "Science"
        },
        "attachments": [
          {
            "url": "https://res.cloudinary.com/example/image/upload/v1705123456/books/physics_guide.pdf",
            "publicId": "books/physics_guide.pdf",
            "filename": "physics_guide.pdf",
            "fileType": "pdf",
            "mimeType": "application/pdf",
            "size": 2048576,
            "uploadedAt": "2024-01-13T10:30:56.789Z",
            "uploadedBy": "507f1f77bcf86cd799439015"
          }
        ],
        "hasAttachments": true,
        "attachmentCount": 1
      },
      {
        "_id": "507f1f77bcf86cd799439014",
        "title": "General Knowledge",
        "author": "Various Authors",
        "category": "Reference",
        "isbn": "978-8189940126",
        "description": "General knowledge reference book for all students",
        "availableCopies": 8,
        "totalCopies": 15,
        "shelfLocation": "REF-002",
        "classId": null
      }
    ],
    "borrowedBooks": [],
    "totalAvailable": 2,
    "childInfo": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Ahmed Hassan",
      "class": "Class 10A",
      "branch": "507f1f77bcf86cd799439010"
    }
  },
  "message": "Library data retrieved successfully"
}
```

### Success Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | Boolean | Indicates successful API request |
| `data` | Object | Main response data containing library information |
| `data.availableBooks` | Array | List of available books for the child |
| `data.availableBooks[].title` | String | Name of the book |
| `data.availableBooks[].author` | String | Author name |
| `data.availableBooks[].category` | String | Book category (Science, Mathematics, Reference, etc.) |
| `data.availableBooks[].isbn` | String | International Standard Book Number |
| `data.availableBooks[].description` | String | Book description |
| `data.availableBooks[].availableCopies` | Number | Number of copies currently available for borrowing |
| `data.availableBooks[].totalCopies` | Number | Total number of copies in the library |
| `data.availableBooks[].shelfLocation` | String | Physical location on the shelf |
| `data.availableBooks[].classId` | Object/Null | Class information if book is class-specific, null if available to all classes |
| `data.availableBooks[].attachments` | Array | Array of attachment objects containing file URLs and metadata |
| `data.availableBooks[].hasAttachments` | Boolean | Convenience field indicating whether the book has any attachments |
| `data.availableBooks[].attachmentCount` | Number | Convenience field showing the total number of attachments for the book |
| `data.borrowedBooks` | Array | Books currently borrowed by the child (placeholder for future implementation) |
| `data.totalAvailable` | Number | Total count of available books |
| `data.childInfo.id` | String | Child's unique identifier |
| `data.childInfo.name` | String | Child's full name |
| `data.childInfo.class` | String | Child's current class |
| `data.childInfo.branch` | String | Branch ID where the child studies |
| `message` | String | Success message |

---

## Error Responses

### 403 Forbidden - Access Denied
**Condition:** Parent does not own the specified child or authentication fails

```json
{
  "success": false,
  "message": "Access denied"
}
```

### 404 Not Found - Child Not Found
**Condition:** Child ID does not exist or child is not a student

```json
{
  "success": false,
  "message": "Child not found or not a student"
}
```

### 401 Unauthorized - Missing or Invalid Token
**Condition:** Authorization header is missing or token is invalid/expired

```json
{
  "success": false,
  "message": "Unauthorized"
}
```

### 500 Internal Server Error
**Condition:** Server error during processing

```json
{
  "success": false,
  "message": "Failed to fetch library data"
}
```

---

## Data Filtering Logic

The API applies the following filtering to retrieve books:

1. **Branch Match:** Books must belong to the same branch as the child
2. **Availability:** Only books with `availableCopies > 0` and status `'available'` are returned
3. **Class Match:** Books are included if:
   - They are general books (no `classId` specified) - available to all classes
   - OR they are specific to the child's current class

### Query Example:
```javascript
const availableBooks = await Library.find({
  branchId: child.branchId,
  availableCopies: { $gt: 0 },
  status: 'available',
  $or: [
    { classId: null }, // General books
    { classId: child.studentProfile?.classId } // Class-specific books
  ]
})
```

---

## Authentication & Authorization

### Authentication Flow
1. Parent must be logged in with valid JWT token
2. Token is passed in `Authorization` header as `Bearer {token}`
3. Token is validated by `withAuth` middleware

### Authorization Checks
- **Parent Ownership:** System verifies that the requesting parent owns the specified child
- **Child Validation:** Ensures the child is an active student
- **Role-based Access:** Only users with parent role can access this endpoint

### Token Generation
Parents receive JWT tokens upon login. Token should include:
- Parent user ID
- Parent role
- Issue time and expiration

---

## Code Implementation Details

### Middleware Used
- **withAuth:** Validates JWT token and user authentication
- **connectDB:** Establishes MongoDB database connection

### Database Queries
1. **Parent Verification:** Checks if parent's `parentProfile.children` includes the childId
2. **Child Retrieval:** Fetches child document to get branch and class information
3. **Books Query:** Retrieves books matching the criteria (branch, availability, class)

### Performance Considerations
- `.lean()` is used for read-only queries to improve performance
- `.select()` limits returned fields to necessary ones
- `.sort()` ensures consistent ordering by title
- Single database connection used for all queries

---

## Usage Examples

### Example 1: Basic Request with cURL
```bash
curl -X GET http://localhost:3000/api/parent/507f1f77bcf86cd799439011/library \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTAiLCJyb2xlIjoicGFyZW50IiwiaWF0IjoxNzA1MDI3ODAwfQ.abcd1234" \
  -H "Content-Type: application/json"
```

### Example 2: JavaScript/Node.js
```javascript
async function getChildLibrary(childId, authToken) {
  try {
    const response = await fetch(`/api/parent/${childId}/library`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error:', error.message);
      return null;
    }

    const data = await response.json();
    return data.data; // Returns libraryData object
  } catch (error) {
    console.error('Request failed:', error);
    return null;
  }
}

// Usage
const libraryData = await getChildLibrary('507f1f77bcf86cd799439011', token);
console.log('Available Books:', libraryData.availableBooks);
```

### Example 3: React/Frontend
```jsx
import { useEffect, useState } from 'react';

function ChildLibrary({ childId, authToken }) {
  const [library, setLibrary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLibrary = async () => {
      try {
        const response = await fetch(`/api/parent/${childId}/library`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) throw new Error('Failed to fetch');
        
        const data = await response.json();
        setLibrary(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLibrary();
  }, [childId, authToken]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>{library.childInfo.name}'s Library</h2>
      <p>Class: {library.childInfo.class}</p>
      <h3>Available Books ({library.totalAvailable})</h3>
      <ul>
        {library.availableBooks.map(book => (
          <li key={book._id}>
            <strong>{book.title}</strong> by {book.author}
            <br />
            Available Copies: {book.availableCopies}/{book.totalCopies}
            <br />
            Location: {book.shelfLocation}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Rate Limiting & Throttling
Currently, no explicit rate limiting is implemented. For production environments, consider:
- Implementing rate limiting middleware (e.g., express-rate-limit)
- Limiting requests per parent to 100/hour
- Adding caching for frequently accessed data

---

## Common Issues & Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| 403 Forbidden | Parent doesn't own this child | Verify the parent-child relationship in the database |
| 404 Not Found | Invalid childId | Check that childId is a valid MongoDB ObjectId |
| Empty availableBooks array | No books available in branch | Check if books exist and have `availableCopies > 0` |
| 401 Unauthorized | Invalid/expired token | Re-authenticate parent to get new token |
| Database connection error | MongoDB not running | Ensure MongoDB service is running |

---

## Future Enhancements

- [ ] Add borrowing history tracking (populate `borrowedBooks` field)
- [ ] Implement book reservation system
- [ ] Add search/filter functionality for books
- [ ] Pagination for large book lists
- [ ] Due date tracking for borrowed books
- [ ] Send notifications when borrowed books are due
- [ ] Add book rating and review system
- [ ] Export library reports

---

## API Testing

### Using Postman
1. Create a new GET request
2. URL: `http://localhost:3000/api/parent/[childId]/library`
3. Go to Headers tab and add:
   - Key: `Authorization`
   - Value: `Bearer {token}`
4. Click Send

### Using the Test File
The project includes a test file that demonstrates library API usage:
```bash
node test-library-flow.js
```

---

## Related Documentation
- [Parent Routes Overview](./PARENT_ROUTES_README.md)
- [Library Management System](./library.md)
- [API Client Guide](./API_CLIENT_GUIDE.md)
- [Complete Parent API Documentation](./PARENT_ROUTES_README.md)

---

## Support & Questions
For issues or questions regarding the Parent Library API:
1. Check the troubleshooting section above
2. Review related documentation files
3. Check the database for data consistency
4. Review logs in the server console for detailed error messages

---

**Last Updated:** January 12, 2026
**API Version:** 1.0
**Status:** Production Ready ✅
