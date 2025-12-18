import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    const body = await request.json();
    const { supabaseUserId, accepted } = body;

    // If user is not authenticated (during registration), use Admin API
    let useAdminAPI = false;
    let authenticatedUserId: string | null = null;

    if (authError || !user) {
      // User not authenticated - this is during registration
      // Use Admin API to create/update user record
      useAdminAPI = true;
    } else {
      // User is authenticated - verify the supabaseUserId matches
      if (supabaseUserId !== user.id) {
        return NextResponse.json(
          { error: "User ID mismatch" },
          { status: 403 }
        );
      }
      authenticatedUserId = user.id;
    }

    // Use appropriate client (authenticated or admin)
    const dbClient = useAdminAPI
      ? createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          }
        )
      : supabase;

    // First, check if user record exists
    const { data: existingUser, error: checkError } = await dbClient
      .from("users")
      .select("id")
      .eq("supabaseUserId", supabaseUserId)
      .single();

    let data;
    let error;

    if (checkError && checkError.code === "PGRST116") {
      // User record doesn't exist yet (might happen during registration)
      // Get user info from auth if using Admin API, otherwise use authenticated user
      let userEmail = "";
      let userName = "";

      if (useAdminAPI) {
        // Get user info from Admin API
        const supabaseAdmin = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          }
        );
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(
          supabaseUserId
        );
        userEmail = authUser?.user?.email || "";
        userName = authUser?.user?.user_metadata?.name || "";
      } else {
        userEmail = user?.email || "";
        userName = user?.user_metadata?.name || "";
      }

      // Try to create it with TOC acceptance
      const { data: createData, error: createError } = await dbClient
        .from("users")
        .insert({
          supabaseUserId: supabaseUserId,
          email: userEmail,
          name: userName,
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
      const { data: updateData, error: updateError } = await dbClient
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

      // If it's a permission error during registration, don't fail - user record will be created later
      if (error.code === "42501" && useAdminAPI) {
        console.warn(
          "Permission denied when creating user record during registration. This is expected if service role doesn't have schema permissions. User record will be created when user confirms email."
        );
        // Return success but indicate the user record wasn't created
        return NextResponse.json({
          success: true,
          warning:
            "User record could not be created due to permissions. It will be created when user confirms email.",
          data: null,
        });
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
