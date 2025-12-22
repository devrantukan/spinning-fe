import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TENANT_BE_URL = process.env.TENANT_ADMIN_URL || "http://localhost:3001";

export async function GET(request: NextRequest) {
  try {
    // Seat layouts should be publicly viewable
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
    const locationId = searchParams.get("locationId");

    if (!locationId) {
      return NextResponse.json(
        { error: "locationId is required" },
        { status: 400 }
      );
    }

    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append("locationId", locationId);

    // Add organization ID to query params if not already present
    if (organizationId && !queryParams.has("organizationId")) {
      queryParams.append("organizationId", organizationId);
    }

    // Build URL with query parameters
    const seatLayoutsUrl = `${TENANT_BE_URL}/api/seat-layouts?${queryParams.toString()}`;
    console.log("Fetching seat layout from:", seatLayoutsUrl);

    const response = await fetch(seatLayoutsUrl, {
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
          "Error in seat layouts API: Non-JSON response:",
          text.substring(0, 200)
        );
        return NextResponse.json(
          { error: "Invalid response from server" },
          { status: 500 }
        );
      }
    } else {
      const errorText = await response.text();
      console.error("Error fetching seat layout:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText.substring(0, 200),
      });

      // Return null for 404 (seat layout might not exist)
      if (response.status === 404) {
        return NextResponse.json(null, { status: 200 });
      }

      return NextResponse.json(
        { error: "Failed to fetch seat layout" },
        { status: response.status }
      );
    }
  } catch (error: unknown) {
    console.error("Error in seat layouts API:", error);

    // Handle connection errors gracefully
    if (error instanceof Error && "cause" in error) {
      const cause = (error as Error & { cause?: { code?: string } }).cause;
      if (cause && typeof cause === "object" && "code" in cause) {
        if (cause.code === "ECONNREFUSED") {
          console.error(
            `Connection refused when fetching seat layout. Is ${TENANT_BE_URL} running?`
          );
          return NextResponse.json(null, { status: 200 }); // Return null instead of error
        } else if (cause.code === "ERR_SSL_WRONG_VERSION_NUMBER") {
          console.error(
            `SSL error when fetching seat layout. URL: ${TENANT_BE_URL}/api/seat-layouts`
          );
          return NextResponse.json(null, { status: 200 }); // Return null instead of error
        }
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}



