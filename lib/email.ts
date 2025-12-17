/**
 * Email utility for sending emails
 * Supports SMTP (via nodemailer) or other email services
 * Configure via environment variables
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

interface BankTransferEmailData {
  customerName: string;
  customerEmail: string;
  packageName: string;
  packagePrice: number;
  bankDetails: {
    accountName: string;
    bankName: string;
    accountNumber: string;
    iban?: string;
    swift?: string;
    branchCode?: string;
    currency?: string;
    notes?: string;
  };
  orderId: string;
  orderDate: string;
  couponCode?: string;
  finalPrice?: number;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Check if email service is configured
    const emailApiUrl = process.env.EMAIL_API_URL;
    const emailApiKey = process.env.EMAIL_API_KEY;

    // If using an email service API (like Resend, SendGrid, etc.)
    if (emailApiUrl && emailApiKey) {
      const response = await fetch(emailApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${emailApiKey}`,
        },
        body: JSON.stringify({
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text || options.html.replace(/<[^>]*>/g, ""),
          from:
            options.from ||
            process.env.EMAIL_FROM ||
            "noreply@spinningstudio.com",
        }),
      });

      return response.ok;
    }

    // Fallback: Log email (for development)
    // In production, you should configure an email service
    console.log("=== EMAIL (not sent - no service configured) ===");
    console.log("To:", options.to);
    console.log("Subject:", options.subject);
    console.log("Body:", options.text || options.html);
    console.log("================================");

    // Return true in dev mode so app doesn't break
    // In production, this should return false if no service is configured
    return process.env.NODE_ENV === "development";
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

export function generateBankTransferCustomerEmail(
  data: BankTransferEmailData
): string {
  const price = data.finalPrice || data.packagePrice;
  const currency = data.bankDetails.currency || "TRY";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Instructions</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f97316; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0;">Payment Instructions</h1>
  </div>
  
  <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
    <p>Dear ${data.customerName},</p>
    
    <p>Thank you for your purchase! Please complete your payment via bank transfer to activate your package.</p>
    
    <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316;">
      <h2 style="margin-top: 0; color: #f97316;">Order Details</h2>
      <p><strong>Order ID:</strong> ${data.orderId}</p>
      <p><strong>Package:</strong> ${data.packageName}</p>
      <p><strong>Amount:</strong> ${price.toFixed(2)} ${currency}</p>
      ${
        data.couponCode
          ? `<p><strong>Coupon:</strong> ${data.couponCode}</p>`
          : ""
      }
      <p><strong>Order Date:</strong> ${data.orderDate}</p>
    </div>
    
    <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
      <h2 style="margin-top: 0; color: #10b981;">Bank Transfer Details</h2>
      <p><strong>Account Name:</strong> ${data.bankDetails.accountName}</p>
      <p><strong>Bank Name:</strong> ${data.bankDetails.bankName}</p>
      <p><strong>Account Number:</strong> ${data.bankDetails.accountNumber}</p>
      ${
        data.bankDetails.iban
          ? `<p><strong>IBAN:</strong> ${data.bankDetails.iban}</p>`
          : ""
      }
      ${
        data.bankDetails.swift
          ? `<p><strong>SWIFT:</strong> ${data.bankDetails.swift}</p>`
          : ""
      }
      ${
        data.bankDetails.branchCode
          ? `<p><strong>Branch Code:</strong> ${data.bankDetails.branchCode}</p>`
          : ""
      }
      ${
        data.bankDetails.notes
          ? `<p><strong>Notes:</strong> ${data.bankDetails.notes}</p>`
          : ""
      }
    </div>
    
    <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Important:</strong> Please include your Order ID (${
        data.orderId
      }) in the transfer description/reference so we can process your payment quickly.</p>
    </div>
    
    <p>Once we receive your payment, your package will be activated automatically. You will receive a confirmation email once the payment has been processed.</p>
    
    <p>If you have any questions, please don't hesitate to contact us.</p>
    
    <p>Best regards,<br>The Spinning Studio Team</p>
  </div>
</body>
</html>
  `.trim();
}

export function generateBankTransferOrganizationEmail(
  data: BankTransferEmailData
): string {
  const price = data.finalPrice || data.packagePrice;
  const currency = data.bankDetails.currency || "TRY";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Bank Transfer Order</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #3b82f6; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0;">New Bank Transfer Order</h1>
  </div>
  
  <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
    <p>A new package purchase has been made via bank transfer and is pending payment confirmation.</p>
    
    <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
      <h2 style="margin-top: 0; color: #3b82f6;">Order Details</h2>
      <p><strong>Order ID:</strong> ${data.orderId}</p>
      <p><strong>Customer:</strong> ${data.customerName}</p>
      <p><strong>Customer Email:</strong> ${data.customerEmail}</p>
      <p><strong>Package:</strong> ${data.packageName}</p>
      <p><strong>Amount:</strong> ${price.toFixed(2)} ${currency}</p>
      ${
        data.couponCode
          ? `<p><strong>Coupon:</strong> ${data.couponCode}</p>`
          : ""
      }
      <p><strong>Order Date:</strong> ${data.orderDate}</p>
      <p><strong>Status:</strong> <span style="color: #f59e0b; font-weight: bold;">PENDING PAYMENT</span></p>
    </div>
    
    <div style="background-color: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Action Required:</strong> Please monitor for bank transfer payment matching Order ID ${
        data.orderId
      }. Once payment is received and verified, please confirm the order in the admin panel to activate the customer's package.</p>
    </div>
    
    <p>Thank you!</p>
  </div>
</body>
</html>
  `.trim();
}
