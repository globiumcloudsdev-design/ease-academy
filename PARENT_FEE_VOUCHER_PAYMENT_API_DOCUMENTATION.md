# Parent Fee Voucher Payment API Documentation

## Overview
This API endpoint allows authenticated parents to submit payment for their child's fee voucher. The payment is submitted with a screenshot proof and requires admin approval before being marked as paid.

## Endpoint
```
POST /api/parent/[childId]/fee-vouchers/[id]/pay
```

## Authentication
- **Required**: Bearer token in Authorization header
- **User Role**: Parent
- **Middleware**: `withAuth` (validates parent authentication and ownership of the child)

## URL Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `childId` | String | Yes | The ID of the child/student |
| `id` | String | Yes | The ID of the fee voucher |

## Request Body (FormData)
The request must be sent as `multipart/form-data` with the following fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | Number | Yes | Payment amount (must be > 0 and ≤ remaining voucher amount) |
| `paymentMethod` | String | Yes | Payment method (e.g., "bank_transfer", "cash", "online") |
| `transactionId` | String | No | Transaction ID (auto-generated if not provided) |
| `remarks` | String | No | Additional remarks/notes |
| `screenshot` | File | Yes | Payment proof screenshot (image file) |

## Validation Rules
1. **Parent Ownership**: Parent must own the specified child
2. **Voucher Existence**: Fee voucher must exist
3. **Voucher Ownership**: Voucher must belong to the specified child
4. **Payment Status**: Voucher must not already be fully paid
5. **Amount Limits**: Payment amount cannot exceed remaining voucher amount
6. **Required Fields**: Amount, payment method, and screenshot are mandatory

## Response

### Success Response (200)
```json
{
  "success": true,
  "message": "Payment submitted for approval",
  "payment": {
    "amount": 5000,
    "paymentDate": "2024-01-15T10:30:00.000Z",
    "paymentMethod": "bank_transfer",
    "transactionId": "TXN-1705312200000",
    "status": "pending"
  }
}
```

### Error Responses

#### 403 Forbidden - Access Denied
```json
{
  "success": false,
  "message": "Access denied"
}
```

#### 404 Not Found - Voucher Not Found
```json
{
  "success": false,
  "message": "Fee voucher not found"
}
```

#### 400 Bad Request - Various Validation Errors
```json
{
  "success": false,
  "message": "Valid amount is required"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to submit payment"
}
```

## Process Flow
1. **Authentication Check**: Verify parent token and child ownership
2. **Voucher Validation**: Check voucher exists and belongs to child
3. **Status Check**: Ensure voucher is not already paid
4. **Branch Admin Check**: Verify branch has an admin for approval
5. **Input Validation**: Validate amount, payment method, and screenshot
6. **Screenshot Upload**: Upload payment proof to Cloudinary
7. **Payment Record**: Add payment to voucher history with 'pending' status
8. **Response**: Return success with payment details

## Implementation Notes
- **File Upload**: Screenshot is uploaded to Cloudinary in folder `ease-academy/students/{childId}/fee-payments/{voucherId}`
- **Payment Status**: All payments start with 'pending' status and require admin approval
- **Transaction ID**: Auto-generated if not provided using format `TXN-{timestamp}`
- **Database**: Uses MongoDB with Mongoose models (User, FeeVoucher, Branch)
- **Cloud Storage**: Integrates with Cloudinary for image uploads

## Example Usage (JavaScript/Fetch)
```javascript
const formData = new FormData();
formData.append('amount', '5000');
formData.append('paymentMethod', 'bank_transfer');
formData.append('transactionId', 'TXN123456');
formData.append('remarks', 'Monthly fee payment');
formData.append('screenshot', fileInput.files[0]); // File object

const response = await fetch('/api/parent/64f1a2b3c4d5e6f7g8h9i0j1/fee-vouchers/64f1a2b3c4d5e6f7g8h9i0j2/pay', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-jwt-token'
  },
  body: formData
});

const result = await response.json();
```

## Dependencies
- Next.js API Routes
- MongoDB/Mongoose
- Cloudinary for file uploads
- Authentication middleware
- FeeVoucher model
- User model
- Branch model

## Error Handling
- All errors are caught and returned with appropriate HTTP status codes
- Detailed error messages are logged to console for debugging
- Database connection errors are handled gracefully

## Security Considerations
- Authentication required for all requests
- Parent can only access their own children's vouchers
- File uploads are validated and stored securely
- Payment amounts are validated against voucher limits
