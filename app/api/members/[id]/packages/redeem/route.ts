import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TENANT_BE_URL = process.env.TENANT_BE_URL || "http://localhost:3001";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: memberId } = await params;
    const body = await request.json();

    // Try member-specific endpoint first (if it exists)
    let response = await fetch(
      `${TENANT_BE_URL}/api/members/${memberId}/packages/redeem`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          ...body,
          memberId, // Ensure memberId is in the body as well
        }),
      }
    );

    // If member-specific endpoint doesn't exist (404), fall back to general endpoint
    if (response.status === 404) {
      response = await fetch(`${TENANT_BE_URL}/api/packages/redeem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          ...body,
          memberId,
        }),
      });
    }

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data, { status: 201 });
    } else {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      return NextResponse.json(errorData, { status: response.status });
    }
  } catch (error: any) {
    console.error("Error redeeming package:", error);
    return NextResponse.json(
      { error: error.message || "Failed to redeem package" },
      { status: 500 }
    );
  }
}
