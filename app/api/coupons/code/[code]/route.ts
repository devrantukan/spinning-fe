import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TENANT_BE_URL = process.env.TENANT_BE_URL || "http://localhost:3001";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
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

    const { code } = await params;

    const response = await fetch(`${TENANT_BE_URL}/api/coupons/code/${code}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
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
    console.error("Error fetching coupon:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch coupon" },
      { status: 500 }
    );
  }
}
