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
      // Generate UUID for the id field (required by database)
      const { randomUUID } = await import("crypto");
      const userId = randomUUID();

      // Get organizationId from environment variables (required for users table)
      const organizationId =
        process.env.ORGANIZATION_ID || process.env.TENANT_ORGANIZATION_ID;

      if (!organizationId) {
        console.error(
          "ORGANIZATION_ID or TENANT_ORGANIZATION_ID is not set in environment variables"
        );
        return NextResponse.json(
          {
            error: "Server configuration error",
            message: "Organization ID is required but not configured",
          },
          { status: 500 }
        );
      }

      console.log(
        "[TOC] Creating user record with organizationId:",
        organizationId
      );

      const now = new Date().toISOString();
      const { data: createData, error: createError } = await dbClient
        .from("users")
        .insert({
          id: userId,
          supabaseUserId: supabaseUserId,
          email: userEmail,
          name: userName,
          dateOfBirth: dateOfBirth,
          mobilePhone: mobilePhone,
          countryCode: countryCode,
          organizationId: organizationId,
          tocAccepted: accepted,
          tocAcceptedAt: accepted ? now : null,
          liabilityWaiverAccepted: liabilityWaiverAccepted || false,
          liabilityWaiverAcceptedAt: liabilityWaiverAccepted ? now : null,
          createdAt: now,
          updatedAt: now,
        })
        .select()
        .single();

      data = createData;
      error = createError;

      if (createError) {
        console.error("[TOC] Error creating user record:", {
          code: createError.code,
          message: createError.message,
          details: createError.details,
          hint: createError.hint,
          organizationId: organizationId,
        });
      } else {
        console.log("[TOC] User record created successfully:", {
          userId: createData?.id,
          supabaseUserId: supabaseUserId,
        });
      }
    } else if (checkError) {
      // Other error checking for user
      error = checkError;
      console.error("[TOC] Error checking for existing user:", checkError);
    } else {
      // User exists, update TOC acceptance and liability waiver
      const now = new Date().toISOString();
      const updateDataObj: any = {
        tocAccepted: accepted,
        tocAcceptedAt: accepted ? now : null,
        updatedAt: now, // Always update the updatedAt timestamp
      };

      // Only update liability waiver if provided
      if (liabilityWaiverAccepted !== undefined) {
        updateDataObj.liabilityWaiverAccepted = liabilityWaiverAccepted;
        updateDataObj.liabilityWaiverAcceptedAt = liabilityWaiverAccepted
          ? now
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
      console.error("[TOC] Error updating TOC acceptance:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });

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
        console.log(
          "[TOC] Checking for existing member record for userId:",
          data.id
        );
        // Check if member already exists
        const { data: existingMember, error: checkMemberError } = await dbClient
          .from("members")
          .select("id")
          .eq("userId", data.id)
          .single();

        if (checkMemberError && checkMemberError.code === "PGRST116") {
          // Member doesn't exist, create it
          console.log(
            "[TOC] Member record not found, creating new member record"
          );
          // Generate UUID for the id field (required by database)
          const { randomUUID } = await import("crypto");
          const memberId = randomUUID();

          // Get organizationId from environment variables (required for members table)
          const organizationId =
            process.env.ORGANIZATION_ID || process.env.TENANT_ORGANIZATION_ID;

          if (!organizationId) {
            console.error(
              "[TOC] ORGANIZATION_ID or TENANT_ORGANIZATION_ID is not set. Cannot create member record."
            );
          } else {
            const now = new Date().toISOString();
            const { data: newMember, error: memberError } = await dbClient
              .from("members")
              .insert({
                id: memberId,
                userId: data.id,
                organizationId: organizationId,
                creditBalance: 0,
                status: "ACTIVE",
                createdAt: now,
                updatedAt: now,
              })
              .select()
              .single();

            if (memberError) {
              console.error("[TOC] Failed to create member record:", {
                code: memberError.code,
                message: memberError.message,
                details: memberError.details,
                hint: memberError.hint,
                userId: data.id,
              });
              // Don't fail the request - member can be created later
            } else {
              console.log("[TOC] Member record created successfully:", {
                memberId: newMember?.id,
                userId: data.id,
              });
            }
          }
        } else if (checkMemberError) {
          console.error(
            "[TOC] Error checking for existing member:",
            checkMemberError
          );
        } else if (existingMember) {
          console.log("[TOC] Member record already exists:", existingMember.id);
        }
      } catch (memberErr: any) {
        console.error("[TOC] Exception creating member record:", {
          message: memberErr?.message,
          stack: memberErr?.stack,
          userId: data.id,
        });
        // Don't fail the request - member can be created later
      }
    } else {
      console.warn(
        "[TOC] Cannot create member record - user data or id is missing:",
        {
          hasData: !!data,
          hasId: !!data?.id,
        }
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
