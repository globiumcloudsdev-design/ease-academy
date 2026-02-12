# Fee Payment API Quick Reference

## 🔐 Authentication

```bash
# Login to get JWT token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"parent@example.com","password":"password123"}'
```

## 👨‍👩‍👧‍👦 Parent APIs

### Get Children
```bash
curl -X GET http://localhost:3000/api/parent \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Fee Vouchers
```bash
curl -X GET "http://localhost:3000/api/parent/CHILD_ID/fee-vouchers" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Submit Payment
```bash
curl -X POST http://localhost:3000/api/parent/CHILD_ID/fee-vouchers/VOUCHER_ID/pay \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "amount=2000" \
  -F "paymentMethod=bank-transfer" \
  -F "transactionId=TXN-$(date +%s)" \
  -F "remarks=Test payment" \
  -F "screenshot=@payment_receipt.jpg"
```

## 🏢 Branch Admin APIs

### Get Pending Payments
```bash
curl -X GET http://localhost:3000/api/branch-admin/pending-fees \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Approve Payment
```bash
curl -X POST http://localhost:3000/api/branch-admin/pending-fees/approve \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "voucherId": "VOUCHER_ID",
    "paymentIndex": 0,
    "remarks": "Payment approved"
  }'
```

### Reject Payment
```bash
curl -X POST http://localhost:3000/api/branch-admin/pending-fees/reject \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "voucherId": "VOUCHER_ID",
    "paymentIndex": 0,
    "rejectionReason": "Invalid transaction ID"
  }'
```

## 👑 Super Admin APIs

### Get All Fee Vouchers
```bash
curl -X GET "http://localhost:3000/api/super-admin/fee-vouchers?status=pending&limit=50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Approve Payment (Super Admin)
```bash
curl -X POST http://localhost:3000/api/super-admin/fee-vouchers/VOUCHER_ID/approve-payment \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "PAYMENT_ID",
    "action": "approve",
    "remarks": "Approved by super admin"
  }'
```

### Reject Payment (Super Admin)
```bash
curl -X POST http://localhost:3000/api/super-admin/fee-vouchers/VOUCHER_ID/approve-payment \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "PAYMENT_ID",
    "action": "reject",
    "remarks": "Invalid payment proof"
  }'
```

## 🧪 Testing Scripts

```bash
# Complete payment flow test
node test-complete-parent-payment-flow.js

# Super admin pending fees test
node test-super-admin-pending-fees.js --create
node test-super-admin-pending-fees.js --test

# Check paid fees
node check-paid-fees.js

# Get authentication token
node get-token.js
```

## 📊 Status Codes

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

## 💰 Payment Methods

- `bank-transfer`
- `cash`
- `online`
- `cheque`

## 📋 Voucher Statuses

- `pending` - Not paid
- `partial` - Partially paid
- `paid` - Fully paid
- `overdue` - Past due date
- `cancelled` - Cancelled

## 💳 Payment Statuses

- `pending` - Awaiting approval
- `approved` - Approved by admin
- `rejected` - Rejected by admin

## 🔧 Environment Setup

```bash
# Install dependencies
npm install

# Start MongoDB
mongod

# Start development server
npm run dev

# Server runs on http://localhost:3000
```

## 📝 Sample Data

### Parent Login
```json
{
  "email": "arshayn@example.com",
  "password": "password123"
}
```

### Branch Admin Login
```json
{
  "email": "hafizshoaib@gmail.com",
  "password": "123456"
}
```

### Super Admin Login
```json
{
  "email": "superadmin@easeacademy.com",
  "password": "password123"
}
```

## 🚨 Common Issues

1. **Connection Refused**: Make sure MongoDB is running
2. **Unauthorized**: Check JWT token validity
3. **File Upload Failed**: Ensure screenshot is a valid image file
4. **Payment Not Found**: Verify voucher ID and payment index

## 📞 Support

- Check `FEE_PAYMENT_API_DOCUMENTATION.md` for detailed docs
- Run test scripts to verify functionality
- Check server logs for error details
