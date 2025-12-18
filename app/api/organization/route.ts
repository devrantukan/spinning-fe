import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TENANT_BE_URL = process.env.TENANT_ADMIN_URL || "http://localhost:3001";

export async function GET() {
  try {
    // Try to get session for authenticated requests
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Add API key if available (for server-to-server communication)
    // This allows fetching organization data without user authentication
    const mainBackendApiKey = process.env.MAIN_BACKEND_API_KEY;
    if (mainBackendApiKey) {
      headers["X-API-Key"] = mainBackendApiKey;
    }

    // Add organization ID header if available (tenant backend uses this)
    const organizationId =
      process.env.ORGANIZATION_ID || process.env.TENANT_ORGANIZATION_ID;
    if (organizationId) {
      headers["X-Organization-Id"] = organizationId;
    }

    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    const organizationUrl = `${TENANT_BE_URL}/api/organization`;

    const response = await fetch(organizationUrl, {
      headers,
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    } else {
      // If backend requires auth, try with API key only (no user auth)
      if (mainBackendApiKey) {
        const apiKeyHeaders: HeadersInit = {
          "Content-Type": "application/json",
          "X-API-Key": mainBackendApiKey,
        };

        if (organizationId) {
          apiKeyHeaders["X-Organization-Id"] = organizationId;
        }

        const apiKeyResponse = await fetch(organizationUrl, {
          headers: apiKeyHeaders,
        });

        if (apiKeyResponse.ok) {
          const apiKeyData = await apiKeyResponse.json();
          return NextResponse.json(apiKeyData);
        }
      }

      // Return default organization name if API fails
      console.warn(
        "Organization API failed, returning default. Backend may require authentication for SMTP settings."
      );
      return NextResponse.json({ name: "Spin8 Studio" });
    }
  } catch (error) {
    console.error("Error fetching organization:", error);
    if (error instanceof Error && "cause" in error) {
      const cause = (error as any).cause;
      if (cause?.code === "ECONNREFUSED") {
        console.error(
          `Connection refused to tenant backend at ${TENANT_BE_URL}. Please check TENANT_ADMIN_URL environment variable.`
        );
      }
    }
    // Return default organization name on error
    return NextResponse.json({ name: "Spin8 Studio" });
  }
}
