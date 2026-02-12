# Fee Voucher & Fee Payment API Documentation

## Overview

This document provides comprehensive API documentation for the Fee Voucher and Fee Payment system in the Ease Academy management system. The system supports parent fee payments, branch admin approval workflows, and super admin oversight across all branches.

## Table of Contents

1. [Authentication](#authentication)
2. [Parent APIs](#parent-apis)
3. [Branch Admin APIs](#branch-admin-apis)
4. [Super Admin APIs](#super-admin-apis)
5. [Data Models](#data-models)
6. [Error Codes](#error-codes)
7. [Testing](#testing)

## Authentication

All API endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Login Endpoint

**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt_token_here",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "role": "parent|branch-admin|super-admin"
    }
  }
}
```

---

## Parent APIs

### Get Children

**GET** `/api/parent`

**Response:**
```json
{
  "success": true,
  "children": [
    {
      "id": "student_id",
      "name": "John Doe",
      "class": "Class 5A",
      "rollNumber": "001"
    }
  ]
}
```

### Get Fee Vouchers

**GET** `/api/parent/{childId}/fee-vouchers`

**Query Parameters:**
- `status` (optional): Filter by status (`pending`, `partial`, `paid`, `overdue`)
- `year` (optional): Filter by year
- `month` (optional): Filter by month

**Response:**
```json
{
  "success": true,
  "feeVouchers": [
    {
      "id": "voucher_id",
      "voucherNumber": "FV-2024-001",
      "template": {
        "name": "Monthly Tuition Fee"
      },
      "totalAmount": 5000,
      "paidAmount": 2000,
      "remainingAmount": 3000,
      "status": "partial",
      "dueDate": "2024-02-15T00:00:00.000Z",
      "issueDate": "2024-01-15T00:00:00.000Z"
    }
  ]
}
```

### Submit Fee Payment

**POST** `/api/parent/{childId}/fee-vouchers/{voucherId}/pay`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `amount` (required): Payment amount in PKR
- `paymentMethod` (required): `bank-transfer`, `cash`, `online`, `cheque`
- `transactionId` (required): Unique transaction identifier
- `remarks` (optional): Additional payment notes
- `screenshot` (required): Payment receipt image file

**Response:**
```json
{
  "success": true,
  "message": "Payment submitted successfully",
  "payment": {
    "id": "payment_id",
    "amount": 2000,
    "paymentMethod": "bank-transfer",
    "transactionId": "TXN-123456",
    "status": "pending",
    "submittedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## Branch Admin APIs

### Get Pending Fee Payments

**GET** `/api/branch-admin/pending-fees`

**Response:**
```json
{
  "success": true,
  "pendingFees": [
    {
      "id": "payment_id",
      "voucherId": "voucher_id",
      "voucherNumber": "FV-2024-001",
      "studentName": "John Doe",
      "className": "Class 5A",
      "amount": 2000,
      "currency": "PKR",
      "paymentMethod": "bank-transfer",
      "transactionId": "TXN-123456",
      "paymentDate": "2024-01-15T10:30:00.000Z",
      "screenshotUrl": "https://cloudinary.com/image.jpg",
      "remarks": "Payment notes",
      "submittedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Approve Payment

**POST** `/api/branch-admin/pending-fees/approve`

**Request Body:**
```json
{
  "voucherId": "voucher_id",
  "paymentIndex": 0,
  "remarks": "Payment approved"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment approved successfully",
  "voucher": {
    "id": "voucher_id",
    "status": "partial",
    "paidAmount": 4000,
    "remainingAmount": 1000
  }
}
```

### Reject Payment

**POST** `/api/branch-admin/pending-fees/reject`

**Request Body:**
```json
{
  "voucherId": "voucher_id",
  "paymentIndex": 0,
  "rejectionReason": "Invalid transaction ID"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment rejected successfully"
}
```

---

## Super Admin APIs

### Get All Fee Vouchers

**GET** `/api/super-admin/fee-vouchers`

**Query Parameters:**
- `status` (optional): Filter by status
- `branchId` (optional): Filter by branch
- `limit` (optional): Limit results (default: 50)
- `skip` (optional): Skip results for pagination

**Response:**
```json
{
  "success": true,
  "vouchers": [
    {
      "id": "voucher_id",
      "voucherNumber": "FV-2024-001",
      "studentId": {
        "fullName": "John Doe"
      },
      "branchId": {
        "name": "Main Branch"
      },
      "totalAmount": 5000,
      "paidAmount": 2000,
      "remainingAmount": 3000,
      "status": "partial",
      "paymentHistory": [
        {
          "amount": 2000,
          "status": "approved",
          "paymentMethod": "bank-transfer",
          "transactionId": "TXN-123456",
          "paymentDate": "2024-01-15T10:30:00.000Z"
        }
      ]
    }
  ],
  "total": 150
}
```

### Approve Payment (Super Admin)

**POST** `/api/super-admin/fee-vouchers/{voucherId}/approve-payment`

**Request Body:**
```json
{
  "paymentId": "payment_id",
  "action": "approve",
  "remarks": "Approved by super admin"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment approved successfully",
  "voucher": {
    "id": "voucher_id",
    "status": "paid",
    "paidAmount": 5000,
    "remainingAmount": 0
  }
}
```

### Reject Payment (Super Admin)

**POST** `/api/super-admin/fee-vouchers/{voucherId}/approve-payment`

**Request Body:**
```json
{
  "paymentId": "payment_id",
  "action": "reject",
  "remarks": "Invalid payment proof"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment rejected successfully"
}
```

### Get Branches

**GET** `/api/super-admin/branches`

**Response:**
```json
{
  "success": true,
  "branches": [
    {
      "id": "branch_id",
      "name": "Main Branch",
      "location": "City Center",
      "status": "active"
    }
  ]
}
```

---

## Data Models

### Fee Voucher Model

```javascript
{
  voucherNumber: String, // Unique voucher number
  studentId: ObjectId,   // Reference to Student
  branchId: ObjectId,    // Reference to Branch
  templateId: ObjectId,  // Reference to FeeTemplate
  classId: ObjectId,     // Reference to Class

  // Amounts
  amount: Number,        // Base amount
  lateFeeAmount: Number, // Late fee charges
  discountAmount: Number,// Discounts applied
  totalAmount: Number,   // Final amount to pay
  paidAmount: Number,    // Amount already paid
  remainingAmount: Number,// Amount still due

  // Status & Dates
  status: String,        // 'pending', 'partial', 'paid', 'overdue', 'cancelled'
  issueDate: Date,       // When voucher was issued
  dueDate: Date,         // Payment deadline
  month: Number,         // Month (1-12)
  year: Number,          // Year

  // Payment History
  paymentHistory: [{
    amount: Number,
    paymentDate: Date,
    paymentMethod: String, // 'cash', 'bank-transfer', 'online', 'cheque'
    transactionId: String,
    status: String,       // 'pending', 'approved', 'rejected'
    remarks: String,
    submittedBy: ObjectId,
    approvedBy: ObjectId,
    approvedAt: Date,
    rejectionReason: String,
    screenshot: {
      url: String,
      publicId: String
    }
  }],

  // Metadata
  remarks: String,
  createdBy: ObjectId,
  updatedBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Payment Status Flow

```
Parent submits payment
    ↓
Payment status: 'pending'
    ↓
Branch Admin reviews
    ↓
Approved → status: 'approved'
Rejected → status: 'rejected'
    ↓
Voucher amounts updated accordingly
```

---

## Error Codes

### Common HTTP Status Codes

- **200**: Success
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (invalid/missing token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **500**: Internal Server Error

### Specific Error Responses

```json
{
  "success": false,
  "message": "Detailed error message",
  "errors": [
    {
      "field": "amount",
      "message": "Amount must be greater than 0"
    }
  ]
}
```

### Common Error Messages

- `"Payment amount exceeds remaining balance"`
- `"Invalid payment method"`
- `"Transaction ID already exists"`
- `"Payment screenshot is required"`
- `"Payment not found"`
- `"Payment already processed"`

---

## Testing

### Test Scripts

#### Complete Payment Flow Test
```bash
node test-complete-parent-payment-flow.js
```

#### Super Admin Pending Fees Test
```bash
# Create test data
node test-super-admin-pending-fees.js --create

# Test approval functionality
node test-super-admin-pending-fees.js --test
```

#### Check Paid Fees
```bash
node check-paid-fees.js
```

### Postman Collection

Import the following collection for testing:

```json
{
  "info": {
    "name": "Ease Academy Fee Payment APIs",
    "description": "Complete API collection for fee voucher and payment management"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000"
    },
    {
      "key": "auth_token",
      "value": ""
    }
  ]
}
```

### Sample Test Scenarios

#### 1. Parent Payment Submission
```javascript
// 1. Login as parent
POST /api/auth/login
{
  "email": "parent@example.com",
  "password": "password123"
}

// 2. Get children
GET /api/parent

// 3. Get fee vouchers
GET /api/parent/{childId}/fee-vouchers

// 4. Submit payment (multipart/form-data)
POST /api/parent/{childId}/fee-vouchers/{voucherId}/pay
```

#### 2. Branch Admin Approval
```javascript
// 1. Login as branch admin
POST /api/auth/login
{
  "email": "branch@example.com",
  "password": "password123"
}

// 2. Get pending payments
GET /api/branch-admin/pending-fees

// 3. Approve payment
POST /api/branch-admin/pending-fees/approve
{
  "voucherId": "voucher_id",
  "paymentIndex": 0
}
```

#### 3. Super Admin Oversight
```javascript
// 1. Login as super admin
POST /api/auth/login
{
  "email": "superadmin@easeacademy.com",
  "password": "password123"
}

// 2. Get all vouchers
GET /api/super-admin/fee-vouchers?status=pending

// 3. Approve payment across branches
POST /api/super-admin/fee-vouchers/{voucherId}/approve-payment
{
  "paymentId": "payment_id",
  "action": "approve"
}
```

---

## Security Considerations

1. **Authentication**: All endpoints require valid JWT tokens
2. **Authorization**: Role-based access control (parent, branch-admin, super-admin)
3. **Input Validation**: All inputs are validated and sanitized
4. **File Upload**: Payment screenshots are securely stored on Cloudinary
5. **Rate Limiting**: API endpoints should implement rate limiting
6. **Audit Trail**: All payment actions are logged with user information

## Performance Optimization

1. **Database Indexing**: Proper indexes on frequently queried fields
2. **Pagination**: Large result sets are paginated
3. **Caching**: Consider caching for frequently accessed data
4. **File Storage**: Cloudinary for efficient image storage and delivery

---

## Support

For API support or questions:
- Check the error messages for detailed information
- Review the test scripts for usage examples
- Contact the development team for technical assistance

---

*Last Updated: January 2024*
*API Version: v1.0*
