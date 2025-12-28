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
    const seatLayoutId = searchParams.get("seatLayoutId");

    if (!locationId && !seatLayoutId) {
      return NextResponse.json(
        { error: "locationId or seatLayoutId is required" },
        { status: 400 }
      );
    }

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (locationId) {
      queryParams.append("locationId", locationId);
    }
    if (seatLayoutId) {
      queryParams.append("seatLayoutId", seatLayoutId);
    }
    // Request seats to be included in the response
    queryParams.append("includeSeats", "true");
    queryParams.append("include", "seats");

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

        // Always try to fetch seats if we have a seat layout ID
        if (data && data.id) {
          // If seats are not included or empty, fetch them separately
          if (
            !data.seats ||
            !Array.isArray(data.seats) ||
            data.seats.length === 0
          ) {
            try {
              const seatsUrl = `${TENANT_BE_URL}/api/seat-layouts/${data.id}/seats`;
              console.log("Fetching seats from:", seatsUrl);

              // Try public access first (seats should be publicly viewable)
              const publicHeaders: HeadersInit = {
                "Content-Type": "application/json",
              };
              if (organizationId) {
                publicHeaders["X-Organization-Id"] = organizationId;
              }
              let seatsResponse = await fetch(seatsUrl, {
                headers: publicHeaders,
              });

              // If public access fails, try with auth as fallback (for backward compatibility)
              if (
                seatsResponse.status === 401 ||
                seatsResponse.status === 403
              ) {
                console.log(
                  "Public access failed, trying with auth as fallback"
                );
                seatsResponse = await fetch(seatsUrl, { headers });
              }

              if (seatsResponse.ok) {
                const seatsData = await seatsResponse.json();
                if (Array.isArray(seatsData)) {
                  data.seats = seatsData;
                  console.log(`Fetched ${seatsData.length} seats`);
                } else if (seatsData.seats && Array.isArray(seatsData.seats)) {
                  data.seats = seatsData.seats;
                  console.log(`Fetched ${seatsData.seats.length} seats`);
                } else if (seatsData.data && Array.isArray(seatsData.data)) {
                  data.seats = seatsData.data;
                  console.log(`Fetched ${seatsData.data.length} seats`);
                }
              } else {
                const errorText = await seatsResponse.text();
                // If 401/403, backend requires auth - continue without seats (will generate default grid)
                if (
                  seatsResponse.status === 401 ||
                  seatsResponse.status === 403
                ) {
                  console.log(
                    "Backend requires auth for seats, continuing without seats - will generate default grid"
                  );
                } else {
                  console.error("Error fetching seats:", {
                    status: seatsResponse.status,
                    statusText: seatsResponse.statusText,
                    body: errorText.substring(0, 200),
                  });
                }
              }
            } catch (seatsError) {
              console.error("Error fetching seats:", seatsError);
              // Continue without seats - grid will be generated
            }
          } else {
            console.log(`Seat layout already has ${data.seats.length} seats`);
          }
        }

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
