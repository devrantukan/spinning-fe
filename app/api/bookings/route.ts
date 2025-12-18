import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TENANT_BE_URL = process.env.TENANT_ADMIN_URL || "http://localhost:3001";

export async function POST(request: NextRequest) {
  try {
    // Get Supabase session to extract auth token
    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // The spinning-tenant-be API endpoint is /api/bookings
    const endpoint = `${TENANT_BE_URL}/api/bookings`;
    const url = endpoint;

    console.log("Creating booking:", url, body);
    console.log("Payment type:", body.paymentType);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log("Booking created successfully:", data);
        return NextResponse.json(data, { status: 201 });
      } else {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        console.error(
          `Error creating booking: ${response.status} ${response.statusText}`,
          errorData
        );
        return NextResponse.json(errorData, { status: response.status });
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error(`Failed to create booking:`, error.message);
      return NextResponse.json(
        { error: error.message || "Failed to create booking" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in bookings API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
