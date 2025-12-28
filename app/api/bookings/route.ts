import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TENANT_BE_URL = process.env.TENANT_ADMIN_URL || "http://localhost:3001";

export async function GET(request: NextRequest) {
  try {
    // Get Supabase session to extract auth token (optional for public viewing)
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Build headers - include auth if available, but don't require it
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    // Add organization ID if available
    const organizationId =
      process.env.ORGANIZATION_ID || process.env.TENANT_ORGANIZATION_ID;
    if (organizationId) {
      headers["X-Organization-Id"] = organizationId;
    }

    // Get query parameters from request
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    // Build query parameters
    const queryParams = new URLSearchParams();
    // Only add sessionId if provided (for fetching all bookings, sessionId is optional)
    if (sessionId) {
      queryParams.append("sessionId", sessionId);
    }

    // Add organization ID to query params if not already present
    if (organizationId && !queryParams.has("organizationId")) {
      queryParams.append("organizationId", organizationId);
    }

    // Build URL with query parameters
    const bookingsUrl = `${TENANT_BE_URL}/api/bookings?${queryParams.toString()}`;
    console.log("Fetching bookings from:", bookingsUrl);

    const response = await fetch(bookingsUrl, {
      headers,
    });

    if (response.ok) {
      const contentType = response.headers.get("content-type");

      // Check if response is JSON
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        return NextResponse.json(data);
      } else {
        // If not JSON, might be HTML error page
        const text = await response.text();
        console.error(
          "Error in bookings API: Non-JSON response:",
          text.substring(0, 200)
        );
        return NextResponse.json(
          { error: "Invalid response from server" },
          { status: 500 }
        );
      }
    } else {
      const errorText = await response.text();
      console.error("Error fetching bookings:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText.substring(0, 200),
      });

      // Return empty array for 404 (no bookings found)
      if (response.status === 404) {
        return NextResponse.json([], { status: 200 });
      }

      return NextResponse.json(
        { error: "Failed to fetch bookings" },
        { status: response.status }
      );
    }
  } catch (error: unknown) {
    console.error("Error in bookings API:", error);

    // Handle connection errors gracefully
    if (error instanceof Error && "cause" in error) {
      const cause = (error as Error & { cause?: { code?: string } }).cause;
      if (cause && typeof cause === "object" && "code" in cause) {
        if (cause.code === "ECONNREFUSED") {
          console.error(
            `Connection refused when fetching bookings. Is ${TENANT_BE_URL} running?`
          );
          return NextResponse.json([], { status: 200 }); // Return empty array instead of error
        }
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get Supabase session to extract auth token
    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      console.error("Booking POST: Unauthorized - no session or access token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
      console.log(
        "Booking POST: Request body received:",
        JSON.stringify(body, null, 2)
      );
    } catch (parseError) {
      console.error("Booking POST: Error parsing request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Add organization ID if available
    const organizationId =
      process.env.ORGANIZATION_ID || process.env.TENANT_ORGANIZATION_ID;

    // Build headers
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    };

    if (organizationId) {
      headers["X-Organization-Id"] = organizationId;
    }

    // The spinning-tenant-be API endpoint is /api/bookings
    const endpoint = `${TENANT_BE_URL}/api/bookings`;
    const url = endpoint;

    console.log("Booking POST: Creating booking:", url);
    console.log("Booking POST: Headers:", {
      ...headers,
      Authorization: "Bearer ***",
    });
    console.log("Booking POST: Body:", JSON.stringify(body, null, 2));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased timeout to 30s

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      console.log("Booking POST: Response status:", response.status);
      console.log(
        "Booking POST: Response text:",
        responseText.substring(0, 500)
      );

      if (response.ok) {
        let data;
        try {
          data = JSON.parse(responseText);
        } catch {
          data = { message: responseText };
        }
        console.log("Booking POST: Booking created successfully");
        return NextResponse.json(data, { status: 201 });
      } else {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { error: responseText || "Unknown error from backend" };
        }
        console.error(
          `Booking POST: Error creating booking: ${response.status} ${response.statusText}`,
          errorData
        );
        return NextResponse.json(errorData, { status: response.status });
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("Booking POST: Fetch error:", error);
      console.error("Booking POST: Error details:", {
        message: error.message,
        name: error.name,
        cause: error.cause,
        stack: error.stack?.substring(0, 500),
      });

      // Handle specific error types
      if (error.name === "AbortError") {
        return NextResponse.json(
          { error: "Request timeout. Please try again." },
          { status: 408 }
        );
      }

      if (error.cause?.code === "ECONNREFUSED") {
        return NextResponse.json(
          {
            error: "Cannot connect to booking service. Please try again later.",
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: error.message || "Failed to create booking" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Booking POST: Outer catch error:", error);
    console.error("Booking POST: Error details:", {
      message: error.message,
      name: error.name,
      stack: error.stack?.substring(0, 500),
    });
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
