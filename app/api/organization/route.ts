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

    const organizationId =
      process.env.ORGANIZATION_ID || process.env.TENANT_ORGANIZATION_ID;

    // For unauthenticated requests (like during registration), use the public endpoint
    if (!session?.access_token) {
      console.log("No session found, using public organization endpoint");
      try {
        const publicOrgUrl = organizationId
          ? `${TENANT_BE_URL}/api/organization/public?organizationId=${organizationId}`
          : `${TENANT_BE_URL}/api/organization/public`;

        const publicResponse = await fetch(publicOrgUrl);

        if (publicResponse.ok) {
          const publicData = await publicResponse.json();
          console.log("Public organization data fetched:", {
            hasSmtpHost: !!publicData.smtpHost,
            hasSmtpUser: !!publicData.smtpUser,
            hasName: !!publicData.name,
          });
          return NextResponse.json(publicData);
        }
      } catch (publicError) {
        console.warn(
          "Error fetching from public endpoint, falling back to authenticated endpoint:",
          publicError
        );
      }
    }

    // For authenticated requests, use the regular endpoint
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
    if (organizationId) {
      headers["X-Organization-Id"] = organizationId;
    }

    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    const organizationUrl = `${TENANT_BE_URL}/api/organization`;
    console.log("Fetching organization from:", organizationUrl);
    console.log("Request headers:", {
      hasApiKey: !!headers["X-API-Key"],
      hasOrgId: !!headers["X-Organization-Id"],
      orgId: headers["X-Organization-Id"],
      hasAuth: !!headers["Authorization"],
    });

    let response: Response;
    try {
      response = await fetch(organizationUrl, {
        headers,
      });
    } catch (fetchError: unknown) {
      const error = fetchError as { code?: string; message?: string };
      // Handle SSL errors - might be protocol mismatch (HTTPS vs HTTP)
      if (error.code === "ERR_SSL_WRONG_VERSION_NUMBER") {
        console.error(
          `SSL error when fetching organization. URL: ${organizationUrl}`
        );
        console.error(
          "This usually means the URL protocol (http/https) doesn't match the server."
        );
        console.error(
          `Current TENANT_ADMIN_URL: ${
            process.env.TENANT_ADMIN_URL || "not set"
          }`
        );
        // Try the opposite protocol as fallback
        const alternateUrl = organizationUrl.startsWith("https://")
          ? organizationUrl.replace("https://", "http://")
          : organizationUrl.replace("http://", "https://");
        console.log("Trying alternate protocol:", alternateUrl);
        try {
          response = await fetch(alternateUrl, {
            headers,
          });
        } catch (altError) {
          console.error("Alternate protocol also failed:", altError);
          throw fetchError; // Throw original error
        }
      } else {
        throw fetchError;
      }
    }

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
      const cause = (error as { code?: string; message?: string }).cause;
      if (cause?.code === "ECONNREFUSED") {
        console.error(
          `Connection refused to tenant backend at ${TENANT_BE_URL}. Please check TENANT_ADMIN_URL environment variable.`
        );
      } else if (cause?.code === "ERR_SSL_WRONG_VERSION_NUMBER") {
        console.error(`SSL protocol mismatch. URL: ${TENANT_BE_URL}`);
        console.error(
          "This usually means the URL uses HTTPS but the server is HTTP (or vice versa)."
        );
        console.error(
          `Current TENANT_ADMIN_URL: ${
            process.env.TENANT_ADMIN_URL || "not set"
          }`
        );
        console.error(
          "Please check if TENANT_ADMIN_URL should use http:// or https://"
        );
      }
    }
    // Return default organization name on error
    return NextResponse.json({ name: "Spin8 Studio" });
  }
}
