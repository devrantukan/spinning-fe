import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TENANT_BE_URL = process.env.TENANT_ADMIN_URL || "http://localhost:3001";

export async function GET(request: NextRequest) {
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

    const response = await fetch(`${TENANT_BE_URL}/api/packages`, {
      headers,
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(Array.isArray(data) ? data : []);
    } else {
      const errorText = await response.text();
      console.error("Error fetching packages:", errorText);
      return NextResponse.json([], { status: 200 });
    }
  } catch (error) {
    console.error("Error in packages API:", error);
    if (error instanceof Error && "cause" in error) {
      const cause = (error as any).cause;
      if (cause?.code === "ECONNREFUSED") {
        console.error(
          `Connection refused to tenant backend at ${TENANT_BE_URL}. Please check TENANT_ADMIN_URL environment variable.`
        );
      }
    }
    return NextResponse.json([], { status: 200 });
  }
}
