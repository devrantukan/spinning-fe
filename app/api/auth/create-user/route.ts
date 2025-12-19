import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, userMetadata } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Use Supabase Admin API to create user without sending email
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Supabase configuration missing" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Create user using Admin API - this won't send confirmation email
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: false, // Don't auto-confirm, user needs to confirm via our email
      user_metadata: userMetadata || {},
    });

    if (error) {
      console.error("Error creating user:", error);
      return NextResponse.json(
        { error: error.message || "Failed to create user" },
        { status: 500 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: "User creation failed - no user returned" },
        { status: 500 }
      );
    }

    // Try to create user record in users table with all registration data
    // If it fails due to permissions, it will be created later via TOC route
    let userRecord = null;
    try {
      // Parse date of birth from userMetadata
      let dateOfBirth = null;
      if (userMetadata?.dob) {
        try {
          dateOfBirth = userMetadata.dob; // Already in YYYY-MM-DD format from AuthModal
        } catch (e) {
          console.warn("Invalid date of birth format:", userMetadata.dob);
        }
      }

      // Generate UUID for the id field (required by database)
      const { randomUUID } = await import("crypto");
      const userId = randomUUID();

      const { data: newUserRecord, error: userRecordError } =
        await supabaseAdmin
          .from("users")
          .insert({
            id: userId,
            supabaseUserId: data.user.id,
            email: data.user.email || email,
            name: userMetadata?.name || "",
            dateOfBirth: dateOfBirth || null,
            mobilePhone: userMetadata?.mobilePhone || null,
            countryCode: userMetadata?.countryCode || null,
            tocAccepted: userMetadata?.tocAccepted || false,
            tocAcceptedAt: userMetadata?.tocAccepted
              ? new Date().toISOString()
              : null,
            liabilityWaiverAccepted:
              userMetadata?.liabilityWaiverAccepted || false,
            liabilityWaiverAcceptedAt: userMetadata?.liabilityWaiverAccepted
              ? new Date().toISOString()
              : null,
          })
          .select()
          .single();

      if (userRecordError) {
        if (userRecordError.code === "23505") {
          // Duplicate key error - user record already exists, try to fetch it
          const { data: existingRecord } = await supabaseAdmin
            .from("users")
            .select()
            .eq("supabaseUserId", data.user.id)
            .single();
          userRecord = existingRecord || null;
        } else {
          console.warn(
            "Could not create user record (will be created via TOC route):",
            userRecordError.message
          );
          // Don't fail - user record will be created when TOC is saved
        }
      } else {
        userRecord = newUserRecord;
      }
    } catch (err) {
      console.warn(
        "Error creating user record (will be created via TOC route):",
        err
      );
      // Don't fail - user record will be created when TOC is saved
    }

    return NextResponse.json({
      user: data.user,
      userRecord: userRecord,
    });
  } catch (error: any) {
    console.error("Error in create-user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create user" },
      { status: 500 }
    );
  }
}
