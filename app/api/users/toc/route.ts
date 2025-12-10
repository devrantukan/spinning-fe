import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { supabaseUserId, accepted } = body;

    // Verify the supabaseUserId matches the authenticated user
    if (supabaseUserId !== user.id) {
      return NextResponse.json({ error: "User ID mismatch" }, { status: 403 });
    }

    // First, check if user record exists
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("supabaseUserId", supabaseUserId)
      .single();

    let data;
    let error;

    if (checkError && checkError.code === "PGRST116") {
      // User record doesn't exist yet (might happen during registration)
      // Try to create it with TOC acceptance
      const { data: createData, error: createError } = await supabase
        .from("users")
        .insert({
          supabaseUserId: supabaseUserId,
          email: user.email || "",
          name: user.user_metadata?.name || "",
          tocAccepted: accepted,
          tocAcceptedAt: accepted ? new Date().toISOString() : null,
        })
        .select()
        .single();

      data = createData;
      error = createError;
    } else if (checkError) {
      // Other error checking for user
      error = checkError;
    } else {
      // User exists, update TOC acceptance
      const { data: updateData, error: updateError } = await supabase
        .from("users")
        .update({
          tocAccepted: accepted,
          tocAcceptedAt: accepted ? new Date().toISOString() : null,
        })
        .eq("supabaseUserId", supabaseUserId)
        .select()
        .single();

      data = updateData;
      error = updateError;
    }

    if (error) {
      console.error("Error updating TOC acceptance:", error);

      // If columns don't exist, provide SQL to add them
      if (error.code === "42703") {
        return NextResponse.json(
          {
            error: "Database schema error",
            message:
              "The tocAccepted and tocAcceptedAt columns need to be added to the users table.",
            sql: `
-- Add TOC acceptance columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS "tocAccepted" BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "tocAcceptedAt" TIMESTAMP WITH TIME ZONE;
            `.trim(),
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: "Failed to update TOC acceptance", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error in TOC API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
