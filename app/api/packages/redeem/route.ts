import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requestMainBackend } from "@/lib/main-backend-client";
import {
  sendEmail,
  generateBankTransferCustomerEmail,
  generateBankTransferOrganizationEmail,
} from "@/lib/email";

const TENANT_BE_URL = process.env.TENANT_BE_URL || "http://localhost:3001";
const ORGANIZATION_EMAIL =
  process.env.ORGANIZATION_EMAIL || "admin@spinningstudio.com";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const paymentType = body.paymentType || "CREDITS";

    // Handle bank transfer payment separately
    if (paymentType === "BANK_TRANSFER") {
      return handleBankTransferRedemption(request, supabase, session, body);
    }

    // Use the main backend client utility which properly handles errors
    const result = await requestMainBackend(
      `${TENANT_BE_URL}/api/packages/redeem`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      }
    );

    // If there's an error response, return it with the proper status code
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    // Success response
    return NextResponse.json(result.data, { status: 201 });
  } catch (error: any) {
    // Only catch actual exceptions (network errors, etc.), not HTTP error responses
    console.error("Error redeeming package:", error);
    return NextResponse.json(
      { error: error.message || "Failed to redeem package" },
      { status: 500 }
    );
  }
}

async function handleBankTransferRedemption(
  request: NextRequest,
  supabase: any,
  session: any,
  body: any
) {
  try {
    // Get user info
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Get member info
    const membersResponse = await fetch(
      `${request.nextUrl.origin}/api/members`,
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    if (!membersResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch member information" },
        { status: 500 }
      );
    }

    const members = await membersResponse.json();
    const member =
      Array.isArray(members) && members.length > 0 ? members[0] : null;

    if (!member) {
      return NextResponse.json(
        { error: "Member account not found" },
        { status: 404 }
      );
    }

    // Get package info
    const packagesResponse = await fetch(
      `${request.nextUrl.origin}/api/packages`,
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    if (!packagesResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch package information" },
        { status: 500 }
      );
    }

    const packages = await packagesResponse.json();
    const packageData = Array.isArray(packages)
      ? packages.find((p: any) => p.id === body.packageId)
      : null;

    if (!packageData) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    // Get bank details
    const bankDetailsResponse = await fetch(
      `${request.nextUrl.origin}/api/organization/bank-details`
    );

    if (!bankDetailsResponse.ok) {
      return NextResponse.json(
        {
          error: "Bank details not configured. Please contact support.",
        },
        { status: 500 }
      );
    }

    const { bankDetails } = await bankDetailsResponse.json();

    if (!bankDetails) {
      return NextResponse.json(
        {
          error: "Bank details not configured. Please contact support.",
        },
        { status: 500 }
      );
    }

    // Calculate final price (with coupon if applicable)
    let finalPrice = packageData.price;
    let couponCode = body.couponCode;

    if (couponCode) {
      try {
        const couponResponse = await fetch(
          `${request.nextUrl.origin}/api/coupons/code/${couponCode}`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        if (couponResponse.ok) {
          const coupon = await couponResponse.json();
          if (coupon.discountType === "PERCENTAGE" && coupon.discountValue) {
            finalPrice = finalPrice * (1 - coupon.discountValue / 100);
          } else if (
            coupon.discountType === "FIXED_AMOUNT" &&
            coupon.discountValue
          ) {
            finalPrice = finalPrice - coupon.discountValue;
          } else if (coupon.couponType === "PACKAGE" && coupon.customPrice) {
            finalPrice = coupon.customPrice;
          }
          finalPrice = Math.max(0, finalPrice);
        }
      } catch (error) {
        console.error("Error applying coupon:", error);
      }
    }

    // Generate order ID
    const orderId = `BT-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;
    const orderDate = new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Create pending redemption record in database
    const { data: redemptionData, error: redemptionError } = await supabase
      .from("pending_redemptions")
      .insert({
        order_id: orderId,
        member_id: member.id,
        package_id: body.packageId,
        payment_type: "BANK_TRANSFER",
        amount: finalPrice,
        status: "PENDING",
        coupon_code: couponCode || null,
        customer_email: user.email,
        customer_name: user.user_metadata?.name || user.email,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (redemptionError) {
      console.error("Error creating pending redemption:", redemptionError);
      // Continue anyway - emails can still be sent
    }

    // Prepare email data
    const emailData = {
      customerName: user.user_metadata?.name || user.email || "Customer",
      customerEmail: user.email || "",
      packageName: packageData.name || "Package",
      packagePrice: packageData.price,
      bankDetails: bankDetails,
      orderId: orderId,
      orderDate: orderDate,
      couponCode: couponCode,
      finalPrice: finalPrice,
    };

    // Send emails
    const customerEmailSent = await sendEmail({
      to: user.email || "",
      subject: `Payment Instructions - Order ${orderId}`,
      html: generateBankTransferCustomerEmail(emailData),
    });

    const orgEmailSent = await sendEmail({
      to: ORGANIZATION_EMAIL,
      subject: `New Bank Transfer Order - ${orderId}`,
      html: generateBankTransferOrganizationEmail(emailData),
    });

    if (!customerEmailSent) {
      console.warn("Failed to send customer email");
    }

    if (!orgEmailSent) {
      console.warn("Failed to send organization email");
    }

    return NextResponse.json(
      {
        orderId: orderId,
        status: "PENDING",
        message:
          "Bank transfer order created. Please check your email for payment instructions.",
        bankDetails: bankDetails,
        amount: finalPrice,
        customerEmailSent: customerEmailSent,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error handling bank transfer redemption:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process bank transfer order" },
      { status: 500 }
    );
  }
}
