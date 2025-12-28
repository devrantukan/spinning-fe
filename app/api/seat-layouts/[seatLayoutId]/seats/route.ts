import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TENANT_BE_URL = process.env.TENANT_ADMIN_URL || "http://localhost:3001";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ seatLayoutId: string }> }
) {
  try {
    // Seats should be publicly viewable
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

    const { seatLayoutId } = await params;

    if (!seatLayoutId) {
      return NextResponse.json(
        { error: "seatLayoutId is required" },
        { status: 400 }
      );
    }

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (organizationId && !queryParams.has("organizationId")) {
      queryParams.append("organizationId", organizationId);
    }

    // Build URL with query parameters
    const seatsUrl = `${TENANT_BE_URL}/api/seat-layouts/${seatLayoutId}/seats${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    console.log("Fetching seats from:", seatsUrl);

    // Try public access first (seats should be publicly viewable)
    const publicHeaders: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (organizationId) {
      publicHeaders["X-Organization-Id"] = organizationId;
    }
    let response = await fetch(seatsUrl, { headers: publicHeaders });

    // If public access fails, try with auth as fallback (for backward compatibility)
    if (response.status === 401 || response.status === 403) {
      console.log("Public access failed, trying with auth as fallback");
      response = await fetch(seatsUrl, { headers });
    }

    if (response.ok) {
      const contentType = response.headers.get("content-type");

      // Check if response is JSON
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();

        // Handle different response formats
        if (Array.isArray(data)) {
          return NextResponse.json(data);
        } else if (data.seats && Array.isArray(data.seats)) {
          return NextResponse.json(data.seats);
        } else if (data.data && Array.isArray(data.data)) {
          return NextResponse.json(data.data);
        } else {
          return NextResponse.json(data);
        }
      } else {
        // If not JSON, might be HTML error page
        const text = await response.text();
        console.error(
          "Error in seats API: Non-JSON response:",
          text.substring(0, 200)
        );
        return NextResponse.json(
          { error: "Invalid response from server" },
          { status: 500 }
        );
      }
    } else {
      const errorText = await response.text();
      console.error("Error fetching seats:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText.substring(0, 200),
      });

      // Return empty array for 404 (no seats found)
      if (response.status === 404) {
        return NextResponse.json([], { status: 200 });
      }

      return NextResponse.json(
        { error: "Failed to fetch seats" },
        { status: response.status }
      );
    }
  } catch (error: unknown) {
    console.error("Error in seats API:", error);

    // Handle connection errors gracefully
    if (error instanceof Error && "cause" in error) {
      const cause = (error as Error & { cause?: { code?: string } }).cause;
      if (cause && typeof cause === "object" && "code" in cause) {
        if (cause.code === "ECONNREFUSED") {
          console.error(
            `Connection refused when fetching seats. Is ${TENANT_BE_URL} running?`
          );
          return NextResponse.json([], { status: 200 }); // Return empty array instead of error
        } else if (cause.code === "ERR_SSL_WRONG_VERSION_NUMBER") {
          console.error(
            `SSL error when fetching seats. URL: ${TENANT_BE_URL}/api/seat-layouts`
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
