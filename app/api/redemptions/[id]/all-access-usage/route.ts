import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TENANT_BE_URL = process.env.TENANT_BE_URL || "http://localhost:3001";

export async function GET(
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

    const { id } = await params;

    const response = await fetch(
      `${TENANT_BE_URL}/api/redemptions/${id}/all-access-usage`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(Array.isArray(data) ? data : []);
    } else {
      const errorText = await response.text();
      console.error("Error fetching all access usage:", errorText);
      return NextResponse.json([], { status: 200 });
    }
  } catch (error) {
    console.error("Error in all access usage API:", error);
    return NextResponse.json([], { status: 200 });
  }
}
