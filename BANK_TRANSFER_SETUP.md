# Bank Transfer Payment Setup Guide

This document explains the bank transfer payment feature that has been implemented for package purchases.

## Features Implemented

1. **Bank Transfer Payment Option**: Users can now purchase packages via bank transfer
2. **Pending Order Management**: Orders are created with "PENDING" status until payment is confirmed
3. **Email Notifications**:
   - Customer receives payment instructions via email
   - Organization receives notification of new pending order
4. **Bank Details Management**: API endpoint to store and retrieve organizational bank account details

## Setup Instructions

### 1. Database Setup

Run the SQL script in your Supabase SQL Editor:

```bash
# The SQL file is located at:
database-setup.sql
```

This will create:

- `organization_settings` table - stores bank account details
- `pending_redemptions` table - tracks bank transfer orders

### 2. Environment Variables

Add these to your `.env.local` file:

```env
# Email Configuration (choose one method)

# Option 1: Email Service API (e.g., Resend, SendGrid)
EMAIL_API_URL=https://api.resend.com/emails
EMAIL_API_KEY=your_email_api_key_here
EMAIL_FROM=noreply@yourdomain.com

# Option 2: SMTP (requires nodemailer package)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
# EMAIL_FROM=noreply@yourdomain.com

# Organization email for notifications
ORGANIZATION_EMAIL=admin@spinningstudio.com

# Backend API URL
TENANT_BE_URL=http://localhost:3001
```

**Note**: The current email implementation uses a simple API approach. For production, you should:

- Use a proper email service like Resend, SendGrid, or AWS SES
- Or implement SMTP using nodemailer

### 3. Configure Bank Account Details

Use the API endpoint to set bank account details (admin only):

```bash
POST /api/organization/bank-details
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "bankDetails": {
    "accountName": "Spinning Studio Ltd",
    "bankName": "Example Bank",
    "accountNumber": "12345678",
    "iban": "TR330006100519786457841326",
    "swift": "TGBATRIS",
    "branchCode": "0061",
    "currency": "TRY",
    "notes": "Please include Order ID in transfer reference"
  }
}
```

Or you can insert directly into the database:

```sql
INSERT INTO organization_settings (id, bank_details)
VALUES (1, '{
  "accountName": "Spinning Studio Ltd",
  "bankName": "Example Bank",
  "accountNumber": "12345678",
  "iban": "TR330006100519786457841326",
  "swift": "TGBATRIS",
  "branchCode": "0061",
  "currency": "TRY",
  "notes": "Please include Order ID in transfer reference"
}'::jsonb)
ON CONFLICT (id) DO UPDATE
SET bank_details = EXCLUDED.bank_details, updated_at = NOW();
```

### 4. Email Service Integration

The current implementation supports email service APIs. To use a service like Resend:

1. Install Resend SDK (optional, if you want to enhance the email utility):

```bash
npm install resend
```

2. Update `lib/email.ts` if needed for your specific email service

3. Or use environment variables as shown above

## Usage

### For Customers

1. Go to `/pricing` page
2. Select a package
3. Choose "Bank Transfer" as payment method
4. Optionally enter a coupon code
5. Click "Purchase"
6. Receive email with payment instructions
7. Complete bank transfer including Order ID in reference
8. Wait for payment confirmation (admin will activate package)

### For Administrators

1. Monitor `pending_redemptions` table for new orders
2. When payment is received:
   - Verify payment matches the order
   - Update order status to "CONFIRMED"
   - This should trigger package activation (backend integration needed)

## API Endpoints

### GET /api/organization/bank-details

Retrieves organizational bank account details (public)

### POST /api/organization/bank-details

Updates bank account details (admin only)

### POST /api/packages/redeem

Redeems a package. Supports `paymentType: "BANK_TRANSFER"` parameter.

**Request Body:**

```json
{
  "memberId": "member-id",
  "packageId": "package-id",
  "couponCode": "COUPON123", // optional
  "paymentType": "BANK_TRANSFER"
}
```

**Response (Bank Transfer):**

```json
{
  "orderId": "BT-1234567890-ABC123",
  "status": "PENDING",
  "message": "Bank transfer order created...",
  "bankDetails": { ... },
  "amount": 500.00,
  "customerEmailSent": true
}
```

## Database Schema

### organization_settings

- `id` (INTEGER, PRIMARY KEY) - Always 1
- `bank_details` (JSONB) - Bank account information
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### pending_redemptions

- `id` (UUID, PRIMARY KEY)
- `order_id` (TEXT, UNIQUE) - Generated order ID (e.g., BT-1234567890-ABC123)
- `member_id` (TEXT) - Member who made the purchase
- `package_id` (TEXT) - Package being purchased
- `payment_type` (TEXT) - "BANK_TRANSFER"
- `amount` (DECIMAL) - Final price after discounts
- `status` (TEXT) - PENDING, CONFIRMED, CANCELLED
- `coupon_code` (TEXT, nullable) - Applied coupon code
- `customer_email` (TEXT)
- `customer_name` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `confirmed_at` (TIMESTAMP, nullable)

## Next Steps

1. **Payment Confirmation**: Implement admin interface or automated system to confirm payments
2. **Package Activation**: Integrate with backend to activate package when payment is confirmed
3. **Payment Tracking**: Add payment reference tracking
4. **Expiry Handling**: Add logic to cancel pending orders after a certain period
5. **Email Templates**: Customize email templates as needed

## Testing

1. Set up bank details in the database
2. Configure email service (or check console logs in development)
3. Make a test purchase as a customer
4. Verify emails are sent (check email service dashboard or console)
5. Verify order appears in `pending_redemptions` table

## Troubleshooting

- **Emails not sending**: Check email service configuration and API keys
- **Bank details not found**: Ensure organization_settings table has a record with id=1
- **Permission errors**: Check RLS policies match your user role system
- **Order not created**: Check console logs and database connection
