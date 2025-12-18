import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TENANT_BE_URL = process.env.TENANT_ADMIN_URL || "http://localhost:3001";

export async function GET() {
  try {
    // Packages should be publicly viewable, but we'll try to get session if available
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

    // Add organization ID if available (tenant backend may need it)
    const organizationId =
      process.env.ORGANIZATION_ID || process.env.TENANT_ORGANIZATION_ID;
    if (organizationId) {
      headers["X-Organization-Id"] = organizationId;
    }

    // Build URL with optional organization ID query param
    const packagesUrl = organizationId
      ? `${TENANT_BE_URL}/api/packages?organizationId=${organizationId}`
      : `${TENANT_BE_URL}/api/packages`;
    console.log("Fetching packages from:", packagesUrl);

    const response = await fetch(packagesUrl, {
      headers,
    });

    if (response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        return NextResponse.json(Array.isArray(data) ? data : []);
      } else {
        // Got HTML instead of JSON - likely a 404 page or wrong URL
        const text = await response.text();
        console.error(
          "Received HTML instead of JSON from packages endpoint. URL:",
          packagesUrl
        );
        console.error("Response preview:", text.substring(0, 200));
        return NextResponse.json([], { status: 200 });
      }
    } else {
      const errorText = await response.text();
      // Check if it's HTML (404 page)
      if (
        errorText.trim().startsWith("<!DOCTYPE") ||
        errorText.trim().startsWith("<html")
      ) {
        console.error(
          `404 error from tenant backend. URL: ${packagesUrl}, Status: ${response.status}`
        );
        console.error(
          "Tenant backend returned HTML 404 page. Check TENANT_ADMIN_URL environment variable."
        );
      } else {
        console.error("Error fetching packages:", errorText);
      }
      return NextResponse.json([], { status: 200 });
    }
  } catch (error) {
    console.error("Error in packages API:", error);
    if (error instanceof Error && "cause" in error) {
      const cause = (error as { cause?: { code?: string } }).cause;
      if (cause?.code === "ECONNREFUSED") {
        console.error(
          `Connection refused to tenant backend at ${TENANT_BE_URL}. Please check TENANT_ADMIN_URL environment variable.`
        );
      }
    }
    return NextResponse.json([], { status: 200 });
  }
}
