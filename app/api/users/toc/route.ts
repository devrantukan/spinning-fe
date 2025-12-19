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
    const { supabaseUserId, accepted, liabilityWaiverAccepted } = body;

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

      // Get additional user metadata (dob, mobilePhone, countryCode) from auth user
      let dateOfBirth = null;
      let mobilePhone = null;
      let countryCode = null;

      if (useAdminAPI) {
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
        const metadata = authUser?.user?.user_metadata || {};
        dateOfBirth = metadata.dob || null;
        mobilePhone = metadata.mobilePhone || null;
        countryCode = metadata.countryCode || null;
      } else {
        const metadata = user?.user_metadata || {};
        dateOfBirth = metadata.dob || null;
        mobilePhone = metadata.mobilePhone || null;
        countryCode = metadata.countryCode || null;
      }

      // Try to create it with TOC acceptance, liability waiver, and all registration data
      const { data: createData, error: createError } = await dbClient
        .from("users")
        .insert({
          supabaseUserId: supabaseUserId,
          email: userEmail,
          name: userName,
          dateOfBirth: dateOfBirth,
          mobilePhone: mobilePhone,
          countryCode: countryCode,
          tocAccepted: accepted,
          tocAcceptedAt: accepted ? new Date().toISOString() : null,
          liabilityWaiverAccepted: liabilityWaiverAccepted || false,
          liabilityWaiverAcceptedAt: liabilityWaiverAccepted
            ? new Date().toISOString()
            : null,
        })
        .select()
        .single();

      data = createData;
      error = createError;
    } else if (checkError) {
      // Other error checking for user
      error = checkError;
    } else {
      // User exists, update TOC acceptance and liability waiver
      const updateDataObj: any = {
        tocAccepted: accepted,
        tocAcceptedAt: accepted ? new Date().toISOString() : null,
      };

      // Only update liability waiver if provided
      if (liabilityWaiverAccepted !== undefined) {
        updateDataObj.liabilityWaiverAccepted = liabilityWaiverAccepted;
        updateDataObj.liabilityWaiverAcceptedAt = liabilityWaiverAccepted
          ? new Date().toISOString()
          : null;
      }

      const { data: updateData, error: updateError } = await dbClient
        .from("users")
        .update(updateDataObj)
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
              "The tocAccepted, tocAcceptedAt, liabilityWaiverAccepted, and liabilityWaiverAcceptedAt columns need to be added to the users table.",
            sql: `
-- Add TOC acceptance and liability waiver columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS "tocAccepted" BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "tocAcceptedAt" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "liabilityWaiverAccepted" BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "liabilityWaiverAcceptedAt" TIMESTAMP WITH TIME ZONE;
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

    // After successfully creating/updating user record, create member record if it doesn't exist
    if (data && data.id) {
      try {
        // Check if member already exists
        const { data: existingMember, error: checkMemberError } = await dbClient
          .from("members")
          .select("id")
          .eq("userId", data.id)
          .single();

        if (checkMemberError && checkMemberError.code === "PGRST116") {
          // Member doesn't exist, create it
          const { data: newMember, error: memberError } = await dbClient
            .from("members")
            .insert({
              userId: data.id,
              role: "member",
              creditBalance: 0,
              status: "active",
            })
            .select()
            .single();

          if (memberError) {
            console.warn("Failed to create member record:", memberError);
            // Don't fail the request - member can be created later
          } else {
            console.log("Member record created successfully:", newMember?.id);
          }
        } else if (existingMember) {
          console.log("Member record already exists:", existingMember.id);
        }
      } catch (memberErr) {
        console.warn("Error creating member record:", memberErr);
        // Don't fail the request - member can be created later
      }
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
